/*
 * The most of one product a customer can order online (all its variants
 * together). Above it the order goes by mail: Natuurhout checks what there is
 * first (Xander, Nov 2026). Checked by the Worker at checkout
 * (worker/shop/checkout.ts). Client-safe: no catalogue import.
 *
 * Counted stock is not a limit (Xander, Nov 2026): more can be ordered, the
 * price list, winkelmandje and order say how many are in stock and that the
 * rest is in nabestelling and comes with the next freight (backorderNote).
 */

export const ORDER_LIMITS: Record<string, { max: number; what: string }> = {
  palen: { max: 300, what: "kastanjepalen" },
};

/** The message for a basket over a limit, or null. */
export function overLimit(lines: { handle: string; qty: number }[]): string | null {
  const totals = new Map<string, number>();
  for (const l of lines) totals.set(l.handle, (totals.get(l.handle) ?? 0) + l.qty);
  for (const [handle, qty] of totals) {
    const limit = ORDER_LIMITS[handle];
    if (limit && qty > limit.max) {
      return `Meer dan ${limit.max} ${limit.what} bestelt u per mail (info@natuurhout.be) of met het bestelformulier in uw winkelmandje: dan kijken we eerst wat er op voorraad is.`;
    }
  }
  return null;
}

/** How much of a line is in stock and how much is ordered after (nabestelling), or null when all is in stock / not counted. */
export function backorder(stock: number | null | undefined, qty: number): { inStock: number; later: number } | null {
  if (stock === null || stock === undefined || stock <= 0 || qty <= stock) return null;
  return { inStock: stock, later: qty - stock };
}

/** Under a price list row or basket line that asks more than the counted stock. */
export function backorderNote(stock: number | null | undefined, qty: number, later?: string): string | null {
  const b = backorder(stock, qty);
  if (!b) return null;
  // `later`: the product's own wording (src/lib/made-to-order.ts), e.g. hazelaar from Ukraine.
  return `Nog ${b.inStock} op voorraad. De overige ${b.later} zijn in nabestelling: ${later ?? "die komen mee met de volgende vracht (normaal binnen 4 à 5 weken)."} Liever eerst weten wanneer? Mail info@natuurhout.be.`;
}
