import type { Metadata } from "next";
import Link from "next/link";
import CookieSettingsLink from "@/components/CookieSettingsLink";
import LegalPage from "@/components/LegalPage";
import { approvedSeo, getLegacyPageByPath } from "@/lib/legacy";

/*
 * Cookiebeleid, rewritten in Nov 2026 (handbuilt-routes.json): the WordPress
 * page was a Complianz list of WooCommerce, Wordfence, Elementor, reCAPTCHA,
 * Wistia, OptinMonster and other cookies of the old site. Now: what this site
 * stores (src/lib/tracking.ts, src/lib/cart.ts) and a button that reopens
 * the cookie banner (CookieConsent).
 */
const page = getLegacyPageByPath("/cookiebeleid-eu/");
const seo = approvedSeo("/cookiebeleid-eu/");

export const metadata: Metadata = {
  title: { absolute: seo.approvedTitle ?? page?.title ?? "Cookiebeleid | Natuurhout" },
  description: seo.approvedDescription ?? page?.description,
  alternates: { canonical: page?.canonical },
};

const button =
  "inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep";

export default function CookiePolicyPage() {
  if (!page) throw new Error("The WordPress /cookiebeleid-eu/ snapshot is missing.");
  return (
    <LegalPage
      page={page}
      heading={seo.approvedHeading ?? "Cookiebeleid (EU)"}
      intro={
        <>
          <p>
            Natuurhout gebruikt alleen wat nodig is om de website te laten werken. Statistiek- en marketingcookies plaatsen we pas als u daarvoor
            toestemming geeft, en u kunt uw keuze altijd wijzigen.
          </p>
          <p className="mt-4">
            <CookieSettingsLink className={button} label="Mijn cookie-instellingen wijzigen" />
          </p>
        </>
      }
    >
      <h2>Wat zijn cookies?</h2>
      <p>
        Een cookie is een klein bestand dat een website in uw browser bewaart. Daarnaast kan een website ook gegevens in uw browser zelf opslaan
        (“lokale opslag”). In dit beleid noemen we dat allemaal cookies.
      </p>

      <h2>Noodzakelijk (altijd aan)</h2>
      <p>Zonder deze gegevens werkt de website niet zoals u verwacht. Ze blijven in uw browser en we gebruiken ze niet om u te volgen.</p>
      <table>
        <thead>
          <tr><th>Naam</th><th>Waarvoor</th><th>Hoe lang</th></tr>
        </thead>
        <tbody>
          <tr><td>nh-consent-v1</td><td>Onthoudt uw cookiekeuze, zodat we die niet bij elke pagina opnieuw vragen.</td><td>Tot u ze wijzigt of uw browsergegevens wist</td></tr>
          <tr><td>natuurhout-winkelmandje-v1</td><td>Bewaart wat in uw winkelmandje zit.</td><td>Tot u bestelt, het mandje leegmaakt of uw browsergegevens wist</td></tr>
          <tr><td>__cf_bm (Cloudflare)</td><td>Kan door onze hostingpartij Cloudflare geplaatst worden om de website tegen bots en misbruik te beschermen.</td><td>30 minuten</td></tr>
        </tbody>
      </table>

      <h2>Statistieken (alleen met uw toestemming)</h2>
      <p>
        Met Google Analytics 4, geladen via Google Tag Manager, zien we hoe de website gebruikt wordt: welke pagina’s bezocht worden en hoe
        bezoekers bij ons terechtkomen. Zo kunnen we de website verbeteren.
      </p>
      <table>
        <thead>
          <tr><th>Naam</th><th>Waarvoor</th><th>Hoe lang</th></tr>
        </thead>
        <tbody>
          <tr><td>_ga</td><td>Onderscheidt bezoekers voor de statistieken.</td><td>2 jaar</td></tr>
          <tr><td>_ga_*</td><td>Houdt het bezoek bij voor de statistieken.</td><td>2 jaar</td></tr>
        </tbody>
      </table>

      <h2>Marketing (alleen met uw toestemming)</h2>
      <p>
        Met de Meta Pixel (Facebook en Instagram) meten we of onze advertenties werken en kunnen we ze afstemmen op mensen die onze website
        bezochten. Via Google Tag Manager kunnen ook advertentiemetingen van Google geladen worden.
      </p>
      <table>
        <thead>
          <tr><th>Naam</th><th>Waarvoor</th><th>Hoe lang</th></tr>
        </thead>
        <tbody>
          <tr><td>_fbp</td><td>Herkent uw browser voor het meten en tonen van advertenties.</td><td>3 maanden</td></tr>
          <tr><td>_fbc</td><td>Onthoudt via welke advertentie u op de website kwam.</td><td>3 maanden</td></tr>
        </tbody>
      </table>
      <p>
        Lees ook het privacybeleid van{" "}
        <a href="https://policies.google.com/privacy?hl=nl" target="_blank" rel="noopener">Google</a> en{" "}
        <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener">Meta</a>.
      </p>

      <h2>Betalen</h2>
      <p>
        Betaalt u online, dan gaat u naar de beveiligde betaalpagina van MultiSafepay. Die plaatst daar haar eigen noodzakelijke cookies; zie het{" "}
        <a href="https://www.multisafepay.com/nl/privacy" target="_blank" rel="noopener">privacybeleid van MultiSafepay</a>.
      </p>

      <h2>Links naar andere websites</h2>
      <p>
        Klikt u op een link naar bijvoorbeeld WhatsApp, Facebook, Instagram, YouTube of Google Maps, dan gelden daar de cookies en het privacybeleid
        van die website. Op natuurhout.be zelf sluiten we geen video’s of kaarten in.
      </p>

      <h2>Uw keuze wijzigen of cookies wissen</h2>
      <p>
        Klik op <CookieSettingsLink className="font-medium text-accent-deep underline underline-offset-2 hover:text-ink" label="Cookie-instellingen" />{" "}
        (ook onderaan elke pagina) om uw toestemming te geven of in te trekken. U kunt cookies en lokale opslag ook wissen in de instellingen van uw
        browser; uw winkelmandje is dan leeg.
      </p>
      <p>
        Meer over hoe we met uw gegevens omgaan, leest u in onze <Link href="/privacyverklaring/">privacyverklaring</Link>. Terug naar de{" "}
        <Link href="/">homepage</Link>.
      </p>
    </LegalPage>
  );
}
