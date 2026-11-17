/*
 * Catalogue edits made in the backend (beheer.natuurhout.be → Producten /
 * Voorraad), applied on top of everything else in src/lib/catalog.ts.
 *
 * The backend keeps them in D1 and publishes them at
 * https://www.natuurhout.be/api/catalogus/; the deploy workflow copies that
 * into src/data/catalog-overrides.json and rebuilds the site when it changed
 * (.github/workflows/deploy.yml). The Worker applies the live D1 version on
 * top at checkout, so an order always gets the current price and stock.
 *
 * Client-safe: no catalogue import.
 */

export type VariantOverride = {
  title?: string;
  /** Price incl. btw, as a number. */
  price?: number;
  /** "Was" price for a strike-through; null removes one. */
  compare_at?: number | null;
  /** In stock (orderable right away) or "op bestelling". */
  available?: boolean;
};

export type ProductOverride = {
  title?: string;
  /** Taken off the product lists (the product page stays). */
  hidden?: boolean;
};

export type CatalogOverrides = {
  products: Record<string, ProductOverride>;
  /** By variant id. */
  variants: Record<string, VariantOverride>;
};

export const NO_OVERRIDES: CatalogOverrides = { products: {}, variants: {} };

type V = { id: number; title: string; price: string; compare_at: string | null; available: boolean };
type P<Var extends V> = { handle: string; title: string; variants: Var[]; priceFrom: string | null; priceTo: string | null; available: boolean };

const money = (n: number) => n.toFixed(2);

export function applyOverrides<Var extends V, Prod extends P<Var>>(products: Prod[], o: CatalogOverrides): Prod[] {
  if (!Object.keys(o.products).length && !Object.keys(o.variants).length) return products;
  return products.map((product) => {
    const po = o.products[product.handle];
    let changed = Boolean(po?.title);
    const variants = product.variants.map((variant) => {
      const vo = o.variants[String(variant.id)];
      if (!vo) return variant;
      changed = true;
      return {
        ...variant,
        ...(vo.title ? { title: vo.title } : {}),
        ...(vo.price !== undefined ? { price: money(vo.price) } : {}),
        ...(vo.compare_at !== undefined ? { compare_at: vo.compare_at === null ? null : money(vo.compare_at) } : {}),
        ...(vo.available !== undefined ? { available: vo.available } : {}),
      };
    });
    if (!changed) return product;
    const prices = variants.map((v) => parseFloat(v.price)).filter(Number.isFinite);
    return {
      ...product,
      ...(po?.title ? { title: po.title } : {}),
      variants,
      priceFrom: prices.length ? money(Math.min(...prices)) : product.priceFrom,
      priceTo: prices.length ? money(Math.max(...prices)) : product.priceTo,
      available: variants.some((v) => v.available),
    };
  });
}

/** Handles taken off the product lists in the backend. */
export const hiddenHandles = (o: CatalogOverrides) => new Set(Object.entries(o.products).filter(([, p]) => p.hidden).map(([h]) => h));
