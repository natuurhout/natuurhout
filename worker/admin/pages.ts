/*
 * Admin pages (beheer.natuurhout.be). Server-rendered HTML with plain forms:
 * every change is a POST that redirects back (POST/redirect/GET), so the
 * admin works without client-side JavaScript.
 */

import { now } from "../crm/schema";
import type { Mailer } from "../shop/send";
import type { PublishEnv } from "../shop/publish";
import type { CheckoutEnv } from "../shop/checkout";
import { getCheckoutSettings, saveCheckoutSettings, type Zone } from "../shop/delivery";
import { mspKey } from "../shop/msp";
import type { OrderRow } from "../shop/orders";
import { orderTable } from "./shop-orders";
import { getSettings, missingSettings, saveSettings, SETTING_FIELDS, validIban, type ShopSettings } from "../shop/settings";
import { myOpenTasks, tasksPanel } from "./tasks";
import { ago, euro, euroRound, html, icon, initials, lines, page, raw, when, type Badges, type Safe, type Section } from "./html";

export type Ctx = {
  db: D1Database;
  url: URL;
  base: string;
  user: { email: string; name: string };
  users: Map<string, string>;
  badges: Badges;
  /** A status change dragged on the pipeline board (fetch, wants 204). */
  board: boolean;
  /** Sends shop mail to customers (null when the EMAIL binding is missing). */
  mail: Mailer | null;
  /** Site rebuild after catalogue edits (worker/shop/publish.ts). */
  publish: PublishEnv;
  /** MultiSafepay keys + mail, for the checkout steps the backend can trigger. */
  checkout: CheckoutEnv;
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
/** Columns of the pipeline board (archived requests only show in the list). */
const BOARD: Status[] = ["nieuw", "in_behandeling", "offerte_verstuurd", "gewonnen", "verloren"];
const PER_COLUMN = 60;
const statusLabel = (s: string) => STATUSES.find(([k]) => k === s)?.[1] ?? s;
const isStatus = (s: string): s is Status => STATUSES.some(([k]) => k === s);

const KINDS: Record<string, string> = {
  calculator: "Calculator",
  vraag: "Offertevraag",
  bestelling: "Bestelling",
  manueel: "Manueel",
};
/** Sidebar views on the request list. */
const KIND_GROUPS: Record<string, { label: string; kinds: string[]; section: Section }> = {
  offertes: { label: "Offertes", kinds: ["calculator", "vraag"], section: "offertes" },
  bestellingen: { label: "Bestellingen", kinds: ["bestelling"], section: "bestellingen" },
};

const FLASH: Record<string, string> = {
  saved: "Opgeslagen.",
  note: "Notitie toegevoegd.",
  created: "Aangemaakt.",
  task: "Taak toegevoegd.",
  done: "Taak afgevinkt.",
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

export const notFound = () => new HttpError(404, "Niet gevonden.");

export function respond(ctx: Ctx, title: string, section: Section | undefined, body: Safe, wide = false): Response {
  const flash = FLASH[ctx.url.searchParams.get("ok") ?? ""];
  const query = section === "zoeken" ? (ctx.url.searchParams.get("q") ?? "") : undefined;
  return new Response(page({ title, base: ctx.base, section, user: ctx.user, badges: ctx.badges, flash, wide, query, body }), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const seeOther = (ctx: Ctx, path: string, ok?: keyof typeof FLASH) =>
  new Response(null, { status: 303, headers: { Location: `${ctx.base}${path}${ok ? `${path.includes("?") ? "&" : "?"}ok=${ok}` : ""}` } });

export const who = (ctx: Ctx, email: string | null) => (email ? ctx.users.get(email.toLowerCase()) || email : "");
export const contactName = (c: { name: string; email: string | null; phone?: string }) => c.name || c.email || c.phone || "(zonder naam)";
const chip = (status: string) => html`<span class="chip st-${status}">${statusLabel(status)}</span>`;
export const like = (q: string) => `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
export const field = (form: FormData, name: string, max = 500) => String(form.get(name) ?? "").trim().slice(0, max);

function mailNote(status: string | null): Safe | string {
  if (status === "mislukt") return html` <span class="warn small" title="De e-mail naar de inbox is mislukt">· mail mislukt</span>`;
  if (status === "niet-ingesteld") return html` <span class="warn small" title="E-mail verzenden was nog niet ingesteld">· geen mail</span>`;
  return "";
}

export function userOptions(ctx: Ctx, selected: string | null): Safe {
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

export function timeline(ctx: Ctx, notes: NoteRow[], showRequest = false): Safe {
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
  const tasks = await myOpenTasks(ctx);
  const { results: shop } = await ctx.db
    .prepare("SELECT status, COUNT(*) AS n, COALESCE(SUM(total), 0) AS sum FROM orders WHERE status IN ('nieuw', 'bevestigd', 'betaald', 'klaar') GROUP BY status")
    .all<{ status: string; n: number; sum: number }>();
  const shopN = new Map(shop.map((s) => [s.status, s]));
  const mine = (open.results as RequestRow[]).filter((r) => r.assigned_to?.toLowerCase() === ctx.user.email).length;
  return respond(
    ctx,
    "Overzicht",
    "overzicht",
    html`<div class="head"><div><h1>Overzicht</h1><p class="sub">Goeiedag${ctx.user.name ? ` ${ctx.user.name}` : ""}, dit staat er open.</p></div>
<div class="actions"><a class="btn ghost" href="${ctx.base}/aanvragen">${icon("board")}Pipeline</a></div></div>
<div class="stats">
${(["nieuw", "in_behandeling", "offerte_verstuurd", "gewonnen"] as Status[]).map(
  (s) => html`<a class="stat" href="${ctx.base}/aanvragen?weergave=lijst&status=${s}"><span><i class="dot st-${s}"></i>${statusLabel(s)}</span><b>${n.get(s) ?? 0}</b></a>`,
)}
<a class="stat" href="${ctx.base}/aanvragen?wie=${ctx.user.email}"><span>Open, aan mij</span><b>${mine}</b></a>
<a class="stat" href="${ctx.base}/taken"><span>Taken vandaag of te laat</span><b class="${ctx.badges.takenLaat ? "warn" : ""}">${ctx.badges.takenLaat}</b></a>
</div>
<h2 style="margin:4px 0 10px">Webshop</h2>
<div class="stats">
<a class="stat" href="${ctx.base}/bestellingen?status=nieuw"><span><i class="dot os-nieuw"></i>Nieuwe bestellingen</span><b>${shopN.get("nieuw")?.n ?? 0}</b></a>
<a class="stat" href="${ctx.base}/bestellingen?status=bevestigd"><span><i class="dot os-bevestigd"></i>Wacht op betaling</span><b>${euro(shopN.get("bevestigd")?.sum ?? 0)}</b></a>
<a class="stat" href="${ctx.base}/bestellingen?status=betaald"><span><i class="dot os-betaald"></i>Betaald, klaarzetten</span><b>${shopN.get("betaald")?.n ?? 0}</b></a>
<a class="stat" href="${ctx.base}/bestellingen?status=klaar"><span><i class="dot os-klaar"></i>Klaar voor levering</span><b>${shopN.get("klaar")?.n ?? 0}</b></a>
<a class="stat" href="${ctx.base}/voorraad"><span>Voorraad laag of op</span><b class="${ctx.badges.lowStock ? "warn" : ""}">${ctx.badges.lowStock}</b></a>
</div>
<div class="grid two">
<section class="card"><div class="head" style="margin-bottom:10px"><h2>Open aanvragen</h2><a class="small" href="${ctx.base}/aanvragen?weergave=lijst">alle aanvragen</a></div>
${requestTable(ctx, open.results as never)}</section>
<div>
<section class="card"><div class="head" style="margin-bottom:10px"><h2>Mijn taken</h2><a class="small" href="${ctx.base}/taken">alle taken</a></div>${tasks}</section>
<section class="card"><h2>Laatste notities</h2>${timeline(ctx, notes.results as NoteRow[], true)}</section>
</div>
</div>`,
  );
}

// ---------------------------------------------------------------- aanvragen

type ListRow = RequestRow & { contact_name: string; contact_email: string | null; contact_phone?: string; contact_city?: string };

/** The filters shared by the board and the list (?soort, ?wie, ?q). */
function requestFilters(ctx: Ctx) {
  const p = ctx.url.searchParams;
  const kind = p.get("soort") ?? "";
  const assignee = (p.get("wie") ?? "").toLowerCase();
  const q = (p.get("q") ?? "").trim();
  const where: string[] = [];
  const args: (string | number)[] = [];
  const group = KIND_GROUPS[kind];
  if (group) {
    where.push(`r.kind IN (${group.kinds.map(() => "?").join(",")})`);
    args.push(...group.kinds);
  } else if (kind in KINDS) {
    where.push("r.kind = ?");
    args.push(kind);
  }
  if (assignee === "niemand") where.push("r.assigned_to IS NULL");
  else if (assignee) {
    where.push("r.assigned_to = ? COLLATE NOCASE");
    args.push(assignee);
  }
  if (q) {
    const cols = ["r.title", "r.body", "c.name", "c.email", "c.phone", "c.city", "c.company"];
    where.push(`(${cols.map((col) => `${col} LIKE ? ESCAPE '\\'`).join(" OR ")})`);
    args.push(...cols.map(() => like(q)));
  }
  return { kind, assignee, q, group, where, args, active: Boolean(kind || assignee || q) };
}

/** Short source label on a board card. */
const SRC: Record<string, string> = { calculator: "Calculator", vraag: "Formulier", bestelling: "Bestelling", manueel: "Manueel" };

function boardCard(ctx: Ctx, r: ListRow): Safe {
  const name = contactName({ name: r.contact_name, email: r.contact_email, phone: r.contact_phone });
  const sub = r.contact_name && r.contact_email ? r.contact_email : r.contact_city || r.contact_phone || "";
  const assignee = r.assigned_to ? who(ctx, r.assigned_to) : "";
  return html`<a class="k" href="${ctx.base}/aanvragen/${r.id}" draggable="true" data-id="${r.id}" data-total="${r.total ?? 0}">
${!r.assigned_to && OPEN.includes(r.status as Status) ? html`<span class="ping" title="Nog niet toegewezen"></span>` : ""}
<div class="k-top"><div style="min-width:0"><div class="k-name">${name}</div>${sub ? html`<div class="k-sub">${sub}</div>` : ""}</div><span class="src ${r.kind}">${SRC[r.kind] ?? r.kind}</span></div>
${r.title ? html`<div class="k-title">${r.title}</div>` : ""}
<div class="k-foot">${assignee ? html`<span class="avatar sm" title="${assignee}">${initials(assignee)}</span>` : ""}<span title="${when(r.created_at)}">${ago(r.created_at)}</span>${
    r.mail_status === "mislukt" ? html`<span class="k-flag" title="De e-mail naar de inbox is mislukt">· mail mislukt</span>` : ""
  }${r.total ? html`<span class="amt">${euroRound(r.total)}</span>` : ""}</div></a>`;
}

export async function requestList(ctx: Ctx): Promise<Response> {
  const p = ctx.url.searchParams;
  const view = p.get("weergave") === "lijst" || p.has("status") ? "lijst" : "bord";
  const f = requestFilters(ctx);
  const heading = f.group?.label ?? "Aanvragen";
  const section = f.group?.section ?? "aanvragen";
  const opt = (value: string, label: string, current: string) => html`<option value="${value}" ${value === current ? raw("selected") : ""}>${label}</option>`;
  const status = p.get("status") ?? "open";

  // This page's URL with one view setting changed (the Bord/Lijst toggle, "more" links).
  const href = (list: boolean, listStatus?: string) => {
    const u = new URLSearchParams(p);
    u.delete("ok");
    u.delete("weergave");
    u.delete("status");
    if (list) u.set("weergave", "lijst");
    if (listStatus) u.set("status", listStatus);
    const s = u.toString();
    return `${ctx.base}/aanvragen${s ? `?${s}` : ""}`;
  };

  const [{ results: counts }, all] = await Promise.all([
    ctx.db
      .prepare(
        `SELECT r.status, COUNT(*) AS n, COALESCE(SUM(r.total), 0) AS sum FROM requests r JOIN contacts c ON c.id = r.contact_id${
          f.where.length ? ` WHERE ${f.where.join(" AND ")}` : ""
        } GROUP BY r.status`,
      )
      .bind(...f.args)
      .all<{ status: string; n: number; sum: number }>(),
    ctx.db.prepare("SELECT COUNT(*) AS n FROM requests").first<{ n: number }>(),
  ]);
  const byStatus = new Map(counts.map((c) => [c.status, c]));
  const shownStatuses: string[] = view === "bord" ? BOARD : status === "open" ? OPEN : isStatus(status) ? [status] : STATUSES.map(([k]) => k);
  const shown = shownStatuses.reduce((t, s) => t + (byStatus.get(s)?.n ?? 0), 0);
  const openValue = OPEN.reduce((t, s) => t + (byStatus.get(s)?.sum ?? 0), 0);
  const total = all?.n ?? 0;

  const toolbar = html`<form class="toolbar" method="get" action="${ctx.base}/aanvragen">
${view === "lijst" ? html`<input type="hidden" name="weergave" value="lijst">` : ""}
<label class="search">${icon("search")}<input name="q" type="search" value="${f.q}" placeholder="Zoek op naam, e-mail, telefoon, gemeente…" aria-label="Zoeken"></label>
${view === "lijst" ? html`<select name="status" aria-label="Status">${opt("open", "Alle open", status)}${opt("alle", "Alle statussen", status)}${STATUSES.map(([k, l]) => opt(k, l, status))}</select>` : ""}
<select name="soort" aria-label="Soort">${opt("", "Alle soorten", f.kind)}${Object.entries(KIND_GROUPS).map(([k, g]) => opt(k, `Alle ${g.label.toLowerCase()}`, f.kind))}${Object.entries(KINDS).map(([k, l]) => opt(k, l, f.kind))}</select>
<select name="wie" aria-label="Toegewezen aan">${opt("", "Iedereen", f.assignee)}${opt("niemand", "Niet toegewezen", f.assignee)}${[...ctx.users].map(([e, nm]) => opt(e, nm || e, f.assignee))}</select>
<button class="btn ghost" type="submit">Filter</button>
<span class="summary"><b>${shown}</b> van ${total}${openValue ? html` · <b>${euroRound(openValue)}</b> open` : ""}</span>
</form>`;

  const head = html`<div class="head"><div><h1>${heading}</h1><p class="sub">${
    view === "bord" ? "Pipeline en opvolging. Sleep een kaart naar een andere kolom om de status te wijzigen." : "Alle aanvragen in een lijst."
  }</p></div>
<div class="actions"><span class="seg"><a href="${href(false)}" class="${view === "bord" ? "on" : ""}">${icon("board")}Bord</a><a href="${href(true)}" class="${
    view === "lijst" ? "on" : ""
  }">${icon("list")}Lijst</a></span>
<a class="btn" href="${ctx.base}/aanvragen/nieuw">${icon("plus")}Nieuwe aanvraag</a></div></div>`;

  if (view === "lijst") {
    const where = [...f.where];
    const args = [...f.args];
    if (status === "open") {
      where.push(`r.status IN (${OPEN.map(() => "?").join(",")})`);
      args.push(...OPEN);
    } else if (isStatus(status)) {
      where.push("r.status = ?");
      args.push(status);
    }
    const sql = `${REQUEST_SELECT}${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY r.created_at DESC LIMIT 200`;
    const { results } = await ctx.db.prepare(sql).bind(...args).all<ListRow>();
    return respond(
      ctx,
      heading,
      section,
      html`${head}${toolbar}<section class="card">${requestTable(ctx, results)}${
        results.length === 200 ? html`<p class="muted small">De nieuwste 200 getoond; verfijn de filter.</p>` : ""
      }</section>`,
    );
  }

  // Board: the newest PER_COLUMN cards of each status column.
  const where = [...f.where, `r.status IN (${BOARD.map(() => "?").join(",")})`];
  const { results } = await ctx.db
    .prepare(
      `SELECT * FROM (SELECT r.*, c.name AS contact_name, c.email AS contact_email, c.phone AS contact_phone, c.city AS contact_city,
         ROW_NUMBER() OVER (PARTITION BY r.status ORDER BY r.created_at DESC) AS rn
       FROM requests r JOIN contacts c ON c.id = r.contact_id WHERE ${where.join(" AND ")}) WHERE rn <= ${PER_COLUMN} ORDER BY created_at DESC`,
    )
    .bind(...f.args, ...BOARD)
    .all<ListRow>();
  const columns = BOARD.map((s) => {
    const cards = results.filter((r) => r.status === s);
    const c = byStatus.get(s);
    const more = (c?.n ?? 0) - cards.length;
    const label = statusLabel(s);
    return html`<section class="col st-${s}" data-status="${s}" data-label="${label}" aria-label="${label}">
<div class="col-head"><i class="dot"></i><b>${label}</b><span class="n" data-n="${c?.n ?? 0}">${c?.n ?? 0}</span>${
      s !== "verloren" ? html`<span class="sum" data-sum="${c?.sum ?? 0}">${c?.sum ? euroRound(c.sum) : ""}</span>` : ""
    }<a class="add" href="${ctx.base}/aanvragen/nieuw?status=${s}" title="Nieuwe aanvraag: ${label}" aria-label="Nieuwe aanvraag: ${label}">${icon("plus")}</a></div>
<div class="col-body">${cards.length ? cards.map((r) => boardCard(ctx, r)) : html`<div class="empty">Geen aanvragen</div>`}${
      more > 0 ? html`<a class="more" href="${href(true, s)}">+ ${more} oudere in de lijst</a>` : ""
    }</div></section>`;
  });
  return respond(ctx, heading, section, html`${head}${toolbar}<div class="board" data-board="${ctx.base}">${columns}</div>`, true);
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
  const tasks = await tasksPanel(ctx, { requestId: r.id }, `/aanvragen/${r.id}`);
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
${tasks}
<section class="card"><h2>Notities</h2>${noteForm(ctx, `/aanvragen/${r.id}`)}${timeline(ctx, notes.results)}</section>
</div>
<div class="side-first">
<section class="card"><h2>Bestelling maken</h2><p class="muted small">Akkoord van de klant? Maak er een bestelling van: de regels${data.lines?.length ? "" : " (vul ze in)"} en de klant worden overgenomen, de aanvraag gaat naar Gewonnen.</p>
<a class="btn" href="${ctx.base}/bestellingen/nieuw?aanvraag=${r.id}">${icon("cart")}Omzetten naar bestelling</a></section>
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
  if (action === "status") {
    // Dragged on the pipeline board: only the status changes.
    const status = field(form, "status");
    if (!isStatus(status)) throw new HttpError(400, "Onbekende status.");
    if (status !== r.status) {
      await ctx.db.prepare("UPDATE requests SET status = ?, updated_at = ? WHERE id = ?").bind(status, now(), id).run();
      await addNote(ctx, r.contact_id, id, `Status: ${statusLabel(r.status)} → ${statusLabel(status)}`, "event");
    }
    return ctx.board ? new Response(null, { status: 204 }) : seeOther(ctx, `/aanvragen/${id}`, "saved");
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
  const start = ctx.url.searchParams.get("status") ?? "nieuw";
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
<div class="fields"><label>Status<select name="status">${STATUSES.map(([k, l]) => html`<option value="${k}" ${k === start ? raw("selected") : ""}>${l}</option>`)}</select></label>
<label>Toegewezen aan<select name="assigned_to">${userOptions(ctx, ctx.user.email)}</select></label></div>
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
  const status = field(form, "status") || "nieuw";
  if (!isStatus(status)) throw new HttpError(400, "Onbekende status.");
  const row = await ctx.db
    .prepare(
      `INSERT INTO requests (contact_id, kind, status, assigned_to, title, body, created_by, created_at, updated_at)
       VALUES (?, 'manueel', ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(contactId, status, assigned, title, field(form, "body", 20_000), ctx.user.email, at, at)
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
    html`<div class="head"><div><h1>Klanten</h1><p class="sub">Iedereen die een aanvraag stuurde of manueel werd toegevoegd.</p></div><div class="actions"><a class="btn ghost" href="${ctx.base}/klanten.csv">${icon("download")}Export (CSV)</a><a class="btn" href="${ctx.base}/klanten/nieuw">${icon("plus")}Nieuwe klant</a></div></div>
<form class="toolbar" method="get" action="${ctx.base}/klanten"><label class="search">${icon("search")}<input name="q" type="search" value="${q}" placeholder="Zoek op naam, e-mail, telefoon, gemeente, bedrijf…" aria-label="Zoeken"></label><button class="btn ghost">Zoek</button><span class="summary"><b>${results.length}</b> klanten</span></form>
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
  const tasks = await tasksPanel(ctx, { contactId: id }, `/klanten/${id}`);
  const { results: orders } = await ctx.db.prepare("SELECT * FROM orders WHERE contact_id = ? ORDER BY created_at DESC").bind(id).all<OrderRow>();
  return respond(
    ctx,
    contactName(c),
    "klanten",
    html`<div class="head"><h1>${contactName(c)}</h1><div class="actions"><a class="btn ghost" href="${ctx.base}/aanvragen/nieuw?klant=${c.id}">${icon("plus")}Nieuwe aanvraag</a><a class="btn" href="${ctx.base}/bestellingen/nieuw?klant=${c.id}">${icon("cart")}Nieuwe bestelling</a></div></div>
<div class="grid two">
<div>
${orders.length ? html`<section class="card"><h2>Bestellingen</h2>${orderTable(ctx, orders, false)}</section>` : ""}
<section class="card"><h2>Aanvragen</h2>${requestTable(ctx, requests.results, false)}</section>
${tasks}
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

// ---------------------------------------------------------------- activiteit

export async function activity(ctx: Ctx): Promise<Response> {
  const wie = (ctx.url.searchParams.get("wie") ?? "").toLowerCase();
  const byUser = ctx.users.has(wie) ? wie : "";
  // One feed: notes and status changes, requests coming in, tasks done.
  const { results } = await ctx.db
    .prepare(
      `SELECT * FROM (
        SELECT 'note' AS type, n.kind, n.created_at AS at, n.author AS actor, n.body AS text, n.request_id, n.contact_id, c.name AS contact_name, c.email AS contact_email
          FROM notes n JOIN contacts c ON c.id = n.contact_id
        UNION ALL
        SELECT 'request', r.kind, r.created_at, r.created_by, r.title, r.id, r.contact_id, c.name, c.email
          FROM requests r JOIN contacts c ON c.id = r.contact_id
        UNION ALL
        SELECT 'task', 'done', t.done_at, t.done_by, t.title, t.request_id, t.contact_id, c.name, c.email
          FROM tasks t LEFT JOIN contacts c ON c.id = t.contact_id WHERE t.done_at IS NOT NULL
      )${byUser ? " WHERE actor = ? COLLATE NOCASE" : ""} ORDER BY at DESC LIMIT 150`,
    )
    .bind(...(byUser ? [byUser] : []))
    .all<{ type: string; kind: string; at: string; actor: string | null; text: string; request_id: number | null; contact_id: number | null; contact_name: string | null; contact_email: string | null }>();
  const opt = (value: string, label: string) => html`<option value="${value}" ${value === byUser ? raw("selected") : ""}>${label}</option>`;
  const what = (e: (typeof results)[number]) =>
    e.type === "request"
      ? e.actor
        ? html`maakte <a href="${ctx.base}/aanvragen/${e.request_id}">${e.text} #${e.request_id}</a> aan`
        : html`Nieuwe aanvraag via de website: <a href="${ctx.base}/aanvragen/${e.request_id}">${e.text} #${e.request_id}</a>`
      : e.type === "task"
        ? html`vinkte taak af: ${e.text}`
        : e.kind === "event"
          ? lines(e.text)
          : html`notitie: ${lines(e.text)}`;
  return respond(
    ctx,
    "Activiteit",
    "activiteit",
    html`<h1>Activiteit</h1>
<form class="card inline" method="get" action="${ctx.base}/activiteit"><label>Wie<select name="wie">${opt("", "Iedereen")}${[...ctx.users].map(([e, n]) => opt(e, n || e))}</select></label><button>Filter</button></form>
<section class="card">${
      results.length
        ? html`<ul class="timeline">${results.map(
            (e) => html`<li class="${e.kind === "event" ? "event" : ""}"><div class="meta">${when(e.at)}${
              e.contact_id ? html` · <a href="${ctx.base}/klanten/${e.contact_id}">${contactName({ name: e.contact_name ?? "", email: e.contact_email })}</a>` : ""
            }${e.type === "note" && e.request_id ? html` · <a href="${ctx.base}/aanvragen/${e.request_id}">aanvraag #${e.request_id}</a>` : ""}</div>
${e.actor ? html`<b>${who(ctx, e.actor)}</b> ` : ""}${what(e)}</li>`,
          )}</ul>`
        : html`<p class="muted">Nog geen activiteit.</p>`
    }</section>`,
  );
}

// ---------------------------------------------------------------- instellingen

export async function settings(ctx: Ctx): Promise<Response> {
  const [shop, co] = await Promise.all([getSettings(ctx.db), getCheckoutSettings(ctx.db)]);
  const missing = missingSettings(shop);
  const keys = { test: Boolean(mspKey(ctx.checkout, "test")), live: Boolean(mspKey(ctx.checkout, "live")) };
  const zoneRows: (Zone | null)[] = [...co.zones, null, null, null];
  const num = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));
  return respond(
    ctx,
    "Instellingen",
    "instellingen",
    html`<h1>Instellingen</h1>
<form class="card" method="post" action="${ctx.base}/instellingen"><input type="hidden" name="action" value="shop">
<h2>Bedrijf en betaling (facturen, betaalverzoeken)</h2>
${missing.length ? html`<p class="warn small">Nog in te vullen voor betaalverzoeken en facturen: ${missing.join(", ")}.</p>` : ""}
<div class="fields">${SETTING_FIELDS.map(
      (f) => html`<label>${f.label}${f.required ? " *" : ""}<input name="${f.key}" value="${shop[f.key]}" placeholder="${f.hint ?? ""}"></label>`,
    )}</div>
<p class="muted small">Klanten betalen per overschrijving naar dit rekeningnummer (iBanFirst), met de gestructureerde mededeling van de bestelling. Deze gegevens staan op elke factuur.</p>
<button>Opslaan</button></form>
<form class="card" method="post" action="${ctx.base}/instellingen"><input type="hidden" name="action" value="checkout">
<h2>Levering en online betalen (afrekenen)</h2>
<p class="muted small" style="margin-top:-6px">Op <a href="https://www.natuurhout.be/afrekenen/" target="_blank" rel="noopener">/afrekenen/</a> betaalt de klant meteen. De leveringskosten komen uit deze zones (Belgische postcodes). Een postcode buiten alle zones kan niet via de webshop geleverd worden: de klant kiest dan afhalen in Zele of vraagt een offerte. Afhalen is gratis.</p>
<div class="scroll"><table class="editor"><thead><tr><th>Postcode van</th><th>tot en met</th><th>Prijs incl. btw</th><th>Omschrijving</th></tr></thead><tbody>
${zoneRows.map(
  (z) => html`<tr><td><input name="z_from" inputmode="numeric" value="${z ? String(z.from) : ""}" placeholder="9000" style="width:90px"></td><td><input name="z_to" inputmode="numeric" value="${z ? String(z.to) : ""}" placeholder="9299" style="width:90px"></td>
<td><input name="z_price" inputmode="decimal" value="${z ? num(z.price) : ""}" placeholder="45,00" style="width:110px"></td><td><input name="z_label" value="${z?.label ?? ""}" placeholder="Bv. Gent en omgeving"></td></tr>`,
)}</tbody></table></div>
<p class="muted small">Eén regel per zone; de eerste zone die past, telt. Lege regels worden genegeerd. Voor meer zones: opslaan, dan komen er nieuwe lege regels bij.</p>
<div class="fields"><label>Gratis levering vanaf (totaal incl. btw, leeg = nooit)<input name="free_above" inputmode="decimal" value="${num(co.freeAbove)}" placeholder="bv. 500"></label>
<label>MultiSafepay-modus<select name="msp_mode"><option value="test" ${co.mspMode === "test" ? raw("selected") : ""}>Test (testapi, er wordt niet echt betaald)</option><option value="live" ${co.mspMode === "live" ? raw("selected") : ""}>Live (echte betalingen)</option></select></label></div>
<p class="small">Sleutels (Worker-geheimen): test ${keys.test ? html`<span class="b success done">ingesteld</span>` : html`<span class="b critical todo">ontbreekt</span>`} · live ${
      keys.live ? html`<span class="b success done">ingesteld</span>` : html`<span class="b critical todo">ontbreekt</span>`
    }${co.mspMode === "live" && !keys.live ? html` <span class="warn">Live staat aan maar de live-sleutel ontbreekt: online betalen werkt niet.</span>` : ""}</p>
<p class="muted small">Webhook voor MultiSafepay: <code>https://www.natuurhout.be/api/multisafepay/webhook/</code> (wordt per betaling meegestuurd, niets in te stellen).</p>
<button>Opslaan</button></form>
<form class="card" method="post" action="${ctx.base}/instellingen"><input type="hidden" name="action" value="me">
<label>Je naam (zichtbaar bij notities en toewijzingen)<input name="name" value="${ctx.user.name}" required maxlength="60"></label>
<p class="muted small">Aangemeld als ${ctx.user.email}.</p>
<button>Opslaan</button></form>
<section class="card"><h2>Gebruikers</h2><p class="muted small">Wie toegang heeft, beheer je in Cloudflare Zero Trust (Access-policy van beheer.natuurhout.be). Iedereen die zich één keer aanmeldt, verschijnt hier.</p>
<ul>${[...ctx.users].map(([email, name]) => html`<li>${name || "(geen naam)"} <span class="muted small">${email}</span></li>`)}</ul></section>`,
  );
}

export async function settingsPost(ctx: Ctx, form: FormData): Promise<Response> {
  if (field(form, "action") === "checkout") {
    const money = (v: string, what: string) => {
      const n = Number(v.replace(/[€\s]/g, "").replace(",", "."));
      if (!Number.isFinite(n) || n < 0 || n > 100000) throw new HttpError(400, `${what}: ongeldig bedrag (${v}).`);
      return Math.round(n * 100) / 100;
    };
    const from = form.getAll("z_from").map(String), to = form.getAll("z_to").map(String), price = form.getAll("z_price").map(String), label = form.getAll("z_label").map(String);
    const zones: Zone[] = [];
    from.forEach((f, i) => {
      const [a, b, p] = [f.trim(), (to[i] ?? "").trim(), (price[i] ?? "").trim()];
      if (!a && !b && !p) return;
      const lo = Number(a), hi = Number(b || a);
      if (!/^\d{4}$/.test(a) || !/^\d{4}$/.test(String(hi)) || hi < lo) throw new HttpError(400, `Zone ${i + 1}: postcodes van 4 cijfers, "van" niet groter dan "tot".`);
      if (!p) throw new HttpError(400, `Zone ${i + 1}: vul een prijs in (0 voor gratis).`);
      zones.push({ from: lo, to: hi, price: money(p, `Zone ${i + 1}`), label: (label[i] ?? "").trim().slice(0, 80) });
    });
    const free = field(form, "free_above", 20);
    await saveCheckoutSettings(ctx.db, { zones, freeAbove: free ? money(free, "Gratis levering vanaf") || null : null, mspMode: field(form, "msp_mode") === "live" ? "live" : "test" });
    return seeOther(ctx, "/instellingen", "saved");
  }
  if (field(form, "action") === "shop") {
    const values: Partial<ShopSettings> = {};
    for (const f of SETTING_FIELDS) values[f.key] = field(form, f.key, f.key === "invoiceFooter" ? 1000 : 200);
    if (values.iban && !validIban(values.iban)) throw new HttpError(400, "Dit IBAN klopt niet (controlegetal). Kijk het na.");
    if (values.paymentDays && !/^\d{1,3}$/.test(values.paymentDays)) throw new HttpError(400, "Betaaltermijn: een aantal dagen.");
    await saveSettings(ctx.db, values);
    return seeOther(ctx, "/instellingen", "saved");
  }
  const name = field(form, "name", 60);
  if (!name) throw new HttpError(400, "Een naam is verplicht.");
  await ctx.db.prepare("UPDATE users SET name = ? WHERE email = ?").bind(name, ctx.user.email).run();
  return seeOther(ctx, "/instellingen", "saved");
}

// ---------------------------------------------------------------- search

/** Sidebar search (Ctrl K): orders, customers and requests at once. */
export async function search(ctx: Ctx): Promise<Response> {
  const q = (ctx.url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const pat = like(q);
  const [orders, contacts, requests] = q
    ? await Promise.all([
        ctx.db
          .prepare("SELECT * FROM orders WHERE number LIKE ?1 ESCAPE '\\' OR name LIKE ?1 ESCAPE '\\' OR email LIKE ?1 ESCAPE '\\' OR phone LIKE ?1 ESCAPE '\\' OR company LIKE ?1 ESCAPE '\\' OR city LIKE ?1 ESCAPE '\\' OR ogm LIKE ?1 ESCAPE '\\' ORDER BY created_at DESC LIMIT 20")
          .bind(pat)
          .all<OrderRow>(),
        ctx.db
          .prepare("SELECT * FROM contacts WHERE name LIKE ?1 ESCAPE '\\' OR email LIKE ?1 ESCAPE '\\' OR phone LIKE ?1 ESCAPE '\\' OR company LIKE ?1 ESCAPE '\\' OR city LIKE ?1 ESCAPE '\\' ORDER BY updated_at DESC LIMIT 20")
          .bind(pat)
          .all<ContactRow>(),
        ctx.db
          .prepare("SELECT r.id, r.kind, r.status, r.title, r.total, r.created_at, c.name, c.email FROM requests r JOIN contacts c ON c.id = r.contact_id WHERE r.title LIKE ?1 ESCAPE '\\' OR r.body LIKE ?1 ESCAPE '\\' OR c.name LIKE ?1 ESCAPE '\\' OR c.email LIKE ?1 ESCAPE '\\' ORDER BY r.created_at DESC LIMIT 20")
          .bind(pat)
          .all<{ id: number; kind: string; status: string; title: string; total: number | null; created_at: string; name: string; email: string | null }>(),
      ])
    : [{ results: [] as OrderRow[] }, { results: [] as ContactRow[] }, { results: [] }];
  const none = !orders.results.length && !contacts.results.length && !requests.results.length;
  return respond(
    ctx,
    q ? `Zoeken: ${q}` : "Zoeken",
    "zoeken",
    html`<div class="ph"><div class="title">${icon("search")}${q ? html`Resultaten voor “${q}”` : "Zoeken"}</div></div>
${!q ? html`<p class="muted">Typ in het zoekveld links (of druk Ctrl K) om bestellingen, klanten en aanvragen te zoeken.</p>` : none ? html`<section class="card"><p class="muted" style="margin:0">Niets gevonden.</p></section>` : ""}
${orders.results.length ? html`<section class="card flush"><div class="card-h"><h2>Bestellingen</h2></div>${orderTable(ctx, orders.results)}</section>` : ""}
${
  contacts.results.length
    ? html`<section class="card flush"><div class="card-h"><h2>Klanten</h2></div><div class="scroll"><table class="itable"><thead><tr><th>Naam</th><th>E-mail</th><th>Telefoon</th><th>Gemeente</th></tr></thead><tbody>${contacts.results.map(
        (c) => html`<tr data-href="${ctx.base}/klanten/${c.id}"><td><a href="${ctx.base}/klanten/${c.id}">${contactName(c)}</a>${c.company ? html` <span class="muted">· ${c.company}</span>` : ""}</td><td>${c.email ?? ""}</td><td>${c.phone}</td><td>${c.city}</td></tr>`,
      )}</tbody></table></div></section>`
    : ""
}
${
  requests.results.length
    ? html`<section class="card flush"><div class="card-h"><h2>Aanvragen</h2></div><div class="scroll"><table class="itable"><thead><tr><th>Aanvraag</th><th>Klant</th><th>Soort</th><th>Status</th><th class="num">Bedrag</th></tr></thead><tbody>${requests.results.map(
        (r) => html`<tr data-href="${ctx.base}/aanvragen/${r.id}"><td><a href="${ctx.base}/aanvragen/${r.id}">${r.title || `#${r.id}`}</a><div class="muted small">${when(r.created_at)}</div></td><td>${r.name || r.email}</td><td>${KINDS[r.kind] ?? r.kind}</td><td>${chip(r.status)}</td><td class="num">${euro(r.total)}</td></tr>`,
      )}</tbody></table></div></section>`
    : ""
}`,
  );
}
