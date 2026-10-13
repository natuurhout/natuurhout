import ProductCard from "@/components/ProductCard";
import ShopCategoryGrid, { type ShopCategory } from "@/components/ShopCategoryGrid";
import { collectionProducts, collections, uncollectedProducts } from "@/lib/catalog";
import { categories as tiles } from "@/lib/categories";
import { CARD_PHOTOS } from "@/lib/extra-photos";

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

/** Every product, by category, in Xander's order. */
export function shopSections(): (ShopCategory & { image?: string })[] {
  const shopCategories: ShopCategory[] = [...collections]
    .sort((a, b) => rank(a.handle) - rank(b.handle))
    .map((collection) => ({ handle: collection.handle, title: TITLES[collection.handle] ?? collection.title, products: collectionProducts(collection) }));
  const overige = uncollectedProducts();
  if (overige.length) shopCategories.push({ handle: "overige", title: "Overige producten", products: overige });
  return shopCategories
    .filter((category) => category.products.length > 0)
    .map((category) => {
      const first = category.products[0];
      return { ...category, image: PHOTOS[category.handle] ?? CARD_PHOTOS[first.handle] ?? first.images[0]?.src };
    });
}

/**
 * The whole range: the category tiles (hover shows what is in them), then
 * every product card per category. Used on /shop/ and /producten/.
 */
export default function ShopCatalogue({ heading = "h2" }: { heading?: "h2" | "h3" }) {
  const sections = shopSections();
  const Heading = heading;
  return (
    <>
      <nav aria-label="Categorieën" className="mt-8">
        <ShopCategoryGrid categories={sections} />
      </nav>
      {sections.map((category) => (
        <section key={category.handle} id={category.handle} className="mt-14 scroll-mt-24">
          <Heading className="font-display text-2xl font-semibold text-ink">{category.title}</Heading>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {category.products.map((product) => (
              <ProductCard key={`${product.handle}-${product.title}`} product={product} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
