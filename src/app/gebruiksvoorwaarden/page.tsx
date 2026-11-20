import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { CompanyBlock } from "@/components/LegalPage";
import { approvedSeo, getLegacyPageByPath } from "@/lib/legacy";

/*
 * Gebruiksvoorwaarden, updated in Nov 2026 (handbuilt-routes.json): the
 * WordPress text named "Informatietuinen BEHO comm.v" and the Dutch privacy
 * law (WBP). Same content, corrected: the right company, the AVG, links to
 * the privacyverklaring and algemene voorwaarden, a line on prices.
 */
const page = getLegacyPageByPath("/gebruiksvoorwaarden/");
const seo = approvedSeo("/gebruiksvoorwaarden/");

export const metadata: Metadata = {
  title: { absolute: seo.approvedTitle ?? page?.title ?? "Gebruiksvoorwaarden | Natuurhout" },
  description: seo.approvedDescription ?? page?.description,
  alternates: { canonical: page?.canonical },
};

export default function TermsOfUsePage() {
  if (!page) throw new Error("The WordPress /gebruiksvoorwaarden/ snapshot is missing.");
  return (
    <LegalPage page={page} heading={seo.approvedHeading ?? "Gebruiksvoorwaarden"}>
      <h2>Toepassing</h2>
      <p>
        Op het gebruik van de website www.natuurhout.be zijn deze gebruiksvoorwaarden van toepassing. De website is van:
      </p>
      <CompanyBlock />
      <p>
        Door de website te gebruiken, aanvaardt u deze voorwaarden. Voor bestellingen gelden onze{" "}
        <Link href="/algemene-voorwaarden-van-beho-comm-v/">algemene voorwaarden</Link>.
      </p>

      <h2>Informatie op de website</h2>
      <p>
        We stellen de informatie op deze website met zorg samen en houden ze bij. Toch kan er een fout in staan. Aan de informatie kunnen geen
        rechten worden ontleend. Kennelijke vergissingen in prijzen of productinformatie (bijvoorbeeld een tikfout) binden ons niet; we laten het u
        dan zo snel mogelijk weten. Natuurhout is niet aansprakelijk voor schade door het gebruik van de website, door onvolledige of onjuiste
        informatie, of doordat de website (tijdelijk) niet beschikbaar is, behalve bij opzet of grove fout.
      </p>
      <p>
        De website bevat links naar websites van anderen. We kiezen die met zorg, maar zijn niet verantwoordelijk voor hun inhoud of
        beschikbaarheid.
      </p>
      <p>
        We doen ons best om elke mail en elk formulier snel te beantwoorden, maar kunnen niet garanderen dat een elektronisch bericht altijd tijdig
        aankomt. Kreeg u binnen twee werkdagen geen antwoord, bel ons dan even op 052 55 88 58.
      </p>

      <h2>Intellectuele eigendom</h2>
      <p>
        Alle teksten, foto’s, afbeeldingen, logo’s, de vormgeving en de opbouw van deze website zijn van BEHO comm.v. (Natuurhout) of haar
        licentiegevers. U mag ze bekijken en voor persoonlijk gebruik bewaren. Kopiëren, verspreiden of commercieel gebruiken mag alleen met onze
        voorafgaande schriftelijke toestemming.
      </p>

      <h2>Privacy en cookies</h2>
      <p>
        We gaan zorgvuldig om met uw persoonsgegevens, volgens de Algemene Verordening Gegevensbescherming (AVG). Lees er meer over in onze{" "}
        <Link href="/privacyverklaring/">privacyverklaring</Link> en ons <Link href="/cookiebeleid-eu/">cookiebeleid</Link>.
      </p>

      <h2>Wijzigingen</h2>
      <p>We mogen deze gebruiksvoorwaarden altijd aanpassen. De nieuwe versie geldt vanaf ze op de website staat.</p>

      <h2>Toepasselijk recht</h2>
      <p>
        Op deze website en deze voorwaarden is het Belgisch recht van toepassing. Geschillen gaan naar de bevoegde rechtbank van de plaats waar
        BEHO comm.v. gevestigd is, tenzij de wet een andere rechtbank aanwijst (bijvoorbeeld voor consumenten).
      </p>
    </LegalPage>
  );
}
