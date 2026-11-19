"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import PhotoLightbox from "@/components/PhotoLightbox";

/*
 * Small product photo with thumbnails, kept to the side of the price list so
 * prices are visible straight away. Works for shop photos (Shopify CDN) and
 * the mirrored WordPress media below /wp-content/uploads/. Clicking the photo
 * opens it large in a pop-up with all the others (PhotoLightbox), as on the
 * project pages; the "Foto's" tab of a product page opens the same pop-up.
 * Arrows on the photo and beside the thumbnails (and a swipe on phones) go
 * to the previous or next photo.
 */

export type GalleryImage = { src: string; alt: string };

const arrowOnPhoto =
  "absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-md ring-1 ring-ink/10 transition-colors hover:bg-white hover:text-accent-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
const arrowBesideStrip =
  "grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-ink/70 transition-colors hover:border-accent hover:text-accent-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";

export default function ProductGallery({ images, badge }: { images: GalleryImage[]; badge?: string }) {
  const [index, setIndex] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const go = (step: number) => setIndex((i) => (i + step + count) % count);

  // Keep the current thumbnail in view, without scrolling the page itself.
  useEffect(() => {
    const row = strip.current;
    const thumb = row?.children[index] as HTMLElement | undefined;
    if (!row || !thumb) return;
    row.scrollTo({ left: thumb.offsetLeft - row.clientWidth / 2 + thumb.clientWidth / 2, behavior: "smooth" });
  }, [index]);

  const img = images[index] ?? images[0];
  if (!img) return null;

  return (
    <div>
      <div
        className="relative mx-auto max-w-md md:max-w-none"
        onTouchStart={(event) => (touchX.current = event.touches[0].clientX)}
        onTouchEnd={(event) => {
          if (touchX.current === null || count < 2) return;
          const dx = event.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <a
          href={img.src}
          data-lightbox-index={index}
          aria-label={`${img.alt || "Foto"} vergroten`}
          className="group relative block aspect-[4/3] cursor-zoom-in overflow-hidden rounded-card bg-white ring-1 ring-line md:aspect-square"
        >
          {/* Photos come in every format: the whole photo is shown, and a blurred
              copy of it fills the rest of the frame instead of white bars. */}
          <Image src={img.src} alt="" aria-hidden fill sizes="10vw" className="scale-110 object-cover opacity-60 blur-xl" />
          <Image src={img.src} alt={img.alt} fill sizes="(max-width: 768px) 100vw, 30vw" className="object-contain" priority />
          {badge && (
            <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
              {badge}
            </span>
          )}
          <span
            aria-hidden
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1.5 text-xs font-semibold text-white opacity-90 transition-opacity group-hover:opacity-100"
          >
            <Expand className="h-3.5 w-3.5" />
            {count > 1 ? `${index + 1} / ${count}` : "Vergroten"}
          </span>
        </a>
        {count > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className={`${arrowOnPhoto} left-2.5`} aria-label="Vorige foto">
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} className={`${arrowOnPhoto} right-2.5`} aria-label="Volgende foto">
              <ChevronRight aria-hidden className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="mx-auto mt-2.5 flex max-w-md items-center gap-2 md:max-w-none">
          <button type="button" onClick={() => go(-1)} className={arrowBesideStrip} aria-label="Vorige foto">
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </button>
          <div ref={strip} className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth px-0.5 py-1">
            {images.map((im, i) => (
              <button
                key={im.src}
                type="button"
                onClick={() => setIndex(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                  i === index ? "ring-accent" : "ring-line hover:ring-brand/40"
                }`}
                aria-label={`Afbeelding ${i + 1}`}
                aria-current={i === index}
              >
                <Image src={im.src} alt={im.alt} fill sizes="3.5rem" className="object-cover" />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go(1)} className={arrowBesideStrip} aria-label="Volgende foto">
            <ChevronRight aria-hidden className="h-4 w-4" />
          </button>
        </div>
      )}
      <PhotoLightbox photos={images} onChange={setIndex} />
    </div>
  );
}
