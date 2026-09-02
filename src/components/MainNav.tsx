"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, Mail, MapPin, Menu, Phone, ShoppingCart, X } from "lucide-react";

export type NavCollection = {
  handle: string;
  title: string;
  count?: number;
  image?: { src: string; alt: string };
};

const pageLinks = [
  { href: "/", label: "Home" },
  { href: "/aanbiedingen-2/", label: "Aanbiedingen" },
  { href: "/onze-realisaties/", label: "Realisaties" },
  { href: "/offerte-aanvragen/", label: "Offerte aanvragen" },
  { href: "/over-ons/", label: "Over ons" },
  { href: "/contact/", label: "Contact" },
];

export default function MainNav({ collections }: { collections: NavCollection[] }) {
  const pathname = usePathname();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setMegaOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMegaOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const navLinkClass = (active: boolean) =>
    `relative flex h-[72px] items-center whitespace-nowrap px-4 text-[15px] font-semibold transition-colors after:absolute after:inset-x-4 after:bottom-0 after:h-1 after:origin-left after:bg-accent after:transition-transform ${active ? "text-white after:scale-x-100" : "text-white/75 after:scale-x-0 hover:text-white hover:after:scale-x-100"}`;

  return (
    <div ref={wrapRef} className="relative bg-brand-dark text-white">
      <div className="mx-auto flex max-w-[1400px] items-stretch justify-between px-4 sm:px-6 lg:px-8">
        <nav className="hidden min-w-0 items-stretch lg:flex" aria-label="Hoofdnavigatie">
          <Link href="/" className={navLinkClass(isActive("/"))} onMouseEnter={() => setMegaOpen(false)}>Home</Link>

          <button type="button" onClick={() => setMegaOpen((open) => !open)} className={navLinkClass(megaOpen || pathname.startsWith("/project/") || pathname === "/producten/")} aria-expanded={megaOpen} aria-controls="producten-menu">
            Producten &amp; Prijzen
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
          </button>

          {pageLinks.slice(1).map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass(isActive(link.href))} onMouseEnter={() => setMegaOpen(false)}>{link.label}</Link>
          ))}
        </nav>

        <div className="flex h-16 flex-1 items-center justify-between lg:hidden">
          <button type="button" className="inline-flex h-11 items-center gap-2 rounded-sm px-1 text-sm font-semibold text-white" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            Menu
          </button>
          <Link href="/shop/" className="inline-flex h-11 items-center gap-2 rounded-sm bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-accent-deep">
            <ShoppingCart className="h-4 w-4" />
            Shop
          </Link>
        </div>

        <Link href="/shop/" className="hidden min-h-[72px] shrink-0 items-center gap-3 bg-accent px-7 text-[15px] font-bold text-white transition-colors hover:bg-accent-deep xl:inline-flex">
          <ShoppingCart className="h-5 w-5" />
          Naar de shop
        </Link>
      </div>

      {megaOpen && (
        <div id="producten-menu" className="absolute inset-x-0 top-full z-50 hidden border-t-4 border-accent bg-white text-ink shadow-[0_24px_50px_-28px_rgba(36,39,41,0.45)] lg:block" onMouseLeave={() => setMegaOpen(false)}>
          <div className="mx-auto grid max-w-[1400px] gap-10 px-8 py-9 lg:grid-cols-[1fr_300px]">
            <div>
              <h2 className="text-xl font-bold text-ink">Producten &amp; Prijzen</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-8 xl:grid-cols-3">
                {collections.map((collection) => (
                  <Link key={collection.handle} href={collection.handle} onClick={() => setMegaOpen(false)} className="group flex min-h-12 items-center gap-3 border-b border-line py-2.5">
                    {collection.image && (
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm">
                        <Image src={collection.image.src} alt={collection.image.alt} fill sizes="2.5rem" className="object-cover" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink group-hover:text-accent">{collection.title}</span>
                      {collection.count !== undefined && <span className="text-xs text-ink/50">{collection.count} {collection.count === 1 ? "product" : "producten"}</span>}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </Link>
                ))}
              </div>
              <Link href="/producten/" onClick={() => setMegaOpen(false)} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent-deep">
                Bekijk alle producten
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-col justify-between rounded-sm bg-brand-soft p-7">
              <div>
                <h2 className="text-xl font-bold text-ink">Afsluitingscalculator</h2>
                <p className="mt-3 text-sm leading-6 text-ink/70">Kies houtsoort, hoogte en lengte. Ontvang meteen een richtprijs met aanbevolen materiaallijst.</p>
              </div>
              <Link href="/calculator/" onClick={() => setMegaOpen(false)} className="mt-7 inline-flex w-fit items-center gap-2 rounded-sm bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-deep">
                Start de calculator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {mobileOpen && (
        <nav id="mobile-navigation" className="border-t border-white/15 bg-brand-dark lg:hidden" aria-label="Mobiele navigatie">
          <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6">
            <div className="grid gap-1">
              {[{ href: "/", label: "Home" }, { href: "/producten/", label: "Producten & Prijzen" }, ...pageLinks.slice(1)].map((link) => (
                <Link key={link.href} href={link.href} className={`rounded-sm px-3 py-3 text-sm font-semibold transition-colors ${isActive(link.href) ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`} onClick={() => setMobileOpen(false)}>{link.label}</Link>
              ))}
            </div>

            <div className="mt-4 grid gap-3 border-t border-white/15 px-3 pt-4 text-sm text-white/70 sm:grid-cols-2">
              <a href="https://maps.google.com/?q=A.+Van+Der+Moerenstraat+39,+9240+Zele" className="flex items-start gap-2 hover:text-white">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-bright" />
                A. Van Der Moerenstraat 39, 9240 Zele
              </a>
              <div className="space-y-2">
                <a href="tel:+3252558858" className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4 text-accent-bright" />+32 5 255 88 58</a>
                <a href="mailto:info@natuurhout.be" className="flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4 text-accent-bright" />info@natuurhout.be</a>
              </div>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
