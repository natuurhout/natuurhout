"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, Tag } from "lucide-react";
import { DEALS, dealRunning, type Deal } from "@/lib/deals";

/*
 * Time-limited deals (src/lib/deals.ts) on the static site: everything here
 * renders only in the browser and only while the deal runs, so it appears and
 * disappears on time without a new build.
 */

function useRunningDeal(match: (deal: Deal) => boolean = () => true): Deal | null {
  const [deal, setDeal] = useState<Deal | null>(null);
  useEffect(() => {
    const check = () => setDeal(DEALS.find((d) => dealRunning(d) && match(d)) ?? null);
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return deal;
}

/** Strip above the header on every page. */
export function DealBanner() {
  const deal = useRunningDeal();
  if (!deal) return null;
  return (
    <Link href={deal.href} className="block bg-ink px-4 py-2 text-center text-[13px] leading-5 text-white hover:bg-black sm:text-sm">
      <Tag aria-hidden className="mr-1.5 inline h-4 w-4 -translate-y-px text-accent" />
      <strong>Black Friday:</strong> −{deal.percent}% op hazelaar hekwerk en poorten, −{deal.bigPercent}% vanaf € {deal.threshold}.{" "}
      <span className="whitespace-nowrap underline decoration-white/40 underline-offset-2">T.e.m. zondag</span>
      <ArrowRight aria-hidden className="ml-1 inline h-3.5 w-3.5 -translate-y-px" />
    </Link>
  );
}

/** Children only while a deal on one of these products runs. */
export function DealGate({ handles, children }: { handles?: string[]; children: ReactNode }) {
  const deal = useRunningDeal((d) => !handles || d.handles.some((h) => handles.includes(h)));
  return deal ? <>{children}</> : null;
}

/** A line on a product page of a deal product. */
export function DealProductLine({ handles }: { handles: string[] }) {
  const deal = useRunningDeal((d) => d.handles.some((h) => handles.includes(h)));
  if (!deal) return null;
  return (
    <p className="flex gap-2 rounded-xl bg-ink px-4 py-3 text-sm leading-6 text-white">
      <Tag aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent" />
      <span>
        <strong>Black Friday-weekend:</strong> −{deal.percent}% op hazelaar hekwerk en poorten, −{deal.bigPercent}% vanaf € {deal.threshold}. De korting
        staat in uw winkelmandje en bij het afrekenen. T.e.m. zondag 29 november.
        <span className="block text-xs text-white/65">Niet op leveringskosten.</span>
      </span>
    </p>
  );
}


function timeLeft(until: string): string {
  const min = Math.max(0, Math.floor((Date.parse(until) - Date.now()) / 60_000));
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  return d > 0 ? `nog ${d} ${d === 1 ? "dag" : "dagen"} en ${h} uur` : h > 0 ? `nog ${h} uur en ${m} min` : `nog ${m} min`;
}

/** Box in the homepage hero, under the buttons. */
export function DealHeroBox() {
  const deal = useRunningDeal();
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!deal) return null;
  return (
    <Link
      href={deal.href}
      className="group mt-8 flex max-w-xl flex-wrap items-center gap-x-6 gap-y-3 rounded-card border border-accent/60 bg-black/45 p-5 text-white backdrop-blur-sm transition-colors hover:border-accent hover:bg-black/55"
    >
      <span className="min-w-0 flex-1 basis-64">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-bright">
          <Tag aria-hidden className="h-4 w-4" /> Black Friday-weekend · {timeLeft(deal.until)}
        </span>
        <span className="mt-1.5 block font-display text-2xl font-bold leading-snug">
          −{deal.percent}% op hazelaar hekwerk en poorten
        </span>
        <span className="mt-1 block text-sm text-white/75">
          −{deal.bigPercent}% vanaf € {deal.threshold} aan hazelaar. T.e.m. zondag 29 november.
        </span>
      </span>
      <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors group-hover:bg-accent group-hover:text-white">
        Bekijk de deal <ArrowRight aria-hidden className="h-4 w-4" />
      </span>
    </Link>
  );
}
