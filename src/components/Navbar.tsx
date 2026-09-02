import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, MapPin, Phone } from "lucide-react";
import MainNav, { type NavCollection } from "@/components/MainNav";

const legacyProductMenu: NavCollection[] = [
  { handle: "/project/rasterwerk-kastanjehout/", title: "Kastanje Rasterwerk" },
  { handle: "/project/robinia-rasterwerk/", title: "Robinia Rasterwerk" },
  { handle: "/project/hazelaarrasterwerk/", title: "Hazelaar Hekwerk" },
  { handle: "/project/franse-poorten/", title: "Franse Poorten Standaard" },
  { handle: "/project/maatwerk-poorten/", title: "Franse Poorten Maatwerk" },
  { handle: "/project/hazelaar-poorten/", title: "Hazelaar Poorten" },
  { handle: "/project/cleft-field-veldpoorten/", title: "Cleft & Field Veldpoorten" },
  { handle: "/project/hazelaarvlechtschermen/", title: "Hazelaar Vlechtschermen" },
  { handle: "/project/hazelaar-vlechtscherm-hasseltre/", title: "Hazelaar Vlechtschermen – halve latten" },
  { handle: "/project/vlechtschermen/", title: "Kastanje Vlechtschermen" },
  { handle: "/project/moestuinbak/", title: "Plantenbakken" },
  { handle: "/project/eiken-palen/", title: "Eiken Palen" },
  { handle: "/project/kastanjepalen/", title: "Palen" },
  { handle: "/project/postsaver-voor-palen/", title: "Postsaver voor Palen" },
  { handle: "/project/post-rail-2/", title: "Post&Rail" },
  { handle: "/project/lariks-schaal-delen-2/", title: "Lariks Schaal delen" },
  { handle: "/project/raamwerkpoort/", title: "Kaderpoort" },
];

// Header: utility bar → logo bar → dark nav with mega menu.
// USP labels in the utility bar are VERBATIM from the live .be homepage.
// Commerce lives below /shop. Existing WordPress information pages keep their
// original paths, including /producten/.
export default function Navbar() {
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
            {/* Original logo retained at its WordPress path for cutover parity. */}
            <Image
              src="/wp-content/uploads/2016/01/logo-natuurhout-new-1.png"
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
            <Link
              href="/shop/"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
            >
              Shop
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Nav bar with mega menu */}
      <MainNav collections={legacyProductMenu} />
    </header>
  );
}
