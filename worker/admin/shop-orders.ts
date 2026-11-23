/*
 * Webshop backend, orders side: Bestellingen (list, detail, actions, manual
 * orders, orders from a quote request) and Facturen (list, PDF, CSV for the
 * accountant). See worker/shop/orders.ts for the flow and the rules.
 */

import { now } from "../crm/schema";
import { loadCatalog, variantLabel, type LiveProduct } from "../shop/catalog";
import { cancelMail, invoiceMail, paymentRequestMail, readyMail, type RefundState } from "../shop/mail";
import {
  EDITABLE,
  getLines,
  getOrder,
  isOrderStatus,
  issueInvoice,
  openInvoice,
  ORDER_STATUSES,
  orderStatusLabel,
  releaseStock,
  replaceLines,
  round2,
  todayBE,
  totals,
  VAT_RATE,
  createOrder,
  type InvoiceData,
  type InvoiceRow,
  type LineRow,
  type NewLine,
  type OrderRow,
  type OrderStatus,
} from "../shop/orders";
import { invoicePdf, orderPdf, pdfBase64 } from "../shop/pdf";
import { syncPayment } from "../shop/checkout";
import { methodName, refundPayment, type MspMode } from "../shop/msp";
import { getSettings, missingSettings } from "../shop/settings";
import { euro, html, icon, lines as multiline, raw, when, ago, type Safe } from "./html";
import { field, HttpError, like, notFound, respond, seeOther, userOptions, who, type Ctx } from "./pages";

const OPEN_ORDER: OrderStatus[] = ["nieuw", "bevestigd", "betaald", "klaar"];


async function orderNote(ctx: Ctx, order: Pick<OrderRow, "id" | "contact_id">, body: string, kind: "note" | "event" = "event") {
  if (!order.contact_id) return;
  await ctx.db
    .prepare("INSERT INTO notes (contact_id, order_id, kind, author, body, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(order.contact_id, order.id, kind, ctx.user.email, body, now())
    .run();
}

// ---------------------------------------------------------------- list

type Badge = Safe;
const badge = (label: string, tone: "" | "attention" | "warning" | "info" | "success" | "critical", progress: "done" | "todo" | "half" | "plain") =>
  html`<span class="b ${tone} ${progress}">${label}</span>`;

/** Shopify-style "Payment status". */
export function paymentBadge(o: Pick<OrderRow, "status" | "paid_at" | "refunded_at">): Badge {
  if (o.status === "geannuleerd" && o.refunded_at) return badge("Terugbetaald", "", "done");
  if (o.status === "geannuleerd") return o.paid_at ? badge("Terug te betalen", "attention", "half") : badge("Geannuleerd", "", "plain");
  if (o.paid_at || o.status === "betaald" || o.status === "klaar" || o.status === "geleverd") return badge("Betaald", "", "done");
  if (o.status === "bevestigd") return badge("Wacht op betaling", "attention", "todo");
  return badge("Te bevestigen", "warning", "todo");
}

/** Shopify-style "Fulfillment status". */
export function fulfilBadge(o: Pick<OrderRow, "status" | "delivery">): Badge | string {
  if (o.status === "geannuleerd") return "";
  if (o.status === "geleverd") return badge(o.delivery ? "Geleverd" : "Afgehaald", "", "done");
  if (o.status === "klaar") return badge(o.delivery ? "Klaar voor levering" : "Klaar om af te halen", "info", "half");
  return badge("Niet afgehandeld", "attention", "todo");
}

export const orderChip = (o: Pick<OrderRow, "status" | "paid_at" | "delivery">) => html`${paymentBadge(o)} ${fulfilBadge(o)}`;

const channel = (o: Pick<OrderRow, "source">) => (o.source === "website" ? "Webshop" : o.source === "offerte" ? "Offerte" : "Manueel");
const deliveryLabel = (o: Pick<OrderRow, "delivery">) => (o.delivery ? "Levering" : "Afhalen in Zele");

/** Filter tabs ("views"), Shopify's All / Unfulfilled / Unpaid / … */
const VIEWS: [key: string, label: string, statuses: OrderStatus[] | null][] = [
  ["alle", "Alle", null],
  ["open", "Niet afgehandeld", ["nieuw", "bevestigd", "betaald", "klaar"]],
  ["nieuw", "Te bevestigen", ["nieuw"]],
  ["onbetaald", "Wacht op betaling", ["bevestigd"]],
  ["betaald", "Te verzenden", ["betaald"]],
  ["klaar", "Klaar", ["klaar"]],
  ["geleverd", "Geleverd", ["geleverd"]],
  ["geannuleerd", "Geannuleerd", ["geannuleerd"]],
];
const PER_PAGE = 50;
const PERIODS: [days: number, label: string][] = [
  [1, "Vandaag"],
  [7, "Laatste 7 dagen"],
  [30, "Laatste 30 dagen"],
  [90, "Laatste 90 dagen"],
];

const beDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit" });
/** UTC instant of Brussels midnight, `daysAgo` days back. */
function beMidnight(daysAgo: number): Date {
  const day = new Date(Date.now() - daysAgo * 86_400_000);
  const local = beDay.format(day); // YYYY-MM-DD in Brussels
  const guess = new Date(`${local}T00:00:00Z`);
  const shown = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/Brussels" }));
  const offset = shown.getTime() - new Date(guess.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(guess.getTime() - offset);
}

function sparkline(values: number[]): Safe {
  if (values.length < 2 || values.every((v) => v === 0)) return raw('<svg class="spark" viewBox="0 0 44 16" aria-hidden="true"><path d="M0 14H44" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>');
  const max = Math.max(...values) || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * 44).toFixed(1)},${(14 - (v / max) * 12).toFixed(1)}`).join(" ");
  return raw(`<svg class="spark" viewBox="0 0 44 16" aria-hidden="true"><polyline points="${pts}" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/></svg>`);
}

type ListRow = OrderRow & { line_count: number };

function filters(ctx: Ctx) {
  const p = ctx.url.searchParams;
  const view = VIEWS.find(([k]) => k === p.get("status")) ?? VIEWS[0];
  const q = (p.get("q") ?? "").trim();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (view[2]) {
    where.push(`status IN (${view[2].map(() => "?").join(",")})`);
    args.push(...view[2]);
  }
  if (q) {
    const cols = ["number", "name", "email", "phone", "city", "company", "ogm"];
    where.push(`(${cols.map((c) => `${c} LIKE ? ESCAPE '\\'`).join(" OR ")})`);
    args.push(...cols.map(() => like(q)));
  }
  return { view, q, sql: where.length ? ` WHERE ${where.join(" AND ")}` : "", args };
}

export async function orderList(ctx: Ctx): Promise<Response> {
  const p = ctx.url.searchParams;
  const { view, q, sql, args } = filters(ctx);
  const pageNo = Math.max(1, Number(p.get("pagina")) || 1);
  const days = PERIODS.find(([d]) => d === Number(p.get("periode")))?.[0] ?? 30;
  const sparkDays = Math.max(days, 7);
  const sparkFrom = beMidnight(sparkDays - 1).toISOString();

  const [{ results }, total, { results: counts }, { results: recent }, waiting] = await Promise.all([
    ctx.db
      .prepare(`SELECT orders.*, (SELECT COUNT(*) FROM order_lines l WHERE l.order_id = orders.id) AS line_count FROM orders${sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...args, PER_PAGE, (pageNo - 1) * PER_PAGE)
      .all<ListRow>(),
    ctx.db.prepare(`SELECT COUNT(*) AS n FROM orders${sql}`).bind(...args).first<{ n: number }>(),
    ctx.db.prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all<{ status: string; n: number }>(),
    ctx.db
      .prepare("SELECT created_at, delivered_at, status, total, (SELECT COUNT(*) FROM order_lines l WHERE l.order_id = orders.id) AS line_count FROM orders WHERE created_at >= ? OR delivered_at >= ?")
      .bind(sparkFrom, sparkFrom)
      .all<{ created_at: string; delivered_at: string | null; status: string; total: number; line_count: number }>(),
    ctx.db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS sum FROM orders WHERE status = 'bevestigd'").first<{ n: number; sum: number }>(),
  ]);
  const n = new Map(counts.map((c) => [c.status, c.n]));
  const viewCount = (statuses: OrderStatus[] | null) => (statuses ? statuses.reduce((t, s) => t + (n.get(s) ?? 0), 0) : counts.reduce((t, c) => t + c.n, 0));

  // KPI strip: the period's figures, sparkline per day over at least 7 days.
  const dayKeys = Array.from({ length: sparkDays }, (_, i) => beDay.format(new Date(beMidnight(sparkDays - 1 - i).getTime() + 3_600_000)));
  const series = (pick: (r: (typeof recent)[number]) => [string | null, number]) => {
    const m = new Map(dayKeys.map((k) => [k, 0]));
    for (const r of recent) {
      const [at, v] = pick(r);
      if (!at) continue;
      const k = beDay.format(new Date(at));
      if (m.has(k)) m.set(k, m.get(k)! + v);
    }
    return [...m.values()];
  };
  const inPeriod = (vals: number[]) => vals.slice(-days).reduce((a, b) => a + b, 0);
  const live = (r: (typeof recent)[number]) => r.status !== "geannuleerd";
  const sOrders = series((r) => [live(r) ? r.created_at : null, 1]);
  const sLines = series((r) => [live(r) ? r.created_at : null, r.line_count]);
  const sRevenue = series((r) => [live(r) ? r.created_at : null, r.total]);
  const sDelivered = series((r) => [r.status === "geleverd" ? r.delivered_at : null, 1]);
  const sCancelled = series((r) => [r.status === "geannuleerd" ? r.created_at : null, 1]);
  const kpi = (label: string, value: string, vals: number[] | null, title: string) =>
    html`<div class="kpi" title="${title}"><span>${label}</span><b>${value}</b>${vals ? sparkline(vals) : ""}</div>`;

  const link = (patch: Record<string, string | null>) => {
    const u = new URLSearchParams(p);
    for (const [k, v] of Object.entries(patch)) (v === null ? u.delete(k) : u.set(k, v));
    return `${ctx.base}/bestellingen${u.size ? `?${u}` : ""}`;
  };
  const count = total?.n ?? 0;
  const first = count ? (pageNo - 1) * PER_PAGE + 1 : 0;
  const last = Math.min(count, pageNo * PER_PAGE);

  return respond(
    ctx,
    "Bestellingen",
    "bestellingen",
    html`<div class="ph"><div class="title">${icon("cart")}Bestellingen</div>
<a class="btn ghost" href="${ctx.base}/bestellingen.csv${p.size ? `?${p}` : ""}">Exporteren</a>
<details class="menu"><summary class="btn ghost">Meer acties ${icon("chevron")}</summary><div class="pop">
<a href="${ctx.base}/facturen">Facturen</a><a href="${ctx.base}/facturen.csv">Facturen exporteren (boekhouder)</a><a href="${ctx.base}/aanvragen?soort=bestellingen">Bestelaanvragen</a></div></details>
<a class="btn" href="${ctx.base}/bestellingen/nieuw">Bestelling maken</a></div>
<div class="kpis"><form class="period" method="get" action="${ctx.base}/bestellingen">${p.get("status") ? html`<input type="hidden" name="status" value="${p.get("status")!}">` : ""}<select name="periode" aria-label="Periode">${PERIODS.map(
      ([d, l]) => html`<option value="${d}" ${d === days ? raw("selected") : ""}>${l}</option>`,
    )}</select></form>
${kpi("Bestellingen", String(inPeriod(sOrders)), sOrders, "Bestellingen in de periode (zonder geannuleerde)")}
${kpi("Artikelen besteld", String(inPeriod(sLines)), sLines, "Bestelregels in de periode")}
${kpi("Omzet", euro(inPeriod(sRevenue)), sRevenue, "Totaal incl. btw van de bestellingen in de periode")}
${kpi("Wacht op betaling", waiting?.n ? `${waiting.n} · ${euro(waiting.sum)}` : "0", null, "Bevestigd, betaling nog niet ontvangen (alle periodes)")}
${kpi("Te verzenden", String((n.get("betaald") ?? 0) + (n.get("klaar") ?? 0)), null, "Betaald of klaar, nog niet geleverd (alle periodes)")}
${kpi("Geleverd", String(inPeriod(sDelivered)), sDelivered, "Geleverd of afgehaald in de periode")}
${kpi("Geannuleerd", String(inPeriod(sCancelled)), sCancelled, "Geannuleerd in de periode")}</div>
<section class="card flush">
<div class="views">${VIEWS.map(
      ([k, l, s]) => html`<a href="${link({ status: k === "alle" ? null : k, pagina: null })}" class="${view[0] === k ? "on" : ""}">${l}${k !== "alle" ? html`<span class="n">${viewCount(s)}</span>` : ""}</a>`,
    )}
<form method="get" action="${ctx.base}/bestellingen">${view[0] !== "alle" ? html`<input type="hidden" name="status" value="${view[0]}">` : ""}<label class="search">${icon("search")}<input name="q" type="search" value="${q}" placeholder="Zoeken en filteren" aria-label="Zoek op nummer, naam, e-mail, gemeente, mededeling"></label></form></div>
${
  results.length
    ? html`<form method="post" action="${ctx.base}/bestellingen/bulk" data-bulk>
<div class="bulk"><b><span data-selected>0</span> geselecteerd</b><label class="check small"><input type="checkbox" name="mail" value="1" checked> Klant mailen</label><button class="btn ghost sm" name="action" value="ready">Markeren als klaar</button><button class="btn ghost sm" name="action" value="delivered">Markeren als geleverd</button></div>
${orderTable(ctx, results, true, true)}</form>`
    : html`<p class="muted" style="padding:24px 16px">${q ? "Geen bestellingen gevonden." : "Nog geen bestellingen."}</p>`
}
${
  count > PER_PAGE
    ? html`<div class="pager"><span>${first}–${last} van ${count}</span><span class="seg"><a href="${link({ pagina: String(pageNo - 1) })}" class="${pageNo > 1 ? "" : "off"}" aria-label="Vorige">${icon("left")}</a><a href="${link({
        pagina: String(pageNo + 1),
      })}" class="${last < count ? "" : "off"}" aria-label="Volgende">${icon("right")}</a></span></div>`
    : ""
}</section>`,
    true,
  );
}

export function orderTable(ctx: Ctx, rows: (OrderRow & { line_count?: number })[], withCustomer = true, select = false): Safe {
  if (!rows.length) return html`<p class="muted">Geen bestellingen.</p>`;
  return html`<div class="scroll"><table class="itable"><thead><tr>${select ? html`<th class="sel"><input type="checkbox" data-all aria-label="Alles selecteren"></th>` : ""}<th>Bestelling</th><th>Datum ↓</th>${
    withCustomer ? html`<th>Klant</th>` : ""
  }<th>Kanaal</th><th class="num">Totaal</th><th>Betaalstatus</th><th>Afhandeling</th>${rows[0].line_count !== undefined ? html`<th>Artikelen</th>` : ""}<th>Leveringsmethode</th></tr></thead><tbody>
${rows.map(
  (o) => html`<tr data-href="${ctx.base}/bestellingen/${o.id}">${select ? html`<td class="sel"><input type="checkbox" name="id" value="${o.id}" aria-label="Selecteer ${o.number}"></td>` : ""}<td><a class="strong" href="${ctx.base}/bestellingen/${o.id}">#${o.number}</a>${
    o.mail_status === "mislukt" ? html` <span class="b critical plain" title="De mail naar de inbox is mislukt">mail mislukt</span>` : ""
  }</td>
<td title="${when(o.created_at)}">${shortDate(o.created_at)}</td>
${withCustomer ? html`<td class="cust">${o.company || o.name || o.email}</td>` : ""}
<td>${channel(o)}</td><td class="num">${euro(o.total)}</td><td>${paymentBadge(o)}</td><td>${fulfilBadge(o)}</td>${
    o.line_count !== undefined ? html`<td>${o.line_count} ${o.line_count === 1 ? "artikel" : "artikelen"}</td>` : ""
  }<td>${deliveryLabel(o)}</td></tr>`,
)}</tbody></table></div>`;
}

const shortFmt = new Intl.DateTimeFormat("nl-BE", { timeZone: "Europe/Brussels", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const yearFmt = new Intl.DateTimeFormat("nl-BE", { timeZone: "Europe/Brussels", year: "numeric" });
/** "10 nov. om 19:14" (with the year when it is not this year), like Shopify. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  const parts = shortFmt.formatToParts(d);
  const get = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  const year = yearFmt.format(d) !== yearFmt.format(new Date()) ? ` ${yearFmt.format(d)}` : "";
  return `${get("day")} ${get("month")}${year} om ${get("hour")}:${get("minute")}`;
}

/** Bulk actions on the list: only orders where the step makes sense. */
export async function orderBulk(ctx: Ctx, form: FormData): Promise<Response> {
  const action = field(form, "action");
  const ids = form.getAll("id").map(Number).filter((x) => Number.isInteger(x) && x > 0).slice(0, 200);
  const allowed: Record<string, OrderStatus[]> = { ready: ["betaald"], delivered: ["betaald", "klaar"] };
  if (!allowed[action]) throw new HttpError(400, "Onbekende actie.");
  for (const id of ids) {
    const order = await getOrder(ctx.db, id);
    if (!order || !allowed[action].includes(order.status as OrderStatus)) continue;
    const one = new FormData();
    one.set("action", action);
    if (field(form, "mail") === "1") one.set("mail", "1");
    try {
      await orderPost(ctx, id, one);
    } catch (error) {
      // A mail that failed must not stop the other orders (their status is set; mail again from the order).
      if (!(error instanceof HttpError)) throw error;
    }
  }
  return seeOther(ctx, `/bestellingen${ctx.url.search}`, "saved");
}

export async function ordersCsv(ctx: Ctx): Promise<Response> {
  const { sql, args } = filters(ctx);
  const { results } = await ctx.db
    .prepare(`SELECT orders.*, (SELECT COUNT(*) FROM order_lines l WHERE l.order_id = orders.id) AS line_count FROM orders${sql} ORDER BY created_at DESC LIMIT 5000`)
    .bind(...args)
    .all<ListRow>();
  const text = (b: Safe | string) => String(b).replace(/<[^>]+>/g, "").trim();
  const headers = ["Bestelling", "Datum", "Klant", "Bedrijf", "E-mail", "Telefoon", "Adres", "Postcode", "Gemeente", "Kanaal", "Betaalstatus", "Afhandeling", "Leveringsmethode", "Artikelen", "Totaal", "Mededeling"];
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = results.map((o) => [
    o.number, when(o.created_at), o.name, o.company, o.email, o.phone, o.street, o.postcode, o.city, channel(o),
    text(paymentBadge(o)), text(fulfilBadge(o)), deliveryLabel(o), o.line_count, o.total.toFixed(2).replace(".", ","), o.ogm,
  ]);
  const csv = "﻿" + [headers, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="natuurhout-bestellingen-${todayBE()}.csv"` } });
}

// ---------------------------------------------------------------- line editor

/** Options for the product picker: every variant, grouped per product. */
function variantOptions(products: LiveProduct[], selected: number | null): Safe {
  return html`<option value="">Vrije regel…</option>${products.map(
    (p) => html`<optgroup label="${p.title}">${p.variants.map(
      (v) =>
        html`<option value="${v.id}" ${v.id === selected ? raw("selected") : ""}>${variantLabel(p, v)} · ${euro(parseFloat(v.price))}${
          v.stock !== null ? ` · voorraad ${v.stock}` : v.available ? "" : " · op bestelling"
        }</option>`,
    )}</optgroup>`,
  )}`;
}

function lineEditor(products: LiveProduct[], lines: Pick<NewLine, "variant_id" | "label" | "qty" | "unit">[], extra = 3): Safe {
  const rows = [...lines, ...Array.from({ length: extra }, () => ({ variant_id: null, label: "", qty: 0, unit: 0 }))];
  return html`<div class="scroll"><table class="editor"><thead><tr><th style="min-width:260px">Product</th><th>Omschrijving (vrije regel)</th><th class="num">Prijs incl. btw</th><th class="num">Aantal</th></tr></thead><tbody>
${rows.map(
  (l) => html`<tr><td><select name="v" aria-label="Product">${variantOptions(products, l.variant_id)}</select></td>
<td><input name="l" value="${l.variant_id ? "" : l.label}" placeholder="Bv. Levering Gent" aria-label="Omschrijving"></td>
<td class="num"><input name="p" inputmode="decimal" value="${l.unit ? String(l.unit).replace(".", ",") : ""}" placeholder="catalogus" aria-label="Prijs" style="width:110px"></td>
<td class="num"><input name="q" inputmode="numeric" value="${l.qty ? String(l.qty) : ""}" aria-label="Aantal" style="width:80px"></td></tr>`,
)}</tbody></table></div>
<p class="muted small">Kies een product (prijs uit de catalogus, of vul zelf een prijs in) of schrijf een vrije regel met prijs, bv. levering. Aantal leeg of 0 = regel weg.</p>`;
}

const parseMoney = (s: string) => {
  const t = s.replace(/[€\s]/g, "");
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  return Number.isFinite(n) ? n : NaN;
};

async function parseLines(ctx: Ctx, form: FormData): Promise<NewLine[]> {
  const { byId } = await loadCatalog(ctx.db);
  const v = form.getAll("v").map(String);
  const l = form.getAll("l").map(String);
  const p = form.getAll("p").map(String);
  const q = form.getAll("q").map(String);
  const out: NewLine[] = [];
  for (let i = 0; i < v.length; i++) {
    const qty = Number((q[i] ?? "").replace(",", "."));
    if (!qty || qty <= 0) continue;
    if (qty > 100_000) throw new HttpError(400, "Aantal te groot.");
    const price = (p[i] ?? "").trim() ? parseMoney(p[i]) : null;
    if (price !== null && (Number.isNaN(price) || Math.abs(price) > 1_000_000)) throw new HttpError(400, `Ongeldige prijs: ${p[i]}`);
    const hit = v[i] ? byId.get(Number(v[i])) : undefined;
    if (hit) {
      out.push({
        variant_id: hit.variant.id,
        handle: hit.product.handle,
        product: hit.product.title,
        label: variantLabel(hit.product, hit.variant),
        qty,
        unit: round2(price ?? parseFloat(hit.variant.price)),
        note: "",
      });
    } else if ((l[i] ?? "").trim()) {
      if (price === null) throw new HttpError(400, `Geef een prijs voor "${l[i].trim()}".`);
      out.push({ variant_id: null, handle: "", product: "", label: l[i].trim().slice(0, 200), qty, unit: round2(price), note: "" });
    }
  }
  return out;
}

// ---------------------------------------------------------------- new order

type QuoteData = { lines?: { id?: number; group: string; label: string; detail: string; qty: number; unit: number | null }[]; street?: string; postcode?: string; city?: string; remarks?: string };

export async function orderNew(ctx: Ctx): Promise<Response> {
  const p = ctx.url.searchParams;
  const { products, byId } = await loadCatalog(ctx.db);
  let contact: Record<string, string | number | null> | null = null;
  let prefill: Pick<NewLine, "variant_id" | "label" | "qty" | "unit">[] = [];
  let requestId: number | null = null;
  let address = { street: "", postcode: "", city: "", remarks: "" };
  const fromRequest = Number(p.get("aanvraag"));
  if (fromRequest) {
    const r = await ctx.db.prepare("SELECT * FROM requests WHERE id = ?").bind(fromRequest).first<{ id: number; contact_id: number; data: string | null; delivery: number }>();
    if (!r) throw notFound();
    requestId = r.id;
    contact = await ctx.db.prepare("SELECT * FROM contacts WHERE id = ?").bind(r.contact_id).first();
    let data: QuoteData = {};
    try {
      data = r.data ? JSON.parse(r.data) : {};
    } catch {
      /* no lines */
    }
    prefill = (data.lines ?? []).map((l) => {
      const hit = l.id !== undefined ? byId.get(l.id) : undefined;
      return hit
        ? { variant_id: hit.variant.id, label: "", qty: l.qty, unit: parseFloat(hit.variant.price) }
        : { variant_id: null, label: [l.group, l.label, l.detail].filter(Boolean).join(" – ").slice(0, 200), qty: l.qty, unit: l.unit ?? 0 };
    });
    address = { street: data.street ?? "", postcode: data.postcode ?? "", city: data.city ?? "", remarks: data.remarks ?? "" };
  } else if (Number(p.get("klant"))) {
    contact = await ctx.db.prepare("SELECT * FROM contacts WHERE id = ?").bind(Number(p.get("klant"))).first();
  }
  const c = (k: string) => String(contact?.[k] ?? "");
  const f = (name: string, label: string, value: string, type = "text", required = false) =>
    html`<label>${label}<input name="${name}" type="${type}" value="${value}" ${required ? raw("required") : ""}></label>`;
  return respond(
    ctx,
    "Nieuwe bestelling",
    "bestellingen",
    html`<div class="head"><div><h1>Nieuwe bestelling</h1><p class="sub">${
      requestId ? html`Van <a href="${ctx.base}/aanvragen/${requestId}">aanvraag #${requestId}</a>. Controleer de regels en prijzen.` : "Telefonische of manuele bestelling."
    }</p></div></div>
<form method="post" action="${ctx.base}/bestellingen">
${requestId ? html`<input type="hidden" name="request_id" value="${requestId}">` : ""}${contact ? html`<input type="hidden" name="contact_id" value="${c("id")}">` : ""}
<section class="card"><h2>Klant</h2><div class="fields">${f("name", "Naam", c("name"), "text", true)}${f("company", "Bedrijf", c("company"))}${f("email", "E-mail", c("email"), "email")}${f(
      "phone",
      "Telefoon",
      c("phone"),
    )}${f("vat_number", "Btw-nummer (bedrijf)", "")}</div>
<div class="fields">${f("street", "Straat + nr", address.street || c("street"))}${f("postcode", "Postcode", address.postcode || c("postcode"))}${f("city", "Gemeente", address.city || c("city"))}
<label>Levering<select name="delivery"><option value="0">Afhalen in Zele</option><option value="1">Levering</option></select></label></div>
<label>Opmerking<textarea name="remarks">${address.remarks}</textarea></label></section>
<section class="card"><h2>Regels</h2>${lineEditor(products, prefill, prefill.length ? 2 : 5)}</section>
<div class="actions"><label style="margin:0">Toegewezen aan<select name="assigned_to">${userOptions(ctx, ctx.user.email)}</select></label><button>Bestelling aanmaken</button></div>
</form>`,
  );
}

export async function orderCreate(ctx: Ctx, form: FormData): Promise<Response> {
  const lines = await parseLines(ctx, form);
  if (!lines.length) throw new HttpError(400, "Voeg minstens één regel toe.");
  const name = field(form, "name", 200);
  const email = field(form, "email", 200).toLowerCase();
  if (!name) throw new HttpError(400, "Een naam is verplicht.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Ongeldig e-mailadres.");
  const at = now();
  let contactId = Number(field(form, "contact_id")) || null;
  if (!contactId && email) contactId = (await ctx.db.prepare("SELECT id FROM contacts WHERE email = ? COLLATE NOCASE").bind(email).first<{ id: number }>())?.id ?? null;
  if (!contactId) {
    const row = await ctx.db
      .prepare(`INSERT INTO contacts (name, email, phone, company, street, postcode, city, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`)
      .bind(name, email || null, field(form, "phone", 40), field(form, "company", 200), field(form, "street", 200), field(form, "postcode", 10), field(form, "city", 100), at, at)
      .first<{ id: number }>();
    contactId = row!.id;
  }
  const requestId = Number(field(form, "request_id")) || null;
  const assigned = field(form, "assigned_to").toLowerCase() || null;
  const order = await createOrder(ctx.db, {
    contact_id: contactId,
    request_id: requestId,
    source: requestId ? "offerte" : "manueel",
    name,
    email,
    phone: field(form, "phone", 40),
    company: field(form, "company", 200),
    vat_number: field(form, "vat_number", 30),
    delivery: field(form, "delivery") === "1",
    street: field(form, "street", 200),
    postcode: field(form, "postcode", 10),
    city: field(form, "city", 100),
    remarks: field(form, "remarks", 4000),
    created_by: ctx.user.email,
    assigned_to: assigned && ctx.users.has(assigned) ? assigned : null,
    lines,
  });
  await orderNote(ctx, order, `Bestelling ${order.number} aangemaakt${requestId ? ` van aanvraag #${requestId}` : ""}`);
  if (requestId) {
    await ctx.db.prepare("UPDATE requests SET status = 'gewonnen', updated_at = ? WHERE id = ? AND status <> 'gewonnen'").bind(now(), requestId).run();
  }
  return seeOther(ctx, `/bestellingen/${order.id}`, "created");
}

// ---------------------------------------------------------------- detail

export async function orderDetail(ctx: Ctx, id: number): Promise<Response> {
  const order = await getOrder(ctx.db, id);
  if (!order) throw notFound();
  const [lines, invoices, notes, settings, catalog, siblings, contactOrders] = await Promise.all([
    getLines(ctx.db, id),
    ctx.db.prepare("SELECT * FROM invoices WHERE order_id = ? ORDER BY id").bind(id).all<InvoiceRow>(),
    ctx.db.prepare("SELECT * FROM notes WHERE order_id = ? ORDER BY created_at DESC").bind(id).all<{ kind: string; author: string; body: string; created_at: string }>(),
    getSettings(ctx.db),
    loadCatalog(ctx.db),
    ctx.db
      .prepare("SELECT (SELECT id FROM orders WHERE created_at > ? ORDER BY created_at ASC LIMIT 1) AS newer, (SELECT id FROM orders WHERE created_at < ? ORDER BY created_at DESC LIMIT 1) AS older")
      .bind(order.created_at, order.created_at)
      .first<{ newer: number | null; older: number | null }>(),
    order.contact_id ? ctx.db.prepare("SELECT COUNT(*) AS n FROM orders WHERE contact_id = ?").bind(order.contact_id).first<{ n: number }>() : null,
  ]);
  const status = order.status as OrderStatus;
  const editing = ctx.url.searchParams.has("bewerk") && EDITABLE.includes(status) && !invoices.results.length;
  const t = totals(lines);
  const missing = missingSettings(settings);
  const canMail = Boolean(ctx.mail && order.email);
  const post = `${ctx.base}/bestellingen/${id}`;
  const hidden = (name: string) => html`<input type="hidden" name="action" value="${name}">`;
  const mailCheck = (name: string, label: string) =>
    canMail ? html`<label class="check"><input type="checkbox" name="${name}" value="1" checked> ${label}</label>` : html`<p class="muted small">${order.email ? "E-mail verzenden is niet ingesteld." : "Geen e-mailadres: geen mail."}</p>`;
  const images = new Map(catalog.products.map((p) => [p.handle, p.images[0]?.src ?? null]));
  const thumb = (handle: string) => {
    const src = handle ? images.get(handle) : null;
    return src ? html`<img class="thumb" src="${`${src}${src.includes("?") ? "&" : "?"}width=96`}" alt="" loading="lazy">` : html`<span class="thumb">${icon("package")}</span>`;
  };
  const hasInvoice = invoices.results.some((i) => i.type === "factuur");
  const hasOpenInvoice = invoices.results.some((i) => i.type === "factuur" && !invoices.results.some((c) => c.credit_of === i.id));
  const itemCount = lines.length;

  // Fulfilment card: the goods, and the next delivery step.
  const fulfilActions: Safe[] = [];
  if (status === "betaald") fulfilActions.push(html`<form method="post" action="${post}">${hidden("delivered")}<button class="btn ghost">${order.delivery ? "Markeren als geleverd" : "Markeren als afgehaald"}</button></form>`);
  if (status === "betaald")
    fulfilActions.push(
      html`<form method="post" action="${post}" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">${hidden("ready")}${mailCheck("mail", "Klant mailen")}<button>${order.delivery ? "Klaar voor levering" : "Klaar om af te halen"}</button></form>`,
    );
  if (status === "klaar") fulfilActions.push(html`<form method="post" action="${post}">${hidden("delivered")}<button>${order.delivery ? "Markeren als geleverd" : "Markeren als afgehaald"}</button></form>`);

  const fulfilCard = html`<section class="card"><div class="head" style="margin-bottom:10px"><h2 style="display:flex;gap:8px;align-items:center">${fulfilBadge(order) || badge("Geannuleerd", "", "plain")}</h2>${
    EDITABLE.includes(status) && !invoices.results.length && !editing ? html`<a class="btn plain" href="${post}?bewerk=1">Bewerken</a>` : ""
  }</div>
<div class="box"><div class="contact" style="padding:8px 0 4px"><div class="row">${icon("truck")}<span>${order.delivery ? "Levering aan huis" : "Afhalen in Zele"}${
    order.delivery && (order.street || order.city) ? html` · <span class="muted">${[order.street, [order.postcode, order.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</span>` : ""
  }</span></div></div>
${
  editing
    ? html`<form method="post" action="${post}" style="padding:8px 0">${hidden("lines")}${lineEditor(catalog.products, lines)}
<div class="actions"><button>Opslaan</button><a class="btn ghost" href="${post}">Annuleren</a></div>${
        status === "bevestigd" ? html`<p class="muted small">Het betaalverzoek is al verstuurd: mail het na het wijzigen opnieuw.</p>` : ""
      }</form>`
    : lines.map(
        (l) => html`<div class="li">${thumb(l.handle)}<div class="what">${l.handle ? html`<a href="https://www.natuurhout.be/shop/${l.handle}/" target="_blank" rel="noopener">${l.product}</a>` : html`<b>${l.product || l.label}</b>`}${
          l.product && l.label !== l.product ? html`<div class="muted small">${l.label}</div>` : ""
        }${l.note ? html`<div class="b critical plain small" style="margin-top:3px">${l.note}</div>` : ""}${l.reserved ? html`<div class="muted small">${l.reserved} uit voorraad gereserveerd</div>` : ""}</div>
<span class="q">${euro(l.unit)} × ${l.qty}</span><span class="t">${euro(l.qty * l.unit)}</span></div>`,
      )
}</div>
${fulfilActions.length ? html`<div class="actions" style="justify-content:flex-end;margin-top:12px">${fulfilActions}</div>` : ""}</section>`;

  // Payment card: the money, and the next payment step.
  let payStep: Safe | string = "";
  if (missing.length && (status === "nieuw" || status === "bevestigd"))
    payStep = html`<p class="b attention plain" style="white-space:normal;margin-top:12px">Vul eerst bij <a href="${ctx.base}/instellingen">&nbsp;Instellingen&nbsp;</a> in: ${missing.join(", ")}.</p>`;
  else if (status === "nieuw")
    payStep = html`<form method="post" action="${post}" class="sec">${hidden("confirm")}${mailCheck("mail", `Betaalverzoek met QR-code mailen naar ${order.email}`)}
<details><summary class="small">Bericht toevoegen aan de mail</summary><label style="margin-top:8px">Bericht<textarea name="message" style="min-height:60px" placeholder="Bv. levering voorzien in week 12"></textarea></label></details>
<div class="actions" style="justify-content:flex-end;margin-top:10px"><button>Bevestigen en betaalverzoek sturen</button></div></form>`;
  else if (status === "bevestigd" && order.payment_method === "online")
    payStep = html`<div class="sec"><p class="muted small" style="margin:0 0 8px">De klant betaalt online; zodra MultiSafepay de betaling bevestigt, wordt de bestelling automatisch betaald gezet en de factuur gemaild. Onbetaald na 3 dagen: automatisch geannuleerd.</p>
<div class="actions" style="justify-content:flex-end"><form method="post" action="${post}">${hidden("psp-sync")}<button class="btn ghost">Status bij MultiSafepay opvragen</button></form></div>
<details style="margin-top:8px"><summary class="small">Toch handmatig als betaald markeren</summary><form method="post" action="${post}" style="margin-top:8px">${hidden("paid")}<div class="fields"><label>Ontvangen bedrag<input name="amount" inputmode="decimal" value="${String(order.total).replace(".", ",")}"></label><label>Datum<input name="date" type="date" value="${todayBE()}"></label></div>${mailCheck("mail", "Factuur maken en mailen")}<button>Betaling ontvangen</button></form></details></div>`;
  else if (status === "bevestigd")
    payStep = html`<form method="post" action="${post}" class="sec">${hidden("paid")}<div class="fields"><label>Ontvangen bedrag<input name="amount" inputmode="decimal" value="${String(order.total).replace(".", ",")}"></label><label>Datum<input name="date" type="date" value="${todayBE()}"></label></div>${mailCheck(
      "mail",
      "Factuur maken en mailen",
    )}<div class="actions" style="justify-content:flex-end;margin-top:10px"><button>Betaling ontvangen</button></div></form>`;
  if (status === "geannuleerd" && order.paid_at && !order.refunded_at)
    payStep = canRefundOnline(order)
      ? html`<form method="post" action="${post}" class="sec">${hidden("refund")}<input type="hidden" name="how" value="online"><p class="muted small" style="margin:0 0 8px">Geannuleerd, maar al online betaald: betaal ${euro(paidAmount(order))} terug op dezelfde manier als de klant betaalde${order.psp_method ? ` (${methodName(order.psp_method)})` : ""}. Het geld gaat van je MultiSafepay-saldo.</p>${mailCheck("mail", "Klant mailen (met creditnota)")}<div class="actions" style="justify-content:flex-end;margin-top:10px"><button data-confirm="${euro(paidAmount(order))} terugbetalen via MultiSafepay?">${euro(paidAmount(order))} terugbetalen via MultiSafepay</button></div></form>`
      : html`<form method="post" action="${post}" class="sec">${hidden("refund")}<input type="hidden" name="how" value="overschrijving"><p class="muted small" style="margin:0 0 8px">Geannuleerd, maar al betaald via overschrijving: stort het bedrag terug via je bank (naar de rekening waarvan de klant betaalde) en duid het hier aan.</p><div class="fields"><label>Teruggestort bedrag<input name="amount" inputmode="decimal" value="${String(paidAmount(order)).replace(".", ",")}"></label><label>Datum<input name="date" type="date" value="${todayBE()}"></label></div>${mailCheck("mail", "Klant mailen (met creditnota)")}<div class="actions" style="justify-content:flex-end;margin-top:10px"><button>Markeren als terugbetaald</button></div></form>`;
  const paid = order.paid_amount ?? (order.paid_at ? order.total : 0);
  const payCard = html`<section class="card"><h2>${paymentBadge(order)}</h2>
<div class="box" style="padding:12px"><div class="sumrows">
<span>Subtotaal</span><span class="m">${itemCount} ${itemCount === 1 ? "artikel" : "artikelen"}</span><span class="r">${euro(t.total)}</span>
<span>Excl. btw</span><span></span><span class="r">${euro(t.net)}</span>
<span>Btw</span><span class="m">${VAT_RATE}% (inbegrepen)</span><span class="r">${euro(t.vat)}</span>
<span class="tot">Totaal</span><span></span><span class="r tot">${euro(t.total)}</span>
<hr>
${
  order.payment_method
    ? html`<span>Betaalwijze</span><span class="m">${
        order.payment_method === "online"
          ? html`Online via MultiSafepay${order.psp_mode === "test" ? html` <span class="b attention plain">TEST</span>` : ""}${order.psp_method ? ` · ${methodName(order.psp_method)}` : ""}${
              order.psp_status ? ` · status ${order.psp_status}` : ""
            }${order.psp_transaction ? ` · transactie ${order.psp_transaction}` : ""}`
          : "Overschrijving"
      }</span><span></span>`
    : ""
}
<span>Betaald door klant</span><span class="m">${order.paid_at ? `${paidHow(order)} ${when(order.paid_at)}` : html`mededeling <code>${order.ogm}</code>`}</span><span class="r">${euro(paid)}</span>
${order.paid_at && Math.abs(paid - order.total) > 0.005 ? html`<span class="warn">Verschil</span><span></span><span class="r warn">${euro(round2(paid - order.total))}</span>` : ""}
${order.refunded_at ? html`<span>Terugbetaald</span><span class="m">${order.refund_ref?.startsWith("multisafepay") ? `via MultiSafepay${order.refund_ref.length > 12 ? ` (${order.refund_ref.slice(13)})` : ""}` : "via overschrijving"} ${when(order.refunded_at)}</span><span class="r">− ${euro(order.refund_amount ?? paid)}</span>` : ""}
</div></div>${payStep}</section>`;

  const docsCard = invoices.results.length
    ? html`<section class="card"><h2>Documenten</h2>${invoices.results.map(
        (i) => html`<div class="li" style="align-items:center"><span class="thumb">${icon("receipt")}</span><div class="what"><a href="${ctx.base}/facturen/${i.id}.pdf" target="_blank">${i.type === "factuur" ? "Factuur" : "Creditnota"} ${i.number}</a><div class="muted small">${when(i.issued_at)} · ${
          i.emailed_at ? `gemaild ${ago(i.emailed_at)} geleden` : "niet gemaild"
        }</div></div><span class="t">${euro(i.total)}</span>${
          canMail ? html`<form method="post" action="${post}" class="inline-form">${hidden("mail-invoice")}<input type="hidden" name="invoice" value="${i.id}"><button class="btn ghost sm">Mailen</button></form>` : ""
        }</div>`,
      )}</section>`
    : "";

  const timeline = html`<section class="card"><h2>Tijdlijn</h2>
<form method="post" action="${post}">${hidden("note")}<label style="margin:0"><textarea name="body" required style="min-height:56px" placeholder="Laat een notitie achter…" aria-label="Notitie"></textarea></label><div class="actions" style="justify-content:flex-end;margin-top:8px"><button class="btn ghost">Plaatsen</button></div></form>
${notes.results.length ? html`<ul class="timeline" style="margin-top:6px">${notes.results.map((n) => html`<li class="${n.kind}"><div class="meta">${who(ctx, n.author) || "Website"} · ${when(n.created_at)}</div>${multiline(n.body)}</li>`)}</ul>` : ""}</section>`;

  const addr = [order.street, [order.postcode, order.city].filter(Boolean).join(" ")].filter(Boolean);
  const customerCard = html`<section class="card"><div class="head" style="margin-bottom:8px"><h2>Klant</h2><details class="menu"><summary class="btn plain">Bewerken</summary><div class="pop panel" style="min-width:300px;padding:12px">
<form method="post" action="${post}">${hidden("customer")}
${(["name:Naam", "company:Bedrijf", "vat_number:Btw-nummer", "email:E-mail", "phone:Telefoon", "street:Straat + nr", "postcode:Postcode", "city:Gemeente"] as const).map((pair) => {
  const [k, label] = pair.split(":") as [keyof OrderRow, string];
  return html`<label>${label}<input name="${k}" value="${String(order[k] ?? "")}"></label>`;
})}
<label>Levering<select name="delivery"><option value="0">Afhalen</option><option value="1" ${order.delivery ? raw("selected") : ""}>Levering</option></select></label>
<label>Toegewezen aan<select name="assigned_to">${userOptions(ctx, order.assigned_to)}</select></label>
<button>Opslaan</button></form></div></details></div>
<p style="margin:0">${order.contact_id ? html`<a href="${ctx.base}/klanten/${order.contact_id}">${order.name || order.company || order.email}</a>` : html`<b>${order.name || order.company}</b>`}</p>
${contactOrders ? html`<p class="muted" style="margin:2px 0 0">${contactOrders.n === 1 ? "1 bestelling" : `${contactOrders.n} bestellingen`}</p>` : ""}
<div class="sec"><h3>Contactgegevens</h3><div class="contact">${order.email ? html`<div class="row">${icon("mail")}<a href="mailto:${order.email}">${order.email}</a></div>` : html`<span class="muted">Geen e-mailadres</span>`}${
    order.phone ? html`<div class="row">${icon("phone")}<a href="tel:${order.phone.replace(/[^\d+]/g, "")}">${order.phone}</a></div>` : ""
  }</div></div>
<div class="sec"><h3>${order.delivery ? "Leveringsadres" : "Afhalen"}</h3><div class="contact"><div class="row">${icon("pin")}<span>${
    addr.length ? html`${order.company ? html`${order.company}<br>` : ""}${order.name}<br>${addr.map((r, i) => html`${i ? html`<br>` : ""}${r}`)}` : html`<span class="muted">Geen adres</span>`
  }</span></div></div></div>
${order.vat_number || order.company ? html`<div class="sec"><h3>Factuurgegevens</h3><p style="margin:0">${order.company || order.name}${order.vat_number ? html`<br>Btw ${order.vat_number}` : ""}</p></div>` : ""}
${order.assigned_to ? html`<div class="sec"><h3>Toegewezen aan</h3><p style="margin:0">${who(ctx, order.assigned_to)}</p></div>` : ""}</section>`;

  const menu = html`<details class="menu"><summary class="btn ghost">Meer acties ${icon("chevron")}</summary><div class="pop">
<a href="${post}/bevestiging.pdf" target="_blank">Bestelbevestiging (PDF)</a>
${EDITABLE.includes(status) && !invoices.results.length ? html`<a href="${post}?bewerk=1">Artikelen bewerken</a>` : ""}
${status === "bevestigd" && canMail && order.payment_method !== "online" ? html`<form method="post" action="${post}">${hidden("resend")}<button>Betaalverzoek opnieuw mailen</button></form>` : ""}
${!hasOpenInvoice && ["betaald", "klaar", "geleverd", "bevestigd"].includes(status) ? html`<form method="post" action="${post}">${hidden("invoice")}<input type="hidden" name="mail" value="${canMail ? "1" : ""}"><button>Factuur maken${canMail ? " en mailen" : ""}</button></form>` : ""}
${order.request_id ? html`<a href="${ctx.base}/aanvragen/${order.request_id}">Oorspronkelijke aanvraag</a>` : ""}
${
  status !== "geannuleerd" && status !== "geleverd"
    ? html`<hr><form method="post" action="${post}">${hidden("cancel")}${
        order.paid_at && canRefundOnline(order)
          ? html`<label class="check small"><input type="checkbox" name="refund" value="1" checked> ${euro(paidAmount(order))} terugbetalen via MultiSafepay</label>`
          : order.paid_at
            ? html`<p class="muted small" style="margin:0 0 6px">Betaald via overschrijving: stort ${euro(paidAmount(order))} terug via je bank en duid het daarna aan bij Betaling.</p>`
            : ""
      }${canMail ? html`<label class="check small"><input type="checkbox" name="mail" value="1" checked> Klant mailen</label>` : ""}<button class="danger" data-confirm="${
        hasInvoice ? "Bestelling annuleren? Er wordt een creditnota gemaakt." : "Bestelling annuleren?"
      }">Bestelling annuleren</button></form>`
    : ""
}</div></details>`;

  return respond(
    ctx,
    `Bestelling ${order.number}`,
    "bestellingen",
    html`<div class="ph"><a class="back" href="${ctx.base}/bestellingen" aria-label="Terug naar bestellingen">${icon("back")}</a><h1>#${order.number} ${paymentBadge(order)} ${fulfilBadge(order)}</h1><span style="flex:1"></span>
<a class="btn ghost" href="${post}/bevestiging.pdf" target="_blank">Afdrukken</a>${menu}
<span class="seg"><a href="${siblings?.newer ? `${ctx.base}/bestellingen/${siblings.newer}` : "#"}" class="${siblings?.newer ? "" : "off"}" aria-label="Nieuwere bestelling">${icon("left")}</a><a href="${
      siblings?.older ? `${ctx.base}/bestellingen/${siblings.older}` : "#"
    }" class="${siblings?.older ? "" : "off"}" aria-label="Oudere bestelling">${icon("right")}</a></span>
<p class="meta">${when(order.created_at)} · ${
      order.source === "website" ? "via de webshop" : order.source === "offerte" ? html`van <a href="${ctx.base}/aanvragen/${order.request_id}">aanvraag #${order.request_id}</a>` : `manueel door ${who(ctx, order.created_by)}`
    }${order.mail_status === "mislukt" ? html` · <span class="warn">mail naar de inbox mislukt</span>` : ""}</p></div>
<div class="grid two"><div>
${fulfilCard}
${payCard}
${docsCard}
${timeline}
</div>
<div>
<section class="card"><h2>Opmerkingen</h2>${order.remarks ? html`<p style="margin:0">${multiline(order.remarks)}</p>` : html`<p class="muted" style="margin:0">Geen opmerkingen van de klant</p>`}</section>
${customerCard}
<section class="card"><details><summary class="small">Status corrigeren</summary><form method="post" action="${post}" class="inline" style="margin-top:10px">${hidden("status")}
<select name="status" aria-label="Status">${ORDER_STATUSES.filter(([k]) => k !== "geannuleerd").map(([k, l]) => html`<option value="${k}" ${k === status ? raw("selected") : ""}>${l}</option>`)}</select><button class="btn ghost">Zet</button></form>
<p class="muted small" style="margin-bottom:0">Alleen om een vergissing recht te zetten: er wordt niets gemaild of gefactureerd.</p></details></section>
</div></div>`,
  );
}

// ---------------------------------------------------------------- actions

async function sendPaymentRequest(ctx: Ctx, order: OrderRow, message: string) {
  const [lines, settings] = await Promise.all([getLines(ctx.db, order.id), getSettings(ctx.db)]);
  const pdf = pdfBase64(orderPdf(order, lines, settings));
  await ctx.mail!(order.email, paymentRequestMail(order, lines, settings, pdf, message));
}

async function makeInvoice(ctx: Ctx, order: OrderRow, mail: boolean, type: "factuur" | "creditnota" = "factuur", credit?: InvoiceRow) {
  const [current, settings] = await Promise.all([getLines(ctx.db, order.id), getSettings(ctx.db)]);
  // A credit note mirrors the invoice it cancels, not the order as it is now.
  const lines = credit ? ((JSON.parse(credit.data) as InvoiceData).lines.map((l) => ({ ...l, qty: Math.abs(l.qty) })) as LineRow[]) : current;
  const missing = missingSettings(settings);
  if (missing.length) throw new HttpError(400, `Vul eerst bij Instellingen in: ${missing.join(", ")}.`);
  const inv = await issueInvoice(ctx.db, order, lines, settings, type, ctx.user.email, credit);
  await orderNote(ctx, order, `${type === "factuur" ? "Factuur" : "Creditnota"} ${inv.number} gemaakt (${euro(inv.total)})`);
  if (mail && ctx.mail && order.email) await mailInvoice(ctx, order, inv);
  return inv;
}

async function mailInvoice(ctx: Ctx, order: OrderRow, inv: InvoiceRow) {
  const data = JSON.parse(inv.data) as InvoiceData;
  const pdf = pdfBase64(invoicePdf(inv.number, inv.type, data));
  await ctx.mail!(order.email, invoiceMail(order, inv.number, inv.type, inv.total, data.seller, pdf));
  await ctx.db.prepare("UPDATE invoices SET emailed_at = ? WHERE id = ?").bind(now(), inv.id).run();
  await orderNote(ctx, order, `${inv.type === "factuur" ? "Factuur" : "Creditnota"} ${inv.number} gemaild naar ${order.email}`);
}

const paidAmount = (order: OrderRow) => order.paid_amount ?? order.total;
const canRefundOnline = (order: OrderRow) => order.payment_method === "online" && order.psp_status === "completed" && Boolean(order.psp_order_id);

/** Refund the whole paid amount through MultiSafepay, back the way the customer paid. */
async function refundOnline(ctx: Ctx, order: OrderRow): Promise<RefundState> {
  const amount = paidAmount(order);
  const mode = (order.psp_mode === "live" ? "live" : "test") as MspMode;
  const res = await refundPayment(ctx.checkout, mode, order.psp_order_id!, amount, `Terugbetaling bestelling ${order.number}`);
  const ref = `multisafepay${res.refund_id ? ` ${res.refund_id}` : res.transaction_id ? ` ${res.transaction_id}` : ""}`;
  await ctx.db.prepare("UPDATE orders SET refunded_at = ?, refund_amount = ?, refund_ref = ?, updated_at = ? WHERE id = ?").bind(now(), amount, ref, now(), order.id).run();
  await orderNote(ctx, order, `Terugbetaald via MultiSafepay: ${euro(amount)}${mode === "test" ? " (TEST)" : ""}`);
  return { kind: "online", amount, method: order.psp_method ? methodName(order.psp_method) : "" };
}

async function lastCredit(ctx: Ctx, orderId: number): Promise<InvoiceRow | undefined> {
  return (await ctx.db.prepare("SELECT * FROM invoices WHERE order_id = ? AND type = 'creditnota' ORDER BY id DESC LIMIT 1").bind(orderId).first<InvoiceRow>()) ?? undefined;
}

/** "Bestelling geannuleerd" / "Terugbetaling": what happens to the money, credit note attached. */
async function sendCancelMail(ctx: Ctx, order: OrderRow, cancelled: boolean, refund: RefundState, credit?: InvoiceRow) {
  const settings = await getSettings(ctx.db);
  const creditPdf = credit ? { number: credit.number, pdf: pdfBase64(invoicePdf(credit.number, credit.type, JSON.parse(credit.data) as InvoiceData)) } : undefined;
  await ctx.mail!(order.email, cancelMail(order, settings, { cancelled, refund, credit: creditPdf }));
  if (credit) await ctx.db.prepare("UPDATE invoices SET emailed_at = ? WHERE id = ?").bind(now(), credit.id).run();
  await orderNote(ctx, order, `Mail "${cancelled ? "bestelling geannuleerd" : "terugbetaling"}" gestuurd naar ${order.email}${credit ? ` (met creditnota ${credit.number})` : ""}`);
}

/** How the customer paid, for "Betaald door klant": online with the method MultiSafepay reports, else by transfer. */
function paidHow(order: OrderRow): string {
  if (order.payment_method === "online" && order.psp_status === "completed") return `online${order.psp_method ? ` (${methodName(order.psp_method)})` : ""}`;
  return "overschrijving";
}

const mailFailed = (error: unknown) => {
  console.error("Shop mail failed", error);
  return new HttpError(502, "De e-mail kon niet verstuurd worden. De wijziging zelf is opgeslagen; probeer het mailen opnieuw.");
};

export async function orderPost(ctx: Ctx, id: number, form: FormData): Promise<Response> {
  const order = await getOrder(ctx.db, id);
  if (!order) throw notFound();
  const action = field(form, "action");
  const at = now();
  const setStatus = async (status: OrderStatus, extra = "", ...args: (string | number | null)[]) => {
    await ctx.db.prepare(`UPDATE orders SET status = ?, updated_at = ?${extra} WHERE id = ?`).bind(status, at, ...args, id).run();
    await orderNote(ctx, order, `Status: ${orderStatusLabel(order.status)} → ${orderStatusLabel(status)}`);
  };
  const wantsMail = field(form, "mail") === "1" && Boolean(ctx.mail && order.email);

  switch (action) {
    case "note": {
      const body = field(form, "body", 10_000);
      if (body) await orderNote(ctx, order, body, "note");
      return seeOther(ctx, `/bestellingen/${id}`, "note");
    }
    case "lines": {
      if (!EDITABLE.includes(order.status as OrderStatus) || (await openInvoice(ctx.db, id))) throw new HttpError(400, "Deze bestelling kan niet meer gewijzigd worden.");
      const lines = await parseLines(ctx, form);
      if (!lines.length) throw new HttpError(400, "Een bestelling heeft minstens één regel nodig. Annuleer ze anders.");
      await replaceLines(ctx.db, id, lines, ctx.user.email);
      const total = totals(lines.map((l) => ({ ...l, vat_rate: VAT_RATE }))).total;
      await orderNote(ctx, order, `Regels gewijzigd: totaal ${euro(order.total)} → ${euro(total)}`);
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
    case "customer": {
      const assigned = field(form, "assigned_to").toLowerCase() || null;
      await ctx.db
        .prepare("UPDATE orders SET name = ?, company = ?, vat_number = ?, email = ?, phone = ?, street = ?, postcode = ?, city = ?, delivery = ?, assigned_to = ?, updated_at = ? WHERE id = ?")
        .bind(
          field(form, "name", 200),
          field(form, "company", 200),
          field(form, "vat_number", 30),
          field(form, "email", 200).toLowerCase(),
          field(form, "phone", 40),
          field(form, "street", 200),
          field(form, "postcode", 10),
          field(form, "city", 100),
          field(form, "delivery") === "1" ? 1 : 0,
          assigned && ctx.users.has(assigned) ? assigned : null,
          at,
          id,
        )
        .run();
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
    case "confirm": {
      if (order.status !== "nieuw") throw new HttpError(400, "Deze bestelling is al bevestigd.");
      const missing = missingSettings(await getSettings(ctx.db));
      if (missing.length) throw new HttpError(400, `Vul eerst bij Instellingen in: ${missing.join(", ")}.`);
      await setStatus("bevestigd", ", confirmed_at = ?", at);
      if (wantsMail) {
        try {
          await sendPaymentRequest(ctx, { ...order, confirmed_at: at }, field(form, "message", 2000));
          await orderNote(ctx, order, `Betaalverzoek gemaild naar ${order.email}`);
        } catch (error) {
          throw mailFailed(error);
        }
      }
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
    case "psp-sync": {
      if (!order.psp_order_id) throw new HttpError(400, "Deze bestelling heeft geen online betaling.");
      try {
        await syncPayment(ctx.checkout, ctx.db, order);
      } catch (error) {
        throw new HttpError(502, `MultiSafepay gaf geen antwoord: ${(error as Error).message}`);
      }
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
    case "resend": {
      if (!ctx.mail || !order.email) throw new HttpError(400, "Mailen is niet mogelijk.");
      try {
        await sendPaymentRequest(ctx, order, "");
      } catch (error) {
        throw mailFailed(error);
      }
      await orderNote(ctx, order, `Betaalverzoek opnieuw gemaild naar ${order.email}`);
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
    case "paid": {
      if (order.status !== "bevestigd" && order.status !== "nieuw") throw new HttpError(400, "Deze bestelling staat niet open voor betaling.");
      const amount = parseMoney(field(form, "amount", 30));
      if (Number.isNaN(amount) || amount < 0) throw new HttpError(400, "Ongeldig bedrag.");
      const date = /^\d{4}-\d{2}-\d{2}$/.test(field(form, "date")) ? `${field(form, "date")}T12:00:00.000Z` : at;
      await setStatus("betaald", ", paid_at = ?, paid_amount = ?", date, round2(amount));
      const paidOrder = { ...order, status: "betaald", paid_at: date, paid_amount: amount };
      if (!(await openInvoice(ctx.db, id))) {
        try {
          await makeInvoice(ctx, paidOrder, wantsMail);
        } catch (error) {
          if (error instanceof HttpError) throw error;
          throw mailFailed(error);
        }
      }
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
    case "invoice": {
      if (await openInvoice(ctx.db, id)) throw new HttpError(400, "Er is al een factuur.");
      try {
        await makeInvoice(ctx, order, wantsMail);
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw mailFailed(error);
      }
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
    case "mail-invoice": {
      const inv = await ctx.db.prepare("SELECT * FROM invoices WHERE id = ? AND order_id = ?").bind(Number(field(form, "invoice")), id).first<InvoiceRow>();
      if (!inv || !ctx.mail || !order.email) throw notFound();
      try {
        await mailInvoice(ctx, order, inv);
      } catch (error) {
        throw mailFailed(error);
      }
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
    case "ready":
      await setStatus("klaar");
      // "Uw bestelling staat klaar" (afhalen: adres + openingsuren; levering: we bellen voor een dag).
      if (wantsMail) {
        try {
          const [lines, settings] = await Promise.all([getLines(ctx.db, id), getSettings(ctx.db)]);
          await ctx.mail!(order.email, readyMail(order, lines, settings));
          await orderNote(ctx, order, `Mail "${order.delivery ? "klaar voor levering" : "klaar om af te halen"}" gestuurd naar ${order.email}`);
        } catch (error) {
          throw mailFailed(error);
        }
      }
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    case "delivered":
      await setStatus("geleverd", ", delivered_at = ?", at);
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    case "cancel": {
      if (order.status === "geannuleerd") return seeOther(ctx, `/bestellingen/${id}`);
      await releaseStock(ctx.db, id, ctx.user.email, "bestelling geannuleerd");
      await setStatus("geannuleerd", ", cancelled_at = ?", at);
      const inv = await openInvoice(ctx.db, id);
      const credit = inv ? await makeInvoice(ctx, order, false, "creditnota", inv) : undefined;
      // Paid online: give the money back through MultiSafepay at once (when ticked).
      let refund: RefundState = order.paid_at ? { kind: "pending", amount: paidAmount(order) } : { kind: "none" };
      let refundError = "";
      if (order.paid_at && field(form, "refund") === "1" && canRefundOnline(order)) {
        try {
          refund = await refundOnline(ctx, order);
        } catch (error) {
          refundError = (error as Error).message;
          await orderNote(ctx, order, `Terugbetaling via MultiSafepay mislukt: ${refundError}`);
        }
      }
      if (wantsMail) {
        try {
          await sendCancelMail(ctx, order, true, refund, credit);
        } catch (error) {
          throw mailFailed(error);
        }
      }
      if (refundError) throw new HttpError(502, `De bestelling is geannuleerd, maar de terugbetaling via MultiSafepay lukte niet: ${refundError}. Probeer opnieuw bij Betaling.`);
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
    case "refund": {
      // A cancelled, paid order: online through MultiSafepay, or a bank transfer marked by hand.
      if (order.status !== "geannuleerd" || !order.paid_at || order.refunded_at) throw new HttpError(400, "Deze bestelling kan niet terugbetaald worden.");
      let refund: RefundState;
      if (field(form, "how") === "online") {
        if (!canRefundOnline(order)) throw new HttpError(400, "Deze bestelling werd niet online betaald.");
        try {
          refund = await refundOnline(ctx, order);
        } catch (error) {
          await orderNote(ctx, order, `Terugbetaling via MultiSafepay mislukt: ${(error as Error).message}`);
          throw new HttpError(502, `MultiSafepay: ${(error as Error).message}`);
        }
      } else {
        const amount = round2(parseFloat(field(form, "amount").replace(",", ".")) || paidAmount(order));
        const date = /^\d{4}-\d{2}-\d{2}$/.test(field(form, "date")) ? `${field(form, "date")}T12:00:00.000Z` : at;
        await ctx.db.prepare("UPDATE orders SET refunded_at = ?, refund_amount = ?, refund_ref = 'overschrijving', updated_at = ? WHERE id = ?").bind(date, amount, at, id).run();
        await orderNote(ctx, order, `Terugbetaald via overschrijving: ${euro(amount)}`);
        refund = { kind: "transfer", amount };
      }
      if (wantsMail) {
        try {
          await sendCancelMail(ctx, order, false, refund, await lastCredit(ctx, id));
        } catch (error) {
          throw mailFailed(error);
        }
      }
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
    case "status": {
      const status = field(form, "status");
      if (!isOrderStatus(status) || status === "geannuleerd") throw new HttpError(400, "Onbekende status.");
      if (status !== order.status) {
        if (order.status === "geannuleerd") {
          await ctx.db.prepare("UPDATE orders SET cancelled_at = NULL WHERE id = ?").bind(id).run();
        }
        await setStatus(status);
      }
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    }
  }
  throw new HttpError(400, "Onbekende actie.");
}

// ---------------------------------------------------------------- PDFs + invoices

const pdfResponse = (bytes: Uint8Array, filename: string) =>
  new Response(bytes, { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${filename}"` } });

export async function orderPdfResponse(ctx: Ctx, id: number): Promise<Response> {
  const order = await getOrder(ctx.db, id);
  if (!order) throw notFound();
  const [lines, settings] = await Promise.all([getLines(ctx.db, id), getSettings(ctx.db)]);
  return pdfResponse(orderPdf(order, lines, settings), `Natuurhout-bestelling-${order.number}.pdf`);
}

export async function invoicePdfResponse(ctx: Ctx, id: number): Promise<Response> {
  const inv = await ctx.db.prepare("SELECT * FROM invoices WHERE id = ?").bind(id).first<InvoiceRow>();
  if (!inv) throw notFound();
  return pdfResponse(invoicePdf(inv.number, inv.type, JSON.parse(inv.data) as InvoiceData), `Natuurhout-${inv.type}-${inv.number}.pdf`);
}

export async function invoiceList(ctx: Ctx): Promise<Response> {
  const year = Number(ctx.url.searchParams.get("jaar")) || Number(todayBE().slice(0, 4));
  const [{ results }, { results: years }] = await Promise.all([
    ctx.db
      .prepare("SELECT i.*, o.number AS order_number, o.name, o.company, o.paid_at FROM invoices i JOIN orders o ON o.id = i.order_id WHERE i.year = ? ORDER BY i.seq DESC")
      .bind(year)
      .all<InvoiceRow & { order_number: string; name: string; company: string; paid_at: string | null }>(),
    ctx.db.prepare("SELECT DISTINCT year FROM invoices ORDER BY year DESC").all<{ year: number }>(),
  ]);
  const sum = round2(results.reduce((t, i) => t + i.total, 0));
  const vat = round2(results.reduce((t, i) => t + i.vat, 0));
  const yearList = [...new Set([year, ...years.map((y) => y.year)])].sort((a, b) => b - a);
  return respond(
    ctx,
    "Facturen",
    "facturen",
    html`<div class="head"><div><h1>Facturen</h1><p class="sub">Facturen en creditnota's, doorlopend genummerd per jaar.</p></div>
<div class="actions"><a class="btn ghost" href="${ctx.base}/facturen.csv?jaar=${year}">${icon("download")}Export ${year} (CSV)</a></div></div>
<form class="toolbar" method="get" action="${ctx.base}/facturen"><select name="jaar" aria-label="Jaar">${yearList.map((y) => html`<option ${y === year ? raw("selected") : ""}>${y}</option>`)}</select>
<span class="summary"><b>${results.length}</b> documenten · <b>${euro(sum)}</b> incl. btw · btw <b>${euro(vat)}</b></span></form>
<section class="card">${
      results.length
        ? html`<div class="scroll"><table><thead><tr><th>Nummer</th><th>Datum</th><th>Klant</th><th>Bestelling</th><th>Status</th><th class="num">Btw</th><th class="num">Totaal</th></tr></thead><tbody>
${results.map(
  (i) => html`<tr><td><a href="${ctx.base}/facturen/${i.id}.pdf" target="_blank">${i.number}</a>${i.type === "creditnota" ? html` <span class="chip">creditnota</span>` : ""}</td>
<td class="small">${when(i.issued_at)}</td><td>${i.company || i.name}</td><td><a href="${ctx.base}/bestellingen/${i.order_id}">${i.order_number}</a></td>
<td class="small">${i.type === "creditnota" ? "" : i.paid_at ? html`<span class="chip os-betaald">betaald</span>` : html`<span class="chip warn">open</span>`}${i.emailed_at ? "" : html` <span class="muted">niet gemaild</span>`}</td>
<td class="num">${euro(i.vat)}</td><td class="num"><b>${euro(i.total)}</b></td></tr>`,
)}</tbody></table></div>`
        : html`<p class="muted">Nog geen facturen in ${year}.</p>`
    }</section>`,
  );
}

export async function invoicesCsv(ctx: Ctx): Promise<Response> {
  const year = Number(ctx.url.searchParams.get("jaar")) || Number(todayBE().slice(0, 4));
  const { results } = await ctx.db
    .prepare("SELECT i.*, o.number AS order_number, o.paid_at FROM invoices i JOIN orders o ON o.id = i.order_id WHERE i.year = ? ORDER BY i.seq")
    .bind(year)
    .all<InvoiceRow & { order_number: string; paid_at: string | null }>();
  const headers = ["Nummer", "Type", "Datum", "Klant", "Bedrijf", "Btw-nummer klant", "Bestelling", "Excl. btw", "Btw", "Incl. btw", "Betaald op"];
  const nl = (n: number) => n.toFixed(2).replace(".", ",");
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = results.map((i) => {
    const d = JSON.parse(i.data) as InvoiceData;
    return [i.number, i.type, d.date, d.customer.name, d.customer.company, d.customer.vat, i.order_number, nl(round2(i.total - i.vat)), nl(i.vat), nl(i.total), i.paid_at?.slice(0, 10) ?? ""];
  });
  const csv = "﻿" + [headers, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="natuurhout-facturen-${year}.csv"` } });
}

