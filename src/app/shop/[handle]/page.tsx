import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import JsonLd from "@/components/JsonLd";
import { getProduct, products, relatedProducts } from "@/lib/catalog";
import {
  productBodyHtml,
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

export default async function ShopProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) notFound();
  const related = relatedProducts(product, 4);

  // Shop pages are additive (they are not in the frozen WordPress inventory),
  // so this route uses a capped reading width instead of the full-bleed
  // container the migrated pages need. Order follows the conventional
  // storefront funnel: buy box, then detail, then cross-sell.
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

      <section className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            <span aria-hidden className="h-px w-8 bg-accent" />Detailbeschrijving
          </h2>
          {product.bodyHtml ? (
            <div
              className="mt-5 max-w-3xl space-y-3 text-ink/80 [&_a]:text-accent [&_a]:underline [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_h4]:text-lg [&_h4]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink"
              dangerouslySetInnerHTML={{ __html: productBodyHtml(product) }}
            />
          ) : <p className="mt-5 text-ink/60">Meer informatie volgt.</p>}
        </div>
        <aside className="space-y-4">
          <div className="rounded-card border border-line bg-white p-6">
            <p className="font-display text-lg font-semibold">Vragen over dit product?</p>
            <p className="mt-2 text-sm text-ink/70">
              Bel of mail ons voor advies op maat, een prijs voor een grotere hoeveelheid of een afspraak in Zele.
            </p>
            <div className="mt-4 space-y-1.5 text-sm">
              <a href="tel:+3252558858" className="block font-medium text-accent hover:text-accent-deep">+32 5 255 88 58</a>
              <a href="mailto:info@natuurhout.be" className="block text-ink/70 hover:text-accent">info@natuurhout.be</a>
            </div>
            <Link href="/offerte-aanvragen/" className="mt-4 inline-flex text-sm font-medium text-accent hover:text-accent-deep">
              Offerte aanvragen →
            </Link>
          </div>
          <div className="rounded-card bg-brand-dark p-6 text-white">
            <p className="font-display text-lg font-semibold">Complete afsluiting?</p>
            <p className="mt-2 text-sm text-white/70">Stel hekwerk, palen en poort samen en zie meteen een richtprijs.</p>
            <Link href="/calculator/" className="mt-4 inline-flex text-sm font-medium text-accent-bright hover:text-white">Naar de calculator →</Link>
          </div>
        </aside>
      </section>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold">Bijhorende producten</h2>
            <Link href="/shop/" className="text-sm font-medium text-accent hover:text-accent-deep">
              Bekijk het volledige assortiment →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {related.map((item) => <ProductCard key={item.handle} product={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}
