/*
 * Admin pages (beheer.natuurhout.be). Server-rendered HTML with plain forms:
 * every change is a POST that redirects back (POST/redirect/GET), so the
 * admin works without client-side JavaScript.
 */

import { now } from "../crm/schema";
import { euro, html, lines, page, raw, when, type Safe, type Section } from "./html";

export type Ctx = {
  db: D1Database;
  url: URL;
  base: string;
  user: { email: string; name: string };
  users: Map<string, string>;
};

export const STATUSES = [
  ["nieuw", "Nieuw"],
  ["in_behandeling", "In behandeling"],
  ["offerte_verstuurd", "Offerte verstuurd"],
  ["gewonnen", "Gewonnen"],
  ["verloren", "Verloren"],
  ["gearchiveerd", "Gearchiveerd"],
] as const;
export type Status = (typeof STATUSES)[number][0];
const OPEN: Status[] = ["nieuw", "in_behandeling", "offerte_verstuurd"];
const statusLabel = (s: string) => STATUSES.find(([k]) => k === s)?.[1] ?? s;
const isStatus = (s: string): s is Status => STATUSES.some(([k]) => k === s);

const KINDS: Record<string, string> = {
  calculator: "Calculator",
  vraag: "Offertevraag",
  bestelling: "Bestelling",
  manueel: "Manueel",
};

const FLASH: Record<string, string> = {
  saved: "Opgeslagen.",
  note: "Notitie toegevoegd.",
  created: "Aangemaakt.",
};

type ContactRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  company: string;
  street: string;
  postcode: string;
  city: string;
  notes: string;
  created_at: string;
  updated_at: string;
};
type RequestRow = {
  id: number;
  contact_id: number;
  kind: string;
  status: string;
  assigned_to: string | null;
  title: string;
  body: string;
  data: string | null;
  total: number | null;
  delivery: number;
  page: string;
  photos: number;
  mail_status: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
type NoteRow = { id: number; contact_id: number; request_id: number | null; kind: string; author: string; body: string; created_at: string };

export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

const notFound = () => new HttpError(404, "Niet gevonden.");

function respond(ctx: Ctx, title: string, section: Section | undefined, body: Safe): Response {
  const flash = FLASH[ctx.url.searchParams.get("ok") ?? ""];
  return new Response(page({ title, base: ctx.base, section, user: ctx.user, flash, body }), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const seeOther = (ctx: Ctx, path: string, ok?: keyof typeof FLASH) =>
  new Response(null, { status: 303, headers: { Location: `${ctx.base}${path}${ok ? `${path.includes("?") ? "&" : "?"}ok=${ok}` : ""}` } });

const who = (ctx: Ctx, email: string | null) => (email ? ctx.users.get(email.toLowerCase()) || email : "");
const contactName = (c: { name: string; email: string | null; phone?: string }) => c.name || c.email || c.phone || "(zonder naam)";
const chip = (status: string) => html`<span class="chip st-${status}">${statusLabel(status)}</span>`;
const like = (q: string) => `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
const field = (form: FormData, name: string, max = 500) => String(form.get(name) ?? "").trim().slice(0, max);

function mailNote(status: string | null): Safe | string {
  if (status === "mislukt") return html` <span class="warn small" title="De e-mail naar de inbox is mislukt">· mail mislukt</span>`;
  if (status === "niet-ingesteld") return html` <span class="warn small" title="E-mail verzenden was nog niet ingesteld">· geen mail</span>`;
  return "";
}

function userOptions(ctx: Ctx, selected: string | null): Safe {
  return html`<option value="">Niemand</option>${[...ctx.users].map(
    ([email, name]) => html`<option value="${email}" ${email === selected?.toLowerCase() ? raw("selected") : ""}>${name || email}</option>`,
  )}`;
}

function requestTable(ctx: Ctx, rows: (RequestRow & { contact_name: string; contact_email: string | null })[], withContact = true): Safe {
  if (!rows.length) return html`<p class="muted">Geen aanvragen.</p>`;
  return html`<div class="scroll"><table><thead><tr><th>Datum</th>${withContact ? html`<th>Klant</th>` : ""}<th>Aanvraag</th><th>Status</th><th>Wie</th><th class="num">Bedrag</th></tr></thead><tbody>
${rows.map(
  (r) => html`<tr>
<td class="small">${when(r.created_at)}</td>
${withContact ? html`<td><a href="${ctx.base}/klanten/${r.contact_id}">${contactName({ name: r.contact_name, email: r.contact_email })}</a></td>` : ""}
<td><a href="${ctx.base}/aanvragen/${r.id}">${r.title || KINDS[r.kind] || r.kind}</a> <span class="muted small">#${r.id}</span>${mailNote(r.mail_status)}</td>
<td>${chip(r.status)}</td>
<td class="small">${who(ctx, r.assigned_to)}</td>
<td class="num">${euro(r.total)}</td></tr>`,
)}</tbody></table></div>`;
}

function timeline(ctx: Ctx, notes: NoteRow[], showRequest = false): Safe {
  if (!notes.length) return html`<p class="muted small">Nog geen notities.</p>`;
  return html`<ul class="timeline">${notes.map(
    (n) => html`<li class="${n.kind}"><div class="meta">${who(ctx, n.author) || "Website"} · ${when(n.created_at)}${
      showRequest && n.request_id ? html` · <a href="${ctx.base}/aanvragen/${n.request_id}">aanvraag #${n.request_id}</a>` : ""
    }</div>${lines(n.body)}</li>`,
  )}</ul>`;
}

function noteForm(ctx: Ctx, action: string): Safe {
  return html`<form method="post" action="${ctx.base}${action}">
<input type="hidden" name="action" value="note">
<label>Nieuwe notitie<textarea name="body" required placeholder="Gebeld, offerte gemaild, afspraak voor levering…"></textarea></label>
<button>Notitie toevoegen</button></form>`;
}

async function addNote(ctx: Ctx, contactId: number, requestId: number | null, body: string, kind: "note" | "event" = "note") {
  await ctx.db
    .prepare("INSERT INTO notes (contact_id, request_id, kind, author, body, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(contactId, requestId, kind, ctx.user.email, body, now())
    .run();
}

const REQUEST_SELECT = `SELECT r.*, c.name AS contact_name, c.email AS contact_email FROM requests r JOIN contacts c ON c.id = r.contact_id`;

// ---------------------------------------------------------------- overzicht

export async function overview(ctx: Ctx): Promise<Response> {
  const [counts, open, notes] = await ctx.db.batch([
    ctx.db.prepare("SELECT status, COUNT(*) AS n FROM requests GROUP BY status"),
    ctx.db.prepare(
      `${REQUEST_SELECT} WHERE r.status IN (${OPEN.map(() => "?").join(",")}) ORDER BY r.status = 'nieuw' DESC, r.created_at DESC LIMIT 25`,
    ).bind(...OPEN),
    ctx.db.prepare("SELECT * FROM notes ORDER BY created_at DESC LIMIT 10"),
  ]);
  const n = new Map((counts.results as { status: string; n: number }[]).map((r) => [r.status, r.n]));
  const mine = (open.results as RequestRow[]).filter((r) => r.assigned_to?.toLowerCase() === ctx.user.email).length;
  return respond(
    ctx,
    "Overzicht",
    "overzicht",
    html`<h1>Overzicht</h1>
<div class="stats">
${(["nieuw", "in_behandeling", "offerte_verstuurd", "gewonnen"] as Status[]).map(
  (s) => html`<a class="stat" href="${ctx.base}/aanvragen?status=${s}"><b class="st-${s}">${n.get(s) ?? 0}</b><span>${statusLabel(s)}</span></a>`,
)}
<a class="stat" href="${ctx.base}/aanvragen?wie=${ctx.user.email}"><b>${mine}</b><span>Open, aan mij toegewezen</span></a>
</div>
<div class="grid two">
<section class="card"><div class="head"><h2>Open aanvragen</h2><a class="btn ghost" href="${ctx.base}/aanvragen/nieuw">Nieuwe aanvraag</a></div>
${requestTable(ctx, open.results as never)}</section>
<section class="card"><h2>Laatste notities</h2>${timeline(ctx, notes.results as NoteRow[], true)}</section>
</div>`,
  );
}

// ---------------------------------------------------------------- aanvragen

export async function requestList(ctx: Ctx): Promise<Response> {
  const p = ctx.url.searchParams;
  const status = p.get("status") ?? "open";
  const kind = p.get("soort") ?? "";
  const assignee = (p.get("wie") ?? "").toLowerCase();
  const q = (p.get("q") ?? "").trim();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (status === "open") {
    where.push(`r.status IN (${OPEN.map(() => "?").join(",")})`);
    args.push(...OPEN);
  } else if (isStatus(status)) {
    where.push("r.status = ?");
    args.push(status);
  }
  if (kind in KINDS) {
    where.push("r.kind = ?");
    args.push(kind);
  }
  if (assignee === "niemand") where.push("r.assigned_to IS NULL");
  else if (assignee) {
    where.push("r.assigned_to = ? COLLATE NOCASE");
    args.push(assignee);
  }
  if (q) {
    const cols = ["r.title", "r.body", "c.name", "c.email", "c.phone", "c.city"];
    where.push(`(${cols.map((col) => `${col} LIKE ? ESCAPE '\\'`).join(" OR ")})`);
    args.push(...cols.map(() => like(q)));
  }
  const sql = `${REQUEST_SELECT}${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY r.created_at DESC LIMIT 200`;
  const { results } = await ctx.db.prepare(sql).bind(...args).all<RequestRow & { contact_name: string; contact_email: string | null }>();
  const opt = (value: string, label: string, current: string) =>
    html`<option value="${value}" ${value === current ? raw("selected") : ""}>${label}</option>`;
  return respond(
    ctx,
    "Aanvragen",
    "aanvragen",
    html`<div class="head"><h1>Aanvragen</h1><a class="btn" href="${ctx.base}/aanvragen/nieuw">Nieuwe aanvraag</a></div>
<form class="card inline" method="get" action="${ctx.base}/aanvragen">
<label>Status<select name="status">${opt("open", "Alle open", status)}${opt("alle", "Alle", status)}${STATUSES.map(([k, l]) => opt(k, l, status))}</select></label>
<label>Soort<select name="soort">${opt("", "Alle", kind)}${Object.entries(KINDS).map(([k, l]) => opt(k, l, kind))}</select></label>
<label>Toegewezen aan<select name="wie">${opt("", "Iedereen", assignee)}${opt("niemand", "Niemand", assignee)}${[...ctx.users].map(([e, nm]) => opt(e, nm || e, assignee))}</select></label>
<label>Zoeken<input name="q" value="${q}" placeholder="naam, e-mail, gemeente, tekst"></label>
<button>Filter</button></form>
<section class="card">${requestTable(ctx, results)}${results.length === 200 ? html`<p class="muted small">De nieuwste 200 getoond; verfijn de filter.</p>` : ""}</section>`,
  );
}

type QuoteData = {
  lines?: { group: string; label: string; detail: string; qty: number; unit: number | null }[];
  street?: string;
  postcode?: string;
  city?: string;
  remarks?: string;
  inStock?: boolean;
};

export async function requestDetail(ctx: Ctx, id: number): Promise<Response> {
  const r = await ctx.db.prepare("SELECT * FROM requests WHERE id = ?").bind(id).first<RequestRow>();
  if (!r) throw notFound();
  const [contact, notes] = await Promise.all([
    ctx.db.prepare("SELECT * FROM contacts WHERE id = ?").bind(r.contact_id).first<ContactRow>(),
    ctx.db.prepare("SELECT * FROM notes WHERE request_id = ? ORDER BY created_at DESC").bind(id).all<NoteRow>(),
  ]);
  if (!contact) throw notFound();
  let data: QuoteData = {};
  try {
    data = r.data ? (JSON.parse(r.data) as QuoteData) : {};
  } catch {
    /* shown as plain text below */
  }
  const address = [data.street, [data.postcode, data.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const info = html`<dl>
<dt>Soort</dt><dd>${KINDS[r.kind] ?? r.kind}${r.kind === "bestelling" ? (data.inStock ? " · alles op voorraad" : " · op bestelling") : ""}</dd>
<dt>Ontvangen</dt><dd>${when(r.created_at)}${r.created_by ? html` door ${who(ctx, r.created_by)}` : r.kind !== "manueel" ? " via de website" : ""}</dd>
${r.page ? html`<dt>Pagina</dt><dd><a href="https://www.natuurhout.be${r.page}" target="_blank" rel="noopener">${r.page}</a></dd>` : ""}
${r.kind !== "manueel" ? html`<dt>Levering</dt><dd>${r.delivery ? `Ja${address ? `, ${address}` : ""}` : "Nee, afhalen"}</dd>` : ""}
${r.total !== null ? html`<dt>Bedrag</dt><dd>${euro(r.total)} incl. btw</dd>` : ""}
${r.photos ? html`<dt>Foto's</dt><dd>${r.photos} (in de e-mail in de inbox)</dd>` : ""}
${r.mail_status ? html`<dt>E-mail</dt><dd class="${r.mail_status === "verstuurd" ? "" : "warn"}">${
    r.mail_status === "verstuurd" ? "Naar de inbox verstuurd" : r.mail_status === "mislukt" ? "Verzenden mislukt" : "Niet verstuurd (e-mail nog niet ingesteld)"
  }</dd>` : ""}
</dl>`;
  const linesTable = data.lines?.length
    ? html`<div class="scroll"><table><thead><tr><th>Artikel</th><th class="num">Aantal</th><th class="num">Prijs</th><th class="num">Totaal</th></tr></thead><tbody>
${data.lines.map(
  (l) => html`<tr><td>${l.label}${l.detail ? html`<div class="muted small">${l.detail}</div>` : ""}</td><td class="num">${l.qty}</td><td class="num">${euro(l.unit)}</td><td class="num">${
    l.unit === null ? "" : euro(l.unit * l.qty)
  }</td></tr>`,
)}</tbody></table></div>`
    : "";
  return respond(
    ctx,
    `${r.title} #${r.id}`,
    "aanvragen",
    html`<div class="head"><h1>${r.title || KINDS[r.kind]} <span class="muted">#${r.id}</span></h1>${chip(r.status)}</div>
<div class="grid two">
<div>
<section class="card"><h2>Aanvraag</h2>${info}</section>
${linesTable ? html`<section class="card"><h2>Artikelen</h2>${linesTable}</section>` : ""}
${data.remarks ? html`<section class="card"><h2>Opmerkingen van de klant</h2><p>${lines(data.remarks)}</p></section>` : ""}
${r.body ? html`<section class="card"><h2>${r.kind === "manueel" ? "Omschrijving" : "Volledige aanvraag"}</h2><pre class="body">${r.body}</pre></section>` : ""}
<section class="card"><h2>Notities</h2>${noteForm(ctx, `/aanvragen/${r.id}`)}${timeline(ctx, notes.results)}</section>
</div>
<div class="side-first">
<section class="card"><h2>Opvolging</h2>
<form method="post" action="${ctx.base}/aanvragen/${r.id}"><input type="hidden" name="action" value="update">
<label>Status<select name="status">${STATUSES.map(([k, l]) => html`<option value="${k}" ${k === r.status ? raw("selected") : ""}>${l}</option>`)}</select></label>
<label>Toegewezen aan<select name="assigned_to">${userOptions(ctx, r.assigned_to)}</select></label>
<button>Opslaan</button></form></section>
<section class="card"><h2>Klant</h2>
<p><a href="${ctx.base}/klanten/${contact.id}"><b>${contactName(contact)}</b></a>${contact.company ? html`<br>${contact.company}` : ""}</p>
<dl>${contact.email ? html`<dt>E-mail</dt><dd><a href="mailto:${contact.email}">${contact.email}</a></dd>` : ""}
${contact.phone ? html`<dt>Telefoon</dt><dd><a href="tel:${contact.phone.replace(/[^\d+]/g, "")}">${contact.phone}</a></dd>` : ""}
${contact.city ? html`<dt>Gemeente</dt><dd>${[contact.postcode, contact.city].filter(Boolean).join(" ")}</dd>` : ""}</dl></section>
</div></div>`,
  );
}

export async function requestPost(ctx: Ctx, id: number, form: FormData): Promise<Response> {
  const r = await ctx.db.prepare("SELECT id, contact_id, status, assigned_to FROM requests WHERE id = ?").bind(id).first<RequestRow>();
  if (!r) throw notFound();
  const action = field(form, "action");
  if (action === "note") {
    const body = field(form, "body", 10_000);
    if (body) await addNote(ctx, r.contact_id, id, body);
    return seeOther(ctx, `/aanvragen/${id}`, "note");
  }
  if (action === "update") {
    const status = field(form, "status");
    const assigned = field(form, "assigned_to").toLowerCase() || null;
    if (!isStatus(status)) throw new HttpError(400, "Onbekende status.");
    if (assigned && !ctx.users.has(assigned)) throw new HttpError(400, "Onbekende gebruiker.");
    const events: string[] = [];
    if (status !== r.status) events.push(`Status: ${statusLabel(r.status)} → ${statusLabel(status)}`);
    if (assigned !== (r.assigned_to?.toLowerCase() ?? null)) events.push(assigned ? `Toegewezen aan ${who(ctx, assigned)}` : "Niet meer toegewezen");
    if (events.length) {
      await ctx.db.prepare("UPDATE requests SET status = ?, assigned_to = ?, updated_at = ? WHERE id = ?").bind(status, assigned, now(), id).run();
      await addNote(ctx, r.contact_id, id, events.join("\n"), "event");
    }
    return seeOther(ctx, `/aanvragen/${id}`, "saved");
  }
  throw new HttpError(400, "Onbekende actie.");
}

export async function requestNew(ctx: Ctx): Promise<Response> {
  const contactId = Number(ctx.url.searchParams.get("klant"));
  const contact = contactId ? await ctx.db.prepare("SELECT * FROM contacts WHERE id = ?").bind(contactId).first<ContactRow>() : null;
  return respond(
    ctx,
    "Nieuwe aanvraag",
    "aanvragen",
    html`<h1>Nieuwe aanvraag</h1>
<form class="card" method="post" action="${ctx.base}/aanvragen">
${contact
  ? html`<input type="hidden" name="contact_id" value="${contact.id}"><p>Klant: <b>${contactName(contact)}</b></p>`
  : html`<p class="muted small">Bestaat de klant al (zelfde e-mailadres), dan wordt de aanvraag aan die klant gekoppeld.</p>
<div class="fields"><label>Naam<input name="name" required></label><label>E-mail<input name="email" type="email"></label><label>Telefoon<input name="phone"></label><label>Gemeente<input name="city"></label></div>`}
<label>Titel<input name="title" required placeholder="Bv. telefonische vraag: hekwerk 40 m + poort"></label>
<label>Omschrijving<textarea name="body"></textarea></label>
<label>Toegewezen aan<select name="assigned_to">${userOptions(ctx, ctx.user.email)}</select></label>
<button>Aanmaken</button></form>`,
  );
}

export async function requestCreate(ctx: Ctx, form: FormData): Promise<Response> {
  const at = now();
  let contactId = Number(field(form, "contact_id"));
  if (contactId) {
    if (!(await ctx.db.prepare("SELECT 1 FROM contacts WHERE id = ?").bind(contactId).first())) throw notFound();
  } else {
    contactId = await findOrCreateContact(ctx, form, at);
  }
  const title = field(form, "title", 200);
  if (!title) throw new HttpError(400, "Een titel is verplicht.");
  const assigned = field(form, "assigned_to").toLowerCase() || null;
  if (assigned && !ctx.users.has(assigned)) throw new HttpError(400, "Onbekende gebruiker.");
  const row = await ctx.db
    .prepare(
      `INSERT INTO requests (contact_id, kind, status, assigned_to, title, body, created_by, created_at, updated_at)
       VALUES (?, 'manueel', 'nieuw', ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(contactId, assigned, title, field(form, "body", 20_000), ctx.user.email, at, at)
    .first<{ id: number }>();
  return seeOther(ctx, `/aanvragen/${row!.id}`, "created");
}

// ---------------------------------------------------------------- klanten

async function findOrCreateContact(ctx: Ctx, form: FormData, at: string): Promise<number> {
  const name = field(form, "name", 200);
  const email = field(form, "email", 200).toLowerCase() || null;
  if (!name && !email) throw new HttpError(400, "Naam of e-mailadres is verplicht.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Ongeldig e-mailadres.");
  if (email) {
    const existing = await ctx.db.prepare("SELECT id FROM contacts WHERE email = ? COLLATE NOCASE").bind(email).first<{ id: number }>();
    if (existing) return existing.id;
  }
  const row = await ctx.db
    .prepare(
      `INSERT INTO contacts (name, email, phone, company, street, postcode, city, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      name,
      email,
      field(form, "phone", 40),
      field(form, "company", 200),
      field(form, "street", 200),
      field(form, "postcode", 10),
      field(form, "city", 100),
      field(form, "notes", 10_000),
      at,
      at,
    )
    .first<{ id: number }>();
  return row!.id;
}

export async function contactList(ctx: Ctx): Promise<Response> {
  const q = (ctx.url.searchParams.get("q") ?? "").trim();
  const filter = q
    ? ` WHERE c.name LIKE ?1 ESCAPE '\\' OR c.email LIKE ?1 ESCAPE '\\' OR c.phone LIKE ?1 ESCAPE '\\' OR c.city LIKE ?1 ESCAPE '\\' OR c.company LIKE ?1 ESCAPE '\\'`
    : "";
  const stmt = ctx.db.prepare(
    `SELECT c.*, COUNT(r.id) AS requests, MAX(r.created_at) AS last_request
     FROM contacts c LEFT JOIN requests r ON r.contact_id = c.id${filter}
     GROUP BY c.id ORDER BY COALESCE(MAX(r.created_at), c.created_at) DESC LIMIT 300`,
  );
  const { results } = await (q ? stmt.bind(like(q)) : stmt).all<ContactRow & { requests: number; last_request: string | null }>();
  return respond(
    ctx,
    "Klanten",
    "klanten",
    html`<div class="head"><h1>Klanten</h1><span><a class="btn ghost" href="${ctx.base}/klanten.csv">Export (CSV)</a> <a class="btn" href="${ctx.base}/klanten/nieuw">Nieuwe klant</a></span></div>
<form class="card inline" method="get" action="${ctx.base}/klanten"><label>Zoeken<input name="q" value="${q}" placeholder="naam, e-mail, telefoon, gemeente"></label><button>Zoek</button></form>
<section class="card">${
      results.length
        ? html`<div class="scroll"><table><thead><tr><th>Naam</th><th>E-mail</th><th>Telefoon</th><th>Gemeente</th><th class="num">Aanvragen</th><th>Laatste</th></tr></thead><tbody>
${results.map(
  (c) => html`<tr><td><a href="${ctx.base}/klanten/${c.id}">${contactName(c)}</a>${c.company ? html`<div class="muted small">${c.company}</div>` : ""}</td>
<td class="small">${c.email ?? ""}</td><td class="small">${c.phone}</td><td class="small">${c.city}</td><td class="num">${c.requests}</td><td class="small">${when(c.last_request)}</td></tr>`,
)}</tbody></table></div>`
        : html`<p class="muted">Geen klanten gevonden.</p>`
    }</section>`,
  );
}

function contactFields(c?: Partial<ContactRow>): Safe {
  const f = (name: keyof ContactRow, label: string, type = "text") =>
    html`<label>${label}<input name="${name}" type="${type}" value="${String(c?.[name] ?? "")}"></label>`;
  return html`<div class="fields">${f("name", "Naam")}${f("company", "Bedrijf")}${f("email", "E-mail", "email")}${f("phone", "Telefoon")}${f("street", "Straat + nr")}${f("postcode", "Postcode")}${f("city", "Gemeente")}</div>
<label>Vaste info over deze klant<textarea name="notes">${c?.notes ?? ""}</textarea></label>`;
}

export function contactNew(ctx: Ctx): Response {
  return respond(
    ctx,
    "Nieuwe klant",
    "klanten",
    html`<h1>Nieuwe klant</h1><form class="card" method="post" action="${ctx.base}/klanten">${contactFields()}<button>Aanmaken</button></form>`,
  );
}

export async function contactCreate(ctx: Ctx, form: FormData): Promise<Response> {
  const id = await findOrCreateContact(ctx, form, now());
  return seeOther(ctx, `/klanten/${id}`, "created");
}

export async function contactDetail(ctx: Ctx, id: number): Promise<Response> {
  const c = await ctx.db.prepare("SELECT * FROM contacts WHERE id = ?").bind(id).first<ContactRow>();
  if (!c) throw notFound();
  const [requests, notes] = await Promise.all([
    ctx.db.prepare(`${REQUEST_SELECT} WHERE r.contact_id = ? ORDER BY r.created_at DESC`).bind(id).all<RequestRow & { contact_name: string; contact_email: string | null }>(),
    ctx.db.prepare("SELECT * FROM notes WHERE contact_id = ? ORDER BY created_at DESC LIMIT 100").bind(id).all<NoteRow>(),
  ]);
  return respond(
    ctx,
    contactName(c),
    "klanten",
    html`<div class="head"><h1>${contactName(c)}</h1><a class="btn" href="${ctx.base}/aanvragen/nieuw?klant=${c.id}">Nieuwe aanvraag</a></div>
<div class="grid two">
<div>
<section class="card"><h2>Aanvragen</h2>${requestTable(ctx, requests.results, false)}</section>
<section class="card"><h2>Notities</h2>${noteForm(ctx, `/klanten/${c.id}`)}${timeline(ctx, notes.results, true)}</section>
</div>
<section class="card"><h2>Gegevens</h2><form method="post" action="${ctx.base}/klanten/${c.id}"><input type="hidden" name="action" value="update">
${contactFields(c)}<button>Opslaan</button></form>
<p class="muted small">Klant sinds ${when(c.created_at)}.</p></section>
</div>`,
  );
}

export async function contactPost(ctx: Ctx, id: number, form: FormData): Promise<Response> {
  if (!(await ctx.db.prepare("SELECT 1 FROM contacts WHERE id = ?").bind(id).first())) throw notFound();
  const action = field(form, "action");
  if (action === "note") {
    const body = field(form, "body", 10_000);
    if (body) await addNote(ctx, id, null, body);
    return seeOther(ctx, `/klanten/${id}`, "note");
  }
  if (action === "update") {
    const email = field(form, "email", 200).toLowerCase() || null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Ongeldig e-mailadres.");
    if (email) {
      const other = await ctx.db.prepare("SELECT id FROM contacts WHERE email = ? COLLATE NOCASE AND id <> ?").bind(email, id).first<{ id: number }>();
      if (other) throw new HttpError(409, `Een andere klant (#${other.id}) heeft dit e-mailadres al.`);
    }
    await ctx.db
      .prepare("UPDATE contacts SET name = ?, company = ?, email = ?, phone = ?, street = ?, postcode = ?, city = ?, notes = ?, updated_at = ? WHERE id = ?")
      .bind(
        field(form, "name", 200),
        field(form, "company", 200),
        email,
        field(form, "phone", 40),
        field(form, "street", 200),
        field(form, "postcode", 10),
        field(form, "city", 100),
        field(form, "notes", 10_000),
        now(),
        id,
      )
      .run();
    return seeOther(ctx, `/klanten/${id}`, "saved");
  }
  throw new HttpError(400, "Onbekende actie.");
}

export async function contactsCsv(ctx: Ctx): Promise<Response> {
  const { results } = await ctx.db
    .prepare(
      `SELECT c.*, COUNT(r.id) AS requests, MAX(r.created_at) AS last_request
       FROM contacts c LEFT JOIN requests r ON r.contact_id = c.id GROUP BY c.id ORDER BY c.name`,
    )
    .all<ContactRow & { requests: number; last_request: string | null }>();
  const cols = ["id", "name", "company", "email", "phone", "street", "postcode", "city", "requests", "last_request", "created_at", "notes"] as const;
  const headers = ["ID", "Naam", "Bedrijf", "E-mail", "Telefoon", "Straat", "Postcode", "Gemeente", "Aanvragen", "Laatste aanvraag", "Klant sinds", "Info"];
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // no formula injection when opened in Excel
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Semicolons + BOM: what Excel in Belgium opens correctly by double-click.
  const csv = "﻿" + [headers, ...results.map((r) => cols.map((k) => r[k]))].map((row) => row.map(cell).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="natuurhout-klanten-${now().slice(0, 10)}.csv"`,
    },
  });
}

// ---------------------------------------------------------------- instellingen

export function settings(ctx: Ctx): Response {
  return respond(
    ctx,
    "Instellingen",
    "instellingen",
    html`<h1>Instellingen</h1>
<form class="card" method="post" action="${ctx.base}/instellingen">
<label>Je naam (zichtbaar bij notities en toewijzingen)<input name="name" value="${ctx.user.name}" required maxlength="60"></label>
<p class="muted small">Aangemeld als ${ctx.user.email}.</p>
<button>Opslaan</button></form>
<section class="card"><h2>Gebruikers</h2><p class="muted small">Wie toegang heeft, beheer je in Cloudflare Zero Trust (Access-policy van beheer.natuurhout.be). Iedereen die zich één keer aanmeldt, verschijnt hier.</p>
<ul>${[...ctx.users].map(([email, name]) => html`<li>${name || "(geen naam)"} <span class="muted small">${email}</span></li>`)}</ul></section>`,
  );
}

export async function settingsPost(ctx: Ctx, form: FormData): Promise<Response> {
  const name = field(form, "name", 60);
  if (!name) throw new HttpError(400, "Een naam is verplicht.");
  await ctx.db.prepare("UPDATE users SET name = ? WHERE email = ?").bind(name, ctx.user.email).run();
  return seeOther(ctx, "/instellingen", "saved");
}
