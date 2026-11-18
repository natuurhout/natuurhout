/*
 * Webshop backend, orders side: Bestellingen (list, detail, actions, manual
 * orders, orders from a quote request) and Facturen (list, PDF, CSV for the
 * accountant). See worker/shop/orders.ts for the flow and the rules.
 */

import { now } from "../crm/schema";
import { loadCatalog, variantLabel, type LiveProduct } from "../shop/catalog";
import { invoiceMail, paymentRequestMail } from "../shop/mail";
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
import { getSettings, missingSettings } from "../shop/settings";
import { euro, html, icon, lines as multiline, raw, when, ago, type Safe } from "./html";
import { field, HttpError, like, notFound, respond, seeOther, userOptions, who, type Ctx } from "./pages";

const OPEN_ORDER: OrderStatus[] = ["nieuw", "bevestigd", "betaald", "klaar"];

export const orderChip = (status: string) => html`<span class="chip os-${status}">${orderStatusLabel(status)}</span>`;

async function orderNote(ctx: Ctx, order: Pick<OrderRow, "id" | "contact_id">, body: string, kind: "note" | "event" = "event") {
  if (!order.contact_id) return;
  await ctx.db
    .prepare("INSERT INTO notes (contact_id, order_id, kind, author, body, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(order.contact_id, order.id, kind, ctx.user.email, body, now())
    .run();
}

// ---------------------------------------------------------------- list

export async function orderList(ctx: Ctx): Promise<Response> {
  const p = ctx.url.searchParams;
  const status = p.get("status") ?? "open";
  const q = (p.get("q") ?? "").trim();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (status === "open") {
    where.push(`status IN (${OPEN_ORDER.map(() => "?").join(",")})`);
    args.push(...OPEN_ORDER);
  } else if (isOrderStatus(status)) {
    where.push("status = ?");
    args.push(status);
  }
  if (q) {
    const cols = ["number", "name", "email", "phone", "city", "company"];
    where.push(`(${cols.map((c) => `${c} LIKE ? ESCAPE '\\'`).join(" OR ")})`);
    args.push(...cols.map(() => like(q)));
  }
  const [{ results }, { results: counts }] = await Promise.all([
    ctx.db
      .prepare(`SELECT * FROM orders${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT 300`)
      .bind(...args)
      .all<OrderRow>(),
    ctx.db.prepare("SELECT status, COUNT(*) AS n, COALESCE(SUM(total), 0) AS sum FROM orders GROUP BY status").all<{ status: string; n: number; sum: number }>(),
  ]);
  const n = new Map(counts.map((c) => [c.status, c]));
  const openCount = OPEN_ORDER.reduce((t, s) => t + (n.get(s)?.n ?? 0), 0);
  const toPay = n.get("bevestigd")?.sum ?? 0;
  const tab = (key: string, label: string, count: number | null) => {
    const u = new URLSearchParams();
    if (key !== "open") u.set("status", key);
    if (q) u.set("q", q);
    return html`<a href="${ctx.base}/bestellingen${u.size ? `?${u}` : ""}" class="${status === key ? "on" : ""}">${label}${count !== null ? html` <span class="n">${count}</span>` : ""}</a>`;
  };
  return respond(
    ctx,
    "Bestellingen",
    "bestellingen",
    html`<div class="head"><div><h1>Bestellingen</h1><p class="sub">Bestellingen van de website en manueel ingevoerde bestellingen.${
      toPay ? html` <b>${euro(toPay)}</b> wacht op betaling.` : ""
    }</p></div>
<div class="actions"><a class="btn" href="${ctx.base}/bestellingen/nieuw">${icon("plus")}Nieuwe bestelling</a></div></div>
<nav class="tabs">${tab("open", "Open", openCount)}${ORDER_STATUSES.map(([k, l]) => tab(k, l, n.get(k)?.n ?? 0))}${tab("alle", "Alle", null)}</nav>
<form class="toolbar" method="get" action="${ctx.base}/bestellingen">${status !== "open" ? html`<input type="hidden" name="status" value="${status}">` : ""}
<label class="search">${icon("search")}<input name="q" type="search" value="${q}" placeholder="Zoek op nummer, naam, e-mail, gemeente…" aria-label="Zoeken"></label><button class="btn ghost">Zoek</button></form>
<section class="card">${orderTable(ctx, results)}</section>`,
  );
}

export function orderTable(ctx: Ctx, rows: OrderRow[], withCustomer = true): Safe {
  if (!rows.length) return html`<p class="muted">Geen bestellingen.</p>`;
  return html`<div class="scroll"><table><thead><tr><th>Nummer</th><th>Datum</th>${withCustomer ? html`<th>Klant</th>` : ""}<th>Status</th><th>Levering</th><th class="num">Totaal</th></tr></thead><tbody>
${rows.map(
  (o) => html`<tr><td><a href="${ctx.base}/bestellingen/${o.id}">${o.number}</a>${o.source !== "website" ? html` <span class="muted small">${o.source}</span>` : ""}${
    o.mail_status === "mislukt" ? html` <span class="warn small">· mail mislukt</span>` : ""
  }</td>
<td class="small" title="${when(o.created_at)}">${ago(o.created_at)}</td>
${withCustomer ? html`<td>${o.contact_id ? html`<a href="${ctx.base}/klanten/${o.contact_id}">${o.company || o.name || o.email}</a>` : o.name}<div class="muted small">${o.city}</div></td>` : ""}
<td>${orderChip(o.status)}</td><td class="small">${o.delivery ? "Levering" : "Afhalen"}</td><td class="num"><b>${euro(o.total)}</b></td></tr>`,
)}</tbody></table></div>`;
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
  const [lines, invoices, notes, settings] = await Promise.all([
    getLines(ctx.db, id),
    ctx.db.prepare("SELECT * FROM invoices WHERE order_id = ? ORDER BY id").bind(id).all<InvoiceRow>(),
    ctx.db.prepare("SELECT * FROM notes WHERE order_id = ? ORDER BY created_at DESC").bind(id).all<{ kind: string; author: string; body: string; created_at: string }>(),
    getSettings(ctx.db),
  ]);
  const editing = ctx.url.searchParams.has("bewerk") && EDITABLE.includes(order.status as OrderStatus) && !invoices.results.length;
  const t = totals(lines);
  const missing = missingSettings(settings);
  const status = order.status as OrderStatus;
  const action = (name: string, label: string, opts: { ghost?: boolean; body?: Safe | string; confirm?: string } = {}) =>
    html`<form method="post" action="${ctx.base}/bestellingen/${id}" class="act"><input type="hidden" name="action" value="${name}">${opts.body ?? ""}<button class="${
      opts.ghost ? "btn ghost" : ""
    }"${opts.confirm ? raw(` data-confirm="${opts.confirm}"`) : ""}>${label}</button></form>`;
  const canMail = Boolean(ctx.mail && order.email);
  const mailCheck = (name: string, label: string) =>
    canMail ? html`<label class="check"><input type="checkbox" name="${name}" value="1" checked> ${label}</label>` : html`<p class="muted small">${order.email ? "E-mail verzenden is niet ingesteld." : "Geen e-mailadres: geen mail."}</p>`;

  const steps: Safe[] = [];
  if (missing.length && (status === "nieuw" || status === "bevestigd"))
    steps.push(html`<p class="warn small">Vul eerst bij <a href="${ctx.base}/instellingen">Instellingen</a> de bedrijfs- en bankgegevens in: ${missing.join(", ")}.</p>`);
  if (status === "nieuw")
    steps.push(
      action("confirm", "Bevestigen & betaalverzoek sturen", {
        body: html`${mailCheck("mail", `Betaalverzoek mailen naar ${order.email}`)}<label>Extra bericht in de mail (optioneel)<textarea name="message" style="min-height:60px" placeholder="Bv. levering voorzien in week 12"></textarea></label>`,
      }),
    );
  if (status === "bevestigd") {
    steps.push(
      action("paid", "Betaling ontvangen", {
        body: html`<div class="fields"><label>Bedrag<input name="amount" inputmode="decimal" value="${String(order.total).replace(".", ",")}"></label><label>Datum<input name="date" type="date" value="${todayBE()}"></label></div>${mailCheck(
          "mail",
          "Factuur maken en mailen",
        )}`,
      }),
    );
    if (canMail) steps.push(action("resend", "Betaalverzoek opnieuw mailen", { ghost: true }));
  }
  if (status === "betaald") steps.push(action("ready", order.delivery ? "Klaar voor levering" : "Klaar om af te halen"));
  if (status === "klaar" || status === "betaald") steps.push(action("delivered", order.delivery ? "Geleverd" : "Afgehaald", { ghost: status === "betaald" }));
  if (status !== "geannuleerd" && status !== "geleverd")
    steps.push(
      action("cancel", "Bestelling annuleren", {
        ghost: true,
        body: invoices.results.some((i) => i.type === "factuur") ? html`<p class="muted small">Er is al een factuur: er wordt een creditnota gemaakt.</p>` : "",
        confirm: "Bestelling annuleren?",
      }),
    );
  const hasOpenInvoice = invoices.results.some((i) => i.type === "factuur" && !invoices.results.some((c) => c.credit_of === i.id));
  if (!hasOpenInvoice && ["betaald", "klaar", "geleverd", "bevestigd"].includes(status)) steps.push(action("invoice", "Factuur maken", { ghost: true, body: mailCheck("mail", "Factuur mailen") }));

  const party = [order.company, order.name, order.street, [order.postcode, order.city].filter(Boolean).join(" "), order.vat_number && `Btw ${order.vat_number}`].filter(Boolean);
  return respond(
    ctx,
    `Bestelling ${order.number}`,
    "bestellingen",
    html`<div class="head"><div><h1>Bestelling ${order.number} ${orderChip(order.status)}</h1><p class="sub">${when(order.created_at)} · ${
      order.source === "website" ? "via de website" : order.source === "offerte" ? html`van <a href="${ctx.base}/aanvragen/${order.request_id}">aanvraag #${order.request_id}</a>` : `manueel door ${who(ctx, order.created_by)}`
    }${order.mail_status === "mislukt" ? html` · <span class="warn">mail naar de inbox mislukt</span>` : ""}</p></div>
<div class="actions"><a class="btn ghost" href="${ctx.base}/bestellingen/${id}/bevestiging.pdf" target="_blank">${icon("file")}Bestelbevestiging (PDF)</a></div></div>
<div class="grid two"><div>
<section class="card"><div class="head" style="margin-bottom:8px"><h2>Regels</h2>${
      EDITABLE.includes(status) && !invoices.results.length && !editing ? html`<a class="btn ghost sm" href="${ctx.base}/bestellingen/${id}?bewerk=1">Regels wijzigen</a>` : ""
    }</div>
${
  editing
    ? html`<form method="post" action="${ctx.base}/bestellingen/${id}"><input type="hidden" name="action" value="lines">${lineEditor((await loadCatalog(ctx.db)).products, lines)}
<div class="actions"><button>Regels opslaan</button><a class="btn ghost" href="${ctx.base}/bestellingen/${id}">Annuleren</a></div>${
        status === "bevestigd" ? html`<p class="muted small">Het betaalverzoek is al verstuurd: mail het na het wijzigen opnieuw.</p>` : ""
      }</form>`
    : html`<div class="scroll"><table><thead><tr><th>Artikel</th><th class="num">Aantal</th><th class="num">Prijs</th><th class="num">Totaal</th></tr></thead><tbody>
${lines.map(
  (l) => html`<tr><td>${l.handle ? html`<a href="https://www.natuurhout.be/shop/${l.handle}/" target="_blank" rel="noopener">${l.product}</a>` : l.product}${
    !l.product ? l.label : l.label !== l.product ? html`<div class="muted small">${l.label}</div>` : ""
  }${l.note ? html`<div class="warn small">${l.note}</div>` : ""}${l.reserved ? html`<div class="muted small">${l.reserved} uit voorraad gereserveerd</div>` : ""}</td>
<td class="num">${l.qty}</td><td class="num">${euro(l.unit)}</td><td class="num">${euro(l.qty * l.unit)}</td></tr>`,
)}
<tr><td colspan="3" class="num muted">Excl. btw</td><td class="num">${euro(t.net)}</td></tr>
<tr><td colspan="3" class="num muted">Btw ${VAT_RATE}%</td><td class="num">${euro(t.vat)}</td></tr>
<tr><td colspan="3" class="num"><b>Totaal incl. btw</b></td><td class="num"><b>${euro(t.total)}</b></td></tr></tbody></table></div>`
}</section>
${order.remarks ? html`<section class="card"><h2>Opmerking van de klant</h2><p>${multiline(order.remarks)}</p></section>` : ""}
<section class="card"><h2>Documenten</h2>${
      invoices.results.length
        ? html`<table><tbody>${invoices.results.map(
            (i) => html`<tr><td><a href="${ctx.base}/facturen/${i.id}.pdf" target="_blank">${i.type === "factuur" ? "Factuur" : "Creditnota"} ${i.number}</a></td><td class="small">${when(i.issued_at)}</td>
<td class="small">${i.emailed_at ? `gemaild ${ago(i.emailed_at)} geleden` : "niet gemaild"}</td><td class="num">${euro(i.total)}</td>
<td class="num">${canMail ? html`<form method="post" action="${ctx.base}/bestellingen/${id}" class="inline-form"><input type="hidden" name="action" value="mail-invoice"><input type="hidden" name="invoice" value="${i.id}"><button class="btn ghost sm">Mailen</button></form>` : ""}</td></tr>`,
          )}</tbody></table>`
        : html`<p class="muted small">Nog geen factuur. Die wordt gemaakt bij "Betaling ontvangen".</p>`
    }</section>
<section class="card"><h2>Tijdlijn</h2>
<form method="post" action="${ctx.base}/bestellingen/${id}"><input type="hidden" name="action" value="note"><label>Nieuwe notitie<textarea name="body" required style="min-height:60px"></textarea></label><button class="btn ghost">Notitie toevoegen</button></form>
${
  notes.results.length
    ? html`<ul class="timeline">${notes.results.map((n) => html`<li class="${n.kind}"><div class="meta">${who(ctx, n.author) || "Website"} · ${when(n.created_at)}</div>${multiline(n.body)}</li>`)}</ul>`
    : ""
}</section>
</div>
<div class="side-first">
<section class="card"><h2>Volgende stap</h2><div class="steps">${steps.length ? steps : html`<p class="muted small">Afgerond.</p>`}</div></section>
<section class="card"><h2>Betaling</h2><dl>
<dt>Bedrag</dt><dd><b>${euro(order.total)}</b></dd>
<dt>Mededeling</dt><dd><code>${order.ogm}</code></dd>
<dt>Status</dt><dd>${order.paid_at ? html`<span class="chip os-betaald">Betaald ${when(order.paid_at)}</span>${order.paid_amount !== null && Math.abs(order.paid_amount - order.total) > 0.005 ? html` <span class="warn small">(${euro(order.paid_amount)})</span>` : ""}` : "Open"}</dd>
</dl></section>
<section class="card"><h2>Klant</h2>
<p>${order.contact_id ? html`<a href="${ctx.base}/klanten/${order.contact_id}"><b>${party[0] ?? order.email}</b></a>` : html`<b>${party[0] ?? ""}</b>`}${party.slice(1).map((r) => html`<br>${r}`)}</p>
<dl>${order.email ? html`<dt>E-mail</dt><dd><a href="mailto:${order.email}">${order.email}</a></dd>` : ""}${order.phone ? html`<dt>Telefoon</dt><dd><a href="tel:${order.phone.replace(/[^\d+]/g, "")}">${order.phone}</a></dd>` : ""}
<dt>Levering</dt><dd>${order.delivery ? "Levering aan huis" : "Afhalen in Zele"}</dd></dl>
<details style="margin-top:12px"><summary class="small">Gegevens wijzigen</summary>
<form method="post" action="${ctx.base}/bestellingen/${id}" style="margin-top:10px"><input type="hidden" name="action" value="customer">
${(["name:Naam", "company:Bedrijf", "vat_number:Btw-nummer", "email:E-mail", "phone:Telefoon", "street:Straat + nr", "postcode:Postcode", "city:Gemeente"] as const).map((pair) => {
  const [k, label] = pair.split(":") as [keyof OrderRow, string];
  return html`<label>${label}<input name="${k}" value="${String(order[k] ?? "")}"></label>`;
})}
<label>Levering<select name="delivery"><option value="0">Afhalen</option><option value="1" ${order.delivery ? raw("selected") : ""}>Levering</option></select></label>
<label>Toegewezen aan<select name="assigned_to">${userOptions(ctx, order.assigned_to)}</select></label>
<button class="btn ghost">Opslaan</button></form></details></section>
<section class="card"><h2>Status corrigeren</h2><form method="post" action="${ctx.base}/bestellingen/${id}" class="inline"><input type="hidden" name="action" value="status">
<select name="status" aria-label="Status">${ORDER_STATUSES.filter(([k]) => k !== "geannuleerd").map(([k, l]) => html`<option value="${k}" ${k === status ? raw("selected") : ""}>${l}</option>`)}</select><button class="btn ghost">Zet</button></form>
<p class="muted small">Alleen om een vergissing recht te zetten: er wordt niets gemaild of gefactureerd.</p></section>
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
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    case "delivered":
      await setStatus("geleverd", ", delivered_at = ?", at);
      return seeOther(ctx, `/bestellingen/${id}`, "saved");
    case "cancel": {
      if (order.status === "geannuleerd") return seeOther(ctx, `/bestellingen/${id}`);
      await releaseStock(ctx.db, id, ctx.user.email, "bestelling geannuleerd");
      await setStatus("geannuleerd", ", cancelled_at = ?", at);
      const inv = await openInvoice(ctx.db, id);
      if (inv) await makeInvoice(ctx, order, false, "creditnota", inv);
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

