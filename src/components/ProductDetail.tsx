import type { ReactNode } from "react";
import { Leaf, ShieldCheck, Store, Truck } from "lucide-react";
import PriceList from "@/components/PriceList";
import ProductGallery, { type GalleryImage } from "@/components/ProductGallery";
import { discountPercent, type Product } from "@/lib/catalog";
import { SHOP_EXTRA_PHOTOS } from "@/lib/extra-photos";
import { productLead } from "@/lib/seo";

/*
 * Product page top, price-list style: a small photo on the side and the full
 * price list straight away. Used by the shop pages (/shop/…) and by the
 * WordPress product pages (/project/…), which pass their own heading, lead,
 * photos and — when a product is not sold in the webshop — their own prices.
 */

const assurances = [
  { icon: Truck, label: "Levering mogelijk" },
  { icon: Store, label: "Afhalen in Zele" },
  { icon: ShieldCheck, label: "+15 jaar ervaring" },
  { icon: Leaf, label: "Duurzaam hout" },
];

function Assurances({ className }: { className: string }) {
  return (
    <ul className={className}>
      {assurances.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0 text-accent" />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function ProductHero({
  heading,
  lead,
  images,
  products,
  children,
}: {
  heading: string;
  lead: string;
  images: GalleryImage[];
  products: Product[];
  /** Shown under the price list, or instead of it when there are no shop products. */
  children?: ReactNode;
}) {
  const bestSaving = Math.max(
    0,
    ...products.flatMap((p) => p.variants.map((v) => discountPercent(v) ?? 0)),
  );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-start lg:gap-10">
      <div className="md:sticky md:top-24">
        <ProductGallery images={images} badge={bestSaving > 0 ? `Tot −${bestSaving}%` : undefined} />
        <Assurances className="mt-5 hidden gap-2.5 rounded-card border border-line bg-white p-4 text-sm text-ink/75 md:grid" />
      </div>

      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>
        {lead && <p className="mt-3 line-clamp-3 max-w-2xl leading-7 text-ink/75">{lead}</p>}
        <a href="#productinfo" className="mt-1 inline-flex text-sm font-medium text-accent hover:text-accent-deep">
          Lees meer over dit product ↓
        </a>

        <div className="mt-6 space-y-4">
          {products.length > 0 && <PriceList products={products} />}
          {children}
        </div>

        <Assurances className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-ink/75 md:hidden" />
      </div>
    </div>
  );
}

export default function ProductDetail({ product }: { product: Product }) {
  return (
    <ProductHero
      heading={product.title}
      lead={productLead(product)}
      images={[
        ...(SHOP_EXTRA_PHOTOS[product.handle] ?? []).map(({ src, alt }) => ({ src, alt })),
        ...product.images.map(({ src, alt }) => ({ src, alt })),
      ]}
      products={[product]}
    />
  );
}
