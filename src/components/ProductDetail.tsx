import type { ReactNode } from "react";
import { Handshake, Phone, Truck, Users, Warehouse } from "lucide-react";
import PriceList from "@/components/PriceList";
import ProductGallery, { type GalleryImage } from "@/components/ProductGallery";
import { discountPercent, type Product } from "@/lib/catalog";
import { PHONE } from "@/lib/contact";
import { SHOP_EXTRA_PHOTOS } from "@/lib/extra-photos";
import { productLead } from "@/lib/seo";

/*
 * Product page top, price-list style: a small photo on the side and the full
 * price list straight away. Used by the shop pages (/shop/…) and by the
 * WordPress product pages (/project/…), which pass their own heading, lead,
 * photos and — when a product is not sold in the webshop — their own prices.
 */

// Why buy here: the same strengths as the top bar, for every product.
const assurances = [
  { icon: Users, label: "Familiebedrijf · 15 jaar ervaring" },
  { icon: Warehouse, label: "Op voorraad: binnen de week geleverd" },
  { icon: Truck, label: "Eigen levering in heel België" },
  { icon: Handshake, label: "Afhalen in Zele, wij helpen inladen" },
];

function Assurances({ className }: { className: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">Waarom Natuurhout</p>
      <ul className="mt-3 grid gap-2.5 max-md:grid-cols-2 max-md:gap-x-4">
        {assurances.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-start gap-2.5">
            <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {label}
          </li>
        ))}
      </ul>
      <a
        href={PHONE.href}
        className="mt-3.5 flex items-center gap-2.5 border-t border-line pt-3 font-medium text-accent-deep hover:text-ink"
      >
        <Phone aria-hidden className="h-4 w-4 shrink-0" />
        <span>
          Advies nodig? <span className="whitespace-nowrap">{PHONE.label}</span>
        </span>
      </a>
    </div>
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
        <Assurances className="mt-5 hidden rounded-card border border-line bg-white p-4 text-sm text-ink/75 md:block" />
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

        <Assurances className="mt-5 rounded-card border border-line bg-white p-4 text-sm text-ink/75 md:hidden" />
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
