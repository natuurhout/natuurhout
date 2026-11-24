"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type LightboxPhoto = { src: string; alt: string };

/*
 * Full-screen photo viewer for a project's photos. The page links each photo
 * to its full-size file (`<a href data-lightbox-index>`), so the photos still
 * open without JavaScript; with it, a click opens this pop-up instead: the
 * photo large, arrows (and swipe, and the arrow keys) for the others, and a
 * row of thumbnails below to jump straight to one. Used on the project pages
 * and on the product pages (gallery and "Foto's" tab); `onChange` lets a
 * gallery follow the photo the visitor ended on.
 */
export default function PhotoLightbox({ photos, onChange }: { photos: LightboxPhoto[]; onChange?: (index: number) => void }) {
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLUListElement>(null);
  const touchX = useRef<number | null>(null);
  const count = photos.length;

  const go = useCallback((step: number) => setIndex((i) => (i === null ? i : (i + step + count) % count)), [count]);
  const close = useCallback(() => {
    setIndex(null);
    opener.current?.focus();
  }, []);

  // Open from any photo link on the page (normal clicks only, so ctrl/cmd-
  // click still opens the file in a new tab).
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLElement>("a[data-lightbox-index], a[data-lightbox-src]");
      if (!link) return;
      // By position, or by photo (a price list's photo per choice): only a photo this viewer holds.
      const i = link.dataset.lightboxSrc !== undefined ? photos.findIndex((photo) => photo.src === link.dataset.lightboxSrc) : Number(link.dataset.lightboxIndex);
      if (!Number.isInteger(i) || i < 0 || i >= count) return;
      event.preventDefault();
      opener.current = link;
      setIndex(i);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [count, photos]);

  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowLeft") go(-1);
      else if (event.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, close, go]);

  useEffect(() => {
    if (index !== null) onChange?.(index);
  }, [index, onChange]);

  // Keep the current thumbnail in view.
  useEffect(() => {
    if (index === null) return;
    strip.current?.children[index]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  if (index === null) return null;
  const photo = photos[index];

  // Rendered on <body>: inside a sticky column (the product gallery) the
  // viewer would otherwise sit under the sticky header.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto's van het project"
      className="fixed inset-0 z-[100] flex flex-col bg-[#1c1f21]/95 text-white backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && close()}
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <p className="text-sm font-medium tabular-nums text-white/80" aria-live="polite">
          {index + 1} / {count}
        </p>
        <button
          ref={closeButton}
          type="button"
          onClick={close}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="Sluiten"
        >
          <X aria-hidden className="h-6 w-6" />
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1"
        onClick={(event) => event.target === event.currentTarget && close()}
        onTouchStart={(event) => (touchX.current = event.touches[0].clientX)}
        onTouchEnd={(event) => {
          if (touchX.current === null) return;
          const dx = event.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        }}
      >
        <Image
          key={photo.src}
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="100vw"
          className="object-contain px-2 sm:px-20"
          loading="eager"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ink/60 ring-1 ring-white/20 transition-colors hover:bg-accent-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:left-4"
              aria-label="Vorige foto"
            >
              <ChevronLeft aria-hidden className="h-7 w-7" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ink/60 ring-1 ring-white/20 transition-colors hover:bg-accent-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:right-4"
              aria-label="Volgende foto"
            >
              <ChevronRight aria-hidden className="h-7 w-7" />
            </button>
          </>
        )}
      </div>

      <p className="mx-auto max-w-3xl px-4 pt-3 text-center text-sm text-white/75">{photo.alt}</p>

      {count > 1 && (
        <ul ref={strip} className="mx-auto flex max-w-full gap-2 overflow-x-auto px-4 pb-4 pt-3 sm:px-6">
          {photos.map((thumb, i) => (
            <li key={thumb.src} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={`relative block h-14 w-20 overflow-hidden rounded-lg ring-2 transition sm:h-16 sm:w-24 ${
                  i === index ? "ring-accent" : "opacity-60 ring-transparent hover:opacity-100"
                }`}
                aria-label={`Foto ${i + 1}`}
                aria-current={i === index}
              >
                <Image src={thumb.src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body,
  );
}
