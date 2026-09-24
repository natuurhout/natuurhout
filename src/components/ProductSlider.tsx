"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/catalog";

/*
 * One collection rail on the homepage. Native scroll-snap does the moving, so
 * it works without JS and stays a plain swipe on touch; the arrows are
 * progressive enhancement and sit inside the header row rather than floating
 * over it, where they used to cover the "Alles bekijken" link.
 *
 * Only groups with enough products to fill a row get a rail — the page merges
 * the smaller collections into one grid instead, so no row is left with a
 * single card and three empty columns.
 */

export default function ProductSlider({
  products,
  title,
  href,
}: {
  products: Product[];
  title: string;
  href: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setAtStart(track.scrollLeft <= 1);
    setAtEnd(track.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    return () => observer.disconnect();
  }, [sync]);

  function page(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  }

  const overflows = !(atStart && atEnd);
  const arrowClass =
    "rounded-full border border-line bg-white p-2 text-ink/60 transition-colors hover:border-accent hover:text-accent disabled:opacity-35 disabled:hover:border-line disabled:hover:text-ink/60";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        <div className="flex items-center gap-3">
          <Link href={href} className="text-sm font-medium text-accent hover:text-accent-deep">
            Alles bekijken →
          </Link>
          {overflows && (
            <div className="hidden gap-2 sm:flex">
              <button
                type="button"
                onClick={() => page(-1)}
                disabled={atStart}
                aria-label={`${title}: vorige producten`}
                className={arrowClass}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => page(1)}
                disabled={atEnd}
                aria-label={`${title}: volgende producten`}
                className={arrowClass}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={sync}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      >
        {products.map((product) => (
          <div
            key={product.handle}
            className="w-[60%] shrink-0 snap-start sm:w-[38%] lg:w-[23.5%]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
