import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { collectionProducts, collections, uncollectedProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop | Natuurhout",
  description: "Bekijk het volledige assortiment natuurhout, hekwerk, palen, poorten en plaatsingsmateriaal.",
};

export default function ShopPage() {
  const overige = uncollectedProducts();
  return (
    <div className="w-full px-4 py-12 sm:px-6 lg:px-10">
      <SectionHeading as="h1" kicker="Assortiment">Shop</SectionHeading>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink/70">
        Bekijk het volledige assortiment. De productgegevens en actuele varianten zijn overgenomen uit de bestaande webshop.
      </p>

      {collections.map((collection) => {
        const items = collectionProducts(collection);
        if (!items.length) return null;
        return (
          <section key={collection.handle} id={collection.handle} className="mt-14 scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold text-ink">{collection.title}</h2>
            <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((product) => <ProductCard key={product.handle} product={product} />)}
            </div>
          </section>
        );
      })}

      {overige.length > 0 && (
        <section id="overige" className="mt-14 scroll-mt-24">
          <h2 className="font-display text-2xl font-semibold text-ink">Overige producten</h2>
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {overige.map((product) => <ProductCard key={product.handle} product={product} />)}
          </div>
        </section>
      )}
    </div>
  );
}
