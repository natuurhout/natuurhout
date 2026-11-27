"use client";

import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { DEALS, dealPercent, dealRunning } from "@/lib/deals";
import { formatPrice } from "@/lib/catalog";

/*
 * Under the winkelmandje and at /afrekenen/: the running deal on products in
 * the order (src/lib/deals.ts), what it gives now and how much is still
 * missing for the higher percentage. Only in the browser, only while it runs.
 */
export default function DealNote({ lines, className = "mt-2" }: { lines: { handle: string; qty: number; unit: number }[]; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);
  if (now === null) return null;
  const deal = DEALS.find((d) => dealRunning(d, now) && lines.some((l) => d.handles.includes(l.handle)));
  if (!deal) return null;
  const percent = dealPercent(deal, lines, now);
  const total = lines.filter((l) => deal.handles.includes(l.handle)).reduce((t, l) => t + l.qty * l.unit, 0);
  const missing = Math.max(0, deal.threshold - total);
  return (
    <div className={`${className} flex gap-2 rounded-xl bg-ink px-4 py-3 text-sm leading-6 text-white`}>
      <Tag aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent" />
      <div>
        <strong>{deal.name}: −{percent}% op uw hazelaar hekwerk en poorten.</strong>{" "}
        {missing > 0
          ? `Nog ${formatPrice(missing)} aan hazelaar voor −${deal.bigPercent}%.`
          : `U haalt de −${deal.bigPercent}% (vanaf ${formatPrice(deal.threshold)}).`}
        <span className="mt-0.5 block text-xs text-white/65">Niet op leveringskosten. Geldig t.e.m. zondag 29 november, 23:59.</span>
      </div>
    </div>
  );
}
