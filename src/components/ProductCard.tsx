import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/lib/catalog";

// Titles and prices are verbatim shop data — never reworded or rounded.
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
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className="font-semibold text-ink group-hover:text-brand">
          {product.title}
        </h3>
        {product.priceFrom && (
          <p className="mt-auto pt-2 text-sm text-ink/70">
            {hasRange ? "Vanaf " : ""}
            <span className="text-base font-semibold text-brand">
              {formatPrice(product.priceFrom)}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
