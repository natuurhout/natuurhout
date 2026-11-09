// Consent-gated tracking. Nothing loads until the visitor accepts in
// CookieConsent.tsx (opt-in, like the Complianz setup on the old WordPress
// site). IDs are the ones the live site fired (migration/phase0-report.md §6):
// the GTM container, GA4 (statistics) and the Meta Pixel (marketing).
export const GTM_ID = "GTM-PNLTC3D";
export const GA4_ID = "G-CN9LQB6Q07";
export const META_PIXEL_ID = "705295257764810";

export type Consent = { statistics: boolean; marketing: boolean };
const STORAGE_KEY = "nh-consent-v1";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function readConsent(): Consent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Consent>;
    return {
      statistics: Boolean(parsed.statistics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

export function saveConsent(consent: Consent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // Private mode / blocked storage: the banner simply shows again next visit.
  }
}

function script(src: string) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const el = document.createElement("script");
  el.async = true;
  el.src = src;
  document.head.appendChild(el);
}

let loaded: Consent = { statistics: false, marketing: false };

/** Load the tags the visitor consented to (idempotent). */
export function applyConsent(consent: Consent) {
  if (!consent.statistics && !consent.marketing) return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    // Consent Mode v2 defaults before any Google tag runs.
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500,
    });
    window.gtag("js", new Date());
  }
  window.gtag("consent", "update", {
    analytics_storage: consent.statistics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  });

  if (consent.statistics && !loaded.statistics) {
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    script(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`);
    window.gtag("config", GA4_ID);
    script(`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`);
  }
  if (consent.marketing && !loaded.marketing && !window.fbq) {
    const queue: unknown[][] = [];
    const fbq = Object.assign(
      (...args: unknown[]) => {
        queue.push(args);
      },
      {
        queue,
        loaded: true,
        version: "2.0",
        push: (...args: unknown[]) => queue.push(args),
      },
    );
    window.fbq = fbq;
    window._fbq = fbq;
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
    script("https://connect.facebook.net/en_US/fbevents.js");
  }
  loaded = {
    statistics: loaded.statistics || consent.statistics,
    marketing: loaded.marketing || consent.marketing,
  };
}

/** A quote/order request was sent successfully (the real conversion). */
export function trackLead(kind: "offerte" | "bestelling" | "calculator") {
  window.dataLayer?.push({ event: "generate_lead", lead_kind: kind });
  window.gtag?.("event", "generate_lead", { lead_kind: kind });
  window.fbq?.("track", "Lead", { content_name: kind });
}

export const OPEN_CONSENT_EVENT = "nh:consent-open";
