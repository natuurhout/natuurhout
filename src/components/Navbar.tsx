import Image from "next/image";
import Link from "next/link";
import { Check, Mail, Phone } from "lucide-react";
import MainNav from "@/components/MainNav";
import OpeningStatus from "@/components/OpeningStatus";
import { EMAIL, PHONE } from "@/lib/contact";

const usps = ["15 jaar ervaring", "Levering in heel België", "Service op maat"];

/*
 * Three-part header, as on the original Natuurhout site: trust strip, logo
 * row, dark navigation. The whole header is sticky with a negative top equal
 * to the height of the first two rows (36px on mobile; 40 + 84px from 992px),
 * so those rows scroll away and only the navigation bar stays on screen.
 * Keep the heights below and the -top values in step.
 */
export default function Navbar() {
  return (
    <header className="sticky -top-9 z-40 desk:-top-[124px]">
      <div className="bg-brand text-white">
        <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 desk:h-10 lg:px-8">
          {/* One USP at a time on small screens (rotating), all three from 992px. */}
          <ul className="usp-rotate text-[13px] font-semibold desk:text-sm">
            {usps.map((usp) => (
              <li key={usp}>
                <Check aria-hidden className="h-4 w-4 shrink-0 stroke-[3] text-accent-bright" />
                {usp}
              </li>
            ))}
          </ul>
          <div className="hidden shrink-0 items-center gap-6 text-sm font-semibold desk:flex">
            <a href={PHONE.href} className="inline-flex items-center gap-2 text-white transition-colors hover:text-accent-bright">
              <Phone aria-hidden className="h-4 w-4 text-accent-bright" />
              {PHONE.label}
            </a>
            <a href={EMAIL.href} className="inline-flex items-center gap-2 text-white transition-colors hover:text-accent-bright">
              <Mail aria-hidden className="h-4 w-4 text-accent-bright" />
              {EMAIL.label}
            </a>
          </div>
        </div>
      </div>

      <div className="hidden bg-white desk:block">
        <div className="mx-auto flex h-[84px] max-w-[1400px] items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Natuurhout home" className="shrink-0">
            <Image
              src="/wp-content/uploads/2016/01/logo-natuurhout-new-1.png"
              alt="Natuurhout"
              width={557}
              height={107}
              className="h-auto w-[250px] xl:w-[280px]"
              priority
            />
          </Link>
          <OpeningStatus className="text-[15px]" />
        </div>
      </div>

      <MainNav />
    </header>
  );
}
