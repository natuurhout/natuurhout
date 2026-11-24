"use client";

import { useEffect } from "react";
import { trackContactClick } from "@/lib/tracking";

/** Counts clicks on phone, WhatsApp and e-mail links anywhere on the site (consent-gated in tracking.ts). */
export default function ClickTracking() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href");
      if (href) trackContactClick(href);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
