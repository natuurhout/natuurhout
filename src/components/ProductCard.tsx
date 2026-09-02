import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatPrice, type Product } from "@/lib/catalog";

// Quiet editorial card: image, name, price, understated action row.
// Titles and prices are verbatim shop data — never reworded or rounded.
export default function ProductCard({ product }: { product: Product }) {
  const img = product.images[0];
  const hasRange =
    product.priceFrom && product.priceTo && product.priceFrom !== product.priceTo;
  return (
    <Link href={`/shop/${product.handle}/`} className="group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-brand-soft">
        {img ? (
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        {!product.available && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-medium text-white">
            Uitverkocht
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 pt-4">
        <div>
          <h3 className="font-medium leading-snug text-ink group-hover:text-accent">
            {product.title}
          </h3>
          {product.priceFrom && (
            <p className="mt-1 text-sm text-ink/55">
              {hasRange ? "vanaf " : ""}
              <span className="font-semibold text-ink">
                {formatPrice(product.priceFrom)}
              </span>
            </p>
          )}
        </div>
        <span className="mt-1 rounded-full border border-line p-2 text-ink/40 transition-colors group-hover:border-accent group-hover:text-accent">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
