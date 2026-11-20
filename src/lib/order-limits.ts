/*
 * The most of one product a customer can order online (all its variants
 * together). Above it the order goes by mail: Natuurhout checks what there is
 * first (Xander, Nov 2026). Checked by the Worker at checkout
 * (worker/shop/checkout.ts). Client-safe: no catalogue import.
 *
 * Counted stock is a limit too: the winkelmandje lowers a line to what is in
 * stock and says so (stockNote), and checkout refuses more (overStock). A
 * variant with 0 counted stays orderable as "op bestelling".
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

/** Under a basket line that was lowered to the stock. */
export const stockNote = (stock: number) =>
  `Dit is onze volledige voorraad (${stock} ${stock === 1 ? "stuk" : "stuks"}). Meer nodig? Mail ons op info@natuurhout.be: dan laten we u weten wanneer de volgende vracht binnenkomt.`;

/** The message for a line above its counted stock, or null. Stock 0 is "op bestelling" and allowed. */
export function overStock(lines: { product: string; label: string; qty: number; stock: number | null }[]): string | null {
  const line = lines.find((l) => l.stock !== null && l.stock > 0 && l.qty > l.stock);
  if (!line) return null;
  const name = line.label && line.label !== line.product ? `${line.product} (${line.label})` : line.product;
  return `Van ${name} hebben we nog ${line.stock} op voorraad. Pas het aantal aan in uw winkelmandje, of mail ons op info@natuurhout.be: dan laten we u weten wanneer de volgende vracht binnenkomt.`;
}
