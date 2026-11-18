/*
 * Checkout settings, edited in the backend (Instellingen → Levering en online
 * betalen) and kept in the D1 settings table next to the shop settings:
 *   delivery_zones       JSON [{from, to, price, label}] on Belgian postcodes
 *   delivery_free_above  order total (incl. btw) from which delivery is free
 *   msp_mode             'test' | 'live' (which MultiSafepay key checkout uses)
 * A postcode outside every zone cannot be delivered through the checkout:
 * the customer picks it up in Zele or asks for a quote.
 */

import type { MspMode } from "./msp";

export type Zone = { from: number; to: number; price: number; label: string };
export type CheckoutSettings = { zones: Zone[]; freeAbove: number | null; mspMode: MspMode };

const KEYS = ["delivery_zones", "delivery_free_above", "msp_mode"] as const;

export async function getCheckoutSettings(db: D1Database): Promise<CheckoutSettings> {
  const { results } = await db
    .prepare(`SELECT key, value FROM settings WHERE key IN (${KEYS.map(() => "?").join(",")})`)
    .bind(...KEYS)
    .all<{ key: string; value: string }>();
  const v = new Map(results.map((r) => [r.key, r.value]));
  let zones: Zone[] = [];
  try {
    const parsed = JSON.parse(v.get("delivery_zones") || "[]") as unknown;
    if (Array.isArray(parsed))
      zones = parsed.filter(
        (z): z is Zone => z && Number.isInteger(z.from) && Number.isInteger(z.to) && typeof z.price === "number" && z.price >= 0 && z.from <= z.to,
      );
  } catch {
    zones = [];
  }
  const free = Number(v.get("delivery_free_above"));
  return { zones, freeAbove: Number.isFinite(free) && free > 0 ? free : null, mspMode: v.get("msp_mode") === "live" ? "live" : "test" };
}

export async function saveCheckoutSettings(db: D1Database, s: CheckoutSettings) {
  const put = (k: string, value: string) => db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value").bind(k, value);
  await db.batch([put("delivery_zones", JSON.stringify(s.zones)), put("delivery_free_above", s.freeAbove ? String(s.freeAbove) : ""), put("msp_mode", s.mspMode)]);
}

/** Delivery price for a Belgian postcode, or null when the checkout cannot deliver there. */
export function deliveryFee(s: CheckoutSettings, postcode: string, subtotal: number): { price: number; label: string } | null {
  const pc = Number(postcode.replace(/\D/g, ""));
  if (!/^\d{4}$/.test(postcode.replace(/\D/g, ""))) return null;
  const zone = s.zones.find((z) => pc >= z.from && pc <= z.to);
  if (!zone) return null;
  if (s.freeAbove !== null && subtotal >= s.freeAbove) return { price: 0, label: zone.label };
  return { price: zone.price, label: zone.label };
}
