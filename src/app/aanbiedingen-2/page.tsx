import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Aanbiedingen | Natuurhout",
  alternates: { canonical: "https://www.natuurhout.be/aanbiedingen-2/" },
};

export default function OffersPage() {
  const offers = products.filter((product) => product.variants.some((variant) => variant.compare_at));
  return (
    <div className="px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Actuele voorraad</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">Aanbiedingen</h1>
      <p className="mt-5 max-w-2xl leading-7 text-ink/70">Bekijk producten die momenteel aan een verlaagde prijs beschikbaar zijn. Zolang de voorraad strekt.</p>
      {offers.length ? (
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {offers.map((product) => <ProductCard key={product.handle} product={product} />)}
        </div>
      ) : (
        <p className="mt-10 rounded-card border border-line bg-white p-7 text-ink/70">Er zijn momenteel geen aanbiedingen.</p>
      )}
    </div>
  );
}
