/*
 * Bezoekers: who is on the site now, and visitors over the last hours or days.
 * Counted anonymously by worker/visits.ts (no cookies, no IP addresses: a
 * visitor is a hash that changes every day). The page reloads itself every
 * 30 seconds while it is open (app.js, data-autorefresh).
 */
import { addDays, todayBE } from "../shop/orders";
import { ago, html, raw, type Safe } from "./html";
import { respond, type Ctx } from "./pages";

/** On the site "now": a page view or ping in the last 5 minutes. */
const LIVE_MS = 5 * 60_000;
const liveSince = () => new Date(Date.now() - LIVE_MS).toISOString();

export async function liveCount(db: D1Database): Promise<number> {
  try {
    const row = await db.prepare("SELECT COUNT(*) AS n FROM visits_live WHERE at >= ?").bind(liveSince()).first<{ n: number }>();
    return row?.n ?? 0;
  } catch {
    return 0; // table not there yet (first request after the deploy)
  }
}

type Period = { key: string; label: string; hours?: number; bucketMin?: number; days?: number };
const PERIODS: Period[] = [
  { key: "2u", label: "Laatste 2 uur", hours: 2, bucketMin: 5 },
  { key: "6u", label: "Laatste 6 uur", hours: 6, bucketMin: 15 },
  { key: "24u", label: "Laatste 24 uur", hours: 24, bucketMin: 60 },
  { key: "7d", label: "Laatste 7 dagen", days: 7 },
  { key: "30d", label: "Laatste 30 dagen", days: 30 },
  { key: "90d", label: "Laatste 90 dagen", days: 90 },
];

const SHOP_STEPS = [
  { label: "Calculator", path: "/calculator/" },
  { label: "Winkelmandje", path: "/winkelmandje/" },
  { label: "Afrekenen", path: "/afrekenen/" },
  { label: "Bestelling geplaatst", path: "/afrekenen/bedankt/" },
];

const time = (iso: string) => new Intl.DateTimeFormat("nl-BE", { timeZone: "Europe/Brussels", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const dayLabel = (day: string, short: boolean) =>
  new Intl.DateTimeFormat("nl-BE", { timeZone: "UTC", ...(short ? { day: "numeric", month: "numeric" } : { weekday: "short", day: "numeric" }) }).format(new Date(`${day}T12:00:00Z`));
const n = (v: number) => new Intl.NumberFormat("nl-BE").format(v);
const DEVICE: Record<string, string> = { gsm: "Gsm", tablet: "Tablet", computer: "Computer" };

type Row = Record<string, string | number>;

export async function visitorsPage(ctx: Ctx): Promise<Response> {
  const db = ctx.db;
  const period = PERIODS.find((p) => p.key === ctx.url.searchParams.get("periode")) ?? PERIODS[2];
  const today = todayBE();
  const nowMs = Date.now();
  // Range: from a time (hours) or from a local day (days).
  const startIso = period.hours ? new Date(nowMs - period.hours * 3_600_000).toISOString() : "";
  const startDay = period.days ? addDays(today, -(period.days - 1)) : "";
  const where = period.hours ? "at >= ?" : "day >= ?";
  const from = period.hours ? startIso : startDay;
  // Orders and requests in the same range (their created_at is ISO UTC).
  const fromIso = period.hours ? startIso : `${startDay}T00:00:00`;

  const bucketSql = period.hours
    ? db.prepare(
        `SELECT CAST((julianday(at) - julianday(?)) * 1440 / ? AS INTEGER) AS b, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views FROM visits WHERE at >= ? GROUP BY b`,
      ).bind(startIso, period.bucketMin!, startIso)
    : db.prepare("SELECT day AS b, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views FROM visits WHERE day >= ? GROUP BY day").bind(startDay);

  const [live, totals, buckets, pages, sources, devices, countries, steps, todayRow, yesterdayRow, orders, requests] = await db.batch([
    db.prepare("SELECT visitor, at, path, device, source FROM visits_live WHERE at >= ? ORDER BY at DESC LIMIT 50").bind(liveSince()),
    db.prepare(`SELECT COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views FROM visits WHERE ${where}`).bind(from),
    bucketSql,
    db.prepare(`SELECT path, COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views FROM visits WHERE ${where} GROUP BY path ORDER BY visitors DESC, views DESC LIMIT 15`).bind(from),
    // A visitor's way in: the source of their first landing in the range.
    db.prepare(
      `SELECT source, COUNT(*) AS visitors FROM (SELECT visitor, source, MIN(at) FROM visits WHERE ${where} AND source <> '' GROUP BY visitor) GROUP BY source ORDER BY visitors DESC LIMIT 12`,
    ).bind(from),
    db.prepare(`SELECT device, COUNT(DISTINCT visitor) AS visitors FROM visits WHERE ${where} GROUP BY device ORDER BY visitors DESC`).bind(from),
    db.prepare(`SELECT country, COUNT(DISTINCT visitor) AS visitors FROM visits WHERE ${where} GROUP BY country ORDER BY visitors DESC LIMIT 6`).bind(from),
    db.prepare(
      `SELECT ${SHOP_STEPS.map((_, i) => `COUNT(DISTINCT CASE WHEN path = ?${i + 1} THEN visitor END) AS s${i}`).join(", ")} FROM visits WHERE ${where.replace("?", `?${SHOP_STEPS.length + 1}`)}`,
    ).bind(...SHOP_STEPS.map((s) => s.path), from),
    db.prepare("SELECT COUNT(DISTINCT visitor) AS visitors, COUNT(*) AS views FROM visits WHERE day = ?").bind(today),
    db.prepare("SELECT COUNT(DISTINCT visitor) AS visitors FROM visits WHERE day = ? AND hour <= ?").bind(addDays(today, -1), localHour()),
    db.prepare("SELECT COUNT(*) AS n FROM orders WHERE created_at >= ? AND status <> 'geannuleerd'").bind(fromIso),
    db.prepare("SELECT COUNT(*) AS n FROM requests WHERE created_at >= ?").bind(fromIso),
  ]);

  const liveRows = live.results as { visitor: string; at: string; path: string; device: string; source: string }[];
  const total = totals.results[0] as { visitors: number; views: number };
  const todayTotals = todayRow.results[0] as { visitors: number; views: number };
  const yesterdaySoFar = (yesterdayRow.results[0] as { visitors: number }).visitors;
  const stepCounts = steps.results[0] as Record<string, number>;

  // Every bucket of the range, also the empty ones.
  const byBucket = new Map((buckets.results as { b: number | string; visitors: number; views: number }[]).map((r) => [String(r.b), r]));
  const bars: { label: string; title: string; visitors: number; views: number }[] = period.hours
    ? Array.from({ length: (period.hours * 60) / period.bucketMin! }, (_, i) => {
        const at = new Date(Date.parse(startIso) + i * period.bucketMin! * 60_000).toISOString();
        const r = byBucket.get(String(i));
        return { label: time(at), title: time(at), visitors: r?.visitors ?? 0, views: r?.views ?? 0 };
      })
    : Array.from({ length: period.days! }, (_, i) => {
        const day = addDays(startDay, i);
        const r = byBucket.get(day);
        return { label: dayLabel(day, period.days! > 7), title: dayLabel(day, false), visitors: r?.visitors ?? 0, views: r?.views ?? 0 };
      });
  const max = Math.max(1, ...bars.map((b) => b.visitors));
  const every = Math.ceil(bars.length / (period.hours ? 6 : 8)); // few labels, so they fit on a phone too

  const table = (rows: Row[], head: [string, string], key: string, label: (r: Row) => Safe | string = (r) => String(r[key])) => {
    const top = Math.max(1, ...rows.map((r) => Number(r.visitors)));
    return rows.length
      ? html`<table><thead><tr><th>${head[0]}</th><th></th><th class="num">${head[1]}</th></tr></thead><tbody>${rows.map(
          (r) => html`<tr><td style="width:48%">${label(r)}</td><td><div class="meter"><i style="width:${((Number(r.visitors) / top) * 100).toFixed(1)}%"></i></div></td><td class="num">${n(Number(r.visitors))}</td></tr>`,
        )}</tbody></table>`
      : html`<p class="muted small">Nog geen bezoekers in deze periode.</p>`;
  };
  const pageLink = (r: Row) => html`<a href="https://www.natuurhout.be${String(r.path)}" target="_blank" rel="noopener">${String(r.path) === "/" ? "Home" : String(r.path)}</a>${
    Number(r.views) > Number(r.visitors) ? html`<div class="muted small">${n(Number(r.views))} keer bekeken</div>` : ""
  }`;

  return respond(
    ctx,
    "Bezoekers",
    "bezoekers",
    html`<div class="head" data-autorefresh="30"><div><h1>Bezoekers</h1><p class="sub">Anoniem geteld, zonder cookies of IP-adressen. Bots en wie in de backend is aangemeld tellen niet mee. Ververst elke 30 seconden.</p></div>
<div class="seg" role="group" aria-label="Periode">${PERIODS.map(
      (p) => html`<a href="${ctx.base}/bezoekers?periode=${p.key}" class="${p.key === period.key ? "on" : ""}"${p.key === period.key ? raw(' aria-current="true"') : ""}>${p.key}</a>`,
    )}</div></div>
<div class="stats">
<div class="stat"><span><i class="dot" style="background:#29845a"></i>Nu op de site</span><b>${n(liveRows.length)}</b></div>
<div class="stat"><span>Vandaag</span><b>${n(todayTotals.visitors)}</b></div>
<div class="stat"><span>Gisteren tot dit uur</span><b>${n(yesterdaySoFar)}</b></div>
<div class="stat"><span>Bezoekers, ${period.label.toLowerCase()}</span><b>${n(total.visitors)}</b></div>
<div class="stat"><span>Pagina's bekeken</span><b>${n(total.views)}</b></div>
<div class="stat"><span>Pagina's per bezoeker</span><b>${total.visitors ? (total.views / total.visitors).toFixed(1).replace(".", ",") : "–"}</b></div>
</div>
<div class="grid two">
<section class="card"><h2>Bezoekers, ${period.label.toLowerCase()}</h2><div class="bars${bars.length > 31 ? " dense" : ""}">${bars.map(
      (b, i) =>
        html`<div class="bar" title="${b.title}: ${b.visitors} ${b.visitors === 1 ? "bezoeker" : "bezoekers"}, ${b.views} pagina's"><b>${bars.length <= 31 && b.visitors ? b.visitors : ""}</b><i style="height:${((b.visitors / max) * 130).toFixed(1)}px"></i><span>${i % every === 0 ? b.label : raw("&nbsp;")}</span></div>`,
    )}</div></section>
<section class="card"><h2>Nu op de site (${liveRows.length})</h2>${
      liveRows.length
        ? html`<table><tbody>${liveRows.map(
            (r) => html`<tr><td><a href="https://www.natuurhout.be${r.path}" target="_blank" rel="noopener">${r.path === "/" ? "Home" : r.path}</a><div class="muted small">${DEVICE[r.device] ?? r.device}${r.source ? ` · via ${r.source}` : ""}</div></td><td class="num muted small">${ago(r.at)}</td></tr>`,
          )}</tbody></table>`
        : html`<p class="muted small">Op dit moment niemand (laatste 5 minuten).</p>`
    }</section>
</div>
<div class="grid two">
<section class="card"><h2>Meest bekeken pagina's</h2>${table(pages.results as Row[], ["Pagina", "Bezoekers"], "path", pageLink)}</section>
<div>
<section class="card"><h2>Herkomst</h2>${table(sources.results as Row[], ["Via", "Bezoekers"], "source")}</section>
<section class="card"><h2>Toestel</h2>${table(devices.results as Row[], ["Toestel", "Bezoekers"], "device", (r) => DEVICE[String(r.device)] ?? String(r.device))}</section>
<section class="card"><h2>Land</h2>${table(countries.results as Row[], ["Land", "Bezoekers"], "country", (r) => countryName(String(r.country)))}</section>
<section class="card"><h2>Winkel</h2><dl>${SHOP_STEPS.map((s, i) => html`<dt>${s.label}</dt><dd>${n(stepCounts[`s${i}`] ?? 0)} ${(stepCounts[`s${i}`] ?? 0) === 1 ? "bezoeker" : "bezoekers"}</dd>`)}<dt>Bestellingen</dt><dd>${n(
      (orders.results[0] as { n: number }).n,
    )}</dd><dt>Aanvragen</dt><dd>${n((requests.results[0] as { n: number }).n)}</dd></dl></section>
</div></div>`,
  );
}

function localHour(): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
}

function countryName(code: string): string {
  if (!code) return "Onbekend";
  try {
    return new Intl.DisplayNames(["nl"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Visitors on a local day (Overzicht). */
export async function visitorsOn(db: D1Database, day: string): Promise<number> {
  try {
    const row = await db.prepare("SELECT COUNT(DISTINCT visitor) AS n FROM visits WHERE day = ?").bind(day).first<{ n: number }>();
    return row?.n ?? 0;
  } catch {
    return 0;
  }
}
