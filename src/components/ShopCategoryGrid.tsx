import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { formatPrice, type Product } from "@/lib/catalog";
import { CARD_PHOTOS } from "@/lib/extra-photos";
import { orderTerm } from "@/lib/made-to-order";

export type ShopCategory = {
  /** Section id on the page (the shop collection handle). */
  handle: string;
  title: string;
  image?: string;
  products: Product[];
};

const productPhoto = (product: Product) => CARD_PHOTOS[product.handle] ?? product.images[0]?.src;

const productPrice = (product: Product) =>
  product.priceFrom
    ? `${product.priceTo && product.priceTo !== product.priceFrom ? "vanaf " : ""}${formatPrice(product.priceFrom)}`
    : null;

/*
 * The shop's overview: every category at a glance, one photo each. With a
 * mouse, hovering a category opens a panel with all of its products (photo,
 * name, price), each a link; keyboard focus opens it too. On touch screens a
 * tap jumps to the category's section further down the page.
 */
export default function ShopCategoryGrid({ categories }: { categories: ShopCategory[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {categories.map((category) => {
        const prices = category.products.map((p) => parseFloat(p.priceFrom ?? "")).filter((n) => !Number.isNaN(n));
        const from = prices.length ? formatPrice(Math.min(...prices)) : null;
        const count = `${category.products.length} ${category.products.length === 1 ? "product" : "producten"}`;
        return (
          <li key={category.handle} className="group relative hover:z-30 focus-within:z-30">
            <a
              href={`#${category.handle}`}
              className="flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-shadow hover:shadow-lg hover:shadow-ink/10"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-brand-soft/50">
                {category.image && (
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                  />
                )}
              </span>
              <span className="flex flex-1 flex-col p-3.5">
                <span className="font-display text-lg font-semibold leading-tight text-ink">{category.title}</span>
                <span className="mt-1 text-xs text-ink/60">
                  {count}
                  {from && <> · vanaf {from}</>}
                </span>
              </span>
            </a>

            {/* Hover overview: only where a mouse can hover (and on keyboard focus). */}
            <div
              className="invisible absolute inset-x-0 top-0 hidden min-h-full flex-col rounded-card bg-white p-3 opacity-0 shadow-2xl shadow-ink/20 ring-1 ring-line transition-[opacity,visibility] duration-150 group-focus-within:visible group-focus-within:opacity-100 [@media(hover:hover)]:flex [@media(hover:hover)]:group-hover:visible [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:delay-75"
            >
              <a href={`#${category.handle}`} className="flex items-baseline justify-between gap-2 px-1.5 pb-2 pt-0.5 hover:text-accent-deep">
                <span className="font-display text-lg font-semibold leading-tight">{category.title}</span>
                <span className="shrink-0 text-xs text-ink/55">{count}</span>
              </a>
              <ul className="space-y-0.5 border-t border-line pt-2">
                {category.products.map((product) => {
                  const photo = productPhoto(product);
                  const price = productPrice(product);
                  return (
                    <li key={product.handle}>
                      <a
                        href={`/shop/${product.handle}/`}
                        className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors hover:bg-brand-soft/70"
                      >
                        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-brand-soft/60">
                          {photo && <Image src={photo} alt="" fill sizes="36px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium leading-snug text-ink">{product.title}</span>
                          {price && <span className="block text-xs text-ink/60">{price}</span>}
                        </span>
                        {!product.available && (
                          <span className="shrink-0 rounded-full bg-ink/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            {orderTerm(product.handle).badge}
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
              <a
                href={`#${category.handle}`}
                className="mt-auto flex items-center gap-1.5 px-1.5 pt-2.5 text-sm font-semibold text-accent-deep hover:text-ink"
              >
                Alles bekijken <ArrowDown aria-hidden className="h-4 w-4" />
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
