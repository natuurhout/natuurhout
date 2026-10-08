"use client";

import Image from "next/image";
import { useState } from "react";

/*
 * Small product photo with thumbnails, kept to the side of the price list so
 * prices are visible straight away. Works for shop photos (Shopify CDN) and
 * the mirrored WordPress media below /wp-content/uploads/.
 */

export type GalleryImage = { src: string; alt: string };

export default function ProductGallery({ images, badge }: { images: GalleryImage[]; badge?: string }) {
  const [index, setIndex] = useState(0);
  const img = images[index] ?? images[0];
  if (!img) return null;

  return (
    <div>
      <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-card bg-white ring-1 ring-line md:aspect-square md:max-w-none">
        {/* Photos come in every format: the whole photo is shown, and a blurred
            copy of it fills the rest of the frame instead of white bars. */}
        <Image src={img.src} alt="" aria-hidden fill sizes="10vw" className="scale-110 object-cover opacity-60 blur-xl" />
        <Image src={img.src} alt={img.alt} fill sizes="(max-width: 768px) 100vw, 30vw" className="object-contain" priority />
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
            {badge}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="mx-auto mt-2.5 flex max-w-md gap-2 overflow-x-auto pb-1 md:max-w-none">
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
      )}
    </div>
  );
}
