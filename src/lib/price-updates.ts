import type { Product } from "@/lib/catalog";

/*
 * Prices Natuurhout changed after the webshop data was copied (Xander,
 * Oct 2026: new postsaver price list). Set on top of the shop data, like the
 * promotions; client-safe (no catalogue import). Orders are paid on
 * natuurhout.shop, so the same prices must be set there too.
 */

type PricedVariant = { title: string; price: string };
type PricedProduct<V extends PricedVariant> = { handle: string; variants: V[]; priceFrom: string | null; priceTo: string | null };

/** New prices by product handle and exact variant title. */
const VARIANT_PRICES: Record<string, Record<string, string>> = {
  // "Postsavers paal (rond)": kastanje paal met postsaver, by length and diameter.
  "kastanje-palen-copy": {
    "6-8cm / 120cm": "11.50",
    "6-8cm / 150cm": "12.50",
    "6-8cm / 180cm": "13.50",
    "6-8cm / 200cm": "14.00",
    "6-8cm / 250cm": "16.00",
    "6-8cm / 300cm": "19.00",
    "8-10cm / 120cm": "13.50",
    "8-10cm / 150cm": "14.50",
    "8-10cm / 180cm": "16.50",
    "8-10cm / 200cm": "16.50",
    "8-10cm / 250cm": "19.50",
    "8-10cm / 300cm": "21.00",
  },
  // Losse sleeves: Postsaver 02 (ø6-8), 004 (ø8-10) and 045 (120 mm).
  "kastanje-paal-met-postsaver": {
    "Postsaver ronde paal ø6-8cm": "3.95",
    "Postsaver ronde paal ø8-10cm": "4.75",
    "Postsaver ronde paal ø10-12cm": "4.95",
  },
};

/** Variant names Natuurhout changed, by product handle and shop title. */
const VARIANT_TITLES: Record<string, Record<string, string>> = {
  "kastanje-paal-met-postsaver": { "Losse rol 5m - alle maten": "Wrap & Tack rol 5 m - alle maten" },
};

/** Fitting a postsaver, per post, on top of the sleeve. */
export const POSTSAVER_FITTING = 5;

/**
 * Eiken palen with a postsaver fitted by Natuurhout, by "<length>cm / <dikte>"
 * as in the shop's variant titles. Not a webshop item: ordered on request.
 */
export const OAK_WITH_POSTSAVER: Record<string, number> = {
  "200cm / 10x10": 63,
  "200cm / 12.5x12.5": 80,
  "200cm / 15x15": 112,
  "250cm / 10x10": 73,
  "250cm / 12.5x12.5": 107,
  "250cm / 15x15": 135,
};

/** Applies the new prices, keeping each product's price range in step. */
export function withPriceUpdates<V extends PricedVariant, P extends PricedProduct<V>>(products: P[]): P[] {
  return products.map((product) => {
    const prices = VARIANT_PRICES[product.handle] ?? {};
    const titles = VARIANT_TITLES[product.handle] ?? {};
    if (!VARIANT_PRICES[product.handle] && !VARIANT_TITLES[product.handle]) return product;
    const variants = product.variants.map((variant) => ({
      ...variant,
      ...(variant.title in prices && { price: prices[variant.title] }),
      ...(variant.title in titles && { title: titles[variant.title] }),
    }));
    const amounts = variants.map((variant) => parseFloat(variant.price)).filter((n) => Number.isFinite(n));
    return {
      ...product,
      variants,
      priceFrom: amounts.length ? Math.min(...amounts).toFixed(2) : product.priceFrom,
      priceTo: amounts.length ? Math.max(...amounts).toFixed(2) : product.priceTo,
    };
  });
}

/** Handle of the request-only price list "Eiken palen met postsaver". */
export const OAK_WITH_POSTSAVER_HANDLE = "eiken-palen-met-postsaver";

/**
 * The oak price list with a postsaver fitted, as a price list of its own next
 * to the webshop's eiken palen. Not in the webshop, so every row is ordered
 * on request (negative ids keep them apart from shop variants).
 */
export function oakWithPostsaver(oak: Product): Product | null {
  const variants = oak.variants.flatMap((variant) => {
    const price = OAK_WITH_POSTSAVER[variant.title];
    return price === undefined
      ? []
      : [{ id: -variant.id, title: variant.title, price: price.toFixed(2), compare_at: null, available: false }];
  });
  if (!variants.length) return null;
  const prices = variants.map((variant) => parseFloat(variant.price));
  return {
    ...oak,
    handle: OAK_WITH_POSTSAVER_HANDLE,
    title: "Eiken palen met postsaver (aangebracht door Natuurhout)",
    variants,
    priceFrom: Math.min(...prices).toFixed(2),
    priceTo: Math.max(...prices).toFixed(2),
    available: false,
    promo: false,
    sale: false,
  };
}
