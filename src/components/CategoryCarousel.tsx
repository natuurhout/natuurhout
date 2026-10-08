"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { CategoryTile } from "@/lib/categories";


const INTERVAL_MS = 2800;

/*
 * Homepage product groups as a carousel that moves on by itself, one tile
 * every few seconds, and starts over at the end. Native scroll-snap does the
 * moving, so it is a plain swipe on touch and every tile is in the HTML.
 * It stops while the pointer or focus is on it, for visitors who prefer
 * reduced motion, and with the pause button (WCAG 2.2.2).
 */
export default function CategoryCarousel({ tiles }: { tiles: CategoryTile[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(false);
  }, []);

  const step = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    const tile = track?.firstElementChild as HTMLElement | null;
    if (!track || !tile) return;
    const by = tile.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    const max = track.scrollWidth - track.clientWidth;
    if (direction === 1 && track.scrollLeft >= max - 2) track.scrollTo({ left: 0, behavior: "smooth" });
    else if (direction === -1 && track.scrollLeft <= 2) track.scrollTo({ left: max, behavior: "smooth" });
    else track.scrollBy({ left: direction * by, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!playing || hovered) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) step(1);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [playing, hovered, step]);

  const buttonClass =
    "rounded-full border border-line bg-white p-2 text-ink/60 transition-colors hover:border-accent hover:text-accent";

  return (
    <div
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className="mb-4 flex justify-end gap-2">
        <button type="button" onClick={() => step(-1)} aria-label="Vorige productgroep" className={buttonClass}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Carrousel pauzeren" : "Carrousel afspelen"}
          aria-pressed={!playing}
          className={buttonClass}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Volgende productgroep" className={buttonClass}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carrousel"
        aria-label="Onze productgroepen"
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group flex w-[calc((100%-1rem)/2)] shrink-0 snap-start flex-col overflow-hidden rounded-card border border-line bg-white transition-all duration-300 hover:border-brand/30 hover:shadow-lg hover:shadow-ink/10 sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft/50">
              <Image
                src={tile.src}
                alt={tile.label}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
            </div>
            <p className="flex flex-1 items-center justify-between gap-2 p-3.5 text-sm font-medium leading-snug text-ink group-hover:text-accent">
              {tile.label}
              <ArrowRight className="h-4 w-4 shrink-0 text-ink/30 transition-colors group-hover:text-accent" />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
