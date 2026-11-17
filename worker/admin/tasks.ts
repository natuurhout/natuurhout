/*
 * Follow-up tasks ("Taken"): a to-do with an optional due date and assignee,
 * optionally tied to a request or a customer ("bel terug vrijdag",
 * "offerte opvolgen"). Shown on /taken, on the overview, on request and
 * customer pages, and counted in the sidebar.
 */

import { now } from "../crm/schema";
import { html, raw, type Safe } from "./html";
import { contactName, field, HttpError, notFound, respond, seeOther, userOptions, who, type Ctx } from "./pages";

type TaskRow = {
  id: number;
  title: string;
  due_date: string | null;
  assigned_to: string | null;
  contact_id: number | null;
  request_id: number | null;
  done_at: string | null;
  done_by: string | null;
  created_by: string;
  created_at: string;
  contact_name?: string | null;
  contact_email?: string | null;
  request_title?: string | null;
};

const TASK_SELECT = `SELECT t.*, c.name AS contact_name, c.email AS contact_email, r.title AS request_title
  FROM tasks t LEFT JOIN contacts c ON c.id = COALESCE(t.contact_id, (SELECT contact_id FROM requests WHERE id = t.request_id))
  LEFT JOIN requests r ON r.id = t.request_id`;

/** Today in Belgium, as YYYY-MM-DD. */
export const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const dayFmt = new Intl.DateTimeFormat("nl-BE", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

function dueLabel(due: string | null): Safe | string {
  if (!due) return "";
  const t = today();
  const label = due === t ? "vandaag" : due === addDays(t, 1) ? "morgen" : dayFmt.format(new Date(`${due}T12:00:00Z`));
  return due < t ? html`<span class="chip warn">te laat · ${label}</span>` : due === t ? html`<span class="chip st-nieuw">${label}</span>` : html`<span class="chip">${label}</span>`;
}

/** Only redirect back to a path inside the admin. */
function back(form: FormData, fallback: string): string {
  const to = field(form, "back", 300);
  return /^\/(?!\/)[\w\-/?=&.%]*$/.test(to) ? to : fallback;
}

function taskItems(ctx: Ctx, tasks: TaskRow[], backTo: string, showLinks = true): Safe {
  if (!tasks.length) return html`<p class="muted small">Geen taken.</p>`;
  return html`<ul class="timeline">${tasks.map(
    (t) => html`<li class="task"><form method="post" action="${ctx.base}/taken/${t.id}" class="check">
<input type="hidden" name="action" value="${t.done_at ? "reopen" : "done"}"><input type="hidden" name="back" value="${backTo}">
<button class="tick${t.done_at ? " on" : ""}" title="${t.done_at ? "Opnieuw openen" : "Afvinken"}" aria-label="${t.done_at ? "Opnieuw openen" : "Afvinken"}">${t.done_at ? "✓" : ""}</button></form>
<div><span class="${t.done_at ? "muted" : ""}" style="${t.done_at ? "text-decoration:line-through" : ""}">${t.title}</span> ${t.done_at ? "" : dueLabel(t.due_date)}
<div class="meta">${[
      t.assigned_to ? who(ctx, t.assigned_to) : "niet toegewezen",
      showLinks && t.request_id ? html`<a href="${ctx.base}/aanvragen/${t.request_id}">${t.request_title || "aanvraag"} #${t.request_id}</a>` : "",
      showLinks && !t.request_id && t.contact_id ? html`<a href="${ctx.base}/klanten/${t.contact_id}">${contactName({ name: t.contact_name ?? "", email: t.contact_email ?? null })}</a>` : "",
      showLinks && t.request_id && t.contact_name ? t.contact_name : "",
      t.done_at ? `afgevinkt door ${who(ctx, t.done_by)}` : "",
    ]
      .filter(Boolean)
      .map((part, i) => html`${i ? " · " : ""}${part}`)}</div></div></li>`,
  )}</ul>`;
}

function addForm(ctx: Ctx, backTo: string, link: { requestId?: number; contactId?: number } = {}): Safe {
  return html`<form class="inline" method="post" action="${ctx.base}/taken" style="margin-bottom:8px">
<input type="hidden" name="back" value="${backTo}">
${link.requestId ? html`<input type="hidden" name="request_id" value="${link.requestId}">` : ""}
${link.contactId ? html`<input type="hidden" name="contact_id" value="${link.contactId}">` : ""}
<label style="flex:2 1 220px">Taak<input name="title" required maxlength="200" placeholder="Bv. terugbellen over levering" style="width:100%"></label>
<label>Tegen<input name="due_date" type="date" value="${addDays(today(), 1)}"></label>
<label>Voor<select name="assigned_to">${userOptions(ctx, ctx.user.email)}</select></label>
<button>Toevoegen</button></form>`;
}

/** Task panel for a request or customer page. */
export async function tasksPanel(ctx: Ctx, link: { requestId?: number; contactId?: number }, backTo: string): Promise<Safe> {
  const { results } = link.requestId
    ? await ctx.db.prepare(`${TASK_SELECT} WHERE t.request_id = ? ORDER BY t.done_at IS NOT NULL, t.due_date IS NULL, t.due_date, t.id`).bind(link.requestId).all<TaskRow>()
    : await ctx.db
        .prepare(
          `${TASK_SELECT} WHERE t.contact_id = ? OR t.request_id IN (SELECT id FROM requests WHERE contact_id = ?)
           ORDER BY t.done_at IS NOT NULL, t.due_date IS NULL, t.due_date, t.id LIMIT 50`,
        )
        .bind(link.contactId, link.contactId)
        .all<TaskRow>();
  return html`<section class="card"><h2>Taken</h2>${addForm(ctx, backTo, link)}${taskItems(ctx, results, backTo, !link.requestId)}</section>`;
}

/** Open tasks of the current user, for the overview. */
export async function myOpenTasks(ctx: Ctx): Promise<Safe> {
  const { results } = await ctx.db
    .prepare(`${TASK_SELECT} WHERE t.done_at IS NULL AND t.assigned_to = ? COLLATE NOCASE ORDER BY t.due_date IS NULL, t.due_date, t.id LIMIT 10`)
    .bind(ctx.user.email)
    .all<TaskRow>();
  return taskItems(ctx, results, "/");
}

/** Sidebar counts: open tasks of the user, and how many of those are overdue or due today. */
export async function taskBadges(db: D1Database, email: string): Promise<{ taken: number; takenLaat: number }> {
  const row = await db
    .prepare("SELECT COUNT(*) AS open, SUM(CASE WHEN due_date <= ? THEN 1 ELSE 0 END) AS due FROM tasks WHERE done_at IS NULL AND assigned_to = ? COLLATE NOCASE")
    .bind(today(), email)
    .first<{ open: number; due: number | null }>();
  return { taken: row?.open ?? 0, takenLaat: row?.due ?? 0 };
}

export async function taskList(ctx: Ctx): Promise<Response> {
  const p = ctx.url.searchParams;
  const wie = (p.get("wie") ?? "mij").toLowerCase();
  const done = p.get("toon") === "klaar";
  const where = [done ? "t.done_at IS NOT NULL" : "t.done_at IS NULL"];
  const args: string[] = [];
  if (wie === "mij") {
    where.push("t.assigned_to = ? COLLATE NOCASE");
    args.push(ctx.user.email);
  } else if (wie === "niemand") where.push("t.assigned_to IS NULL");
  else if (ctx.users.has(wie)) {
    where.push("t.assigned_to = ? COLLATE NOCASE");
    args.push(wie);
  }
  const order = done ? "t.done_at DESC" : "t.due_date IS NULL, t.due_date, t.id";
  const { results } = await ctx.db.prepare(`${TASK_SELECT} WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT 300`).bind(...args).all<TaskRow>();

  const t = today();
  const groups: [string, TaskRow[]][] = done
    ? [["Afgevinkt", results]]
    : [
        ["Te laat", results.filter((r) => r.due_date && r.due_date < t)],
        ["Vandaag", results.filter((r) => r.due_date === t)],
        ["Later", results.filter((r) => r.due_date && r.due_date > t)],
        ["Zonder datum", results.filter((r) => !r.due_date)],
      ];
  const backTo = `/taken${ctx.url.search.replace(/[?&]ok=\w+/, "")}`;
  const opt = (value: string, label: string, current: string) => html`<option value="${value}" ${value === current ? raw("selected") : ""}>${label}</option>`;
  return respond(
    ctx,
    "Taken",
    "taken",
    html`<h1>Taken</h1>
<section class="card"><h2>Nieuwe taak</h2>${addForm(ctx, backTo)}</section>
<form class="card inline" method="get" action="${ctx.base}/taken">
<label>Voor<select name="wie">${opt("mij", "Mij", wie)}${opt("iedereen", "Iedereen", wie)}${opt("niemand", "Niemand", wie)}${[...ctx.users]
      .filter(([e]) => e !== ctx.user.email)
      .map(([e, n]) => opt(e, n || e, wie))}</select></label>
<label>Toon<select name="toon">${opt("open", "Open", done ? "klaar" : "open")}${opt("klaar", "Afgevinkt", done ? "klaar" : "open")}</select></label>
<button>Filter</button></form>
${results.length
  ? groups.filter(([, rows]) => rows.length).map(([label, rows]) => html`<section class="card"><h2>${label}</h2>${taskItems(ctx, rows, backTo)}</section>`)
  : html`<section class="card"><p class="muted">Geen taken.</p></section>`}`,
  );
}

export async function taskCreate(ctx: Ctx, form: FormData): Promise<Response> {
  const title = field(form, "title", 200);
  if (!title) throw new HttpError(400, "Een taak heeft een omschrijving nodig.");
  const due = field(form, "due_date", 10) || null;
  if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new HttpError(400, "Ongeldige datum.");
  const assigned = field(form, "assigned_to").toLowerCase() || null;
  if (assigned && !ctx.users.has(assigned)) throw new HttpError(400, "Onbekende gebruiker.");
  const requestId = Number(field(form, "request_id")) || null;
  let contactId = Number(field(form, "contact_id")) || null;
  if (requestId) {
    const r = await ctx.db.prepare("SELECT contact_id FROM requests WHERE id = ?").bind(requestId).first<{ contact_id: number }>();
    if (!r) throw notFound();
    contactId = r.contact_id;
  } else if (contactId && !(await ctx.db.prepare("SELECT 1 FROM contacts WHERE id = ?").bind(contactId).first())) throw notFound();
  await ctx.db
    .prepare("INSERT INTO tasks (title, due_date, assigned_to, contact_id, request_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(title, due, assigned, contactId, requestId, ctx.user.email, now())
    .run();
  return seeOther(ctx, back(form, "/taken"), "task");
}

export async function taskPost(ctx: Ctx, id: number, form: FormData): Promise<Response> {
  if (!(await ctx.db.prepare("SELECT 1 FROM tasks WHERE id = ?").bind(id).first())) throw notFound();
  const action = field(form, "action");
  if (action === "done") {
    await ctx.db.prepare("UPDATE tasks SET done_at = ?, done_by = ? WHERE id = ? AND done_at IS NULL").bind(now(), ctx.user.email, id).run();
    return seeOther(ctx, back(form, "/taken"), "done");
  }
  if (action === "reopen") {
    await ctx.db.prepare("UPDATE tasks SET done_at = NULL, done_by = NULL WHERE id = ?").bind(id).run();
    return seeOther(ctx, back(form, "/taken"), "saved");
  }
  throw new HttpError(400, "Onbekende actie.");
}
