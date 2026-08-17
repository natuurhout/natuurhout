"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type NavCollection = {
  handle: string;
  title: string;
  count: number;
  image?: { src: string; alt: string };
};

// Simple page links — labels/targets follow the live .be menu (URL parity).
const pageLinks = [
  { href: "/aanbiedingen-2/", label: "Aanbiedingen" },
  { href: "/onze-realisaties/", label: "Realisaties" },
  { href: "/natuurhoutadvies/", label: "Houtadvies" },
  { href: "/over-ons/", label: "Over ons" },
  { href: "/contact/", label: "Contact" },
];

export default function MainNav({ collections }: { collections: NavCollection[] }) {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setMegaOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative bg-brand-dark text-white">
      <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Desktop nav */}
        <nav className="hidden items-stretch lg:flex">
          <button
            type="button"
            onClick={() => setMegaOpen((v) => !v)}
            onMouseEnter={() => setMegaOpen(true)}
            className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium transition-colors ${
              megaOpen ? "bg-white/10 text-accent-bright" : "hover:bg-white/5"
            }`}
            aria-expanded={megaOpen}
          >
            Producten &amp; Prijzen
            <span aria-hidden className={`text-xs transition-transform ${megaOpen ? "rotate-180" : ""}`}>
              ▾
            </span>
          </button>
          <Link
            href="/calculator/"
            className="flex items-center px-5 py-3.5 text-sm font-medium hover:bg-white/5"
            onMouseEnter={() => setMegaOpen(false)}
          >
            Calculator
          </Link>
          {pageLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center px-5 py-3.5 text-sm font-medium hover:bg-white/5"
              onMouseEnter={() => setMegaOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="px-2 py-3.5 text-sm font-semibold lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
        >
          ☰ Menu
        </button>

        <Link
          href="/offerte-aanvragen/"
          className="hidden items-center py-3.5 text-sm font-semibold text-accent-bright hover:text-white sm:flex"
        >
          Offerte aanvragen →
        </Link>
      </div>

      {/* Mega menu (desktop) */}
      {megaOpen && (
        <div
          className="absolute inset-x-0 top-full z-50 hidden border-t border-white/10 bg-white text-ink shadow-xl lg:block"
          onMouseLeave={() => setMegaOpen(false)}
        >
          <div className="grid w-full gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">
                Assortiment
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-3">
                {collections.map((c) => (
                  <Link
                    key={c.handle}
                    href={`/producten/#${c.handle}`}
                    onClick={() => setMegaOpen(false)}
                    className="group flex items-center gap-3 rounded-xl border border-brand/15 bg-ground/60 p-3 transition-colors hover:border-accent hover:bg-brand-soft"
                  >
                    {c.image && (
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-soft">
                        <Image src={c.image.src} alt={c.image.alt} fill sizes="3rem" className="object-cover" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold group-hover:text-accent">
                        {c.title}
                      </span>
                      <span className="text-xs text-ink/50">
                        {c.count} {c.count === 1 ? "product" : "producten"}
                      </span>
                    </span>
                    <span aria-hidden className="ml-auto text-ink/30 group-hover:text-accent">›</span>
                  </Link>
                ))}
                <Link
                  href="/producten/"
                  onClick={() => setMegaOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand/25 p-3 text-sm font-semibold text-brand transition-colors hover:border-accent hover:text-accent"
                >
                  Alle producten →
                </Link>
              </div>
            </div>
            {/* Highlight card, kastanjegjerde-style: configurator CTA */}
            <div className="rounded-card bg-brand-soft p-6">
              <p className="text-base font-semibold">Afsluitingscalculator</p>
              <p className="mt-2 text-sm text-ink/70">
                Kies houtsoort, hoogte en lengte — en krijg meteen een
                richtprijs met aanbevolen materiaallijst.
              </p>
              <Link
                href="/calculator/"
                onClick={() => setMegaOpen(false)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
              >
                Start de calculator →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-white/10 lg:hidden">
          <div className="space-y-1 px-4 py-4">
            <Link href="/producten/" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setMobileOpen(false)}>
              Producten &amp; Prijzen
            </Link>
            <Link href="/calculator/" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setMobileOpen(false)}>
              Calculator
            </Link>
            {pageLinks.map((l) => (
              <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10" onClick={() => setMobileOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/offerte-aanvragen/" className="block rounded-lg px-3 py-2 text-sm font-semibold text-accent-bright" onClick={() => setMobileOpen(false)}>
              Offerte aanvragen →
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
