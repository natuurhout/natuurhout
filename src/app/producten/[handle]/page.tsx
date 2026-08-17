import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Button from "@/components/Button";
import { formatPrice, getProduct, products } from "@/lib/catalog";

// Product detail — content (title, description HTML, variants, prices,
// availability) is VERBATIM shop data. Purchasing always happens on
// natuurhout.shop (rule 8: the shop is linked, never replaced).

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

  const [main, ...rest] = product.images;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          {main && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-brand-soft">
              <Image
                src={main.src}
                alt={main.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          )}
          {rest.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {rest.slice(0, 4).map((im) => (
                <div
                  key={im.src}
                  className="relative aspect-square overflow-hidden rounded-2xl bg-brand-soft"
                >
                  <Image
                    src={im.src}
                    alt={im.alt}
                    fill
                    sizes="12rem"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {product.title}
          </h1>
          {product.priceFrom && (
            <p className="mt-3 text-xl font-semibold text-brand">
              {product.priceFrom !== product.priceTo ? "Vanaf " : ""}
              {formatPrice(product.priceFrom)}
            </p>
          )}
          <p className="mt-1 text-sm text-ink/60">
            {product.available ? "Op voorraad" : "Momenteel uitverkocht"}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={product.shopUrl} external>
              Bestel in de webshop
            </Button>
            <Button href="/offerte-aanvragen/" variant="outline">
              Offerte aanvragen
            </Button>
          </div>

          {product.variants.length > 1 && (
            <div className="mt-8 overflow-hidden rounded-2xl ring-1 ring-brand/10">
              <table className="w-full text-sm">
                <thead className="bg-brand-soft text-left text-brand">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Uitvoering</th>
                    <th className="px-4 py-2.5 font-semibold">Prijs</th>
                    <th className="px-4 py-2.5 font-semibold">Voorraad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand/10 bg-white">
                  {product.variants.map((v) => (
                    <tr key={v.title}>
                      <td className="px-4 py-2.5">{v.title}</td>
                      <td className="px-4 py-2.5">{formatPrice(v.price)}</td>
                      <td className="px-4 py-2.5">
                        {v.available ? "Op voorraad" : "Uitverkocht"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {product.bodyHtml && (
            <div
              className="prose-natuurhout mt-8 space-y-3 text-ink/80 [&_a]:text-brand [&_a]:underline [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink"
              // Verbatim shop description HTML (own content, trusted source)
              dangerouslySetInnerHTML={{ __html: product.bodyHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
