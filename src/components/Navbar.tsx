import Image from "next/image";
import Link from "next/link";

// Nav labels match the live natuurhout.be menu (Phase 0 snapshot). Routes
// that are not built yet intentionally point at their future URLs — URL
// parity means these paths will exist before cutover.
const links = [
  { href: "/producten/", label: "Producten & Prijzen" },
  { href: "/onze-realisaties/", label: "Realisaties" },
  { href: "/offerte-aanvragen/", label: "Offerte aanvragen" },
  { href: "/over-ons/", label: "Over ons" },
  { href: "/contact/", label: "Contact" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand/10 bg-ground/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {/* Real logo, hotlinked from live .be until the media mirror lands */}
          <Image
            src="https://www.natuurhout.be/wp-content/uploads/2016/01/logo-natuurhout-new-1.png"
            alt="Natuurhout"
            width={160}
            height={31}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink/80 transition-colors hover:text-brand"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {/* Shop link preserved verbatim — rule 8: the webshop is linked, never touched */}
        <a
          href="https://natuurhout.shop/"
          className="inline-flex items-center gap-2 rounded-full bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
        >
          Naar webshop
          <span aria-hidden className="text-base leading-none">↗</span>
        </a>
      </div>
    </header>
  );
}
