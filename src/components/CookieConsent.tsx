"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  applyConsent,
  OPEN_CONSENT_EVENT,
  readConsent,
  saveConsent,
  type Consent,
} from "@/lib/tracking";

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [statistics, setStatistics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    if (stored) applyConsent(stored);
    else setOpen(true);
    const reopen = () => {
      const current = readConsent();
      if (current) {
        setStatistics(current.statistics);
        setMarketing(current.marketing);
      }
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  function choose(consent: Consent) {
    saveConsent(consent);
    applyConsent(consent);
    setOpen(false);
  }

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookies"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-h-[70vh] max-w-xl overflow-y-auto rounded-card border border-line bg-white p-4 text-[13px] leading-5 sm:text-sm sm:leading-6 text-ink shadow-xl shadow-ink/20 sm:inset-x-6 sm:bottom-6 sm:p-6"
    >
      <p className="font-display text-base font-semibold sm:text-lg">
        Cookies op natuurhout.be
      </p>
      <p className="mt-1 text-ink/75">
        We gebruiken cookies om te meten hoe de site gebruikt wordt
        (statistieken) en om onze advertenties af te stemmen (marketing).
        Noodzakelijke cookies staan altijd aan. Lees ons{" "}
        <Link href="/cookiebeleid-eu/" className="underline underline-offset-2">
          cookiebeleid
        </Link>
        .
      </p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 sm:mt-3 sm:gap-x-6 sm:gap-y-2">
        <label className="inline-flex min-h-9 items-center gap-2">
          <input
            type="checkbox"
            checked
            disabled
            className="h-5 w-5 accent-accent sm:h-4 sm:w-4"
          />{" "}
          Noodzakelijk
        </label>
        <label className="inline-flex min-h-9 items-center gap-2">
          <input
            type="checkbox"
            checked={statistics}
            onChange={(e) => setStatistics(e.target.checked)}
            className="h-5 w-5 accent-accent sm:h-4 sm:w-4"
          />{" "}
          Statistieken
        </label>
        <label className="inline-flex min-h-9 items-center gap-2">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="h-5 w-5 accent-accent sm:h-4 sm:w-4"
          />{" "}
          Marketing
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:flex sm:flex-wrap">
        <button
          type="button"
          onClick={() => choose({ statistics: true, marketing: true })}
          className="col-span-2 rounded-full bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent-deep"
        >
          Alles accepteren
        </button>
        <button
          type="button"
          onClick={() => choose({ statistics, marketing })}
          className="rounded-full border border-ink/20 px-4 py-2.5 font-medium transition-colors hover:border-ink/40 sm:px-5"
        >
          Keuze opslaan
        </button>
        <button
          type="button"
          onClick={() => choose({ statistics: false, marketing: false })}
          className="rounded-full border border-ink/20 px-5 py-2.5 font-medium text-ink/70 sm:border-transparent transition-colors hover:text-ink"
        >
          Weigeren
        </button>
      </div>
    </div>
  );
}
