import type { Product, ProductVariant } from "@/lib/catalog";

/*
 * Tools Natuurhout rents out (Xander, Nov 2026): one extra choice on the
 * product's price list, €60 = €10 rent + €50 deposit, paid together; the
 * deposit is paid back when the tool comes back. Not in the webshop: the
 * variants have negative ids (like the website products), but they are in the
 * catalogue, so cart, backend order and checkout price them like any other.
 */

const rent = (id: number, what: string): ProductVariant => ({
  id,
  title: `Huren: ${what} (€10 huur + €50 borg)`,
  price: "60.00",
  compare_at: null,
  available: true,
});

export const RENTALS: Record<string, { variant: ProductVariant; tool: string }> = {
  grondboor: { variant: rent(-900101, "grondboor ø7,5 of ø9 cm"), tool: "grondboor" },
  // Only the rubber one, not the wooden one.
  "tuin-voorhamer": { variant: rent(-900102, "rubberen slaghamer"), tool: "slaghamer" },
};

/** The line under the price list. */
export const rentNote = (handle: string): string | null => {
  const rental = RENTALS[handle];
  return rental ? `Huren: u betaalt €60, dat is €10 huur en €50 borg. De borg krijgt u terug als u de ${rental.tool} terugbrengt.` : null;
};

export function withRentals<P extends Product>(products: P[]): P[] {
  return products.map((product) => {
    const rental = RENTALS[product.handle];
    if (!rental || product.variants.some((variant) => variant.id === rental.variant.id)) return product;
    const variants = [...product.variants, rental.variant];
    const prices = variants.map((variant) => parseFloat(variant.price)).filter((n) => Number.isFinite(n));
    return { ...product, variants, priceFrom: Math.min(...prices).toFixed(2), priceTo: Math.max(...prices).toFixed(2) };
  });
}
