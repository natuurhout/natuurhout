import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone, Smartphone } from "lucide-react";

// NAP, opening hours and link labels are VERBATIM from the live natuurhout.be
// footer (Phase 0 snapshot) — do not reword; local SEO depends on the exact
// NAP string. Legal page routes keep their live WordPress slugs (URL parity).
export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl font-semibold">Natuurhout</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
              Specialist in kastanjehout: afsluitingen, poorten, palen en
              tuinschermen uit Zele.
            </p>
            <Link
              href="/shop/"
              className="mt-6 inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-deep"
            >
              Naar de shop
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-bright">
              Contact
            </p>
            <ul className="mt-5 space-y-3 text-sm text-white/75">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-bright" />
                Adolf Van Der Moerenstraat 39 9240 Zele - België
              </li>
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-bright" />
                <a href="tel:+3252558858" className="hover:text-white">Tel: +32 5 255 88 58</a>
              </li>
              <li className="flex gap-2.5">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-accent-bright" />
                <a href="tel:+32473740926" className="hover:text-white">Gsm: +32 473 74 09 26</a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-bright" />
                <a href="mailto:info@natuurhout.be" className="hover:text-white">
                  Email: info@natuurhout.be
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-bright">
              Openingsuren
            </p>
            <ul className="mt-5 space-y-3 text-sm text-white/75">
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-bright" />
                Maandag - Vrijdag: van 09.00 tot 18:00
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-bright" />
                Zaterdag: van 09:00 tot 12:00
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-bright">
              Handige Links
            </p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {[
                ["/veelgesteldevragen/", "Veelgestelde Vragen - FAQ"],
                ["/tipsenideeen/", "Tips & Ideeën"],
                ["/algemene-voorwaarden-van-beho-comm-v/", "Algemene voorwaarden"],
                ["/gebruiksvoorwaarden/", "Gebruiksvoorwaarden"],
                ["/privacyverklaring/", "Privacyverklaring"],
                ["/verzoek-toegang-tot-data/", "Verzoek toegang tot data"],
                ["/cookiebeleid-eu/", "Cookiebeleid (EU)"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-white/75 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-white/50 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Natuurhout - BEHO comm.v</p>
          <p>Adolf Van Der Moerenstraat 39, 9240 Zele</p>
        </div>
      </div>
    </footer>
  );
}
