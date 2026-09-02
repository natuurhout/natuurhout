import Image from "next/image";
import Link from "next/link";
import { Check, Clock3, Mail, MapPin, Phone } from "lucide-react";
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
  { handle: "/project/hazelaar-vlechtscherm-hasseltre/", title: "Hazelaar Vlechtschermen - halve latten" },
  { handle: "/project/vlechtschermen/", title: "Kastanje Vlechtschermen" },
  { handle: "/project/moestuinbak/", title: "Plantenbakken" },
  { handle: "/project/eiken-palen/", title: "Eiken Palen" },
  { handle: "/project/kastanjepalen/", title: "Palen" },
  { handle: "/project/postsaver-voor-palen/", title: "Postsaver voor Palen" },
  { handle: "/project/post-rail-2/", title: "Post&Rail" },
  { handle: "/project/lariks-schaal-delen-2/", title: "Lariks Schaal delen" },
  { handle: "/project/raamwerkpoort/", title: "Kaderpoort" },
];

const usps = ["15 jaar ervaring", "Service op maat", "Levering mogelijk"];

function InfoItem({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-l border-line px-5 py-7 xl:px-7">
      <span className="mt-0.5 shrink-0 text-accent" aria-hidden>{icon}</span>
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-5 text-ink">{title}</p>
        <div className="mt-1 text-sm leading-5 text-ink/65">{children}</div>
      </div>
    </div>
  );
}

// The three-part header is a recognisable part of the original Natuurhout site:
// trust strip, practical contact information, then the primary navigation.
export default function Navbar() {
  return (
    <header className="relative z-40 bg-white">
      <div className="bg-brand text-white">
        <div className="mx-auto flex min-h-11 max-w-[1400px] items-center justify-between gap-6 overflow-hidden px-4 sm:px-6 lg:px-8">
          <ul className="grid w-full shrink-0 grid-cols-3 gap-2 py-2 text-[11px] font-semibold leading-tight sm:flex sm:w-auto sm:items-center sm:gap-7 sm:py-0 sm:text-sm lg:gap-12">
            {usps.map((usp) => (
              <li key={usp} className="flex items-center justify-center gap-1.5 text-center sm:justify-start sm:gap-2 sm:whitespace-nowrap sm:text-left">
                <Check className="h-3.5 w-3.5 shrink-0 stroke-[3] text-accent-bright sm:h-4 sm:w-4" />
                {usp}
              </li>
            ))}
          </ul>
          <div className="hidden shrink-0 items-center gap-5 md:flex">
            <a href="https://www.facebook.com/natuurhout/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-white transition-colors hover:text-accent-bright">
              Facebook
            </a>
            <a href="https://www.instagram.com/natuurhout/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-white transition-colors hover:text-accent-bright">
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-5 px-4 py-5 sm:px-6 lg:hidden">
          <Link href="/" aria-label="Natuurhout home">
            <Image src="/wp-content/uploads/2016/01/logo-natuurhout-new-1.png" alt="Natuurhout" width={557} height={107} className="h-auto w-[210px] max-w-[62vw]" priority />
          </Link>
          <a href="tel:+3252558858" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-line text-accent transition-colors hover:border-accent hover:bg-accent hover:text-white" aria-label="Bel Natuurhout">
            <Phone className="h-5 w-5" />
          </a>
        </div>

        <div className="mx-auto hidden min-h-[142px] max-w-[1400px] grid-cols-[1.35fr_1fr_1.12fr_.88fr_1.12fr] items-stretch px-8 lg:grid">
          <Link href="/" className="flex items-center pr-8" aria-label="Natuurhout home">
            <Image src="/wp-content/uploads/2016/01/logo-natuurhout-new-1.png" alt="Natuurhout" width={557} height={107} className="h-auto w-full max-w-[300px]" priority />
          </Link>

          <InfoItem icon={<MapPin className="h-5 w-5" />} title="A. Van Der Moerenstraat 39">
            9240 Zele - België
          </InfoItem>

          <InfoItem icon={<Clock3 className="h-5 w-5" />} title="Maandag-Vrijdag">
            van 09:00 - 18:00
          </InfoItem>

          <InfoItem icon={<Clock3 className="h-5 w-5" />} title="Zaterdag">
            <span className="font-medium text-accent">van 09:00 - 12:00</span>
          </InfoItem>

          <InfoItem icon={<Phone className="h-5 w-5" />} title="+32 5 255 88 58">
            <a href="tel:+32473740926" className="block font-medium underline decoration-ink/25 underline-offset-2 hover:text-accent">+32 473 74 09 26</a>
            <a href="mailto:info@natuurhout.be" className="mt-1 flex items-center gap-1.5 font-medium underline decoration-ink/25 underline-offset-2 hover:text-accent">
              <Mail className="h-3.5 w-3.5" />
              info@natuurhout.be
            </a>
          </InfoItem>
        </div>
      </div>

      <MainNav collections={legacyProductMenu} />
    </header>
  );
}
