import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, MapPin, Phone } from "lucide-react";
import MainNav, { type NavCollection } from "@/components/MainNav";
import { collectionImage, collections } from "@/lib/catalog";

// Header: utility bar → logo bar → dark nav with mega menu.
// USP labels in the utility bar are VERBATIM from the live .be homepage.
// Webshop opens in a new tab: .be and .shop grow together (Xander,
// 2026-08-18) until commerce moves fully onto natuurhout.be.
export default function Navbar() {
  const navCollections: NavCollection[] = collections.map((c) => {
    const img = collectionImage(c);
    return {
      handle: c.handle,
      title: c.title,
      count: c.products.length,
      image: img ? { src: img.src, alt: img.alt } : undefined,
    };
  });

  return (
    <header className="sticky top-0 z-40">
      {/* Utility bar */}
      <div className="bg-brand-dark text-white/70">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-2 text-xs sm:px-6 lg:px-10">
          <p className="flex min-w-0 items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-accent-bright" />
            Adolf Van Der Moerenstraat 39, 9240 Zele
          </p>
          <ul className="hidden items-center gap-6 md:flex">
            {["Duurzame Producten", "Levering mogelijk", "+15 jaar ervaring"].map((u) => (
              <li key={u} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-accent-bright" />
                {u}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-accent-bright" />
              <a href="tel:+3252558858" className="hover:text-white">
                +32 5 255 88 58
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Logo bar */}
      <div className="border-b border-line bg-ground">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center">
            {/* Real logo, hotlinked from live .be until the media mirror lands */}
            <Image
              src="https://www.natuurhout.be/wp-content/uploads/2016/01/logo-natuurhout-new-1.png"
              alt="Natuurhout"
              width={210}
              height={40}
              className="h-9 w-auto sm:h-10"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/offerte-aanvragen/"
              className="hidden rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40 sm:inline-flex"
            >
              Offerte aanvragen
            </Link>
            <a
              href="https://natuurhout.shop/"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
            >
              Webshop
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Nav bar with mega menu */}
      <MainNav collections={navCollections} />
    </header>
  );
}
