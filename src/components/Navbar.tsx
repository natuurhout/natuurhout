import Image from "next/image";
import Link from "next/link";
import MainNav, { type NavCollection } from "@/components/MainNav";
import { collectionImage, collections } from "@/lib/catalog";

// Header layout references kastanjegjerde.no (utility bar → logo bar → dark
// nav with mega menu), restyled in the Natuurhout logo browns.
// USP labels in the utility bar are VERBATIM from the live .be homepage.
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
      <div className="bg-ink text-white/85">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-1.5 text-xs sm:px-6 lg:px-10">
          <p className="truncate">Adolf Van Der Moerenstraat 39, 9240 Zele</p>
          <ul className="hidden items-center gap-6 md:flex">
            <li>✓ Duurzame Producten</li>
            <li>✓ Levering mogelijk</li>
            <li>✓ +15 jaar ervaring</li>
            <li>✓ Groot assortiment</li>
          </ul>
        </div>
      </div>

      {/* Logo bar */}
      <div className="border-b border-brand/10 bg-ground">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center">
            {/* Real logo, hotlinked from live .be until the media mirror lands */}
            <Image
              src="https://www.natuurhout.be/wp-content/uploads/2016/01/logo-natuurhout-new-1.png"
              alt="Natuurhout"
              width={200}
              height={38}
              className="h-9 w-auto"
              priority
            />
          </Link>
          {/* Shop link preserved verbatim — rule 8: the webshop is linked, never touched */}
          <a
            href="https://natuurhout.shop/"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
          >
            Naar webshop
            <span aria-hidden className="text-base leading-none">↗</span>
          </a>
        </div>
      </div>

      {/* Nav bar with mega menu */}
      <MainNav collections={navCollections} />
    </header>
  );
}
