"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, ChevronDown, Mail, Menu, Phone, Search, ShoppingCart, X } from "lucide-react";
import OpeningStatus from "@/components/OpeningStatus";
import SearchBox from "@/components/SearchBox";
import { EMAIL, PHONE, SHOP_URL, WHATSAPP } from "@/lib/contact";
import { WhatsAppIcon } from "@/components/WhatsApp";
import { groupHref, pageLinks, productMenu, QUOTE_HREF } from "@/lib/navigation";
import type { SearchItem } from "@/lib/search";

/*
 * The dark navigation bar (≥ 992px) and the compact mobile bar (< 992px).
 * The <header> around it is sticky with a negative top (see Navbar.tsx), so
 * the trust strip and the logo row scroll away while this bar stays: no
 * height changes, no layout jump. Once it sticks, a small logo slides in.
 */

const productPaths = productMenu.flatMap((group) => [groupHref(group), ...group.links.map((link) => link.href)]);

export default function MainNav({ searchItems }: { searchItems: SearchItem[] }) {
  const pathname = usePathname();
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProducts, setMobileProducts] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [stuck, setStuck] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const mobileBarRef = useRef<HTMLDivElement>(null);
  const productButton = useRef<HTMLButtonElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const hamburger = useRef<HTMLButtonElement>(null);
  const hoverOpenedAt = useRef(0);

  // Stuck = the bar has reached the top of the viewport.
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const bar = barRef.current?.offsetParent ? barRef.current : mobileBarRef.current;
      setStuck(Boolean(bar && bar.getBoundingClientRect().top <= 1 && window.scrollY > 0));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const closeMobile = useCallback((returnFocus = false) => {
    setMobileOpen(false);
    if (returnFocus) hamburger.current?.focus();
  }, []);

  // Close everything on navigation.
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
    setMobileSearch(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (megaOpen) {
        setMegaOpen(false);
        productButton.current?.focus();
      }
      if (mobileOpen) closeMobile(true);
    }
    function onPointerDown(event: MouseEvent) {
      if (!barRef.current?.contains(event.target as Node)) setMegaOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [megaOpen, mobileOpen, closeMobile]);

  // The open mobile menu owns the screen: the page behind it does not scroll.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const megaLinks = () => [...(megaRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? [])];

  function onProductKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMegaOpen(true);
      requestAnimationFrame(() => megaLinks()[0]?.focus());
    }
  }

  function onMegaKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const links = megaLinks();
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    if (next < 0) productButton.current?.focus();
    else links[Math.min(next, links.length - 1)]?.focus();
  }

  const isActive = (href: string) => pathname.startsWith(href);
  const productsActive = megaOpen || productPaths.some(isActive) || pathname === "/producten/";

  const navLink = (active: boolean) =>
    `relative flex h-16 items-center whitespace-nowrap px-2.5 text-[14px] font-semibold transition-colors after:absolute after:inset-x-2.5 after:bottom-0 after:h-1 after:origin-left after:bg-accent after:transition-transform xl:px-4 xl:text-[15px] xl:after:inset-x-4 ${
      active ? "text-white after:scale-x-100" : "text-white/80 after:scale-x-0 hover:text-white hover:after:scale-x-100"
    }`;
  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-sm bg-accent-deep font-bold text-white shadow-sm transition-colors hover:bg-[#9a520d]";

  return (
    <>
      {/* Desktop (≥ 992px) */}
      <div
        ref={barRef}
        className={`relative hidden bg-brand-dark text-white transition-shadow duration-300 desk:block ${stuck ? "shadow-[0_10px_24px_-14px_rgba(0,0,0,0.6)]" : ""}`}
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Natuurhout home"
            inert={!stuck}
            className={`shrink-0 overflow-hidden transition-all duration-300 ease-out ${stuck ? "mr-3 max-w-[120px] opacity-100 xl:mr-5 xl:max-w-[160px]" : "mr-0 max-w-0 opacity-0"}`}
          >
            <Image src="/logo-natuurhout-licht.png" alt="Natuurhout" width={557} height={107} className="h-auto w-[112px] max-w-none xl:w-[150px]" />
          </Link>

          <nav aria-label="Hoofdnavigatie" className="flex min-w-0 items-stretch">
            <button
              ref={productButton}
              type="button"
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse" || megaOpen) return;
                hoverOpenedAt.current = Date.now();
                setMegaOpen(true);
              }}
              onClick={() => {
                // A mouse that opened the menu by hovering should not close it again with the click that follows.
                // (Checked on the ref: the click can arrive before React re-renders the hover's state.)
                if (Date.now() - hoverOpenedAt.current < 500) return;
                setMegaOpen((open) => !open);
              }}
              onKeyDown={onProductKeyDown}
              className={navLink(productsActive)}
              aria-expanded={megaOpen}
              aria-controls="producten-menu"
              aria-haspopup="true"
            >
              Producten &amp; Prijzen
              <ChevronDown aria-hidden className={`ml-1.5 h-4 w-4 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
            </button>
            {pageLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navLink(isActive(link.href))}
                aria-current={isActive(link.href) ? "page" : undefined}
                onPointerEnter={() => setMegaOpen(false)}
                onFocus={() => setMegaOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 pl-3 xl:gap-3">
            <Link href={QUOTE_HREF} className={`${primaryButton} h-10 px-3.5 text-[14px] xl:px-5`}>
              Offerte aanvragen
            </Link>
            <a
              href={SHOP_URL}
              className="inline-flex h-10 items-center gap-2 rounded-sm border border-white/45 px-3.5 text-[14px] font-bold text-white transition-colors hover:border-white hover:bg-white hover:text-brand-dark xl:px-5"
            >
              <ShoppingCart aria-hidden className="h-4 w-4" />
              {/* Below 1280px the compact bar also holds the logo: the label shortens to fit. */}
              <span className={stuck ? "hidden xl:inline" : undefined}>Naar de shop</span>
              {stuck && <span className="xl:hidden">Shop</span>}
            </a>
          </div>
        </div>

        <div
          id="producten-menu"
          ref={megaRef}
          hidden={!megaOpen}
          onKeyDown={onMegaKeyDown}
          onBlur={(event) => {
            if (!barRef.current?.contains(event.relatedTarget as Node)) setMegaOpen(false);
          }}
          className="absolute inset-x-0 top-full z-50 border-t-4 border-accent bg-white text-ink shadow-[0_24px_50px_-28px_rgba(36,39,41,0.45)]"
        >
          <div className="mx-auto grid max-w-[1400px] gap-8 px-8 py-8 xl:grid-cols-[1fr_280px]">
            <div>
              <div className="grid grid-cols-5 gap-x-6 gap-y-6 xl:gap-x-8">
                {productMenu.map((group) => (
                  <div key={group.title}>
                    <h2 className="border-b-2 border-accent pb-2 text-xs font-bold uppercase tracking-[0.14em] text-ink">
                      <Link
                        href={groupHref(group)}
                        onClick={() => setMegaOpen(false)}
                        aria-current={pathname === groupHref(group) ? "page" : undefined}
                        className="group/kop inline-flex items-center gap-1.5 transition-colors hover:text-accent-deep"
                      >
                        {group.title}
                        <ArrowRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-accent transition-transform group-hover/kop:translate-x-0.5" />
                      </Link>
                    </h2>
                    <ul className="mt-2">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={() => setMegaOpen(false)}
                            aria-current={isActive(link.href) ? "page" : undefined}
                            className={`flex min-h-10 items-center border-b border-line py-2 text-sm font-semibold transition-colors hover:text-accent-deep ${
                              isActive(link.href) ? "text-accent-deep" : "text-ink"
                            }`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
                <Link href="/producten/" onClick={() => setMegaOpen(false)} className="inline-flex items-center gap-2 text-sm font-bold text-accent-deep hover:text-ink">
                  Bekijk alle producten <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
                <Link href="/shop/" onClick={() => setMegaOpen(false)} className="inline-flex items-center gap-2 text-sm font-bold text-accent-deep hover:text-ink">
                  Alle prijzen in de catalogus <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="hidden flex-col justify-between rounded-sm bg-brand-soft p-7 xl:flex">
              <div>
                <h2 className="text-xl font-bold text-ink">Afsluitingscalculator</h2>
                <p className="mt-3 text-sm leading-6 text-ink/75">Kies houtsoort, hoogte en lengte. Ontvang meteen een richtprijs met aanbevolen materiaallijst.</p>
              </div>
              <Link href="/calculator/" onClick={() => setMegaOpen(false)} className={`${primaryButton} mt-7 w-fit px-5 py-3 text-sm`}>
                Start de calculator <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile and tablet (< 992px) */}
      <div
        ref={mobileBarRef}
        className={`relative border-b border-line bg-white transition-shadow duration-300 desk:hidden ${stuck || mobileOpen ? "shadow-[0_8px_20px_-14px_rgba(0,0,0,0.45)]" : ""}`}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 sm:px-6">
          <Link href="/" aria-label="Natuurhout home" className="mr-auto shrink-0">
            <Image src="/wp-content/uploads/2016/01/logo-natuurhout-new-1.png" alt="Natuurhout" width={557} height={107} className="h-auto w-[128px] min-[400px]:w-[150px] sm:w-[190px]" priority />
          </Link>
          <button
            type="button"
            onClick={() => {
              setMobileSearch((open) => !open);
              setMobileOpen(false);
            }}
            aria-expanded={mobileSearch}
            aria-controls="mobiel-zoeken"
            aria-label={mobileSearch ? "Zoeken sluiten" : "Zoeken"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-line text-ink/70 transition-colors hover:border-accent hover:text-accent-deep"
          >
            {mobileSearch ? <X aria-hidden className="h-[18px] w-[18px]" /> : <Search aria-hidden className="h-[18px] w-[18px]" />}
          </button>
          <a
            href={PHONE.href}
            aria-label={`Bel ons: ${PHONE.label}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-line text-accent-deep transition-colors hover:border-accent hover:bg-accent-deep hover:text-white"
          >
            <Phone aria-hidden className="h-[18px] w-[18px]" />
          </a>
          <Link href={QUOTE_HREF} className={`${primaryButton} h-10 shrink-0 px-3 text-sm`}>
            Offerte
          </Link>
          <button
            ref={hamburger}
            type="button"
            onClick={() => {
              setMobileOpen((open) => !open);
              setMobileSearch(false);
            }}
            aria-expanded={mobileOpen}
            aria-controls="mobiel-menu"
            aria-label={mobileOpen ? "Menu sluiten" : "Menu openen"}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-dark text-white transition-colors hover:bg-brand"
          >
            {mobileOpen ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
          </button>
        </div>

        {mobileSearch && (
          <div id="mobiel-zoeken" className="border-t border-line px-4 py-3 sm:px-6">
            <SearchBox items={searchItems} autoFocus onNavigate={() => setMobileSearch(false)} />
          </div>
        )}

        <nav
          id="mobiel-menu"
          aria-label="Mobiele navigatie"
          hidden={!mobileOpen}
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-line bg-white shadow-xl"
        >
          <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-2 sm:px-6">
            <ul className="divide-y divide-line">
              <li>
                <button
                  type="button"
                  onClick={() => setMobileProducts((open) => !open)}
                  aria-expanded={mobileProducts}
                  aria-controls="mobiel-producten"
                  className="flex w-full items-center justify-between py-3.5 text-left text-[15px] font-bold text-ink"
                >
                  Producten &amp; Prijzen
                  <ChevronDown aria-hidden className={`h-5 w-5 text-ink/60 transition-transform ${mobileProducts ? "rotate-180" : ""}`} />
                </button>
                <div id="mobiel-producten" hidden={!mobileProducts} className="pb-3">
                  {productMenu.map((group) => (
                    <div key={group.title} className="mt-2">
                      <Link
                        href={groupHref(group)}
                        onClick={() => closeMobile()}
                        className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent-deep hover:text-ink"
                      >
                        {group.title}
                        <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                      </Link>
                      <ul className="mt-1">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={() => closeMobile()}
                              aria-current={isActive(link.href) ? "page" : undefined}
                              className="block rounded-sm px-3 py-2 text-sm font-medium text-ink/85 hover:bg-ground hover:text-ink"
                            >
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <Link href="/producten/" onClick={() => closeMobile()} className="mt-2 inline-flex items-center gap-2 px-3 py-2 text-sm font-bold text-accent-deep">
                    Bekijk alle producten <ArrowRight aria-hidden className="h-4 w-4" />
                  </Link>
                </div>
              </li>
              {pageLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => closeMobile()}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`block py-3.5 text-[15px] font-bold ${isActive(link.href) ? "text-accent-deep" : "text-ink"}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <Link href={QUOTE_HREF} onClick={() => closeMobile()} className={`${primaryButton} h-12 px-5 text-[15px]`}>
                Offerte aanvragen
              </Link>
              <a href={SHOP_URL} className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-brand-dark px-5 text-[15px] font-bold text-brand-dark hover:bg-brand-dark hover:text-white">
                <ShoppingCart aria-hidden className="h-4 w-4" />
                Naar de shop
              </a>
            </div>

            <div className="mt-6 space-y-3 rounded-sm bg-ground p-4 text-sm">
              <OpeningStatus />
              <a href={PHONE.href} className="flex items-center gap-2 font-semibold text-ink hover:text-accent-deep">
                <Phone aria-hidden className="h-4 w-4 text-accent" /> {PHONE.label}
              </a>
              <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-ink hover:text-accent-deep">
                <WhatsAppIcon className="h-4 w-4 text-[#1da851]" /> WhatsApp ({WHATSAPP.label})
              </a>
              <a href={EMAIL.href} className="flex items-center gap-2 font-semibold text-ink hover:text-accent-deep">
                <Mail aria-hidden className="h-4 w-4 text-accent" /> {EMAIL.label}
              </a>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
