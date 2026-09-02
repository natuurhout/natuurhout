import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { products } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Kastanje | Shop | Natuurhout",
  description: "Bekijk alle producten van kastanjehout in de Natuurhout shop.",
  alternates: { canonical: "https://www.natuurhout.be/shop/kastanje/" },
};

export default function KastanjeShopPage() {
  const kastanjeProducts = products.filter((product) =>
    [product.title, product.bodyHtml, ...product.tags].join(" ").toLocaleLowerCase("nl").includes("kastanje")
  );

  return (
    <div className="w-full px-4 py-12 sm:px-6 lg:px-10">
      <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
        <Link href="/">Home</Link><span className="mx-2">›</span><Link href="/shop/">Shop</Link><span className="mx-2">›</span><span>Kastanje</span>
      </nav>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.22em] text-accent">Shopcategorie</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">Kastanje</h1>
      <p className="mt-5 max-w-2xl leading-7 text-ink/70">Alle producten van duurzaam Europees kastanjehout bij elkaar.</p>
      <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {kastanjeProducts.map((product) => <ProductCard key={product.handle} product={product} />)}
      </div>
    </div>
  );
}
