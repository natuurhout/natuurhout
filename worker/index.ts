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
 * Everything else goes to the static assets unchanged (404 → out/404.html);
 * raw *.html paths and /404/ answer 404 like on Vercel.
 */
import nextConfig from "../next.config";
import { POST, type OfferteEnv } from "./offerte";

interface Env extends OfferteEnv {
  ASSETS: Fetcher;
}

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Apex → www (canonical host, see src/lib/site.ts).
    if (url.hostname === "natuurhout.be") {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }

    const response = await handle(request, env, url);

    // The workers.dev staging copy must never be indexed, whatever the built HTML says.
    if (url.hostname.endsWith(".workers.dev")) {
      const guarded = new Response(response.body, response);
      guarded.headers.set("X-Robots-Tag", "noindex, nofollow");
      return guarded;
    }
    return response;
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
  if (PAGE_WITHOUT_SLASH.test(path)) return redirect(`${path}/${url.search}`);

  for (const { pattern, names, destination } of await compile()) {
    const match = pattern.exec(path);
    if (!match) continue;
    const target = names.reduce(
      (dest, name, i) => dest.replace(`:${name}`, match[i + 1]),
      destination,
    );
    return redirect(`${target}${url.search}`);
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

  return env.ASSETS.fetch(request);
}
