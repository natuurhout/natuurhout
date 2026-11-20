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
    // CheckoutResult renders the h1: it depends on how the payment stands.
    <div className="mx-auto w-full max-w-[72rem] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
      <CheckoutResult />
    </div>
  );
}
