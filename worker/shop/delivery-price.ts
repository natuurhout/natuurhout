/*
 * The delivery price itself, without settings storage, postcode data or the
 * catalogue: given the settings, where the customer is (postcode, place,
 * road km from the yard in Zele) and the basket, what does delivery cost, or
 * why is there none. Pure, so `npm test` runs it directly
 * (delivery-price.test.ts); worker/shop/delivery.ts wraps it.
 *
 * Order of the calculation:
 *   1. distance: past the maximum or the last band → no delivery (pickup only)
 *   2. minimum order value for the distance (products incl. btw, without
 *      delivery): below it → no delivery, with how much is missing
 *   3. band price (+ € per km) + region correction on the postcode
 *   4. rules, top to bottom (surcharges, discounts, free, pickup only)
 *   5. free delivery above an order value: wins over everything above
 *   6. never below the minimum delivery price (unless free), rounding
 * The customer only sees the end price; the steps are for the backend tester.
 */

export type Band = { upTo: number; price: number; perKm: number };
/** Minimum order value to deliver up to `upTo` km (0 = none). */
export type MinBand = { upTo: number; min: number };
/** Added to the band price for postcodes `from`–`to` (may be negative). */
export type Region = { from: number; to: number; amount: number; label: string };

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

export type PriceSettings = {
  bands: Band[];
  maxKm: number | null;
  freeAbove: number | null;
  roundUp: boolean;
  rules: Rule[];
  minimums: MinBand[];
  regions: Region[];
  /** Delivery never costs less than this (unless free); null = no floor. */
  minPrice: number | null;
};

export type Basket = { subtotal: number; lines: { handle: string; qty: number }[] };
export type Where = { postcode: string; place: string; km: number };
export type DeliveryQuote =
  | { ok: true; price: number; km: number; place: string; steps: string[]; minimum: number | null }
  /**
   * `minimum`/`short`: only when the order is below the minimum for this distance;
   * `atMinimum`: what delivery would cost once the order reaches that minimum.
   */
  | { ok: false; reason: string; km?: number; place?: string; steps: string[]; minimum?: number; short?: number; atMinimum?: number };

/** Is a product (handle) in a collection? Supplied by the caller (catalogue). */
export type InCollection = (collection: string, handle: string) => boolean;

const euro = (n: number) => `€ ${n.toFixed(2).replace(".", ",")}`;
const round2 = (n: number) => Math.round(n * 100) / 100;
/** "€200" for whole euros, "€12,50" otherwise (customer-facing messages). */
export const euroShort = (n: number) => `€${Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",")}`;
const signed = (n: number) => `${n < 0 ? "−" : "+"} ${euro(Math.abs(n))}`;

/** The minimum order value for delivery at this distance (null: none). */
export function minimumFor(s: Pick<PriceSettings, "minimums">, km: number): number | null {
  const row = [...s.minimums].sort((a, b) => a.upTo - b.upTo).find((m) => km <= m.upTo);
  return row && row.min > 0 ? row.min : null;
}

/** The region correction for a postcode (the first row that covers it), or null. */
export function regionFor(s: Pick<PriceSettings, "regions">, postcode: string): Region | null {
  const pc = Number(postcode);
  if (!Number.isInteger(pc)) return null;
  return s.regions.find((r) => pc >= r.from && pc <= r.to) ?? null;
}

function matches(rule: Rule, km: number, basket: Basket, inCollection: InCollection): boolean {
  const counts = (handle: string) => !rule.collection || inCollection(rule.collection, handle);
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
      return Boolean(rule.collection) && basket.lines.some((l) => counts(l.handle));
    case "qty_min":
      return basket.lines.filter((l) => counts(l.handle)).reduce((t, l) => t + l.qty, 0) >= rule.value;
  }
}

export function priceDelivery(s: PriceSettings, where: Where, basket: Basket, inCollection: InCollection = () => false): DeliveryQuote {
  const { postcode, place, km } = where;
  const at = place ? `${postcode} ${place}` : postcode;
  const steps: string[] = [`${at}: ${km.toLocaleString("nl-BE")} km vanaf Zele`];
  const pickupOnly = (reason: string) => ({ ok: false as const, reason, km, place, steps });
  const bands = [...s.bands].sort((a, b) => a.upTo - b.upTo);
  if (!bands.length) return pickupOnly("Levering via de webshop is nog niet ingesteld.");
  const reach = s.maxKm ?? bands[bands.length - 1].upTo;
  const band = km <= reach ? bands.find((b) => km <= b.upTo) : undefined;
  if (!band) {
    steps.push(`Verder dan ${reach} km: geen levering`);
    return pickupOnly(`We leveren tot ${reach} km van Zele; ${at} ligt op ${Math.round(km)} km. Afhalen in Zele kan altijd.`);
  }

  // 2. Minimum order value for this distance.
  const minimum = minimumFor(s, km);
  if (minimum !== null && basket.subtotal < minimum) {
    const short = round2(minimum - basket.subtotal);
    steps.push(`Minimum bestelbedrag voor levering op ${km.toLocaleString("nl-BE")} km: ${euro(minimum)}, nog ${euro(short)} te gaan: geen levering`);
    // The same basket at the minimum: what delivery would cost then.
    const then = priceDelivery(s, where, { ...basket, subtotal: minimum }, inCollection);
    const atMinimum = then.ok ? then.price : undefined;
    if (atMinimum !== undefined) steps.push(`Bij ${euro(minimum)} zou levering ${atMinimum === 0 ? "gratis zijn" : `${euro(atMinimum)} kosten`}`);
    const cost = atMinimum === undefined ? "" : atMinimum === 0 ? " en is dan gratis" : ` en kost dan ${euroShort(atMinimum)}`;
    return {
      ok: false,
      reason: `Nog ${euroShort(short)} bijbestellen voor levering naar ${at}. Levering op deze afstand kan vanaf ${euroShort(minimum)}${cost}. Afhalen in Zele kan altijd.`,
      km,
      place,
      steps,
      minimum,
      short,
      atMinimum,
    };
  }
  if (minimum !== null) steps.push(`Minimum bestelbedrag voor levering: ${euro(minimum)} (gehaald)`);

  // 3. Band + region.
  let price = band.price + band.perKm * km;
  steps.push(`Schijf tot ${band.upTo} km: ${euro(band.price)}${band.perKm ? ` + ${euro(band.perKm)} × ${String(km).replace(".", ",")} km` : ""} = ${euro(round2(price))}`);
  const region = regionFor(s, postcode);
  if (region && region.amount) {
    price += region.amount;
    steps.push(`Regio ${region.label || `${region.from}–${region.to}`}: ${signed(region.amount)} = ${euro(round2(price))}`);
  }

  // 4. Rules.
  let free = false;
  for (const rule of s.rules) {
    if (!rule.active || !matches(rule, km, basket, inCollection)) continue;
    const name = rule.label || RULE_EFFECT[rule.effect];
    if (rule.effect === "pickup_only") {
      steps.push(`Regel "${name}": niet leveren`);
      return pickupOnly(rule.label || "Deze bestelling leveren we niet via de webshop.");
    }
    if (rule.effect === "free") {
      free = true;
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

  // 5. Free above an order value: wins over band, region and rules.
  if (!free && s.freeAbove !== null && basket.subtotal >= s.freeAbove) {
    free = true;
    steps.push(`Bestelling vanaf ${euro(s.freeAbove)}: gratis levering`);
  }
  if (free) return { ok: true, price: 0, km, place, steps, minimum };

  // 6. Floor and rounding.
  price = Math.max(0, round2(price));
  if (s.minPrice !== null && price < s.minPrice) {
    steps.push(`Nooit onder ${euro(s.minPrice)}: ${euro(price)} → ${euro(s.minPrice)}`);
    price = s.minPrice;
  }
  if (s.roundUp && price % 1) {
    price = Math.ceil(price);
    steps.push(`Afgerond naar ${euro(price)}`);
  }
  return { ok: true, price, km, place, steps, minimum };
}
