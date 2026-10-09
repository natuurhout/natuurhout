import Image from "next/image";
import Link from "next/link";
import { Check, Mail, Phone, Star } from "lucide-react";
import MainNav from "@/components/MainNav";
import OpeningStatus from "@/components/OpeningStatus";
import SearchBox from "@/components/SearchBox";
import { EMAIL, GOOGLE_REVIEWS, MOBILE, PHONE, WHATSAPP } from "@/lib/contact";
import { WhatsAppIcon } from "@/components/WhatsApp";
import { searchIndex } from "@/lib/search";

const usps = ["15 jaar ervaring", "Levering in heel België", "Service op maat"];

const box = "flex items-center gap-3 rounded-xl border border-line bg-white p-1.5 transition-colors";
const iconCircle = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg";

/*
 * Three-part header, as on the original Natuurhout site: trust strip (Google
 * score, USPs, opening hours), logo row (search and contact boxes), dark
 * navigation. The whole header is sticky with a negative top equal
 * to the height of the first two rows (36px on mobile; 40 + 84px from 992px),
 * so those rows scroll away and only the navigation bar stays on screen.
 * Keep the heights below and the -top values in step.
 */
export default function Navbar() {
  const rating = GOOGLE_REVIEWS.rating.toLocaleString("nl-BE");
  return (
    <header className="sticky -top-9 z-40 desk:-top-[124px]">
      <div className="bg-brand text-white">
        <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 desk:h-10 lg:px-8">
          {/* Google score and USPs: one at a time on small screens (rotating), all from 992px. */}
          <ul className="usp-rotate text-[13px] font-semibold desk:text-sm">
            <li>
              <a
                href={GOOGLE_REVIEWS.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${rating} op 5 sterren, ${GOOGLE_REVIEWS.count} Google-reviews`}
                className="inline-flex items-center gap-2 text-white transition-colors hover:text-accent-bright"
              >
                <span aria-hidden className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(GOOGLE_REVIEWS.rating) ? "fill-[#fbbc04] text-[#fbbc04]" : "text-white/40"}`} />
                  ))}
                </span>
                <span>
                  {rating} · {GOOGLE_REVIEWS.count} Google-reviews
                </span>
              </a>
            </li>
            {usps.map((usp) => (
              <li key={usp}>
                <Check aria-hidden className="h-4 w-4 shrink-0 stroke-[3] text-accent-bright" />
                {usp}
              </li>
            ))}
          </ul>
          <OpeningStatus dark className="hidden shrink-0 desk:inline-flex" />
        </div>
      </div>

      <div className="hidden bg-white desk:block">
        <div className="mx-auto flex h-[84px] max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Natuurhout home" className="shrink-0">
            <Image
              src="/wp-content/uploads/2016/01/logo-natuurhout-new-1.png"
              alt="Natuurhout"
              width={557}
              height={107}
              className="h-auto w-[220px] xl:w-[260px]"
              priority
            />
          </Link>
          <SearchBox items={searchIndex} className="w-full max-w-[420px]" />

          {/* Contact boxes: phone and mobile, WhatsApp, email. */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div className={`${box} pr-3.5`}>
              <span aria-hidden className={`${iconCircle} bg-accent/10 text-accent-deep`}>
                <Phone className="h-[18px] w-[18px]" />
              </span>
              <span className="flex flex-col leading-tight">
                <a href={PHONE.href} className="text-[15px] font-bold text-ink hover:text-accent-deep">
                  <span className="sr-only">Telefoon: </span>
                  {PHONE.label}
                </a>
                <a href={MOBILE.href} className="mt-0.5 text-[13px] font-medium text-ink/60 hover:text-accent-deep">
                  Gsm {MOBILE.label}
                </a>
              </span>
            </div>
            <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className={`${box} group hover:border-[#25d366] xl:pr-3.5`}>
              <span aria-hidden className={`${iconCircle} bg-[#25d366]/15 text-[#128c43]`}>
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </span>
              <span className="sr-only xl:not-sr-only xl:flex xl:flex-col xl:leading-tight">
                <span className="text-[15px] font-bold text-ink group-hover:text-[#128c43]">WhatsApp</span>
                <span className="mt-0.5 text-[13px] font-medium text-ink/60">Stuur een bericht</span>
              </span>
            </a>
            <a href={EMAIL.href} title={EMAIL.label} className={`${box} hover:border-accent`}>
              <span aria-hidden className={`${iconCircle} bg-accent/10 text-accent-deep`}>
                <Mail className="h-[18px] w-[18px]" />
              </span>
              <span className="sr-only">Mail ons: {EMAIL.label}</span>
            </a>
          </div>
        </div>
      </div>

      <MainNav searchItems={searchIndex} />
    </header>
  );
}
