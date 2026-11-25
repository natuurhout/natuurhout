/**
 * Natuurhout Worker (Cloudflare). The site itself is a static export in ./out,
 * served from Workers static assets. This script runs first for every request
 * (run_worker_first in wrangler.jsonc) because a static host cannot do what
 * Next did on Vercel:
 *
 *   1. trailingSlash: true — the same 308s Next emits (add the slash to page
 *      paths, strip it from file paths), relative Location, query kept;
 *   2. the redirects() in next.config.ts, read from that file so there is one
 *      list, matched like Next does (case-insensitive, optional trailing slash);
 *   3. POST /api/offerte/ (worker/offerte.ts, formerly the Next route handler).
 *
 * beheer.natuurhout.be is the CRM (worker/admin/), behind Cloudflare Access;
 * locally it answers at http://localhost:<port>/__beheer/ (needs
 * ADMIN_DEV_EMAIL in .dev.vars).
 *
 * Everything else goes to the static assets unchanged (404 → out/404.html);
 * raw *.html paths and /404/ answer 404 like on Vercel.
 */
import { NO_OVERRIDES } from "../src/lib/catalog-overrides";
import { loadCatalog } from "./shop/catalog";
import nextConfig from "../next.config";
import { ADMIN_HOST, handleAdmin, type AdminEnv } from "./admin";
import { POST, type OfferteEnv } from "./offerte";
import { publishSite, type PublishEnv } from "./shop/publish";
import * as checkout from "./shop/checkout";
import { recordVisit, sweepVisits } from "./visits";
import { geoBlock } from "./geo-block";

interface Env extends OfferteEnv, AdminEnv, PublishEnv, checkout.CheckoutEnv {
  ASSETS: Fetcher;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const LOCAL_ADMIN_BASE = "/__beheer";

type Redirect = { source: string; destination: string; permanent?: boolean };
type CompiledRedirect = {
  pattern: RegExp;
  names: string[];
  destination: string;
};

// Next's own trailingSlash redirects (next/dist/lib/load-custom-routes.js).
const FILE_WITH_SLASH =
  /^\/((?!\.well-known(?:\/.*)?)(?:[^/]+\/)*[^/]+\.\w+)\/$/;
const PAGE_WITHOUT_SLASH = /^\/((?!\.well-known(?:\/.*)?)(?:[^/]+\/)*[^/.]+)$/;

let compiled: Promise<CompiledRedirect[]> | undefined;

function compile(): Promise<CompiledRedirect[]> {
  compiled ??= Promise.resolve(
    nextConfig.redirects ? nextConfig.redirects() : [],
  ).then((list) =>
    (list as Redirect[]).map(({ source, destination }) => {
      const names: string[] = [];
      const body = source
        .replace(/\/$/, "")
        .split("/")
        .map((segment) => {
          if (segment.startsWith(":")) {
            names.push(segment.slice(1));
            return "([^/]+?)";
          }
          return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("/");
      return { pattern: new RegExp(`^${body}/?$`, "i"), names, destination };
    }),
  );
  return compiled;
}

function redirect(location: string): Response {
  return new Response(null, { status: 308, headers: { Location: location } });
}

const CANONICAL_HOST = "www.natuurhout.be";

// Static assets cannot set these themselves (no next.config headers() in a static export).
function withSecurityHeaders(response: Response): Response {
  const guarded = new Response(response.body, response);
  guarded.headers.set("X-Content-Type-Options", "nosniff");
  guarded.headers.set("X-Frame-Options", "SAMEORIGIN");
  guarded.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  guarded.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return guarded;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    // A backend save or a website order can change what the site shows (price,
    // name, sold out): start a site rebuild right away when it did.
    const sync = () => ctx.waitUntil(publishSite(env).catch((error) => console.error("Site sync check failed", error)));

    const local = LOCAL_HOSTS.has(url.hostname) && (url.pathname === LOCAL_ADMIN_BASE || url.pathname.startsWith(`${LOCAL_ADMIN_BASE}/`));
    if (url.hostname === ADMIN_HOST || local) {
      const response = await handleAdmin(request, env, url, local ? LOCAL_ADMIN_BASE : "", local);
      if (request.method === "POST") sync();
      return response;
    }

    // Regions blocked in the backend (worker/geo-block.ts): a 403 before anything else.
    const blocked = await geoBlock(request, env.DB, url.pathname);
    if (blocked) return withSecurityHeaders(blocked);

    // Apex → www (canonical host, see src/lib/site.ts).
    if (url.hostname === "natuurhout.be") {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    // Anonymous visitor counter (worker/visits.ts).
    if (url.pathname === "/api/bezoek/") return recordVisit(request, env, ctx);

    const response = withSecurityHeaders(await handle(request, env, url));
    if (request.method === "POST" && (url.pathname === "/api/offerte/" || url.pathname.startsWith("/api/afrekenen/") || url.pathname === "/api/multisafepay/webhook/")) sync();

    // The workers.dev staging copy must never be indexed, whatever the built HTML says.
    if (url.hostname.endsWith(".workers.dev")) {
      const guarded = new Response(response.body, response);
      guarded.headers.set("X-Robots-Tag", "noindex, nofollow");
      return guarded;
    }
    return response;
  },

  // Every 5 minutes (wrangler.jsonc triggers): retry a site rebuild that was
  // missed or failed, so the site never stays behind the backend.
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(publishSite(env, { retry: true }).then((state) => console.log("Site sync:", state)));
    // Online orders nobody paid: cancel after a few days so the stock comes back.
    ctx.waitUntil(checkout.sweepAbandoned(env).then((n) => n && console.log("Checkout: cancelled unpaid orders:", n)));
    // Visitor counts: day totals kept, rows after 90 days and old salts deleted.
    ctx.waitUntil(sweepVisits(env).catch((error) => console.error("Visits sweep failed", error)));
  },
} satisfies ExportedHandler<Env>;

async function handle(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;

  // Client-side navigation payloads of the static export (…/__next.*.txt,
  // …/index.txt). On Vercel these were header-based requests that never
  // went through redirects(), so serve them as-is ("/producten/:handle"
  // would otherwise send /producten/'s payload to /shop/).
  if (/\/(__next\.[^/]*|index)\.txt$/.test(path))
    return env.ASSETS.fetch(request);

  const file = FILE_WITH_SLASH.exec(path);
  if (file) return redirect(`/${file[1]}${url.search}`);

  // redirects() first: a redirected URL without its slash goes to its target in
  // one hop instead of two (308 slash, then 308 target). Patterns match with
  // or without the trailing slash, as in Next.
  for (const { pattern, names, destination } of await compile()) {
    const match = pattern.exec(path);
    if (!match) continue;
    const target = names.reduce(
      (dest, name, i) => dest.replace(`:${name}`, match[i + 1]),
      destination,
    );
    return redirect(`${target}${url.search}`);
  }

  if (PAGE_WITHOUT_SLASH.test(path)) return redirect(`${path}/${url.search}`);

  // Backend catalogue edits, published for the site build (scripts/sync-catalog.mjs).
  if (path === "/api/catalogus/") {
    if (!env.DB) return Response.json(NO_OVERRIDES);
    const { overrides } = await loadCatalog(env.DB);
    return Response.json(overrides, { headers: { "Cache-Control": "no-store" } });
  }

  // Checkout v2 (worker/shop/checkout.ts).
  if (path.startsWith("/api/afrekenen/") || path === "/api/multisafepay/webhook/") {
    const post = request.method === "POST";
    if (path === "/api/afrekenen/prijs/" && post) return checkout.quote(request, env);
    if (path === "/api/afrekenen/" && post) return checkout.place(request, env);
    if (path === "/api/afrekenen/opnieuw/" && post) return checkout.retry(request, env);
    if (path === "/api/afrekenen/status/" && request.method === "GET") return checkout.status(request, env);
    if (path === "/api/afrekenen/beschikbaar/" && request.method === "GET") return checkout.availability(env);
    if (path === "/api/afrekenen/voorraad/" && request.method === "GET") return checkout.stockLevels(request, env);
    if (path === "/api/multisafepay/webhook/" && post) return checkout.webhook(request, env);
    return new Response(null, { status: 405 });
  }

  if (path === "/api/offerte/") {
    if (request.method !== "POST")
      return new Response(null, { status: 405, headers: { Allow: "POST" } });
    return POST(request, env);
  }

  // Export artefacts that Next never served as URLs on Vercel: raw .html
  // files and the 404 page's own folder. Answer them with the 404 page.
  if (path.endsWith(".html") || path === "/404/") {
    return env.ASSETS.fetch(
      new Request(new URL("/__not-found__/", url), request),
    );
  }

  // Videos (public/video/): Safari only plays a video when the server answers
  // byte ranges (206), so slice the file here when the asset itself did not.
  if (path.startsWith("/video/") && /\.mp4$/.test(path)) return videoAsset(request, env);

  // WebP copies of photos (src/lib/image-loader.ts, scripts/build-images.mjs):
  // when a copy was not built, serve the original instead of a broken image.
  const webp = /^\/_img\/w\d+(\/.+)\.webp$/.exec(path);
  if (webp) {
    const copy = await env.ASSETS.fetch(request);
    if (copy.status !== 404) return copy;
    return env.ASSETS.fetch(new Request(new URL(webp[1], url), request));
  }

  return env.ASSETS.fetch(request);
}

async function videoAsset(request: Request, env: Env): Promise<Response> {
  const range = request.headers.get("range");
  const asset = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
  if (!asset.ok || asset.status === 206) return asset;
  const headers = new Headers(asset.headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=86400");
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  if (!m) return new Response(request.method === "HEAD" ? null : asset.body, { status: 200, headers });
  const body = await asset.arrayBuffer();
  const size = body.byteLength;
  let start = m[1] === "" ? size - Number(m[2]) : Number(m[1]);
  let end = m[1] === "" || m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  if (m[1] === "" && m[2] === "") return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  start = Math.max(0, start);
  if (start > end || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  end = Math.min(end, size - 1);
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(request.method === "HEAD" ? null : body.slice(start, end + 1), { status: 206, headers });
}
