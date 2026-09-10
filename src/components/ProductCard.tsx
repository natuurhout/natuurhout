import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  compareAtPrice,
  discountPercent,
  formatPrice,
  productDiscountPercent,
  type Product,
} from "@/lib/catalog";

// Commerce tile: framed white card on the grey ground, square media matching
// the catalogue's dominant 1:1 shop photography, a two-line title box so
// prices line up across a row, and price plus action pinned to the bottom.
// Titles and prices stay verbatim shop data — never reworded or rounded.
export default function ProductCard({ product }: { product: Product }) {
  const img = product.images[0];
  const hasRange =
    product.priceFrom && product.priceTo && product.priceFrom !== product.priceTo;
  // The card shows priceFrom, so its "was" price and percentage must come from
  // that same cheapest variant — a saving on a dearer variant would otherwise
  // strike through a price the customer never sees. When only a dearer variant
  // is reduced the tile still flags the promotion, just without a figure.
  const cheapest = product.variants.reduce<Product["variants"][number] | undefined>(
    (low, v) => (!low || parseFloat(v.price) < parseFloat(low.price) ? v : low),
    undefined,
  );
  const wasPrice = cheapest ? compareAtPrice(cheapest) : null;
  const discount = cheapest ? discountPercent(cheapest) : null;
  const promoOnly = discount === null && productDiscountPercent(product) !== null;

  return (
    <Link
      href={`/shop/${product.handle}/`}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-ink/10"
    >
      <div className="relative aspect-square overflow-hidden bg-brand-soft/50">
        {img ? (
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {discount !== null && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
              −{discount}%
            </span>
          )}
          {promoOnly && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
              Actie
            </span>
          )}
          {!product.available && (
            <span className="rounded-full bg-ink/85 px-2.5 py-1 text-xs font-medium text-white">
              Uitverkocht
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-ink group-hover:text-accent">
          {product.title}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <p className="leading-tight">
            {hasRange && (
              <span className="mr-1 text-xs text-ink/55">vanaf</span>
            )}
            {product.priceFrom && (
              <span className="text-lg font-semibold text-ink">
                {formatPrice(product.priceFrom)}
              </span>
            )}
            {wasPrice !== null && (
              <span className="ml-2 text-sm text-ink/45 line-through">
                {formatPrice(wasPrice)}
              </span>
            )}
          </p>
          <span className="shrink-0 rounded-full border border-line p-2 text-ink/40 transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
