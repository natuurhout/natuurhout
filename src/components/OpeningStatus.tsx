"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { openingStatus, type OpeningStatus as Status } from "@/lib/opening-hours";

/*
 * "Nu open tot 18:00 · Zele", computed in the visitor's browser against
 * Brussels time and refreshed every minute. Pages are prerendered, so the
 * server sends a neutral label that the live status replaces on load.
 */
export default function OpeningStatus({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const tick = () => setStatus(openingStatus(new Date()));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Link
      href="/contact/"
      className={`group inline-flex items-center gap-2 text-sm font-medium transition-colors ${
        dark ? "text-white/85 hover:text-white" : "text-ink/80 hover:text-accent-deep"
      } ${className}`}
    >
      <Clock className={`h-4 w-4 shrink-0 ${dark ? "text-accent-bright" : "text-accent"}`} aria-hidden />
      {status && (
        <span
          aria-hidden
          className={`h-2 w-2 shrink-0 rounded-full ${status.open ? "bg-emerald-500" : dark ? "bg-white/40" : "bg-ink/30"}`}
        />
      )}
      <span>
        {status ? status.text : "Openingsuren"} · Zele
      </span>
    </Link>
  );
}
