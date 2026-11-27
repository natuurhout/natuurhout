/*
 * Time-limited deals (Xander, 27 Nov 2026): a percentage off some products,
 * more from an amount, for a fixed period. Applied after the staffelprijzen in
 * the winkelmandje, /afrekenen/ and the Worker (checkout and order requests),
 * so every total agrees; shown by DealBanner and on /aanbiedingen-2/ only
 * while it runs (checked in the browser, so it switches off on time without
 * a new build). Never on delivery. Prices incl. btw.
 */

export type Deal = {
  id: string;
  name: string;
  /** Product handles the deal is on. */
  handles: string[];
  /** Start and end (end exclusive), as ISO times with the Belgian offset. */
  from: string;
  until: string;
  percent: number;
  /** A higher percentage once the deal products in an order reach `threshold` (before discount). */
  bigPercent: number;
  threshold: number;
  /** Where the banner links to. */
  href: string;
  /** Small print. */
  terms: string;
};

/** Black Friday weekend: hazelaar hekwerk and poorten, 5%, 7% from € 350, until Sunday 29 Nov 2026 midnight. */
export const BLACK_FRIDAY_HAZELAAR: Deal = {
  id: "black-friday-hazelaar-2026",
  name: "Black Friday hazelaar deal",
  handles: ["hazelaar-hekwerk", "hazelaar-poort"],
  from: "2026-11-27T00:00:00+01:00",
  until: "2026-11-30T00:00:00+01:00",
  percent: 5,
  bigPercent: 7,
  threshold: 350,
  href: "/aanbiedingen-2/#black-friday",
  terms:
    "Actie geldig t.e.m. zondag 29 november 2026 (23:59) op hazelaar hekwerk en hazelaar poorten: 5% korting, 7% vanaf € 350 aan hazelaar hekwerk en poorten in één bestelling (incl. btw, vóór korting). Niet op leveringskosten, niet cumuleerbaar met andere promo's. De korting staat in het winkelmandje en bij het afrekenen.",
};

export const DEALS: Deal[] = [BLACK_FRIDAY_HAZELAAR];

export const dealRunning = (deal: Deal, now = Date.now()) => now >= Date.parse(deal.from) && now < Date.parse(deal.until);

/** The deal running now for this product, if any. */
export const dealFor = (handle: string, now = Date.now()) => DEALS.find((d) => d.handles.includes(handle) && dealRunning(d, now)) ?? null;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** The percentage that applies to these lines for a running deal (0 when none of them is in it). */
export function dealPercent(deal: Deal, lines: { handle: string; qty: number; unit: number }[], now = Date.now()): number {
  if (!dealRunning(deal, now)) return 0;
  const total = lines.filter((l) => deal.handles.includes(l.handle)).reduce((t, l) => t + l.qty * l.unit, 0);
  if (total <= 0) return 0;
  return total >= deal.threshold ? deal.bigPercent : deal.percent;
}

/**
 * Lines with the deal price applied (unit, rounded to the cent), with the
 * price they had (dealWas) and the percentage (deal) where it changed.
 */
export function withDealPrices<T extends { handle: string; qty: number; unit: number }>(lines: T[], now = Date.now()): (T & { dealWas?: number; deal?: number })[] {
  let out: (T & { dealWas?: number; deal?: number })[] = lines;
  for (const deal of DEALS) {
    const percent = dealPercent(deal, out, now);
    if (!percent) continue;
    out = out.map((l) => (deal.handles.includes(l.handle) && l.dealWas === undefined ? { ...l, unit: round2(l.unit * (1 - percent / 100)), dealWas: l.unit, deal: percent } : l));
  }
  return out;
}

/** Label suffix for an order line with a deal price. */
export const dealLabel = (percent: number) => `(Black Friday −${percent}%)`;
