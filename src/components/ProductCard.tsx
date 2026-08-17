import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/lib/catalog";

// Card layout references the kastanjegjerde.no product cards (image, title,
// "Fra …" price, tan action button). Titles and prices are verbatim shop
// data — never reworded or rounded.
export default function ProductCard({ product }: { product: Product }) {
  const img = product.images[0];
  const hasRange =
    product.priceFrom && product.priceTo && product.priceFrom !== product.priceTo;
  return (
    <Link
      href={`/producten/${product.handle}/`}
      className="group flex flex-col overflow-hidden rounded-card bg-white shadow-sm ring-1 ring-brand/10 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft">
        {img ? (
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        {!product.available && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">
            Uitverkocht
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 text-center">
        <h3 className="font-semibold text-ink group-hover:text-accent">
          {product.title}
        </h3>
        {product.priceFrom && (
          <p className="text-sm text-ink/70">
            {hasRange ? "Vanaf " : ""}
            <span className="text-base font-semibold text-ink">
              {formatPrice(product.priceFrom)}
            </span>
          </p>
        )}
        <span className="mt-auto inline-flex items-center justify-center rounded-lg bg-accent-tan px-4 py-2 text-sm font-semibold text-ink transition-colors group-hover:bg-accent group-hover:text-white">
          {product.variants.length > 1 ? "Bekijk opties" : "Bekijk product"}
        </span>
      </div>
    </Link>
  );
}
