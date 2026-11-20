/*
 * Logos of the online payment methods the MultiSafepay account offers
 * (checked on its payment page, 20 Nov 2026). Self-hosted SVGs in
 * public/betaalmethoden/: KBC, Belfius, Visa and MultiSafepay from
 * media.multisafepay.com, Bancontact, Mastercard and iDEAL|Wero from the
 * datatrans/payment-logos set. Rendered as spans so they fit inside labels.
 */

export const PAYMENT_METHODS = [
  { file: "bancontact", name: "Bancontact" },
  { file: "visa", name: "Visa" },
  { file: "mastercard", name: "Mastercard" },
  { file: "kbc", name: "KBC/CBC" },
  { file: "belfius", name: "Belfius" },
  { file: "ideal-wero", name: "iDEAL | Wero" },
] as const;

export default function PaymentLogos({ size = "md", className = "" }: { size?: "sm" | "md"; className?: string }) {
  const tile = size === "sm" ? "h-6 w-9" : "h-8 w-12";
  return (
    <span className={`flex flex-wrap items-center gap-1.5 ${className}`} role="list" aria-label="Betaalmethoden">
      {PAYMENT_METHODS.map((m) => (
        <span key={m.file} role="listitem" title={m.name} className={`${tile} grid flex-none place-items-center overflow-hidden rounded-md border border-line bg-white`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/betaalmethoden/${m.file}.svg`} alt={m.name} className="h-full w-full object-contain" loading="lazy" />
        </span>
      ))}
    </span>
  );
}

export function SecuredBy() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink/55">
      Beveiligd via
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/betaalmethoden/multisafepay.svg" alt="MultiSafepay" className="h-4 w-auto" loading="lazy" />
    </span>
  );
}
