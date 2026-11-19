"use client";

import { useEffect, useState } from "react";
import { Store, Truck } from "lucide-react";
import { formatPrice } from "@/lib/catalog";

/*
 * Delivery for a basket and a postcode, from the Worker (/api/afrekenen/prijs/,
 * worker/shop/delivery.ts): the price, or why there is no delivery. Each
 * distance band can have a minimum order value: below it delivery cannot be
 * chosen and DeliveryMinimum shows how much is missing, with a progress bar.
 * Pickup in Zele is always possible. Used by the winkelmandje (also inside
 * its order form) and by /afrekenen/.
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
      <p className="mt-1.5 flex justify-between text-xs text-amber-900/80">
        <span>{formatPrice(result.subtotal)}</span>
        <span>levering vanaf {formatPrice(result.minimum)}</span>
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
  if (!d.ok) return <p className="text-sm text-red-700">{d.reason || "Naar deze postcode leveren we niet via de webshop."} Afhalen in Zele kan altijd.</p>;
  return (
    <p className="text-sm text-ink/75">
      Levering naar <strong className="text-ink">{d.label}</strong>
      {d.km !== null ? ` (± ${Math.round(d.km)} km)` : ""}: <strong className="text-ink">{d.price === 0 ? "gratis" : formatPrice(d.price)}</strong>
    </p>
  );
}
