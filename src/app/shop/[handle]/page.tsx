import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { BoughtTogether, ProductInfo, productInfoTabs } from "@/components/ProductInfo";
import Realisaties from "@/components/Realisaties";
import JsonLd from "@/components/JsonLd";
import { getProduct, products } from "@/lib/catalog";
import { realisatiesFor } from "@/lib/realisaties";
import { boughtTogether, productFacts, productSections } from "@/lib/product-info";
import {
  productDescription,
  productMetadataTitle,
  productStructuredData,
} from "@/lib/seo";

export function generateStaticParams() {
  return products.map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) return {};
  const title = productMetadataTitle(product);
  return {
    title,
    description: productDescription(product),
    alternates: { canonical: `https://www.natuurhout.be/shop/${product.handle}/` },
    openGraph: {
      title,
      description: productDescription(product),
      url: `https://www.natuurhout.be/shop/${product.handle}/`,
      images: product.images[0] ? [product.images[0].src] : [],
    },
  };
}

const fenceKinds = /hekwerk|rasterwerk|poort|palen|paal|postsaver|gaas|post-rail/;

export default async function ShopProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) notFound();

  // Shop pages are additive (they are not in the frozen WordPress inventory),
  // so this route uses a capped reading width instead of the full-bleed
  // container the migrated pages need. Order follows the storefront funnel:
  // photo + price list, then product information in tabs, then cross-sell.
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-8 sm:px-6 lg:px-10">
      <JsonLd data={productStructuredData(product)} />
      <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-accent">Home</Link></li>
          <li aria-hidden>›</li>
          <li><Link href="/shop/" className="hover:text-accent">Shop</Link></li>
          <li aria-hidden>›</li>
          <li className="font-medium text-ink">{product.title}</li>
        </ol>
      </nav>

      <div className="mt-6"><ProductDetail product={product} /></div>

      <ProductInfo
        tabs={productInfoTabs({
          ...productSections(product),
          facts: productFacts(product),
          fencing: fenceKinds.test(product.handle),
        })}
      />
      <BoughtTogether products={boughtTogether(product, 4)} />
      <Realisaties items={realisatiesFor({ handle: product.handle })} />
    </div>
  );
}
