import productsData from "@/data/products.json";
import collectionsData from "@/data/collections.json";

// Product content (titles, prices, descriptions, images) is copied verbatim
// from natuurhout.shop (Shopify products.json, fetched 2026-08-17) per
// Xander's instruction. The shop itself is never modified — every buy action
// links out to natuurhout.shop (migration rule 8).

export type ProductVariant = {
  id: number;
  title: string;
  price: string;
  compare_at: string | null;
  available: boolean;
};

export type ProductImage = {
  src: string;
  width: number | null;
  height: number | null;
  alt: string;
};

export type Product = {
  handle: string;
  title: string;
  bodyHtml: string;
  options: string[];
  images: ProductImage[];
  variants: ProductVariant[];
  priceFrom: string | null;
  priceTo: string | null;
  available: boolean;
  tags: string[];
  shopUrl: string;
  publishedAt: string | null;
};

export type Collection = {
  handle: string;
  title: string;
  products: string[];
};

export const products = productsData as Product[];
export const collections = collectionsData as Collection[];

export function getProduct(handle: string): Product | undefined {
  return products.find((p) => p.handle === handle);
}

export function collectionProducts(col: Collection): Product[] {
  return col.products
    .map((h) => getProduct(h))
    .filter((p): p is Product => Boolean(p));
}

/** Products not in any collection (rendered under "Overige producten"). */
export function uncollectedProducts(): Product[] {
  const inCollections = new Set(collections.flatMap((c) => c.products));
  return products.filter((p) => !inCollections.has(p.handle));
}

/** First product image of a collection — used as its mega-menu thumbnail. */
export function collectionImage(col: Collection): ProductImage | undefined {
  for (const handle of col.products) {
    const img = getProduct(handle)?.images[0];
    if (img) return img;
  }
  return undefined;
}

/** Related products: same collection first, then same tag. */
export function relatedProducts(product: Product, limit = 4): Product[] {
  const out: Product[] = [];
  const seen = new Set([product.handle]);
  for (const col of collections) {
    if (!col.products.includes(product.handle)) continue;
    for (const p of collectionProducts(col)) {
      if (!seen.has(p.handle) && out.length < limit) {
        out.push(p);
        seen.add(p.handle);
      }
    }
  }
  if (out.length < limit) {
    for (const p of products) {
      if (seen.has(p.handle) || out.length >= limit) continue;
      if (p.tags.some((t) => product.tags.includes(t))) {
        out.push(p);
        seen.add(p.handle);
      }
    }
  }
  return out;
}

export function formatPrice(p: string | number): string {
  const n = typeof p === "number" ? p : parseFloat(p);
  return `€${n.toFixed(2).replace(".", ",")}`;
}

/** Deep link that preselects a variant in the webshop. */
export function shopVariantUrl(product: Product, variant?: ProductVariant): string {
  return variant ? `${product.shopUrl}?variant=${variant.id}` : product.shopUrl;
}
