"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/tracking";

export default function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className="text-white/75 transition-colors hover:text-white"
    >
      Cookie-instellingen
    </button>
  );
}
