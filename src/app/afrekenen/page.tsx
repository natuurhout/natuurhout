import type { Metadata } from "next";
import Checkout from "@/components/checkout/Checkout";

// Checkout v2 (online payment via MultiSafepay, or bank transfer). Not linked
// from the site yet: the cart still sends order requests until it is switched
// over. Never indexed. Server side: worker/shop/checkout.ts.
export const metadata: Metadata = {
  title: "Afrekenen | Natuurhout",
  description: "Rond uw bestelling bij Natuurhout af en betaal online of via overschrijving.",
  robots: { index: false, follow: false },
};

export default function AfrekenenPage() {
  return (
    <div className="mx-auto w-full max-w-[72rem] px-4 py-10 sm:px-6 lg:px-10">
      <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        <span aria-hidden className="h-px w-8 bg-accent" />
        Bestellen
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Afrekenen</h1>
      <div className="mt-8">
        <Checkout />
      </div>
    </div>
  );
}
