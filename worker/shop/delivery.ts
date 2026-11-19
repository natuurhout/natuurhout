/*
 * Delivery price for the checkout, set in the backend (Checkout tab) and kept
 * in the D1 settings table:
 *
 *   distance  road km from the yard in Zele per Belgian postcode
 *             (data/be-postcodes.json, scripts/build-delivery-distances.mjs)
 *   bands     "up to N km: € fixed + € per km", the first band that fits counts;
 *             each band can set a minimum order value for delivery (products
 *             incl. btw, without delivery): below it delivery is not offered
 *             and the customer sees how much is missing
 *   max km    further than this (or past the last band): no delivery via the webshop
 *   rules     run top to bottom: when <condition> then <effect>, e.g.
 *             "more than 40 poles: + € 25", "order from € 750: free",
 *             "contains gates: pickup or quote only"
 *   free above / round up to whole euros
 *
 * Pickup in Zele is always free and always possible. Nothing here trusts the browser: the
 * checkout calls deliveryQuote() with the server-priced basket.
 */

import distances from "./data/be-postcodes.json";
import { collections } from "../../src/lib/catalog";
import type { MspMode } from "./msp";

/** `min`: minimum order value (products incl. btw, without delivery) to deliver in this band; null = none. */
export type Band = { upTo: number; price: number; perKm: number; min: number | null };
export const RULE_WHEN = {
  always: "Altijd",
  total_min: "Bestelbedrag vanaf (€)",
  total_max: "Bestelbedrag lager dan (€)",
  km_min: "Afstand vanaf (km)",
  km_max: "Afstand minder dan (km)",
  collection: "Product uit collectie in mandje",
  qty_min: "Aantal stuks vanaf",
} as const;
export const RULE_EFFECT = {
  add: "+ vast bedrag (€)",
  per_km: "+ bedrag per km (€)",
  percent: "+ percentage van de levering (%)",
  discount: "- vast bedrag (€)",
  free: "Gratis levering",
  pickup_only: "Niet leveren (afhalen of offerte)",
} as const;
export type Rule = {
  label: string;
  when: keyof typeof RULE_WHEN;
  value: number;
  /** For "collection" (required) and "qty_min" (optional: count only that collection). */
  collection: string;
  effect: keyof typeof RULE_EFFECT;
  amount: number;
  active: boolean;
};
export type CheckoutSettings = {
  bands: Band[];
  maxKm: number | null;
  freeAbove: number | null;
  roundUp: boolean;
  rules: Rule[];
  mspMode: MspMode;
};

type PostcodeRow = { n: string[]; km: number; est?: 1 };
const POSTCODES = (distances as { postcodes: Record<string, PostcodeRow> }).postcodes;
export const DISTANCE_INFO = { yard: (distances as { yard: { label: string } }).yard.label, about: (distances as { _about: string })._about, count: Object.keys(POSTCODES).length };
export const COLLECTIONS = collections.map((c) => ({ handle: c.handle, title: c.title, products: new Set(c.products) }));

const KEYS = ["delivery_bands", "delivery_max_km", "delivery_free_above", "delivery_round", "delivery_rules", "msp_mode"] as const;

function parseJson<T>(raw: string | undefined, ok: (x: unknown) => x is T): T[] {
  try {
    const v = JSON.parse(raw || "[]") as unknown;
    return Array.isArray(v) ? v.filter(ok) : [];
  } catch {
    return [];
  }
}
const num = (raw: string | undefined) => {
  const n = Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? n : null;
};

export async function getCheckoutSettings(db: D1Database): Promise<CheckoutSettings> {
  const { results } = await db
    .prepare(`SELECT key, value FROM settings WHERE key IN (${KEYS.map(() => "?").join(",")})`)
    .bind(...KEYS)
    .all<{ key: string; value: string }>();
  const v = new Map(results.map((r) => [r.key, r.value]));
  const bands = parseJson(v.get("delivery_bands"), (b): b is Band => {
    const x = b as Band;
    return Boolean(x) && x.upTo > 0 && x.price >= 0 && x.perKm >= 0;
  })
    // Bands saved before the minimum existed have no `min`.
    .map((b) => ({ ...b, min: typeof b.min === "number" && b.min > 0 ? b.min : null }))
    .sort((a, b) => a.upTo - b.upTo);
  const rules = parseJson(v.get("delivery_rules"), (r): r is Rule => {
    const x = r as Rule;
    return Boolean(x) && x.when in RULE_WHEN && x.effect in RULE_EFFECT;
  });
  return {
    bands,
    maxKm: num(v.get("delivery_max_km")),
    freeAbove: num(v.get("delivery_free_above")),
    roundUp: v.get("delivery_round") === "1",
    rules,
    mspMode: v.get("msp_mode") === "live" ? "live" : "test",
  };
}

export async function saveCheckoutSettings(db: D1Database, s: Partial<CheckoutSettings>) {
  const put = (k: string, value: string) => db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value").bind(k, value);
  const stmts: D1PreparedStatement[] = [];
  if (s.bands) stmts.push(put("delivery_bands", JSON.stringify([...s.bands].sort((a, b) => a.upTo - b.upTo))));
  if ("maxKm" in s) stmts.push(put("delivery_max_km", s.maxKm ? String(s.maxKm) : ""));
  if ("freeAbove" in s) stmts.push(put("delivery_free_above", s.freeAbove ? String(s.freeAbove) : ""));
  if ("roundUp" in s) stmts.push(put("delivery_round", s.roundUp ? "1" : ""));
  if (s.rules) stmts.push(put("delivery_rules", JSON.stringify(s.rules)));
  if (s.mspMode) stmts.push(put("msp_mode", s.mspMode));
  if (stmts.length) await db.batch(stmts);
}

export type Basket = { subtotal: number; lines: { handle: string; qty: number }[] };
export type DeliveryQuote =
  | { ok: true; price: number; km: number; place: string; steps: string[]; minimum: number | null }
  /** `minimum`/`short`: only when the order is below the band's minimum for delivery. */
  | { ok: false; reason: string; km?: number; place?: string; steps: string[]; minimum?: number; short?: number };

const euro = (n: number) => `€ ${n.toFixed(2).replace(".", ",")}`;
/** "€200" for whole euros, "€12,50" otherwise (customer-facing messages). */
export const euroShort = (n: number) => `€${Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",")}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Distance and place for a postcode; `city` picks the matching place name when it is one of them. */
export function lookupPostcode(postcode: string, city = ""): { km: number; place: string; places: string[] } | null {
  const pc = postcode.replace(/\s/g, "");
  const row = /^\d{4}$/.test(pc) ? POSTCODES[pc] : undefined;
  if (!row) return null;
  const typed = city.trim().toLowerCase();
  const place = row.n.find((n) => n.toLowerCase() === typed) ?? row.n[0];
  return { km: row.km, place, places: row.n };
}

function matches(rule: Rule, km: number, basket: Basket): boolean {
  const inCollection = (handle: string) => {
    if (!rule.collection) return true;
    return COLLECTIONS.find((c) => c.handle === rule.collection)?.products.has(handle) ?? false;
  };
  switch (rule.when) {
    case "always":
      return true;
    case "total_min":
      return basket.subtotal >= rule.value;
    case "total_max":
      return basket.subtotal < rule.value;
    case "km_min":
      return km >= rule.value;
    case "km_max":
      return km < rule.value;
    case "collection":
      return Boolean(rule.collection) && basket.lines.some((l) => inCollection(l.handle));
    case "qty_min":
      return basket.lines.filter((l) => inCollection(l.handle)).reduce((t, l) => t + l.qty, 0) >= rule.value;
  }
}

export function deliveryQuote(s: CheckoutSettings, postcode: string, city: string, basket: Basket): DeliveryQuote {
  const steps: string[] = [];
  const where = lookupPostcode(postcode, city);
  if (!where) return { ok: false, reason: "Onbekende Belgische postcode.", steps };
  const { km, place } = where;
  steps.push(`${postcode} ${place}: ${km.toLocaleString("nl-BE")} km vanaf Zele`);
  const quoteOnly = (reason: string) => ({ ok: false as const, reason, km, place, steps });
  if (!s.bands.length) return quoteOnly("Levering via de webshop is nog niet ingesteld.");
  if (s.maxKm !== null && km > s.maxKm) return quoteOnly(`Dat is verder dan ${s.maxKm} km.`);
  const band = s.bands.find((b) => km <= b.upTo);
  if (!band) return quoteOnly(`Dat is verder dan ${s.bands[s.bands.length - 1].upTo} km.`);
  if (band.min !== null && basket.subtotal < band.min) {
    const short = round2(band.min - basket.subtotal);
    steps.push(`Minimum bestelbedrag voor levering tot ${band.upTo} km: ${euro(band.min)}, nog ${euro(short)} te gaan: geen levering`);
    return {
      ok: false,
      reason: `Nog ${euroShort(short)} bijbestellen voor levering naar ${postcode} ${place}. Levering op deze afstand kan vanaf ${euroShort(band.min)}. Afhalen in Zele kan altijd.`,
      km,
      place,
      steps,
      minimum: band.min,
      short,
    };
  }
  if (band.min !== null) steps.push(`Minimum bestelbedrag voor levering tot ${band.upTo} km: ${euro(band.min)} (gehaald)`);
  let price = band.price + band.perKm * km;
  steps.push(`Schijf tot ${band.upTo} km: ${euro(band.price)}${band.perKm ? ` + ${euro(band.perKm)} × ${String(km).replace(".", ",")} km` : ""} = ${euro(round2(price))}`);

  for (const rule of s.rules) {
    if (!rule.active || !matches(rule, km, basket)) continue;
    const name = rule.label || RULE_EFFECT[rule.effect];
    if (rule.effect === "pickup_only") {
      steps.push(`Regel "${name}": niet leveren`);
      return quoteOnly(rule.label || "Deze bestelling leveren we niet via de webshop.");
    }
    if (rule.effect === "free") {
      price = 0;
      steps.push(`Regel "${name}": gratis`);
      break;
    }
    const before = price;
    if (rule.effect === "add") price += rule.amount;
    if (rule.effect === "per_km") price += rule.amount * km;
    if (rule.effect === "percent") price += (price * rule.amount) / 100;
    if (rule.effect === "discount") price -= rule.amount;
    steps.push(`Regel "${name}": ${euro(round2(before))} → ${euro(round2(Math.max(0, price)))}`);
  }
  if (s.freeAbove !== null && basket.subtotal >= s.freeAbove && price > 0) {
    price = 0;
    steps.push(`Bestelling vanaf ${euro(s.freeAbove)}: gratis levering`);
  }
  price = Math.max(0, round2(price));
  if (s.roundUp && price % 1) {
    price = Math.ceil(price);
    steps.push(`Afgerond naar ${euro(price)}`);
  }
  return { ok: true, price, km, place, steps, minimum: band.min };
}
