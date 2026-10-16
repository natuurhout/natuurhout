import type { Metadata } from "next";
import CartView from "@/components/CartView";

// New page (no WordPress equivalent): the basket the price lists fill. It
// only shows what this visitor chose, so search engines skip it.
export const metadata: Metadata = {
  title: "Winkelmandje | Natuurhout",
  description: "Uw gekozen producten van Natuurhout: verstuur ze in één keer als bestelling of aanvraag.",
  alternates: { canonical: "https://www.natuurhout.be/winkelmandje/" },
  robots: { index: false, follow: true },
};

export default function WinkelmandjePage() {
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-12 sm:px-6 lg:px-10">
      <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        <span aria-hidden className="h-px w-8 bg-accent" />
        Bestellen
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">Uw winkelmandje</h1>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
