/*
 * Login for beheer.natuurhout.be: Cloudflare Access (Zero Trust) does the
 * actual login (e-mail + one-time code) and puts a signed JWT on every
 * request it lets through (header Cf-Access-Jwt-Assertion). We verify that
 * token here as well, so the admin stays closed even if the Access
 * application were removed or misconfigured: no valid token, no admin.
 *
 * Env (wrangler.jsonc vars):
 *   ACCESS_TEAM_DOMAIN  e.g. "natuurhout.cloudflareaccess.com"
 *   ACCESS_AUD          the Access application's "Application Audience (AUD) Tag"
 *   ADMIN_EMAILS        optional extra allow-list, comma separated
 * Without ACCESS_TEAM_DOMAIN/ACCESS_AUD the admin refuses everyone.
 */

export interface AuthEnv {
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ADMIN_EMAILS?: string;
  /** Local development only (.dev.vars): log in as this address without Access. */
  ADMIN_DEV_EMAIL?: string;
}

export type AuthResult = { ok: true; email: string } | { ok: false; status: 401 | 403 | 503; reason: string };

type Jwk = JsonWebKey & { kid?: string };
let keyCache: { team: string; at: number; keys: Jwk[] } | undefined;

async function signingKeys(team: string, refresh = false): Promise<Jwk[]> {
  if (!refresh && keyCache?.team === team && Date.now() - keyCache.at < 60 * 60_000) return keyCache.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access certs: HTTP ${res.status}`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  keyCache = { team, at: Date.now(), keys };
  return keys;
}

function b64url(value: string): Uint8Array {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function verifyJwt(token: string, team: string, aud: string): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  let header: { alg?: string; kid?: string };
  let payload: { aud?: string | string[]; iss?: string; exp?: number; nbf?: number; email?: string };
  try {
    header = JSON.parse(new TextDecoder().decode(b64url(h)));
    payload = JSON.parse(new TextDecoder().decode(b64url(p)));
  } catch {
    return null;
  }
  if (header.alg !== "RS256" || !header.kid) return null;

  let jwk = (await signingKeys(team)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await signingKeys(team, true)).find((k) => k.kid === header.kid); // keys rotate
  if (!jwk) return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  if (!valid) return null;

  const nowSec = Date.now() / 1000;
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud)) return null;
  if (payload.iss !== `https://${team}`) return null;
  if (!payload.exp || payload.exp < nowSec) return null;
  if (payload.nbf && payload.nbf > nowSec + 60) return null;
  return payload.email?.toLowerCase() || null;
}

export async function authenticate(request: Request, env: AuthEnv, local: boolean): Promise<AuthResult> {
  if (local && env.ADMIN_DEV_EMAIL) return { ok: true, email: env.ADMIN_DEV_EMAIL.toLowerCase() };

  const team = env.ACCESS_TEAM_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const aud = env.ACCESS_AUD?.trim();
  if (!team || !aud) return { ok: false, status: 503, reason: "Cloudflare Access is nog niet ingesteld voor beheer." };

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return { ok: false, status: 401, reason: "Niet aangemeld via Cloudflare Access." };
  let email: string | null;
  try {
    email = await verifyJwt(token, team, aud);
  } catch (error) {
    console.error("Access token check failed", error);
    return { ok: false, status: 503, reason: "Aanmelding kon niet gecontroleerd worden. Probeer het opnieuw." };
  }
  if (!email) return { ok: false, status: 403, reason: "Ongeldige of verlopen aanmelding." };

  const allowed = (env.ADMIN_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes(email)) return { ok: false, status: 403, reason: "Dit account heeft geen toegang." };
  return { ok: true, email };
}
