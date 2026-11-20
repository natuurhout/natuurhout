/*
 * The most of one product a customer can order online (all its variants
 * together). Above it the order goes by mail: Natuurhout checks what there is
 * first (Xander, Nov 2026). Checked by the Worker at checkout
 * (worker/shop/checkout.ts). Client-safe: no catalogue import.
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
