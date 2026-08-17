import productsData from "@/data/products.json";
import collectionsData from "@/data/collections.json";

// Product content (titles, prices, descriptions, images) is copied verbatim
// from natuurhout.shop (Shopify products.json, fetched 2026-08-17) per
// Xander's instruction. The shop itself is never modified — every buy action
// links out to natuurhout.shop (migration rule 8).

export type ProductVariant = {
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

export function formatPrice(p: string): string {
  return `€${p.replace(".", ",")}`;
}
