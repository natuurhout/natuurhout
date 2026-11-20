import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import LegalPage from "@/components/LegalPage";
import { approvedSeo, getLegacyPageByPath } from "@/lib/legacy";

/*
 * Verzoek toegang tot data, rewritten in Nov 2026 (handbuilt-routes.json):
 * the WordPress page described a Complianz form that no longer exists. Now:
 * how to ask for your data (or to change or delete it), by mail with a
 * prefilled subject. Stays noindex (src/lib/legacy.ts).
 */
const page = getLegacyPageByPath("/verzoek-toegang-tot-data/");
const seo = approvedSeo("/verzoek-toegang-tot-data/");

export const metadata: Metadata = {
  title: { absolute: seo.approvedTitle ?? page?.title ?? "Verzoek toegang tot data | Natuurhout" },
  description: seo.approvedDescription ?? page?.description,
  alternates: { canonical: page?.canonical },
  robots: { index: false, follow: false },
};

const REQUESTS = [
  { label: "Inzage in mijn gegevens", subject: "Verzoek: inzage in mijn gegevens" },
  { label: "Mijn gegevens verbeteren", subject: "Verzoek: mijn gegevens verbeteren" },
  { label: "Mijn gegevens wissen", subject: "Verzoek: mijn gegevens wissen" },
];

const mailto = (subject: string) =>
  `mailto:info@natuurhout.be?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    "Hallo Natuurhout,\n\nMijn naam:\nMijn e-mailadres (zoals bij mijn aanvraag of bestelling):\nMijn vraag:\n\n",
  )}`;

export default function DataRequestPage() {
  if (!page) throw new Error("The WordPress /verzoek-toegang-tot-data/ snapshot is missing.");
  return (
    <LegalPage
      page={page}
      heading={seo.approvedHeading ?? "Verzoek toegang tot data"}
      intro={<p>Wilt u weten welke gegevens Natuurhout van u heeft, of wilt u ze laten verbeteren of wissen? Stuur ons een mail; het is gratis.</p>}
    >
      <div className="mt-6 flex flex-wrap gap-3">
        {REQUESTS.map((request) => (
          <a
            key={request.subject}
            href={mailto(request.subject)}
            className="!inline-flex !items-center !gap-2 !rounded-full !border !border-brand/25 !bg-white !px-5 !py-2.5 !text-sm !font-semibold !text-ink !no-underline hover:!border-accent hover:!text-accent-deep"
          >
            <Mail aria-hidden className="h-4 w-4 text-accent" /> {request.label}
          </a>
        ))}
      </div>

      <h2>Hoe het werkt</h2>
      <ol>
        <li>Mail naar <a href="mailto:info@natuurhout.be">info@natuurhout.be</a>, het liefst vanaf het e-mailadres dat u bij uw aanvraag of bestelling gebruikte.</li>
        <li>Zeg wat u wilt: inzage, een kopie in een bestand, verbeteren, wissen, beperken of bezwaar maken.</li>
        <li>Als we niet zeker weten dat het verzoek van u komt, vragen we u om dat te bevestigen. Zo geven we uw gegevens nooit aan iemand anders.</li>
        <li>We antwoorden binnen één maand.</li>
      </ol>

      <h2>Goed om te weten</h2>
      <ul>
        <li>
          Facturen moeten we wettelijk 10 jaar bewaren (vanaf 1 januari na de factuurdatum); die kunnen we pas wissen als die termijn voorbij is.
          Zie de <Link href="/privacyverklaring/">bewaartermijnen in onze privacyverklaring</Link>.
        </li>
        <li>
          Uw toestemming voor statistiek- en marketingcookies trekt u zelf in via “Cookie-instellingen” onderaan elke pagina (zie ons{" "}
          <Link href="/cookiebeleid-eu/">cookiebeleid</Link>).
        </li>
        <li>
          Welke gegevens we bewaren en waarom, leest u in onze <Link href="/privacyverklaring/">privacyverklaring</Link>.
        </li>
      </ul>
    </LegalPage>
  );
}
