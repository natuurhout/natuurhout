import Link from "next/link";

// NAP, opening hours and link labels are VERBATIM from the live natuurhout.be
// footer (Phase 0 snapshot) — do not reword; local SEO depends on the exact
// NAP string. Legal page routes keep their live WordPress slugs (URL parity).
export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="grid w-full gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-10">
        <div>
          <p className="text-lg font-semibold">Natuurhout</p>
          <ul className="mt-4 space-y-2 text-sm text-white/80">
            <li>Adolf Van Der Moerenstraat 39 9240 Zele - België</li>
            <li>Tel: +32 5 255 88 58</li>
            <li>Gsm: +32 473 74 09 26</li>
            <li>Email: info@natuurhout.be</li>
          </ul>
          <ul className="mt-4 space-y-1 text-sm text-white/80">
            <li>Maandag - Vrijdag: van 09.00 tot 18:00</li>
            <li>Zaterdag: van 09:00 tot 12:00</li>
          </ul>
        </div>
        <div>
          <p className="text-lg font-semibold">Handige Links</p>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["/veelgesteldevragen/", "Veelgestelde Vragen – FAQ"],
              ["/tipsenideeen/", "Tips & Ideeën"],
              ["/algemene-voorwaarden-van-beho-comm-v/", "Algemene voorwaarden"],
              ["/gebruiksvoorwaarden/", "Gebruiksvoorwaarden"],
              ["/privacyverklaring/", "Privacyverklaring"],
              ["/verzoek-toegang-tot-data/", "Verzoek toegang tot data"],
              ["/cookiebeleid-eu/", "Cookiebeleid (EU)"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-white/80 transition-colors hover:text-accent-bright"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-lg font-semibold">Online bestellen</p>
          <p className="mt-4 text-sm text-white/80">
            Ons volledige assortiment vindt u in de webshop.
          </p>
          <a
            href="https://natuurhout.shop/"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
          >
            Naar webshop
            <span aria-hidden className="text-base leading-none">↗</span>
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="w-full px-4 py-5 text-xs text-white/60 sm:px-6 lg:px-10">
          © {new Date().getFullYear()} Natuurhout — BEHO comm.v
        </div>
      </div>
    </footer>
  );
}
