/*
 * Checkout v2 (/afrekenen/ on the site): the customer pays at checkout,
 * online through MultiSafepay or by bank transfer to the iBanFirst account.
 *
 *   POST /api/afrekenen/prijs/     basket → server prices + delivery fee (live preview)
 *   POST /api/afrekenen/           place the order; online → MultiSafepay payment page,
 *                                  transfer → payment request mail (PDF + QR)
 *   GET  /api/afrekenen/status/    the return page asks how the payment stands
 *   GET  /api/afrekenen/beschikbaar/  can people check out (settings complete), and pay online?
 *   POST /api/afrekenen/opnieuw/   pay again after a failed/cancelled payment, or switch to transfer
 *   POST /api/multisafepay/webhook/  MultiSafepay tells us a payment changed
 *
 * Never trusts the page: every line is priced from the live catalogue (D1),
 * delivery comes from the zones in Instellingen, and a payment only counts
 * when MultiSafepay's API says the order is completed (the webhook body is
 * only a signed hint). Orders start "bevestigd" (price final), become
 * "betaald" with an invoice mailed, and online orders nobody paid are
 * cancelled after ABANDON_DAYS (stock back), see sweepAbandoned (cron).
 */

import { ensureSchema, now } from "../crm/schema";
import { upsertContact } from "../crm/store";
import { loadCatalog, variantLabel } from "./catalog";
import { deliveryQuote, getCheckoutSettings } from "./delivery";
import { createPayment, getPayment, methodName, mspKey, MspError, validSignature, type MspEnv, type MspMode } from "./msp";
import { createOrder, getLines, getOrder, round2, VAT_RATE, type NewLine, type OrderRow } from "./orders";
import { addOrderNote, cancelUnpaid, mailPaymentRequest, markPaid } from "./paid";
import { makeMailer, type MailEnv } from "./send";
import { backorder, overLimit } from "../../src/lib/order-limits";
import { formatIban, getSettings, missingSettings } from "./settings";

export interface CheckoutEnv extends MspEnv, MailEnv {
  DB?: D1Database;
}

const SITE = "https://www.natuurhout.be";
const WEBHOOK = `${SITE}/api/multisafepay/webhook/`;
const ABANDON_DAYS = 3;
const MAX_LINES = 60;
const MIN_FILL_MS = 3_000;

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Best effort per isolate, like /api/offerte/.
const recent = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const t = Date.now();
  const w = (recent.get(ip) ?? []).filter((x) => t - x < 10 * 60_000);
  w.push(t);
  recent.set(ip, w);
  return w.length > 8;
}

// ---------------------------------------------------------------- pricing

type BasketLine = { id: number; qty: number };
type Priced = {
  lines: (NewLine & { id: number; image: string | null })[];
  invalid: number[];
  subtotal: number;
  /** null when the customer picks up; otherwise the delivery quote (ok or why not). */
  delivery: { ok: boolean; price: number; label: string; km: number | null; reason: string } | null;
  /**
   * The delivery band's minimum order value (products incl. btw) and how much
   * is still missing; below it delivery is not offered (pickup always is).
   */
  minimum: number | null;
  short: number;
  /** Below the minimum: what delivery would cost once the order reaches it. */
  atMinimum: number | null;
  total: number;
};

function parseBasket(body: Record<string, unknown>): BasketLine[] {
  const raw = Array.isArray(body.lines) ? body.lines.slice(0, MAX_LINES) : [];
  const out = new Map<number, number>();
  for (const l of raw as { id?: unknown; qty?: unknown }[]) {
    const id = Number(l?.id);
    const qty = Math.round(Number(l?.qty));
    if (!Number.isSafeInteger(id) || !Number.isFinite(qty) || qty < 1 || qty > 9999) continue;
    out.set(id, (out.get(id) ?? 0) + qty);
  }
  return [...out].map(([id, qty]) => ({ id, qty }));
}

async function price(db: D1Database, basket: BasketLine[], wantsDelivery: boolean, postcode: string, city: string): Promise<Priced> {
  const [{ byId }, settings] = await Promise.all([loadCatalog(db), getCheckoutSettings(db)]);
  const lines: Priced["lines"] = [];
  const invalid: number[] = [];
  for (const b of basket) {
    const hit = byId.get(b.id);
    // Unknown ids are request-only products (no price): those go through a quote.
    if (!hit || hit.product.hidden) {
      invalid.push(b.id);
      continue;
    }
    const later = backorder(hit.variant.stock, b.qty);
    lines.push({
      id: b.id,
      image: hit.product.images[0]?.src ?? null,
      variant_id: hit.variant.id,
      handle: hit.product.handle,
      product: hit.product.title,
      label: variantLabel(hit.product, hit.variant),
      qty: b.qty,
      unit: round2(parseFloat(hit.variant.price)),
      note: later ? `${later.inStock} op voorraad, ${later.later} in nabestelling` : hit.variant.available ? "" : "op bestelling",
    });
  }
  const subtotal = round2(lines.reduce((t, l) => t + l.qty * l.unit, 0));
  let delivery: Priced["delivery"] = null;
  let minimum: number | null = null;
  let short = 0;
  let atMinimum: number | null = null;
  if (wantsDelivery) {
    const q = deliveryQuote(settings, postcode, city, { subtotal, lines: lines.map((l) => ({ handle: l.handle, qty: l.qty })) });
    delivery = q.ok
      ? { ok: true, price: q.price, label: q.place ? `${postcode} ${q.place}` : postcode, km: q.km, reason: "" }
      : { ok: false, price: 0, label: q.place ? `${postcode} ${q.place}` : postcode, km: q.km ?? null, reason: q.reason };
    minimum = q.minimum ?? null;
    short = q.ok ? 0 : (q.short ?? 0);
    atMinimum = q.ok ? null : (q.atMinimum ?? null);
  }
  return { lines, invalid, subtotal, delivery, minimum, short, atMinimum, total: round2(subtotal + (delivery?.ok ? delivery.price : 0)) };
}

export async function quote(request: Request, env: CheckoutEnv): Promise<Response> {
  if (!env.DB) return json({ error: "not-configured" }, 503);
  await ensureSchema(env.DB);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const wantsDelivery = body.delivery === true;
  const p = await price(env.DB, parseBasket(body), wantsDelivery, str(body.postcode, 10), str(body.city, 60));
  return json({
    lines: p.lines.map((l) => ({ id: l.id, product: l.product, label: l.label === l.product ? "" : l.label, qty: l.qty, unit: l.unit, note: l.note, image: l.image })),
    invalid: p.invalid,
    subtotal: p.subtotal,
    delivery: p.delivery,
    deliverable: !wantsDelivery || Boolean(p.delivery?.ok),
    minimum: p.minimum,
    short: p.short,
    atMinimum: p.atMinimum,
    total: p.total,
    vat: round2((p.total * VAT_RATE) / (100 + VAT_RATE)),
  });
}

// ---------------------------------------------------------------- place the order

type Customer = { name: string; email: string; phone: string; company: string; vat: string; street: string; postcode: string; city: string; remarks: string };

function parseCustomer(body: Record<string, unknown>, delivery: boolean): Customer | { error: string } {
  const c: Customer = {
    name: str(body.name, 100),
    email: str(body.email, 120).toLowerCase(),
    phone: str(body.phone, 40),
    company: str(body.company, 120),
    vat: str(body.vat, 30),
    street: str(body.street, 120),
    postcode: str(body.postcode, 10),
    city: str(body.city, 60),
    remarks: str(body.remarks, 2000),
  };
  if (c.name.length < 2) return { error: "Vul uw naam in." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) return { error: "Vul een geldig e-mailadres in." };
  // A mobile number is needed to arrange the delivery; for pickup it is optional.
  if (delivery && !c.phone) return { error: "Vul uw gsm-nummer in: zo kunnen we u bereiken voor de levering." };
  if (delivery && (!c.street || !c.postcode || !c.city)) return { error: "Vul het volledige leveringsadres in." };
  if (body.terms !== true) return { error: "Ga akkoord met de algemene voorwaarden." };
  return c;
}

/** Where the customer comes back to: the site itself (or a local dev server), never a host from outside. */
function siteOrigin(request: Request): string {
  const o = request.headers.get("origin") ?? "";
  return /^https:\/\/(www\.)?natuurhout\.be$/.test(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o) ? o.replace("://natuurhout.be", "://www.natuurhout.be") : SITE;
}

const token = () => [...crypto.getRandomValues(new Uint8Array(18))].map((b) => b.toString(16).padStart(2, "0")).join("");

/** The return page; relative for our own pages, absolute (with origin) for MultiSafepay. */
const returnPath = (order: Pick<OrderRow, "number" | "checkout_token">) => `/afrekenen/bedankt/?o=${encodeURIComponent(order.number)}&t=${order.checkout_token}`;
function returnUrls(origin: string, order: Pick<OrderRow, "number" | "checkout_token">) {
  const base = `${origin}${returnPath(order)}`;
  return { redirect: base, cancel: `${base}&geannuleerd=1` };
}

/** Starts (or restarts) a MultiSafepay payment for an order; returns the payment page URL. */
async function startPayment(env: CheckoutEnv, db: D1Database, order: OrderRow, origin: string, ip: string): Promise<string> {
  const mode = (order.psp_mode === "live" ? "live" : "test") as MspMode;
  const attempt = (order.psp_attempts ?? 0) + 1;
  const pspId = `${order.number}-${attempt}`;
  const [first, ...rest] = order.name.split(/\s+/);
  const urls = returnUrls(origin, order);
  const payment = await createPayment(env, mode, {
    order_id: pspId,
    amount: order.total,
    description: `Natuurhout bestelling ${order.number}`,
    days_active: ABANDON_DAYS - 1,
    notification_url: WEBHOOK,
    redirect_url: urls.redirect,
    cancel_url: urls.cancel,
    customer: {
      locale: "nl_BE",
      ip_address: ip || undefined,
      first_name: (first || order.name).slice(0, 25).padEnd(2, "."),
      last_name: (rest.join(" ") || first || order.name).slice(0, 25).padEnd(2, "."),
      address1: order.street.slice(0, 64) || undefined,
      zip_code: order.postcode.slice(0, 10) || undefined,
      city: order.city.slice(0, 50) || undefined,
      country: "BE",
      phone: order.phone.slice(0, 25) || undefined,
      email: order.email.slice(0, 64),
    },
  });
  await db
    .prepare("UPDATE orders SET psp_order_id = ?, psp_attempts = ?, psp_status = 'initialized', payment_method = 'online', updated_at = ? WHERE id = ?")
    .bind(pspId, attempt, now(), order.id)
    .run();
  return payment.payment_url;
}

async function notifyInbox(env: CheckoutEnv, order: OrderRow, how: string) {
  if (!env.EMAIL) return;
  const inbox = (env.QUOTE_TO || "info@natuurhout.be").split(",").map((s) => s.trim()).filter(Boolean);
  const link = `https://beheer.natuurhout.be/bestellingen/${order.id}`;
  const text = `Nieuwe bestelling ${order.number} via de webshop (${how}).\n\n${order.name} · ${order.email} · ${order.phone}\n${
    order.delivery ? `Levering: ${order.street}, ${order.postcode} ${order.city}` : "Afhalen in Zele"
  }\nTotaal: € ${order.total.toFixed(2).replace(".", ",")}\n\n${link}`;
  try {
    await env.EMAIL.send({
      from: { name: "Natuurhout webshop", email: "offerte@natuurhout.be" },
      to: inbox,
      replyTo: order.email,
      subject: `Bestelling ${order.number}: ${order.name} (${how})`,
      text,
    });
  } catch (error) {
    console.error("Inbox mail for checkout order failed", order.number, error);
  }
}

export async function place(request: Request, env: CheckoutEnv): Promise<Response> {
  if (!env.DB) return json({ error: "not-configured" }, 503);
  const db = env.DB;
  await ensureSchema(db);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json({ error: "Ongeldige aanvraag." }, 400);
  if (str(body.website, 200) || Number(body.elapsedMs) < MIN_FILL_MS) return json({ error: "Probeer het opnieuw." }, 400);
  const ip = request.headers.get("cf-connecting-ip") ?? "";
  if (rateLimited(ip || "unknown")) return json({ error: "Te veel pogingen kort na elkaar. Probeer het over enkele minuten opnieuw." }, 429);

  const method = body.method === "overschrijving" ? "overschrijving" : "online";
  const wantsDelivery = body.delivery === true;
  const customer = parseCustomer(body, wantsDelivery);
  if ("error" in customer) return json({ error: customer.error }, 400);

  const [shop, checkout] = await Promise.all([getSettings(db), getCheckoutSettings(db)]);
  if (missingSettings(shop).length) return json({ error: "Online bestellen is nog niet ingesteld. Bel of mail ons voor uw bestelling." }, 503);
  if (method === "online" && !mspKey(env, checkout.mspMode)) return json({ error: "Online betalen is even niet beschikbaar. Kies betalen via overschrijving." }, 503);
  // In test mode only a deliberate test (the page opened with ?test) pays online: a customer never lands on a test payment page.
  if (method === "online" && checkout.mspMode === "test" && body.test !== true) return json({ error: "Online betalen is nog niet geopend. Kies betalen via overschrijving." }, 503);

  const p = await price(db, parseBasket(body), wantsDelivery, customer.postcode, customer.city);
  if (p.invalid.length) return json({ error: "Enkele producten kunnen niet online besteld worden. Haal ze uit uw winkelmandje en vraag er een offerte voor.", invalid: p.invalid }, 400);
  if (!p.lines.length) return json({ error: "Uw winkelmandje is leeg." }, 400);
  const limit = overLimit(p.lines);
  if (limit) return json({ error: limit }, 400);
  if (wantsDelivery && !p.delivery?.ok)
    return json(
      {
        // Below the band's minimum the reason already says what to do.
        error: p.short > 0 ? p.delivery!.reason : `${p.delivery?.reason || "Naar deze postcode leveren we niet via de webshop."} Kies afhalen in Zele of vraag een offerte.`,
      },
      400,
    );
  const lines: NewLine[] = p.lines.map(({ id: _id, image: _image, ...l }) => l);
  if (wantsDelivery && p.delivery?.ok && p.delivery.price > 0)
    lines.push({ variant_id: null, handle: "", product: "Levering", label: `Levering ${p.delivery.label === customer.postcode ? `${customer.postcode} ${customer.city}` : p.delivery.label} (${String(p.delivery.km).replace(".", ",")} km)`, qty: 1, unit: p.delivery.price, note: "" });

  const at = now();
  const contactId = await upsertContact(db, customer, at);
  let order = await createOrder(db, {
    contact_id: contactId,
    source: "website",
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
    vat_number: customer.vat,
    delivery: wantsDelivery,
    street: customer.street,
    postcode: customer.postcode,
    city: customer.city,
    remarks: customer.remarks,
    page: "/afrekenen/",
    lines,
  });
  await db
    .prepare("UPDATE orders SET status = 'bevestigd', confirmed_at = ?, payment_method = ?, checkout_token = ?, psp_mode = ?, updated_at = ? WHERE id = ?")
    .bind(at, method, token(), method === "online" ? checkout.mspMode : null, at, order.id)
    .run();
  order = (await getOrder(db, order.id))!;
  await addOrderNote(db, order, `Besteld via afrekenen, betaling: ${method === "online" ? `online (MultiSafepay${checkout.mspMode === "test" ? ", TESTMODUS" : ""})` : "overschrijving"}`, null);
  const origin = siteOrigin(request);

  if (method === "overschrijving") {
    const mail = makeMailer(env);
    if (mail) {
      try {
        await mailPaymentRequest(db, mail, order, "");
        await addOrderNote(db, order, `Betaalverzoek gemaild naar ${order.email}`, null);
      } catch (error) {
        console.error("Payment request mail failed", order.number, error);
        await addOrderNote(db, order, "Betaalverzoek kon niet gemaild worden: stuur het opnieuw vanuit de bestelling.", null);
      }
    }
    await notifyInbox(env, order, "overschrijving");
    return json({ redirect: returnPath(order), number: order.number });
  }

  await notifyInbox(env, order, `online${checkout.mspMode === "test" ? ", test" : ""}`);
  try {
    return json({ redirect: await startPayment(env, db, order, origin, ip), number: order.number });
  } catch (error) {
    console.error("MultiSafepay order not created", order.number, error);
    await addOrderNote(db, order, `Online betaling kon niet starten: ${(error as Error).message}`, null);
    // The order exists: the return page offers to try again or pay by transfer.
    return json({ redirect: `${returnPath(order)}&mislukt=1`, number: order.number });
  }
}

// ---------------------------------------------------------------- payment status

const FAILED = new Set(["declined", "cancelled", "expired", "void"]);

/** Asks MultiSafepay how an online payment stands and applies it (idempotent). */
export async function syncPayment(env: CheckoutEnv, db: D1Database, order: OrderRow): Promise<OrderRow> {
  if (!order.psp_order_id || order.paid_at) return order;
  const mode = (order.psp_mode === "live" ? "live" : "test") as MspMode;
  const psp = await getPayment(env, mode, order.psp_order_id);
  const status = String(psp.status || "").toLowerCase();
  const method = psp.payment_details?.type ?? null;
  if (status !== order.psp_status || method !== order.psp_method) {
    await db
      .prepare("UPDATE orders SET psp_status = ?, psp_transaction = ?, psp_method = ?, updated_at = ? WHERE id = ?")
      .bind(status, psp.transaction_id != null ? String(psp.transaction_id) : null, method, now(), order.id)
      .run();
    if (FAILED.has(status)) await addOrderNote(db, order, `Online betaling niet gelukt (${status}${method ? `, ${methodName(method)}` : ""}).`, null);
    if (status === "uncleared") await addOrderNote(db, order, "Online betaling wacht op goedkeuring (uncleared) bij MultiSafepay.", null);
  }
  if (status === "completed" && order.status === "geannuleerd") {
    if (order.psp_status !== "completed")
      await addOrderNote(db, order, "Let op: de online betaling is binnengekomen NA de annulering. Heropen de bestelling (Status corrigeren) of betaal terug via MultiSafepay.", null);
  } else if (status === "completed") {
    await markPaid(db, makeMailer(env), order, {
      amount: psp.amount / 100,
      at: now(),
      author: null,
      how: `online via MultiSafepay${method ? `, ${methodName(method)}` : ""}${mode === "test" ? ", TEST" : ""}`,
      sendInvoice: true,
      invoice: mode === "live",
    });
    if (Math.abs(psp.amount / 100 - order.total) > 0.005)
      await addOrderNote(db, order, `Let op: betaald bedrag (€ ${(psp.amount / 100).toFixed(2)}) verschilt van het totaal (€ ${order.total.toFixed(2)}).`, null);
  }
  return (await getOrder(db, order.id))!;
}

async function byToken(db: D1Database, number: string, t: string): Promise<OrderRow | null> {
  if (!number || !/^[0-9a-f]{36}$/.test(t)) return null;
  const order = await db.prepare("SELECT * FROM orders WHERE number = ?").bind(number).first<OrderRow>();
  if (!order?.checkout_token || order.checkout_token.length !== t.length) return null;
  let diff = 0;
  for (let i = 0; i < t.length; i++) diff |= t.charCodeAt(i) ^ order.checkout_token.charCodeAt(i);
  return diff === 0 ? order : null;
}

/**
 * Can people check out? `ready`: company and bank settings complete (bank
 * transfer works); `online`: MultiSafepay live with its key; `testOnline`:
 * test mode with a key (only for a page opened with ?test). The winkelmandje
 * links to /afrekenen/ only when `ready`.
 */
/**
 * Counted stock for the winkelmandje (GET ?ids=1,2,3): { stock: { [id]: n } }.
 * Variants whose stock is not counted are left out. The price list and basket
 * say how much of a line is in nabestelling (src/lib/order-limits.ts).
 */
export async function stockLevels(request: Request, env: CheckoutEnv): Promise<Response> {
  if (!env.DB) return json({ stock: {} });
  await ensureSchema(env.DB);
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .slice(0, MAX_LINES)
    .map(Number)
    .filter(Number.isSafeInteger);
  const { byId } = await loadCatalog(env.DB);
  const stock: Record<number, number> = {};
  for (const id of ids) {
    const hit = byId.get(id);
    if (hit && !hit.product.hidden && hit.variant.stock !== null) stock[id] = Math.max(0, hit.variant.stock);
  }
  return json({ stock });
}

export async function availability(env: CheckoutEnv): Promise<Response> {
  if (!env.DB) return json({ ready: false, online: false, testOnline: false });
  await ensureSchema(env.DB);
  const [shop, checkout] = await Promise.all([getSettings(env.DB), getCheckoutSettings(env.DB)]);
  const ready = missingSettings(shop).length === 0;
  const keyed = Boolean(mspKey(env, checkout.mspMode));
  return json({ ready, online: ready && keyed && checkout.mspMode === "live", testOnline: ready && keyed && checkout.mspMode === "test" });
}

export async function status(request: Request, env: CheckoutEnv): Promise<Response> {
  if (!env.DB) return json({ error: "not-configured" }, 503);
  await ensureSchema(env.DB);
  const url = new URL(request.url);
  let order = await byToken(env.DB, str(url.searchParams.get("o"), 20), str(url.searchParams.get("t"), 40));
  if (!order) return json({ error: "Bestelling niet gevonden." }, 404);
  if (order.payment_method === "online" && !order.paid_at) {
    try {
      order = await syncPayment(env, env.DB, order);
    } catch (error) {
      console.error("Payment status check failed", order.number, error);
    }
  }
  const [shop, rows] = await Promise.all([getSettings(env.DB), getLines(env.DB, order.id)]);
  // Checkout stores delivery as a line without a handle (see place()).
  const isDelivery = (l: { handle: string; product: string }) => !l.handle && l.product === "Levering";
  const state = order.status === "geannuleerd" ? "geannuleerd" : order.paid_at ? "betaald" : order.payment_method === "overschrijving" ? "overschrijving" : FAILED.has(order.psp_status ?? "") ? "mislukt" : "bezig";
  return json({
    number: order.number,
    state,
    total: order.total,
    method: order.payment_method,
    paidWith: methodName(order.psp_method),
    email: order.email,
    firstName: order.name.trim().split(/\s+/)[0] ?? "",
    delivery: order.delivery === 1,
    place: order.delivery === 1 ? { street: order.street, postcode: order.postcode, city: order.city } : null,
    lines: rows.filter((l) => !isDelivery(l)).map((l) => ({ handle: l.handle, product: l.product, label: l.label === l.product ? "" : l.label, qty: l.qty, total: round2(l.qty * l.unit) })),
    deliveryCost: round2(rows.filter(isDelivery).reduce((sum, l) => sum + l.qty * l.unit, 0)),
    test: order.psp_mode === "test",
    transfer:
      order.payment_method === "overschrijving" && !order.paid_at
        ? { holder: shop.accountHolder, iban: formatIban(shop.iban), bic: shop.bic, reference: order.ogm, amount: order.total, days: Number(shop.paymentDays) || 8 }
        : null,
  });
}

export async function retry(request: Request, env: CheckoutEnv): Promise<Response> {
  if (!env.DB) return json({ error: "not-configured" }, 503);
  const db = env.DB;
  await ensureSchema(db);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const ip = request.headers.get("cf-connecting-ip") ?? "";
  if (rateLimited(ip || "unknown")) return json({ error: "Te veel pogingen kort na elkaar." }, 429);
  let order = await byToken(db, str(body.o, 20), str(body.t, 40));
  if (!order) return json({ error: "Bestelling niet gevonden." }, 404);
  if (order.payment_method === "online") order = await syncPayment(env, db, order).catch(() => order!);
  if (order.paid_at || order.status !== "bevestigd") return json({ error: "Deze bestelling staat niet meer open voor betaling." }, 409);
  const origin = siteOrigin(request);
  if (body.method === "overschrijving") {
    await db.prepare("UPDATE orders SET payment_method = 'overschrijving', updated_at = ? WHERE id = ?").bind(now(), order.id).run();
    order = (await getOrder(db, order.id))!;
    await addOrderNote(db, order, "Klant koos alsnog voor betalen via overschrijving.", null);
    const mail = makeMailer(env);
    if (mail) await mailPaymentRequest(db, mail, order, "").catch((error) => console.error("Payment request mail failed", error));
    return json({ redirect: returnPath(order) });
  }
  if (!order.psp_mode) {
    const { mspMode } = await getCheckoutSettings(db);
    await db.prepare("UPDATE orders SET psp_mode = ? WHERE id = ?").bind(mspMode, order.id).run();
    order = (await getOrder(db, order.id))!;
  }
  try {
    return json({ redirect: await startPayment(env, db, order, origin, ip) });
  } catch (error) {
    console.error("MultiSafepay retry failed", order.number, error);
    return json({ error: error instanceof MspError ? "Online betalen lukt nu niet. Kies betalen via overschrijving." : "Er ging iets mis." }, 502);
  }
}

// ---------------------------------------------------------------- webhook

export async function webhook(request: Request, env: CheckoutEnv): Promise<Response> {
  const ok = () => new Response("OK", { headers: { "content-type": "text/plain" } });
  if (!env.DB) return ok();
  const db = env.DB;
  await ensureSchema(db);
  const raw = await request.text();
  let pspId = new URL(request.url).searchParams.get("transactionid") ?? "";
  try {
    pspId = String((JSON.parse(raw) as { order_id?: string }).order_id ?? pspId);
  } catch {
    // keep the query parameter
  }
  const order = pspId ? await db.prepare("SELECT * FROM orders WHERE psp_order_id = ?").bind(pspId).first<OrderRow>() : null;
  // Not ours (or an old attempt): acknowledge so MultiSafepay stops retrying.
  if (!order) return ok();
  const key = mspKey(env, order.psp_mode === "live" ? "live" : "test");
  if (!(await validSignature(request.headers.get("auth"), raw, key))) {
    console.warn("MultiSafepay webhook with a bad signature", pspId);
    return new Response("invalid signature", { status: 401 });
  }
  try {
    await syncPayment(env, db, order); // the API, not the body, decides
  } catch (error) {
    console.error("Webhook: payment status check failed", pspId, error);
    return new Response("retry", { status: 500 }); // MultiSafepay retries
  }
  return ok();
}

// ---------------------------------------------------------------- cron

/** Online orders nobody paid within ABANDON_DAYS: one last check, then cancel (stock back). */
export async function sweepAbandoned(env: CheckoutEnv): Promise<number> {
  if (!env.DB) return 0;
  const db = env.DB;
  await ensureSchema(db);
  const cutoff = new Date(Date.now() - ABANDON_DAYS * 86_400_000).toISOString();
  const { results } = await db
    .prepare("SELECT * FROM orders WHERE payment_method = 'online' AND status = 'bevestigd' AND paid_at IS NULL AND confirmed_at < ? LIMIT 20")
    .bind(cutoff)
    .all<OrderRow>();
  let cancelled = 0;
  for (const o of results) {
    try {
      const fresh = await syncPayment(env, db, o);
      if (!fresh.paid_at && (await cancelUnpaid(db, fresh, `online betaling niet afgerond binnen ${ABANDON_DAYS} dagen`, null))) cancelled++;
    } catch (error) {
      console.error("Sweep failed for", o.number, error);
    }
  }
  return cancelled;
}

