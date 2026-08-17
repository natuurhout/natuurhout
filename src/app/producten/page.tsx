import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { collectionProducts, collections, uncollectedProducts } from "@/lib/catalog";

// Title + description VERBATIM from live /producten/ (migration/url-inventory.csv).
export const metadata: Metadata = {
  title: "Kastanje Producten | Assortiment Hout | Hekwerk | Natuurhout",
  description:
    "Breed Assortiment Kastanjehout | Op zoek naar kastanje producten: houten (tuin)poorten, houten palen, tuinomheining of een ander product? | Hazelaar producten",
};

export default function ProductenPage() {
  const overige = uncollectedProducts();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading as="h1" underline="Prijzen">
        Producten &amp;
      </SectionHeading>
      <p className="mt-4 max-w-2xl text-ink/70">
        Alle prijzen en voorraad komen rechtstreeks uit onze webshop. Bestellen
        kan via{" "}
        <a
          href="https://natuurhout.shop/"
          className="font-semibold text-brand underline decoration-accent underline-offset-4"
        >
          natuurhout.shop
        </a>
        .
      </p>

      {collections.map((c) => {
        const items = collectionProducts(c);
        if (!items.length) return null;
        return (
          <section key={c.handle} id={c.handle} className="mt-14 scroll-mt-24">
            <h2 className="text-2xl font-semibold text-ink">{c.title}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.handle} product={p} />
              ))}
            </div>
          </section>
        );
      })}

      {overige.length > 0 && (
        <section id="overige" className="mt-14 scroll-mt-24">
          <h2 className="text-2xl font-semibold text-ink">Overige producten</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {overige.map((p) => (
              <ProductCard key={p.handle} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
