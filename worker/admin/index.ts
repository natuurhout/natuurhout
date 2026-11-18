/*
 * beheer.natuurhout.be: the Natuurhout CRM (requests from the website forms,
 * customers, notes). Served by the same Worker as the public site; the
 * public site never routes here (worker/index.ts dispatches on the hostname).
 *
 * Login: Cloudflare Access in front + JWT check here (./auth.ts).
 * Data: D1 (binding DB), schema in ../crm/schema.ts.
 * Pages: ./pages.ts (server-rendered HTML, plain forms).
 */

import { ensureSchema, now } from "../crm/schema";
import { authenticate, type AuthEnv } from "./auth";
import { makeMailer, type MailEnv } from "../shop/send";
import { APP_JS } from "./app-js";
import { html, page } from "./html";
import { lowStockCount, productEdit, productList, productSave, publishPost, reports, stockPage, stockPost } from "./shop-catalog";
import { invoiceList, invoicePdfResponse, invoicesCsv, orderBulk, orderCreate, orderDetail, orderList, orderNew, orderPdfResponse, orderPost, ordersCsv } from "./shop-orders";
import * as pages from "./pages";
import type { PublishEnv } from "../shop/publish";
import { taskBadges, taskCreate, taskList, taskPost } from "./tasks";

export interface AdminEnv extends AuthEnv, MailEnv, PublishEnv {
  DB?: D1Database;
}

export const ADMIN_HOST = "beheer.natuurhout.be";

const SECURITY_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; connect-src 'self'; style-src 'unsafe-inline'; img-src 'self' data: https://cdn.shopify.com; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "Referrer-Policy": "same-origin",
};

function withHeaders(response: Response): Response {
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  return out;
}

function message(base: string, status: number, title: string, text: string, user?: { email: string; name: string }): Response {
  return new Response(page({ title, base, user, body: html`<h1>${title}</h1><section class="card"><p>${text}</p><p><a href="${base}/">Naar het overzicht</a></p></section>` }), {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** A form POST must come from the admin itself (no cross-site form posts). */
function sameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get("origin");
  if (origin) return origin === url.origin;
  return request.headers.get("sec-fetch-site") === "same-origin";
}

const defaultName = (email: string) => {
  const local = email.split("@")[0].split(/[._-]/)[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
};

/**
 * @param base path prefix of the admin: "" on beheer.natuurhout.be,
 *   "/__beheer" in local development (see worker/index.ts).
 */
export async function handleAdmin(request: Request, env: AdminEnv, url: URL, base: string, local: boolean): Promise<Response> {
  return withHeaders(await route(request, env, url, base, local));
}

async function route(request: Request, env: AdminEnv, url: URL, base: string, local: boolean): Promise<Response> {
  if (url.pathname === `${base}/app.js`) return new Response(APP_JS, { headers: { "content-type": "text/javascript; charset=utf-8" } });
  const auth = await authenticate(request, env, local);
  if (!auth.ok) return message(base, auth.status, "Geen toegang", auth.reason);
  if (!env.DB) return message(base, 503, "Database ontbreekt", "De CRM-database (binding DB) is niet gekoppeld aan de Worker.");
  const db = env.DB;

  if (request.method !== "GET" && request.method !== "HEAD") {
    if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "GET, POST" } });
    if (!sameOrigin(request, url)) return message(base, 403, "Geweigerd", "Dit formulier kwam niet van de beheeromgeving zelf.");
  }

  await ensureSchema(db);
  const at = now();
  await db
    .prepare("INSERT INTO users (email, name, first_seen, last_seen) VALUES (?, ?, ?, ?) ON CONFLICT (email) DO UPDATE SET last_seen = excluded.last_seen")
    .bind(auth.email, defaultName(auth.email), at, at)
    .run();
  const { results: userRows } = await db.prepare("SELECT email, name FROM users ORDER BY name").all<{ email: string; name: string }>();
  const users = new Map(userRows.map((u) => [u.email.toLowerCase(), u.name]));
  const [nieuw, taken, orders, lowStock] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM requests WHERE status = 'nieuw'").first<{ n: number }>(),
    taskBadges(db, auth.email),
    db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'nieuw'").first<{ n: number }>(),
    lowStockCount(db),
  ]);
  const ctx: pages.Ctx = {
    db,
    url,
    base,
    user: { email: auth.email, name: users.get(auth.email) ?? "" },
    users,
    badges: { nieuw: nieuw?.n ?? 0, ...taken, orders: orders?.n ?? 0, lowStock },
    board: request.headers.get("x-board") === "1",
    mail: makeMailer(env),
    publish: env,
  };

  const path = (url.pathname.slice(base.length) || "/").replace(/(.)\/+$/, "$1");
  const post = request.method === "POST";
  const form = post ? await request.formData() : new FormData();
  const id = (pattern: RegExp) => {
    const m = pattern.exec(path);
    return m ? Number(m[1]) : null;
  };

  try {
    if (path === "/") return post ? notAllowed() : await pages.overview(ctx);
    if (path === "/aanvragen") return post ? await pages.requestCreate(ctx, form) : await pages.requestList(ctx);
    if (path === "/aanvragen/nieuw") return post ? notAllowed() : await pages.requestNew(ctx);
    let n = id(/^\/aanvragen\/(\d+)$/);
    if (n !== null) return post ? await pages.requestPost(ctx, n, form) : await pages.requestDetail(ctx, n);
    if (path === "/klanten") return post ? await pages.contactCreate(ctx, form) : await pages.contactList(ctx);
    if (path === "/klanten/nieuw") return post ? notAllowed() : pages.contactNew(ctx);
    if (path === "/klanten.csv") return post ? notAllowed() : await pages.contactsCsv(ctx);
    n = id(/^\/klanten\/(\d+)$/);
    if (n !== null) return post ? await pages.contactPost(ctx, n, form) : await pages.contactDetail(ctx, n);
    if (path === "/taken") return post ? await taskCreate(ctx, form) : await taskList(ctx);
    n = id(/^\/taken\/(\d+)$/);
    if (n !== null) return post ? await taskPost(ctx, n, form) : notAllowed();
    if (path === "/producten") return post ? await publishPost(ctx) : await productList(ctx);
    const handle = /^\/producten\/([\w-]+)$/.exec(path)?.[1];
    if (handle) return post ? await productSave(ctx, handle, form) : await productEdit(ctx, handle);
    if (path === "/bestellingen") return post ? await orderCreate(ctx, form) : await orderList(ctx);
    if (path === "/bestellingen/nieuw") return post ? notAllowed() : await orderNew(ctx);
    if (path === "/bestellingen/bulk") return post ? await orderBulk(ctx, form) : notAllowed();
    if (path === "/bestellingen.csv") return post ? notAllowed() : await ordersCsv(ctx);
    if (path === "/zoeken") return post ? notAllowed() : await pages.search(ctx);
    n = id(/^\/bestellingen\/(\d+)$/);
    if (n !== null) return post ? await orderPost(ctx, n, form) : await orderDetail(ctx, n);
    n = id(/^\/bestellingen\/(\d+)\/bevestiging\.pdf$/);
    if (n !== null) return post ? notAllowed() : await orderPdfResponse(ctx, n);
    if (path === "/facturen") return post ? notAllowed() : await invoiceList(ctx);
    if (path === "/facturen.csv") return post ? notAllowed() : await invoicesCsv(ctx);
    n = id(/^\/facturen\/(\d+)\.pdf$/);
    if (n !== null) return post ? notAllowed() : await invoicePdfResponse(ctx, n);
    if (path === "/voorraad") return post ? await stockPost(ctx, form) : await stockPage(ctx);
    if (path === "/rapporten") return post ? notAllowed() : await reports(ctx);
    if (path === "/activiteit") return post ? notAllowed() : await pages.activity(ctx);
    if (path === "/instellingen") return post ? await pages.settingsPost(ctx, form) : await pages.settings(ctx);
    if (path === "/favicon.ico" || path === "/robots.txt")
      return new Response(path === "/robots.txt" ? "User-agent: *\nDisallow: /\n" : null, { status: path === "/robots.txt" ? 200 : 404 });
    return message(base, 404, "Niet gevonden", "Deze pagina bestaat niet.", ctx.user);
  } catch (error) {
    if (error instanceof pages.HttpError) return message(base, error.status, "Dat lukte niet", error.message, ctx.user);
    console.error("Admin error", path, error);
    return message(base, 500, "Er ging iets mis", "Probeer het opnieuw. Blijft het misgaan, kijk dan in de Worker-logs.", ctx.user);
  }
}

const notAllowed = () => new Response(null, { status: 405, headers: { Allow: "GET" } });
