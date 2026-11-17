/*
 * The live catalogue: the site's catalogue as built (baseProducts, without
 * the published backend edits) plus the current edits and stock from D1.
 * Checkout prices orders with this, so a price changed in the backend counts
 * at once, even before the static site has been rebuilt.
 */

import { baseProducts, collections, type Product, type ProductVariant } from "../../src/lib/catalog";
import { applyOverrides, type CatalogOverrides } from "../../src/lib/catalog-overrides";
import { ensureSchema } from "../crm/schema";

export type VariantRow = {
  variant_id: number;
  handle: string;
  title: string | null;
  price: number | null;
  compare_at: number | null;
  available: number | null;
  stock: number | null;
  low_stock: number | null;
  sku: string;
  updated_at: string;
};
export type ProductRow = { handle: string; title: string | null; hidden: number; updated_at: string };

export type LiveVariant = ProductVariant & {
  /** null: stock is not counted for this variant. */
  stock: number | null;
  lowStock: number | null;
  sku: string;
  base: ProductVariant;
};
export type LiveProduct = Omit<Product, "variants"> & { variants: LiveVariant[]; hidden: boolean; base: Product };

/** "Default Title" (a product without options) reads as the product itself. */
export const variantLabel = (product: { title: string }, variant: { title: string }) =>
  variant.title === "Default Title" ? product.title : variant.title;

/** Overrides as the site applies them: stock counted → available follows the stock. */
export function toOverrides(variants: VariantRow[], products: ProductRow[]): CatalogOverrides {
  const out: CatalogOverrides = { products: {}, variants: {} };
  for (const p of products) {
    if (p.title || p.hidden) out.products[p.handle] = { ...(p.title ? { title: p.title } : {}), ...(p.hidden ? { hidden: true } : {}) };
  }
  for (const v of variants) {
    const o: CatalogOverrides["variants"][string] = {};
    if (v.title) o.title = v.title;
    if (v.price !== null) o.price = v.price;
    if (v.compare_at !== null) o.compare_at = v.compare_at > 0 ? v.compare_at : null;
    if (v.stock !== null) o.available = v.stock > 0;
    else if (v.available !== null) o.available = v.available === 1;
    if (Object.keys(o).length) out.variants[String(v.variant_id)] = o;
  }
  return out;
}

export async function loadCatalog(db: D1Database): Promise<{ products: LiveProduct[]; overrides: CatalogOverrides; byId: Map<number, { product: LiveProduct; variant: LiveVariant }> }> {
  await ensureSchema(db);
  const [variants, productRows] = await db.batch([
    db.prepare("SELECT * FROM variant_overrides"),
    db.prepare("SELECT * FROM product_overrides"),
  ]);
  const vRows = variants.results as VariantRow[];
  const pRows = productRows.results as ProductRow[];
  const overrides = toOverrides(vRows, pRows);
  const applied = applyOverrides(baseProducts, overrides);
  const vMap = new Map(vRows.map((v) => [v.variant_id, v]));
  const pMap = new Map(pRows.map((p) => [p.handle, p]));
  const byId = new Map<number, { product: LiveProduct; variant: LiveVariant }>();
  const products = applied.map((product, i): LiveProduct => {
    const base = baseProducts[i];
    const live: LiveProduct = {
      ...product,
      hidden: pMap.get(product.handle)?.hidden === 1,
      base,
      variants: product.variants.map((variant, j) => {
        const row = vMap.get(variant.id);
        return { ...variant, stock: row?.stock ?? null, lowStock: row?.low_stock ?? null, sku: row?.sku ?? "", base: base.variants[j] };
      }),
    };
    for (const variant of live.variants) byId.set(variant.id, { product: live, variant });
    return live;
  });
  return { products, overrides, byId };
}

/** Collection title per product handle (first collection it is in), for reports. */
export function productGroups(): Map<string, string> {
  const out = new Map<string, string>();
  for (const c of collections) for (const h of c.products) if (!out.has(h)) out.set(h, c.title);
  return out;
}

/** Marks the catalogue as changed (the site picks it up on the next rebuild). */
export async function touchCatalog(db: D1Database, at: string) {
  await db.prepare("INSERT INTO catalog_publish (id, changed_at) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET changed_at = excluded.changed_at").bind(at).run();
}
