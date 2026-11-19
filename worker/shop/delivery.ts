/*
 * Delivery for the checkout, set in the backend (Checkout tab) and kept in
 * the D1 settings table:
 *
 *   distance  road km from the yard in Zele per Belgian postcode
 *             (data/be-postcodes.json, scripts/build-delivery-distances.mjs)
 *   bands     "up to N km: € fixed (+ € per km)", the first band that fits counts
 *   max km    further than this (or past the last band): no delivery, pickup only
 *   minimums  minimum order value per distance (products incl. btw, without
 *             delivery): below it no delivery, and how much is missing
 *   regions   postcode from–to: correction in € on the band price
 *   rules     run top to bottom: when <condition> then <effect>
 *   free above / minimum delivery price / round up to whole euros
 *
 * The calculation itself is delivery-price.ts (pure, tested by `npm test`).
 * Pickup in Zele is always free and always possible. Nothing here trusts the
 * browser: the checkout calls deliveryQuote() with the server-priced basket.
 */

import distances from "./data/be-postcodes.json";
import { collections } from "../../src/lib/catalog";
import type { MspMode } from "./msp";
import { priceDelivery, RULE_EFFECT, RULE_WHEN, type Band, type Basket, type DeliveryQuote, type MinBand, type PriceSettings, type Region, type Rule } from "./delivery-price";

export { RULE_EFFECT, RULE_WHEN, euroShort } from "./delivery-price";
export type { Band, Basket, DeliveryQuote, MinBand, Region, Rule } from "./delivery-price";

export type CheckoutSettings = PriceSettings & { mspMode: MspMode };

type PostcodeRow = { n: string[]; km: number; est?: 1 };
const POSTCODES = (distances as { postcodes: Record<string, PostcodeRow> }).postcodes;
export const DISTANCE_INFO = { yard: (distances as { yard: { label: string } }).yard.label, about: (distances as { _about: string })._about, count: Object.keys(POSTCODES).length };
export const COLLECTIONS = collections.map((c) => ({ handle: c.handle, title: c.title, products: new Set(c.products) }));

const KEYS = [
  "delivery_bands",
  "delivery_max_km",
  "delivery_free_above",
  "delivery_round",
  "delivery_rules",
  "delivery_min_bands",
  "delivery_regions",
  "delivery_min_price",
  "msp_mode",
] as const;

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
    return Boolean(x) && x.upTo > 0 && x.price >= 0 && (x.perKm ?? 0) >= 0;
  })
    .map((b) => ({ upTo: b.upTo, price: b.price, perKm: b.perKm || 0 }))
    .sort((a, b) => a.upTo - b.upTo);
  const rules = parseJson(v.get("delivery_rules"), (r): r is Rule => {
    const x = r as Rule;
    return Boolean(x) && x.when in RULE_WHEN && x.effect in RULE_EFFECT;
  });
  const minimums = parseJson(v.get("delivery_min_bands"), (m): m is MinBand => {
    const x = m as MinBand;
    return Boolean(x) && x.upTo > 0 && x.min >= 0;
  }).sort((a, b) => a.upTo - b.upTo);
  const regions = parseJson(v.get("delivery_regions"), (r): r is Region => {
    const x = r as Region;
    return Boolean(x) && Number.isInteger(x.from) && Number.isInteger(x.to) && x.from <= x.to && Number.isFinite(x.amount);
  });
  return {
    bands,
    maxKm: num(v.get("delivery_max_km")),
    freeAbove: num(v.get("delivery_free_above")),
    roundUp: v.get("delivery_round") === "1",
    rules,
    minimums,
    regions,
    minPrice: num(v.get("delivery_min_price")),
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
  if (s.minimums) stmts.push(put("delivery_min_bands", JSON.stringify([...s.minimums].sort((a, b) => a.upTo - b.upTo))));
  if (s.regions) stmts.push(put("delivery_regions", JSON.stringify(s.regions)));
  if ("minPrice" in s) stmts.push(put("delivery_min_price", s.minPrice ? String(s.minPrice) : ""));
  if (s.mspMode) stmts.push(put("msp_mode", s.mspMode));
  if (stmts.length) await db.batch(stmts);
}

/** Distance and place for a postcode; `city` picks the matching place name when it is one of them. */
export function lookupPostcode(postcode: string, city = ""): { km: number; place: string; places: string[] } | null {
  const pc = postcode.replace(/\s/g, "");
  const row = /^\d{4}$/.test(pc) ? POSTCODES[pc] : undefined;
  if (!row) return null;
  const typed = city.trim().toLowerCase();
  // Several places share a postcode (8000: Koolkerke, Brugge): name one only
  // when it is the only one or the customer typed it, never a guess.
  const place = row.n.find((n) => n.toLowerCase() === typed) ?? (row.n.length === 1 ? row.n[0] : "");
  return { km: row.km, place, places: row.n };
}

const inCollection = (collection: string, handle: string) => COLLECTIONS.find((c) => c.handle === collection)?.products.has(handle) ?? false;

export function deliveryQuote(s: CheckoutSettings, postcode: string, city: string, basket: Basket): DeliveryQuote {
  const pc = postcode.replace(/\s/g, "");
  const where = lookupPostcode(pc, city);
  if (!where) return { ok: false, reason: "Onbekende Belgische postcode.", steps: [] };
  return priceDelivery(s, { postcode: pc, place: where.place, km: where.km }, basket, inCollection);
}
