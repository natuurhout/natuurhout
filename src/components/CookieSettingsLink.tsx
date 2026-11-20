"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/tracking";

/** Reopens the cookie banner. The footer's look by default; pages can pass their own. */
export default function CookieSettingsLink({
  className = "text-white/75 transition-colors hover:text-white",
  label = "Cookie-instellingen",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className={className}>
      {label}
    </button>
  );
}
