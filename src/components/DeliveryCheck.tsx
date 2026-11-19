"use client";

import { useEffect, useState } from "react";
import { Store, Truck } from "lucide-react";
import { formatPrice } from "@/lib/catalog";

/** "€135" for whole euros, "€12,50" otherwise. */
const euroShort = (n: number) => `€${Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",")}`;

/*
 * Delivery for a basket and a postcode, from the Worker (/api/afrekenen/prijs/,
 * worker/shop/delivery.ts): the price, or why there is no delivery. Each
 * distance has a minimum order value: below it delivery cannot be chosen
 * (the option is greyed out) and DeliveryMinimum shows how much is missing,
 * with a progress bar; past the maximum distance only pickup is possible.
 * Pickup in Zele always is. Used by the winkelmandje's order form and by
 * /afrekenen/, as soon as the postcode is known; it follows the basket live.
 */

export type DeliveryResult = {
  subtotal: number;
  delivery: { ok: boolean; price: number; label: string; km: number | null; reason: string } | null;
  deliverable: boolean;
  /** The band's minimum order value for delivery, and what is still missing (0 = reached). */
  minimum: number | null;
  short: number;
};

/** Asks the Worker for delivery to `postcode` (4 digits) for these lines; null while unknown. */
export function useDeliveryQuote(lines: { id: number; qty: number }[], postcode: string, city: string, enabled = true): DeliveryResult | null {
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const key = JSON.stringify(lines);
  const pc = postcode.trim();
  const ready = enabled && /^\d{4}$/.test(pc) && lines.length > 0;

  useEffect(() => {
    if (!ready) {
      setResult(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/afrekenen/prijs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: JSON.parse(key), delivery: true, postcode: pc, city: city.trim() }),
        signal: ctrl.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((q: DeliveryResult | null) => setResult(q))
        .catch(() => {});
    }, 300);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [ready, key, pc, city]);

  return ready ? result : null;
}

/** Below the band's minimum: what is missing, a progress bar, and that pickup always works. */
export function DeliveryMinimum({ result, onPickup }: { result: DeliveryResult; onPickup?: () => void }) {
  if (result.minimum === null || result.short <= 0 || !result.delivery) return null;
  const done = Math.min(100, Math.max(0, (result.subtotal / result.minimum) * 100));
  return (
    <div role="status" className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3.5 text-sm leading-6 text-amber-950">
      <p className="flex gap-2">
        <Truck aria-hidden className="mt-1 h-4 w-4 shrink-0 text-amber-700" />
        <span>{result.delivery.reason}</span>
      </p>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-amber-200/70"
        role="progressbar"
        aria-label="Bestelbedrag tegenover het minimum voor levering"
        aria-valuemin={0}
        aria-valuemax={result.minimum}
        aria-valuenow={result.subtotal}
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${done}%` }} />
      </div>
      <p className="mt-1.5 flex justify-between text-xs font-medium text-amber-900/80">
        <span className="tabular-nums">
          {euroShort(result.subtotal)} / {euroShort(result.minimum)}
        </span>
        <span>nog {euroShort(result.short)}</span>
      </p>
      {onPickup && (
        <button type="button" onClick={onPickup} className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-deep underline underline-offset-2 hover:text-ink">
          <Store aria-hidden className="h-4 w-4" /> Kies afhalen in Zele
        </button>
      )}
    </div>
  );
}

/** One line for any other answer: the delivery price, or why there is no delivery. */
export function DeliveryLine({ result }: { result: DeliveryResult }) {
  const d = result.delivery;
  if (!d || (result.minimum !== null && result.short > 0)) return null;
  if (!d.ok) {
    const reason = d.reason || "Naar deze postcode leveren we niet via de webshop.";
    return <p className="text-sm text-red-700">{/afhalen/i.test(reason) ? reason : `${reason} Afhalen in Zele kan altijd.`}</p>;
  }
  return (
    <p className="text-sm text-ink/75">
      Levering naar <strong className="text-ink">{d.label}</strong>
      {d.km !== null ? ` (± ${Math.round(d.km)} km)` : ""}: <strong className="text-ink">{d.price === 0 ? "gratis" : formatPrice(d.price)}</strong>
    </p>
  );
}

/*
 * "Leveringskost berekenen" in the winkelmandje: a postcode (and optionally
 * the municipality) gives the delivery price for the basket right away, and
 * the minimum order value for delivery there, reached or not. `onPostcode`
 * hands the postcode on (the order form below starts from it).
 */
export function DeliveryEstimator({
  lines,
  onPostcode,
}: {
  lines: { id: number; qty: number }[];
  onPostcode?: (postcode: string, city: string) => void;
}) {
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const result = useDeliveryQuote(lines, postcode, city);
  const ready = /^\d{4}$/.test(postcode.trim());
  const field =
    "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

  const d = result?.delivery;
  // Hand on the place that belongs to the postcode (as the Worker found it), not a stale typed one.
  const resolved = d?.label.startsWith(postcode.trim()) ? d.label.slice(postcode.trim().length).trim() : "";
  useEffect(() => {
    if (ready && resolved) onPostcode?.(postcode.trim(), resolved);
  }, [ready, postcode, resolved, onPostcode]);

  return (
    <section aria-labelledby="leveringskost" className="mt-4 rounded-card border border-line bg-white p-4 sm:p-5">
      <h2 id="leveringskost" className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
        <Truck aria-hidden className="h-5 w-5 text-accent" /> Leveringskost berekenen
      </h2>
      <p className="mt-1 text-sm text-ink/60">Vul uw postcode in: u ziet meteen wat levering kost en of er een minimumbedrag geldt.</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-2.5">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">Postcode</span>
          <input className={field} inputMode="numeric" maxLength={4} autoComplete="postal-code" placeholder="bv. 9000" value={postcode} onChange={(e) => setPostcode(e.target.value.replace(/\D/g, ""))} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink">
            Gemeente <span className="font-normal text-ink/50">(optioneel)</span>
          </span>
          <input className={field} autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value)} />
        </label>
      </div>

      <div className="mt-3" aria-live="polite">
        {!ready ? null : !result || !d ? (
          <p className="text-sm text-ink/55">Even berekenen…</p>
        ) : result.short > 0 ? (
          <DeliveryMinimum result={result} />
        ) : d.ok ? (
          <div className="rounded-xl bg-brand-soft/60 px-4 py-3 text-sm leading-6 text-ink/80">
            <p className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span>
                Levering naar <strong className="text-ink">{d.label}</strong>
                {d.km !== null ? ` (± ${Math.round(d.km)} km)` : ""}
              </span>
              <strong className="text-lg text-ink">{d.price === 0 ? "Gratis" : formatPrice(d.price)}</strong>
            </p>
            <p className="mt-0.5 text-ink/65">
              {result.minimum !== null ? `Minimum voor levering hier: ${euroShort(result.minimum)}, dat haalt u.` : "Geen minimumbedrag voor levering hier."}
            </p>
          </div>
        ) : (
          <DeliveryLine result={result} />
        )}
        {ready && <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/55"><Store aria-hidden className="h-3.5 w-3.5" /> Afhalen in Zele is altijd gratis.</p>}
      </div>
    </section>
  );
}
