import type { Metadata } from "next";
import EmailRequestForm from "@/components/EmailRequestForm";

export const metadata: Metadata = {
  title: "Offerte aanvragen | Natuurhout",
  description: "Vraag vrijblijvend een offerte aan voor afsluitingen, poorten, palen en tuinproducten in natuurhout.",
  alternates: { canonical: "https://www.natuurhout.be/offerte-aanvragen/" },
};

export default function QuotePage() {
  return (
    <div className="px-4 py-12 sm:px-6 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">Vrijblijvend</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">Aanvraag Offerte</h1>
        <p className="mt-5 max-w-3xl leading-7 text-ink/70">Beschrijf uw project zo volledig mogelijk. Afmetingen, aantallen en foto&apos;s helpen ons om u sneller en gerichter te adviseren.</p>
        <div className="mt-10"><EmailRequestForm kind="offerte" /></div>
      </div>
    </div>
  );
}
