/*
 * Regions blocked from the public site (Xander, 25 Nov 2026): Natuurhout sells
 * in Belgium and its neighbours and has customers in Poland and Ukraine;
 * Africa, Asia and South America have no business on the site and send mostly
 * spam and attack traffic. Set in the backend (Instellingen → Landen
 * blokkeren), kept in D1 (settings, key "geoBlock").
 *
 * Never blocked: the countries in ALWAYS_ALLOWED (all of Europe's customers),
 * search engines (their crawlers must keep reading the site), the
 * MultiSafepay webhook, /api/catalogus/ (deploy workflow) and the backend itself (beheer.natuurhout.be is
 * dispatched before this runs). Unknown country: allowed.
 * The country comes from Cloudflare (request.cf.country/continent); a VPN
 * gets around it, so this keeps out the bulk, not a determined attacker.
 */

export type GeoBlock = {
  /** Cloudflare continent codes: AF, AS, SA, NA, OC, AN, EU. */
  continents: string[];
  /** Extra countries (ISO codes, e.g. RU), "T1" = the Tor network. */
  countries: string[];
  /** Countries let in although their continent is blocked. */
  allow: string[];
};

export const CONTINENTS: { code: string; label: string; hint?: string }[] = [
  { code: "AF", label: "Afrika" },
  { code: "AS", label: "Azië", hint: "o.a. India, China, Midden-Oosten, Turkije" },
  { code: "SA", label: "Zuid-Amerika" },
  { code: "NA", label: "Noord- en Midden-Amerika", hint: "niet aan te raden: de zoekmachines en Google Ads komen vaak uit de VS" },
  { code: "OC", label: "Oceanië", hint: "Australië, Nieuw-Zeeland" },
  { code: "AN", label: "Antarctica" },
];

/** The European Economic Area, the UK, Switzerland and Ukraine: never blocked, whatever the settings say. */
export const ALWAYS_ALLOWED = new Set(
  "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO GB CH UA".split(" "),
);

export const DEFAULT_GEO_BLOCK: GeoBlock = { continents: ["AF", "AS", "SA"], countries: ["T1"], allow: [] };

const SEARCH_BOTS = /googlebot|google-inspectiontool|adsbot-google|mediapartners-google|bingbot|adidxbot|applebot|duckduckbot|yandexbot|baiduspider|petalbot|facebookexternalhit|linkedinbot|oai-searchbot|chatgpt-user|perplexitybot|claudebot|claude-searchbot/i;

/** "ru, by;T1" → ["RU", "BY", "T1"] */
export const parseCodes = (value: string) => [...new Set(value.toUpperCase().split(/[^A-Z0-9]+/).filter((c) => /^[A-Z][A-Z0-9]$/.test(c)))];

export async function loadGeoBlock(db: D1Database): Promise<GeoBlock> {
  const row = await db.prepare("SELECT value FROM settings WHERE key = 'geoBlock'").first<{ value: string }>();
  if (!row) return DEFAULT_GEO_BLOCK;
  const v = JSON.parse(row.value) as Partial<GeoBlock>;
  return { continents: v.continents ?? [], countries: v.countries ?? [], allow: v.allow ?? [] };
}

export async function saveGeoBlock(db: D1Database, value: GeoBlock): Promise<void> {
  await db
    .prepare("INSERT INTO settings (key, value) VALUES ('geoBlock', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value")
    .bind(JSON.stringify(value))
    .run();
  cached = { at: Date.now(), value };
}

// Per Worker isolate, refreshed every minute: no database read on every request.
let cached: { at: number; value: GeoBlock } | null = null;
async function current(db: D1Database | undefined): Promise<GeoBlock> {
  if (cached && Date.now() - cached.at < 60_000) return cached.value;
  let value = cached?.value ?? DEFAULT_GEO_BLOCK;
  if (db) {
    try {
      value = await loadGeoBlock(db);
    } catch {
      // table not there yet, or D1 hiccup: keep the last known (or the defaults)
    }
  }
  cached = { at: Date.now(), value };
  return value;
}

/** Is this country/continent blocked by these settings? (Pure, also for the backend's overview.) */
export function isBlocked(rules: GeoBlock, country: string, continent: string): boolean {
  if (!country || country === "XX" || ALWAYS_ALLOWED.has(country) || rules.allow.includes(country)) return false;
  return rules.countries.includes(country) || (Boolean(continent) && rules.continents.includes(continent));
}

/** A 403 page for a blocked region, or null to go on. */
export async function geoBlock(request: Request, db: D1Database | undefined, path: string): Promise<Response | null> {
  const cf = (request as Request & { cf?: { country?: string; continent?: string } }).cf;
  const country = String(cf?.country ?? "").toUpperCase();
  if (!country) return null; // local development, or Cloudflare did not say
  // Payment notices, and the catalogue the deploy workflow reads (GitHub runners).
  if (path === "/api/multisafepay/webhook/" || path === "/api/catalogus/") return null;
  if (SEARCH_BOTS.test(request.headers.get("user-agent") ?? "")) return null;
  if (!isBlocked(await current(db), country, String(cf?.continent ?? "").toUpperCase())) return null;
  return new Response(BLOCKED_PAGE, {
    status: 403,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}

const BLOCKED_PAGE = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Natuurhout</title>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f5f5f3;color:#303130;display:grid;place-items:center;min-height:100vh}main{max-width:460px;padding:32px 24px}h1{font-size:20px;margin:0 0 10px}p{line-height:1.55;margin:0 0 10px;color:#5f6368}</style></head>
<body><main><h1>Niet beschikbaar in uw regio</h1><p>Natuurhout levert in België en de buurlanden. Deze website is niet beschikbaar vanuit uw land.</p><h1 style="margin-top:22px">Not available in your region</h1><p>This website is not available from your country.</p></main></body></html>`;
