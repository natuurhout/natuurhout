import type { Metadata } from "next";
import { Clock, MessageCircle, Phone } from "lucide-react";
import FenceCalculator from "@/components/FenceCalculator";
import JsonLd from "@/components/JsonLd";
import FreeQuoteForm from "@/components/quote/FreeQuoteForm";
import QuoteChooser from "@/components/quote/QuoteChooser";
import { calculatorData } from "@/lib/calculator";
import { EMAIL, PHONE } from "@/lib/contact";
import { getLegacyPageByPath } from "@/lib/legacy";

/*
 * Quote page, rebuilt (handbuilt-routes.json): the WordPress page was one
 * large Forminator form that only worked inside WordPress. Title,
 * description, canonical, structured data and h1 stay as they were frozen;
 * the page now offers the calculator and a free request form, both sending
 * through /api/offerte.
 */
const page = getLegacyPageByPath("/offerte-aanvragen/");

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description || undefined,
  alternates: { canonical: page?.canonical },
};

const promises = [
  { icon: MessageCircle, text: "Vrijblijvend en persoonlijk" },
  { icon: Clock, text: "Zo snel mogelijk antwoord" },
];

export default function QuotePage() {
  if (!page) throw new Error("The WordPress quote-page snapshot is missing.");
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      {page.structuredData && <JsonLd data={page.structuredData} />}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
            <span aria-hidden className="h-px w-8 bg-accent" />
            Offerte
          </p>
          {/* The h1 text is frozen by the SEO baseline: "Offerte aanvragen | Kastanje Afsluiting". */}
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Offerte aanvragen <span className="sr-only">|</span>{" "}
            <span className="mt-1 block text-xl font-semibold text-ink/60 sm:text-2xl">Kastanje Afsluiting</span>
          </h1>
          <p className="mt-5 leading-relaxed text-ink/75">
            Voor een afsluiting berekent u zelf een richtprijs met onze calculator en vraagt u in de laatste stap uw
            offerte aan. Zoekt u iets anders of op maat? Beschrijf het in het vrije formulier. Wij bezorgen u
            zo snel mogelijk een offerte.
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink/75">
            {promises.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon aria-hidden className="h-4 w-4 text-accent" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-card border border-line bg-white p-5 text-sm">
          <p className="font-semibold text-ink">Liever even bellen of mailen?</p>
          <a href={PHONE.href} className="mt-2 flex items-center gap-2 font-semibold text-accent-deep hover:text-ink">
            <Phone aria-hidden className="h-4 w-4" /> {PHONE.label}
          </a>
          <a href={EMAIL.href} className="mt-1 block text-ink/70 hover:text-accent-deep">
            {EMAIL.label}
          </a>
        </div>
      </div>

      <div className="mt-10">
        <QuoteChooser calculator={<FenceCalculator data={calculatorData()} />} form={<FreeQuoteForm />} />
      </div>
    </div>
  );
}
