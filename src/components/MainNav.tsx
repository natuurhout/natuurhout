"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Menu, X } from "lucide-react";

export type NavCollection = {
  handle: string;
  title: string;
  count?: number;
  image?: { src: string; alt: string };
};

// Simple page links — labels/targets follow the live .be menu (URL parity).
const pageLinks = [
  { href: "/", label: "Home" },
  { href: "/aanbiedingen-2/", label: "Aanbiedingen" },
  { href: "/onze-realisaties/", label: "Realisaties" },
  { href: "/offerte-aanvragen/", label: "Offerte aanvragen" },
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
    <div ref={wrapRef} className="relative border-b border-line bg-ground/95 backdrop-blur">
      <div className="flex w-full items-center justify-between px-4 sm:px-6 lg:px-10">
        {/* Desktop nav */}
        <nav className="hidden items-stretch gap-1 lg:flex">
          <button
            type="button"
            onClick={() => setMegaOpen((v) => !v)}
            onMouseEnter={() => setMegaOpen(true)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              megaOpen
                ? "border-accent text-accent"
                : "border-transparent text-ink/70 hover:text-ink"
            }`}
            aria-expanded={megaOpen}
          >
            Producten &amp; Prijzen
            <ChevronDown
              className={`h-4 w-4 transition-transform ${megaOpen ? "rotate-180" : ""}`}
            />
          </button>
          {pageLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center border-b-2 border-transparent px-4 py-3 text-sm font-medium text-ink/70 transition-colors hover:text-ink"
              onMouseEnter={() => setMegaOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex items-center gap-2 py-3 text-sm font-medium lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          Menu
        </button>
      </div>

      {/* Mega menu (desktop) */}
      {megaOpen && (
        <div
          className="absolute inset-x-0 top-full z-50 hidden border-b border-line bg-ground shadow-[0_24px_48px_-24px_rgba(38,34,27,0.35)] lg:block"
          onMouseLeave={() => setMegaOpen(false)}
        >
          <div className="grid w-full gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_300px] lg:px-10">
            <div>
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                <span aria-hidden className="h-px w-8 bg-accent" />
                Assortiment
              </p>
              <div className="mt-5 grid grid-cols-2 gap-x-8 xl:grid-cols-3">
                {collections.map((c) => (
                  <Link
                    key={c.handle}
                    href={c.handle}
                    onClick={() => setMegaOpen(false)}
                    className="group flex items-center gap-4 border-b border-line py-3"
                  >
                    {c.image && (
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
                        <Image src={c.image.src} alt={c.image.alt} fill sizes="3rem" className="object-cover" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink group-hover:text-accent">
                        {c.title}
                      </span>
                      {c.count !== undefined && <span className="text-xs text-ink/45">{c.count} {c.count === 1 ? "product" : "producten"}</span>}
                    </span>
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-ink/25 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </Link>
                ))}
              </div>
              <Link
                href="/producten/"
                onClick={() => setMegaOpen(false)}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-deep"
              >
                Bekijk alle producten
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {/* Highlight card: calculator CTA */}
            <div className="flex flex-col justify-between rounded-card bg-brand-dark p-7 text-white">
              <div>
                <p className="font-display text-xl font-semibold">
                  Afsluitingscalculator
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Kies houtsoort, hoogte en lengte — en krijg meteen een
                  richtprijs met aanbevolen materiaallijst.
                </p>
              </div>
              <Link
                href="/calculator/"
                onClick={() => setMegaOpen(false)}
                className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
              >
                Start de calculator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-line lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {[{ href: "/producten/", label: "Producten & Prijzen" },
              { href: "/shop/", label: "Shop" },
              ...pageLinks,
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-ink/80 hover:bg-brand-soft"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
