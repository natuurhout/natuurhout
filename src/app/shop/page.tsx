import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import ShopCatalogue from "@/components/ShopCatalogue";

export const metadata: Metadata = {
  title: "Shop | Natuurhout",
  description: "Bekijk het volledige assortiment natuurhout, hekwerk, palen, poorten en plaatsingsmateriaal.",
  alternates: { canonical: "https://www.natuurhout.be/shop/" },
};

export default function ShopPage() {
  return (
    <div className="w-full px-4 py-12 sm:px-6 lg:px-10">
      <SectionHeading as="h1" kicker="Assortiment">Shop</SectionHeading>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink/70">
        Al onze producten in één overzicht.{" "}
        <span className="[@media(hover:hover)]:hidden">Tik op een categorie om naar de producten te gaan.</span>
        <span className="hidden [@media(hover:hover)]:inline">
          Ga met de muis over een categorie om meteen te zien wat erin zit, of klik erop om naar alle producten van die
          categorie te gaan.
        </span>
      </p>
      <ShopCatalogue />
    </div>
  );
}
