import productsData from "@/data/products.json";
import collectionsData from "@/data/collections.json";
import { PROMO_COLLECTION, promotionCards, REMOVED_PRODUCTS, SALE, UNLISTED, withPromotionCollections, withPromotions } from "@/lib/promotions";
import { withPriceUpdates } from "@/lib/price-updates";
import { renameDeep } from "@/lib/renames.mjs";
import { WEBSITE_PRODUCT_COLLECTIONS, WEBSITE_PRODUCTS } from "@/lib/website-products";

// Product content (titles, prices, descriptions, images) is copied verbatim
// from natuurhout.shop (Shopify products.json, fetched 2026-08-17) per
// Xander's instruction. The shop itself is never modified. This site replaces
// it (Xander, Oct 2026): links in the descriptions point at the product pages
// here, and orders are sent from the price lists (OrderRequestForm). `shopUrl`
// is kept as shop data only; nothing on the site links to it.

export type ProductVariant = {
  id: number;
  title: string;
  price: string;
  compare_at: string | null;
  available: boolean;
  /** On promotion on the website (src/lib/promotions.ts). */
  promo?: boolean;
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
  /** A promo-section card (src/lib/promotions.ts). */
  promo?: boolean;
  /** In the Sale section (src/lib/promotions.ts). */
  sale?: boolean;
};

export type Collection = {
  handle: string;
  title: string;
  products: string[];
};

/** A product's page on this site. */
export const productPage = (product: { handle: string }) => `/shop/${product.handle}/`;

// natuurhout.shop links inside the shop copy: a product link opens that
// product's page here, anything else the shop overview.
const SHOP_LINK = /https?:\/\/(?:www\.)?natuurhout\.shop(\/[^"'\s<>]*)?/g;
// Old shop handles still linked from the copy.
const OLD_HANDLES: Record<string, string> = { "kastanje-hekwerk-copy": "robinia-hekwerk" };
const KNOWN_HANDLES = new Set([...(productsData as Product[]), ...WEBSITE_PRODUCTS].map((product) => product.handle));
function localShopLinks(html: string): string {
  return html
    .replace(SHOP_LINK, (_, path: string | undefined) => {
      const linked = /^\/products\/([\w-]+)/.exec(path ?? "")?.[1];
      const handle = linked ? (OLD_HANDLES[linked] ?? linked) : undefined;
      return handle && KNOWN_HANDLES.has(handle) ? `/shop/${handle}/` : "/shop/";
    })
    // Pages on this site open in the same tab.
    .replace(/(href="\/shop\/[^"]*")\s+target="_blank"(\s+rel="noopener")?/g, "$1");
}

// Website promotions (src/lib/promotions.ts) are applied on top of the shop data.
export const products = withPromotions(
  withPriceUpdates(
    [...renameDeep(productsData as Product[]), ...WEBSITE_PRODUCTS].map((product) => ({
      ...product,
      bodyHtml: localShopLinks(product.bodyHtml),
    })),
  ),
).filter((product) => !(product.handle in REMOVED_PRODUCTS));
export const collections = withPromotionCollections(collectionsData as Collection[]).map((collection) => {
  const added = Object.entries(WEBSITE_PRODUCT_COLLECTIONS).filter(([, target]) => target === collection.handle).map(([handle]) => handle);
  return added.length ? { ...collection, products: [...collection.products, ...added] } : collection;
});

export function getProduct(handle: string): Product | undefined {
  return products.find((p) => p.handle === handle);
}

/**
 * Shown in the product lists (shop, homepage, overviews, search)? Not the
 * ones taken off by hand, and not a sold-out Sale product: every Sale item is
 * unique and never comes back (Xander). Product pages stay either way.
 */
export function isListed(product: Product): boolean {
  return !UNLISTED.has(product.handle) && !(product.sale && !product.available);
}

/** The products on sale: older rolls and products with a small flaw. */
export function saleProducts(): Product[] {
  return SALE.map((handle) => getProduct(handle)).filter((p): p is Product => Boolean(p) && isListed(p!));
}

/** The current promotions, one card each (Promo's section and /aanbiedingen-2/). */
export function promotions(): Product[] {
  return promotionCards(getProduct);
}

export function collectionProducts(col: Collection): Product[] {
  if (col.handle === PROMO_COLLECTION) return promotions();
  return col.products
    .map((h) => getProduct(h))
    .filter((p): p is Product => Boolean(p) && isListed(p!));
}

/** Products not in any collection (rendered under "Overige producten"). */
export function uncollectedProducts(): Product[] {
  const inCollections = new Set(collections.flatMap((c) => c.products));
  return products.filter((p) => !inCollections.has(p.handle) && isListed(p));
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

/**
 * Shopify keeps `compare_at` even when it no longer undercuts the price, so a
 * value only counts as a discount when it is genuinely higher than what the
 * customer pays. Returns the "was" price, or null when there is no sale.
 */
export function compareAtPrice(variant: ProductVariant): number | null {
  if (!variant.compare_at) return null;
  const was = parseFloat(variant.compare_at);
  const now = parseFloat(variant.price);
  if (!Number.isFinite(was) || !Number.isFinite(now)) return null;
  return was > now ? was : null;
}

/** Whole-percent saving on a variant, or null when it is not discounted. */
export function discountPercent(variant: ProductVariant): number | null {
  const was = compareAtPrice(variant);
  if (was === null) return null;
  return Math.round((1 - parseFloat(variant.price) / was) * 100);
}

/** Best saving across a product's variants — drives the listing badge. */
export function productDiscountPercent(product: Product): number | null {
  const percentages = product.variants
    .map(discountPercent)
    .filter((n): n is number => n !== null);
  return percentages.length ? Math.max(...percentages) : null;
}

/**
 * Lowest price per running metre of a fence roll ("100cm / … (10m rol)"),
 * optionally at one height in cm. Promo variants are left out by default.
 */
export function pricePerMeterFrom(handle: string, height?: number, withPromo = false): string | null {
  const prices = (getProduct(handle)?.variants ?? []).flatMap((variant) => {
    const m = variant.title.match(/^(\d+)cm\s*\/.*\((\d+)m rol\)/);
    if (!m || (height !== undefined && Number(m[1]) !== height) || (!withPromo && variant.promo)) return [];
    return [parseFloat(variant.price) / Number(m[2])];
  });
  return prices.length ? formatPrice(Math.min(...prices)) : null;
}

export function formatPrice(p: string | number): string {
  const n = typeof p === "number" ? p : parseFloat(p);
  return `€${n.toFixed(2).replace(".", ",")}`;
}

const ROLL = /\s*\((\d+(?:[.,]\d+)?)\s*m\s*rol\)\s*/i;

/** "4.5/5cm (5m rol)" → { text: "4.5/5cm", roll: 5 }: the roll length of a fence variant. */
export function splitRoll(value: string): { text: string; roll: number | null } {
  const match = ROLL.exec(value);
  return {
    text: value.replace(ROLL, " ").trim(),
    roll: match ? parseFloat(match[1].replace(",", ".")) : null,
  };
}
