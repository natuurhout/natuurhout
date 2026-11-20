import { CUSTOM_GATE_HEIGHTS, CUSTOM_GATE_TABLE } from "@/lib/calculator-pricing";
import type { Product, ProductVariant } from "@/lib/catalog";

/*
 * Products that can be ordered and paid (winkelmandje, /afrekenen/) but have
 * no page of their own in /shop/ (Xander, Nov 2026). The Worker's catalogue
 * holds them next to the webshop's (worker/shop/catalog.ts), so checkout
 * prices them from their id like any other variant.
 *
 * - Kastanje premium maatwerkpoort: the price table of /project/maatwerk-poorten/
 *   (and the calculator), made to measure in about 2 weeks.
 * - Postsavers fitted by Natuurhout (calculator), ready in about 3 days:
 *   built in src/lib/fitted-postsavers.ts, which needs the calculator data.
 * - Eiken palen met postsaver: src/lib/price-updates.ts (oakWithPostsaver).
 */

export const MAATWERK_POORT_HANDLE = "maatwerk-poort";

/** The variant id of a size of the table: -1 … -24. */
export function customGateVariantId(width: number, height: number): number | null {
  const r = CUSTOM_GATE_TABLE.findIndex((row) => row.width === width);
  const h = CUSTOM_GATE_HEIGHTS.indexOf(height);
  return r < 0 || h < 0 ? null : -(r * CUSTOM_GATE_HEIGHTS.length + h + 1);
}

const maatwerkVariants: ProductVariant[] = CUSTOM_GATE_TABLE.flatMap((row) =>
  CUSTOM_GATE_HEIGHTS.map((height, h) => ({
    id: customGateVariantId(row.width, height)!,
    title: `${row.width}cm / ${height}cm`,
    price: row.prices[h].toFixed(2),
    compare_at: null,
    available: false,
  })),
);

export const MAATWERK_POORT: Product = {
  handle: MAATWERK_POORT_HANDLE,
  title: "Kastanje premium maatwerkpoort",
  bodyHtml: "",
  options: ["Breedte", "Hoogte"],
  images: [],
  variants: maatwerkVariants,
  priceFrom: null,
  priceTo: null,
  available: false,
  tags: [],
  shopUrl: "/project/maatwerk-poorten/",
  publishedAt: null,
};
