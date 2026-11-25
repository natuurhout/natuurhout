/*
 * Anonymous visitor counts for the backend (tab Bezoekers, worker/admin/visitors.ts).
 *
 * The site (src/components/VisitCounter.tsx) sends a beacon per page and a
 * ping every minute while the page is open: POST /api/bezoek/. No cookies and
 * no IP addresses are stored: a visitor is a hash of the IP address and
 * browser with a random salt that changes every day (and is deleted after
 * that day), so a visitor is recognised for one day only, like Plausible.
 * Bots are left out; so is anyone logged in to the backend (cookie nh_beheer,
 * set by the admin on .natuurhout.be). Rows older than 90 days are deleted,
 * after their day totals are kept in visit_days.
 */
import { ensureSchema } from "./crm/schema";

export interface VisitsEnv {
  DB?: D1Database;
}

export const ADMIN_COOKIE = "nh_beheer";
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|bingpreview|python|curl|wget|httpclient|java\/|go-http|axios|node-fetch|playwright|puppeteer|phantom|selenium/i;
const SITE_HOSTS = /^(www\.)?natuurhout\.be$/;
const KEEP_DAYS = 90;

const local = (d: Date) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
};

/** Where a landing came from: search engine, social, another site, an ad or direct. */
export function sourceOf(referrer: string, query: string, ownHost = ""): string {
  const q = new URLSearchParams(query);
  if (q.has("gclid") || q.has("gbraid") || q.has("wbraid")) return "Google Ads";
  if (q.has("fbclid")) return "Facebook / Instagram";
  const utm = q.get("utm_source");
  if (utm) return `Campagne: ${utm.slice(0, 40)}`;
  let host = "";
  try {
    host = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "Rechtstreeks";
  }
  if (!host) return "Rechtstreeks";
  if (SITE_HOSTS.test(host) || host === ownHost.replace(/^www\./, "")) return "";
  if (/(^|\.)google\./.test(host)) return "Google";
  if (/(^|\.)bing\.com$/.test(host)) return "Bing";
  if (/duckduckgo|ecosia|yahoo|qwant|brave/.test(host)) return "Andere zoekmachine";
  if (/facebook|instagram|fb\.com|fb\.me/.test(host)) return "Facebook / Instagram";
  if (/chatgpt|openai|perplexity|claude\.ai|gemini|copilot/.test(host)) return "AI-assistent";
  return host.slice(0, 60);
}

export function deviceOf(ua: string): string {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|Android/i.test(ua)) return "gsm";
  return "computer";
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

let salt: { day: string; value: string } | null = null;
async function saltFor(db: D1Database, day: string): Promise<string> {
  if (salt?.day === day) return salt.value;
  const fresh = hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
  await db.prepare("INSERT OR IGNORE INTO visit_salt (day, salt) VALUES (?, ?)").bind(day, fresh).run();
  const row = await db.prepare("SELECT salt FROM visit_salt WHERE day = ?").bind(day).first<{ salt: string }>();
  salt = { day, value: row?.salt ?? fresh };
  return salt.value;
}

/** POST /api/bezoek/ — always 204, whatever happens (it is only a counter). */
export async function recordVisit(request: Request, env: VisitsEnv, ctx: ExecutionContext): Promise<Response> {
  const done = new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  if (!env.DB || request.method !== "POST") return done;
  const origin = request.headers.get("origin") ?? "";
  const fromSite = /^https:\/\/www\.natuurhout\.be$/.test(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || request.headers.get("sec-fetch-site") === "same-origin";
  const ua = request.headers.get("user-agent") ?? "";
  const cookies = request.headers.get("cookie") ?? "";
  if (!fromSite || !ua || BOT.test(ua) || cookies.includes(`${ADMIN_COOKIE}=`)) return done;
  let body: { p?: unknown; r?: unknown; q?: unknown; t?: unknown };
  try {
    body = JSON.parse((await request.text()).slice(0, 2000));
  } catch {
    return done;
  }
  const path = typeof body.p === "string" && body.p.startsWith("/") ? body.p.split(/[?#]/)[0].slice(0, 200) : "";
  if (!path || path.startsWith("/api/")) return done;
  const ping = body.t === "ping";
  const db = env.DB;
  ctx.waitUntil(
    (async () => {
      await ensureSchema(db);
      const at = new Date();
      const { day, hour } = local(at);
      const ip = request.headers.get("cf-connecting-ip") ?? "";
      const visitor = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${await saltFor(db, day)}|${ip}|${ua}`))).slice(0, 24);
      // A ping keeps the landing's source; a page within the site has none ('').
      const source = ping ? "" : sourceOf(typeof body.r === "string" ? body.r : "", typeof body.q === "string" ? body.q : "", new URL(request.url).hostname);
      const device = deviceOf(ua);
      const country = String((request as Request & { cf?: { country?: string } }).cf?.country ?? "").slice(0, 2);
      const iso = at.toISOString();
      const live = db
        .prepare(
          `INSERT INTO visits_live (visitor, at, path, device, source) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT (visitor) DO UPDATE SET at = excluded.at, path = excluded.path, source = CASE WHEN excluded.source <> '' THEN excluded.source ELSE visits_live.source END`,
        )
        .bind(visitor, iso, path, device, source);
      if (ping) await live.run();
      else
        await db.batch([
          db.prepare("INSERT INTO visits (at, day, hour, visitor, path, source, device, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(iso, day, hour, visitor, path, source, device, country),
          live,
        ]);
    })().catch((error) => console.error("Visit not counted", error)),
  );
  return done;
}

/** From the 5-minute cron: keep day totals, delete old rows and old salts. */
export async function sweepVisits(env: VisitsEnv): Promise<void> {
  if (!env.DB) return;
  const db = env.DB;
  await ensureSchema(db);
  const today = local(new Date()).day;
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString().slice(0, 10);
  await db.batch([
    // Totals of every finished day, kept after the rows are gone.
    db.prepare(
      `INSERT INTO visit_days (day, visitors, views)
       SELECT day, COUNT(DISTINCT visitor), COUNT(*) FROM visits WHERE day < ? AND day NOT IN (SELECT day FROM visit_days) GROUP BY day`,
    ).bind(today),
    db.prepare("DELETE FROM visits WHERE day < ?").bind(cutoff),
    db.prepare("DELETE FROM visits_live WHERE at < ?").bind(new Date(Date.now() - 3_600_000).toISOString()),
    // Yesterday's salt goes: its hashes can no longer be linked to anyone.
    db.prepare("DELETE FROM visit_salt WHERE day < ?").bind(today),
  ]);
}

