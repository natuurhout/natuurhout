import type { Collection, Product, ProductVariant } from "@/lib/catalog";

/*
 * Natuurhout's promotions, set on top of the webshop data (Xander, Oct 2026).
 * The copied shop data stays as it is; this file says what is on promotion
 * on the website. Prices themselves always come from the webshop, where
 * orders are paid.
 */

/** The shop collection whose page section lists the promotions. */
export const PROMO_COLLECTION = "promos";

/**
 * Promotions that are over: no strike-through price or percentage any more,
 * and the product moves from the promo collection to its own collection.
 * `null`: listed in no collection on /shop/ (Xander: only kastanje, hazelaar
 * and robinia hekwerk in Rasterwerk, not the grey rolls); the product pages
 * stay.
 */
const ENDED: Record<string, string | null> = {
  "kastanje-hekwerk-1-50m": null,
  "kastanje-hekwerk-1-00m-4-5cm-4-20m-lengte": null,
  "kastanje-hekwerk-100cm-4-5cm": null,
  "kastanje-hekwerk-100cm-7-9cm": null,
  "kastanje-kaderpoort": "poorten",
  "hazelaar-vlechtscherm-80cm-hoog-x-150cm-breed": "vlechtschermen",
};

type Promotion = {
  handle: string;
  /** Variants (by title) that are on promotion. */
  variants: RegExp;
  /** Card title in the promo section. */
  title: string;
  /** Normal price, shown struck through, when Natuurhout gave one. */
  normalPrice?: string;
};

const CURRENT: Promotion[] = [
  { handle: "kastanje-rasterwerk", variants: /^60cm \//, title: "Kastanje hekwerk 60cm – rollen" },
  { handle: "tuinbakken-hazelaar", variants: /^120cm x 120cm x 60cm$/, title: "Tuinbak hazelaar 120 x 120 x 60 cm", normalPrice: "77.00" },
];

function onPromotion(product: Product, variant: ProductVariant) {
  return CURRENT.find((promo) => promo.handle === product.handle && promo.variants.test(variant.title));
}

/** Applies the promotions to the catalogue's products. */
export function withPromotions(products: Product[]): Product[] {
  return products.map((product) => {
    const ended = product.handle in ENDED;
    if (!ended && !CURRENT.some((promo) => promo.handle === product.handle)) return product;
    return {
      ...product,
      variants: product.variants.map((variant) => {
        if (ended) return { ...variant, compare_at: null };
        const promo = onPromotion(product, variant);
        if (!promo) return variant;
        return { ...variant, promo: true, compare_at: promo.normalPrice ?? null };
      }),
    };
  });
}

/** Ended promotions kept out of the /shop/ collection lists. */
export const UNLISTED = new Set(Object.keys(ENDED).filter((handle) => ENDED[handle] === null));

/** Moves ended promotions out of the promo collection into their own. */
export function withPromotionCollections(collections: Collection[]): Collection[] {
  return collections.map((collection) => {
    if (collection.handle === PROMO_COLLECTION) {
      return { ...collection, products: collection.products.filter((handle) => !(handle in ENDED)) };
    }
    const moved = Object.entries(ENDED)
      .filter(([handle, target]) => target === collection.handle && !collection.products.includes(handle))
      .map(([handle]) => handle);
    return moved.length ? { ...collection, products: [...collection.products, ...moved] } : collection;
  });
}

/**
 * The promo section's cards: one per promotion, showing only the variants
 * on promotion (the card links to the full product page).
 */
export function promotionCards(getProduct: (handle: string) => Product | undefined): Product[] {
  return CURRENT.flatMap((promo) => {
    const product = getProduct(promo.handle);
    const variants = product?.variants.filter((variant) => promo.variants.test(variant.title)) ?? [];
    if (!product || !variants.length) return [];
    const prices = variants.map((variant) => parseFloat(variant.price));
    return [{
      ...product,
      title: promo.title,
      variants,
      priceFrom: Math.min(...prices).toFixed(2),
      priceTo: Math.max(...prices).toFixed(2),
      available: variants.some((variant) => variant.available),
      promo: true,
    }];
  });
}
