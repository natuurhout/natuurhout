import type { Metadata } from "next";
import FenceCalculator from "@/components/FenceCalculator";
import { calculatorData } from "@/lib/calculator";

// New page (no live .be equivalent) — concept references
// kastanjegjerde.no/gjerdekalkulator per Xander. Prices are verbatim
// natuurhout.shop variant prices plus the surcharges Natuurhout set.
export const metadata: Metadata = {
  title: "Afsluitingscalculator | Natuurhout",
  description:
    "Bereken een richtprijs voor uw houten afsluiting: hekwerk, palen, poorten, vlechtschermen, Post & Rail en plantenbakken, met actuele webshopprijzen. Vraag meteen uw offerte aan.",
  alternates: { canonical: "https://www.natuurhout.be/calculator/" },
};

export default function CalculatorPage() {
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-12 sm:px-6 lg:px-10">
      <div className="max-w-3xl">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          <span aria-hidden className="h-px w-8 bg-accent" />
          Calculator
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Bereken de richtprijs van uw afsluiting
        </h1>
        <p className="mt-5 leading-relaxed text-ink/70">
          Stel uw afsluiting samen met hekwerk, palen en poort — of kies vlechtschermen, Post &amp; Rail of
          plantenbakken. U ziet meteen een richtprijs op basis van de actuele webshopprijzen en vraagt in de
          laatste stap uw offerte aan.
        </p>
      </div>
      <div className="mt-10">
        <FenceCalculator data={calculatorData()} />
      </div>
    </div>
  );
}
