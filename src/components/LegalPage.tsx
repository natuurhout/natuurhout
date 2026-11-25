import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "@/components/JsonLd";
import type { LegacyPage } from "@/lib/legacy";

/*
 * The legal pages (algemene voorwaarden, gebruiksvoorwaarden,
 * privacyverklaring, cookiebeleid, verzoek toegang tot data), rewritten in
 * Nov 2026 for the website as it works now (handbuilt-routes.json): a
 * readable column, the date of the last change, links between them.
 */

export const LEGAL_UPDATED = "25 november 2026";

export const COMPANY = {
  name: "BEHO comm.v.",
  trade: "Natuurhout",
  vat: "BE 0841.894.771",
};

export const LEGAL_LINKS = [
  { href: "/algemene-voorwaarden-van-beho-comm-v/", label: "Algemene voorwaarden" },
  { href: "/gebruiksvoorwaarden/", label: "Gebruiksvoorwaarden" },
  { href: "/privacyverklaring/", label: "Privacyverklaring" },
  { href: "/cookiebeleid-eu/", label: "Cookiebeleid" },
  { href: "/verzoek-toegang-tot-data/", label: "Verzoek toegang tot uw gegevens" },
];

/** Typography for the text: headings, paragraphs, lists, links. */
export const prose =
  "text-[16px] leading-7 text-ink/80 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_a]:font-medium [&_a]:text-accent-deep [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-ink [&_strong]:font-semibold [&_strong]:text-ink [&_table]:mt-4 [&_table]:w-full [&_table]:text-sm [&_th]:border-b [&_th]:border-line [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink [&_td]:border-b [&_td]:border-line/70 [&_td]:py-2 [&_td]:pr-3 [&_td]:align-top";

export default function LegalPage({
  page,
  heading,
  intro,
  children,
}: {
  page: LegacyPage;
  heading: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[52rem] px-4 py-10 sm:px-6 lg:py-14" data-legal-page={page.pathname}>
      {page.structuredData && <JsonLd data={page.structuredData} />}
      <nav aria-label="Kruimelpad" className="text-sm text-ink/60">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent-deep">Home</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-medium text-ink">{heading}</li>
        </ol>
      </nav>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">{heading}</h1>
      <p className="mt-2 text-sm text-ink/55">Laatst bijgewerkt op {LEGAL_UPDATED}</p>
      {intro && <div className="mt-6 text-lg leading-8 text-ink/80">{intro}</div>}
      <div className={`mt-4 ${prose}`}>{children}</div>
      <aside className="mt-14 rounded-card border border-line bg-white p-5 sm:p-6">
        <p className="text-sm font-semibold text-ink">Meer over uw rechten en onze afspraken</p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {LEGAL_LINKS.filter((link) => link.href !== page.pathname).map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="font-medium text-accent-deep hover:text-ink">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink/65">
          Vragen? Mail naar <a href="mailto:info@natuurhout.be" className="font-medium text-accent-deep underline underline-offset-2">info@natuurhout.be</a> of bel{" "}
          <a href="tel:+3252558858" className="font-medium text-accent-deep underline underline-offset-2">052 55 88 58</a>.
        </p>
      </aside>
    </div>
  );
}

/** Who we are, for the top of each legal page. */
export function CompanyBlock() {
  return (
    <p>
      <strong>{COMPANY.name}</strong> (handelsnaam {COMPANY.trade}), A. Van Der Moerenstraat 39, 9240 Zele, België · btw {COMPANY.vat} ·{" "}
      <a href="mailto:info@natuurhout.be">info@natuurhout.be</a> · <a href="tel:+3252558858">052 55 88 58</a>
    </p>
  );
}
