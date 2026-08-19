import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import { getProduct, products, relatedProducts } from "@/lib/catalog";

// Page layout references kastanjegjerde.no/butikk/* per Xander: breadcrumb,
// gallery + buy panel, related products, description + sidebar cards.
// Content (title, description HTML, variants, prices, availability) is
// VERBATIM shop data; purchases happen on natuurhout.shop (rule 8).

export function generateStaticParams() {
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) return {};
  return {
    title: `${product.title} | Natuurhout`,
    openGraph: { images: product.images[0] ? [product.images[0].src] : [] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) notFound();
  const related = relatedProducts(product, 4);

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent">Home</Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <Link href="/producten/" className="hover:text-accent">
              Producten &amp; Prijzen
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li className="font-medium text-ink">{product.title}</li>
        </ol>
      </nav>

      <div className="mt-6">
        <ProductDetail product={product} />
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-center font-display text-2xl font-semibold">
            Bijhorende producten
          </h2>
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.handle} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Description + sidebar */}
      <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            <span aria-hidden className="h-px w-8 bg-accent" />
            Detailbeschrijving
          </h2>
          {product.bodyHtml ? (
            <div
              className="mt-5 max-w-3xl space-y-3 text-ink/80 [&_a]:text-accent [&_a]:underline [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink"
              // Verbatim shop description HTML (own content, trusted source)
              dangerouslySetInnerHTML={{ __html: product.bodyHtml }}
            />
          ) : (
            <p className="mt-5 text-ink/60">
              Meer informatie over dit product vindt u in de webshop.
            </p>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-card border border-line bg-white p-6">
            <p className="font-display text-lg font-semibold">Waarom Natuurhout?</p>
            <ul className="mt-3 space-y-2 text-sm text-ink/70">
              <li>✓ Duurzame Producten</li>
              <li>✓ Levering mogelijk</li>
              <li>✓ +15 jaar ervaring</li>
              <li>✓ Groot assortiment</li>
            </ul>
          </div>
          <div className="rounded-card bg-brand-dark p-6 text-white">
            <p className="font-display text-lg font-semibold">Complete afsluiting?</p>
            <p className="mt-2 text-sm text-white/70">
              Stel hekwerk, palen en poort samen en zie meteen een richtprijs.
            </p>
            <Link
              href="/calculator/"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-bright hover:text-white"
            >
              Naar de calculator →
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
