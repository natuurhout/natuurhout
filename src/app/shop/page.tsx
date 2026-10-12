import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import ShopCategoryGrid, { type ShopCategory } from "@/components/ShopCategoryGrid";
import { collectionProducts, collections, uncollectedProducts } from "@/lib/catalog";
import { categories as tiles } from "@/lib/categories";
import { CARD_PHOTOS } from "@/lib/extra-photos";

export const metadata: Metadata = {
  title: "Shop | Natuurhout",
  description: "Bekijk het volledige assortiment natuurhout, hekwerk, palen, poorten en plaatsingsmateriaal.",
  alternates: { canonical: "https://www.natuurhout.be/shop/" },
};

// Xander's order (as on the homepage): promotions and sale first, then
// fencing, gates, posts and the rest. A collection the shop adds later goes
// at the end.
const ORDER = [
  "promos",
  "sale",
  "raster",
  "poorten",
  "palen",
  "vlechtschermen",
  "post-rail",
  "tuinbakken",
  "lariks-schaaldelen",
  "plaatsing-materiaal",
  "gaas",
];

// The menu's names where the shop's differ.
const TITLES: Record<string, string> = { raster: "Hekwerk", promos: "Promo's" };

// Category photo: the matching menu tile where there is one.
const tile = (href: string) => tiles.find((t) => t.href === href)?.src;
const PHOTOS: Record<string, string | undefined> = {
  raster: tile("/project/rasterwerk-kastanjehout/"),
  poorten: tile("/project/franse-poorten/"),
  palen: tile("/project/kastanjepalen/"),
  vlechtschermen: tile("/project/hazelaar-vlechtscherm-hasseltre/"),
  "post-rail": tile("/project/post-rail-2/"),
  tuinbakken: tile("/project/moestuinbak/"),
  "lariks-schaaldelen": tile("/project/lariks-schaal-delen-2/"),
};

const rank = (handle: string) => (ORDER.includes(handle) ? ORDER.indexOf(handle) : ORDER.length);

export default function ShopPage() {
  const shopCategories: ShopCategory[] = [...collections]
    .sort((a, b) => rank(a.handle) - rank(b.handle))
    .map((collection) => ({ handle: collection.handle, title: TITLES[collection.handle] ?? collection.title, products: collectionProducts(collection) }));
  const overige = uncollectedProducts();
  if (overige.length) shopCategories.push({ handle: "overige", title: "Overige producten", products: overige });

  const sections = shopCategories
    .filter((category) => category.products.length > 0)
    .map((category) => {
      const first = category.products[0];
      return { ...category, image: PHOTOS[category.handle] ?? CARD_PHOTOS[first.handle] ?? first.images[0]?.src };
    });

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

      <nav aria-label="Categorieën" className="mt-8">
        <ShopCategoryGrid categories={sections} />
      </nav>

      {sections.map((category) => (
        <section key={category.handle} id={category.handle} className="mt-14 scroll-mt-24">
          <h2 className="font-display text-2xl font-semibold text-ink">{category.title}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {category.products.map((product) => (
              <ProductCard key={`${product.handle}-${product.title}`} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
