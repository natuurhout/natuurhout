import type { Metadata } from "next";
import CheckoutResult from "@/components/checkout/CheckoutResult";

// Where MultiSafepay sends the customer back, and where a bank-transfer order
// lands (?o=<order number>&t=<token>). Never indexed.
export const metadata: Metadata = {
  title: "Uw bestelling | Natuurhout",
  robots: { index: false, follow: false },
};

export default function BedanktPage() {
  return (
    <div className="mx-auto w-full max-w-[72rem] px-4 py-10 sm:px-6 lg:px-10">
      <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        <span aria-hidden className="h-px w-8 bg-accent" />
        Bestellen
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Uw bestelling</h1>
      <div className="mt-8">
        <CheckoutResult />
      </div>
    </div>
  );
}
