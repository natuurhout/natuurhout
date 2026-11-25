"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/*
 * Anonymous visitor count for the backend (tab Bezoekers, worker/visits.ts):
 * one beacon per page and a ping every minute while the page is visible, so
 * the backend sees who is on the site now. No cookies, nothing stored in the
 * browser; the server keeps no IP address (privacyverklaring). Not on a local
 * dev server or in automated browsers.
 */
const PING_MS = 60_000;
const PING_FOR_MS = 30 * 60_000;

function send(body: Record<string, string>) {
  const data = JSON.stringify(body);
  try {
    if (navigator.sendBeacon?.("/api/bezoek/", new Blob([data], { type: "text/plain" }))) return;
  } catch {
    // fall through to fetch
  }
  fetch("/api/bezoek/", { method: "POST", body: data, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
}

export default function VisitCounter() {
  const pathname = usePathname();
  const first = useRef(true);
  const lastView = useRef(0);

  useEffect(() => {
    if (navigator.webdriver || !/^(www\.)?natuurhout\.be$|^localhost$/.test(location.hostname)) return;
    // The first page carries where the visitor came from; later pages are within the site.
    send({ t: "view", p: pathname, r: first.current ? document.referrer : location.href, q: first.current ? location.search : "" });
    first.current = false;
    lastView.current = Date.now();
  }, [pathname]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (navigator.webdriver || document.visibilityState !== "visible" || Date.now() - lastView.current > PING_FOR_MS || !lastView.current) return;
      send({ t: "ping", p: location.pathname });
    }, PING_MS);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}
