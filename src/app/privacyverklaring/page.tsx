import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { CompanyBlock } from "@/components/LegalPage";
import { approvedSeo, getLegacyPageByPath } from "@/lib/legacy";

/*
 * Privacyverklaring, rewritten in Nov 2026 (handbuilt-routes.json): the
 * WordPress text listed WordPress, Wordfence and YouTube cookies, a
 * newsletter and user accounts that no longer exist. Now it describes what
 * the site does: forms and orders saved in our own backend, payments through
 * MultiSafepay, mail through Microsoft 365 and Cloudflare, statistics and
 * marketing only after consent.
 */
const page = getLegacyPageByPath("/privacyverklaring/");
const seo = approvedSeo("/privacyverklaring/");

export const metadata: Metadata = {
  title: { absolute: seo.approvedTitle ?? page?.title ?? "Privacyverklaring | Natuurhout" },
  description: seo.approvedDescription ?? page?.description,
  alternates: { canonical: page?.canonical },
};

export default function PrivacyPage() {
  if (!page) throw new Error("The WordPress /privacyverklaring/ snapshot is missing.");
  return (
    <LegalPage
      page={page}
      heading={seo.approvedHeading ?? "Privacyverklaring"}
      intro={<p>Hier leest u welke gegevens Natuurhout van u bewaart, waarom, hoe lang, met wie we ze delen en welke rechten u hebt.</p>}
    >
      <h2>Wie is verantwoordelijk?</h2>
      <CompanyBlock />
      <p>Voor vragen over uw gegevens kunt u altijd mailen naar info@natuurhout.be.</p>

      <h2>Welke gegevens we verwerken</h2>
      <ul>
        <li><strong>Contactgegevens:</strong> naam, e-mailadres, telefoon- of gsm-nummer.</li>
        <li><strong>Adres:</strong> leveringsadres, of postcode en gemeente om de leveringskost te berekenen.</li>
        <li><strong>Bedrijfsgegevens</strong> als u een factuur op bedrijfsnaam vraagt: bedrijfsnaam en btw-nummer.</li>
        <li><strong>Uw aanvraag of bestelling:</strong> de producten, aantallen, prijzen, opmerkingen en foto’s die u meestuurt.</li>
        <li><strong>Betaling:</strong> het bedrag, de betaalmethode en of de betaling gelukt is. Uw kaart- of bankgegevens bij een online betaling ziet u alleen bij MultiSafepay; die komen niet bij ons. Bij een overschrijving zien we de betaling op onze rekening.</li>
        <li><strong>Technische gegevens:</strong> uw IP-adres en browsergegevens, die onze hostingpartij kort bijhoudt om de website te beveiligen en misbruik (zoals spam) te weren.</li>
        <li><strong>Websitegebruik:</strong> alleen als u statistiek- of marketingcookies toestaat (zie ons <Link href="/cookiebeleid-eu/">cookiebeleid</Link>).</li>
      </ul>
      <p>We vragen geen gevoelige gegevens en maken geen gebruikersaccounts aan.</p>

      <h2>Waarom en op welke grond</h2>
      <table>
        <thead>
          <tr><th>Doel</th><th>Grond</th></tr>
        </thead>
        <tbody>
          <tr><td>Uw vraag of offerteaanvraag beantwoorden en opvolgen</td><td>Op uw verzoek, vóór een overeenkomst</td></tr>
          <tr><td>Uw bestelling uitvoeren: bevestigen, betaling verwerken, klaarmaken, leveren of laten afhalen, factureren</td><td>Uitvoering van de overeenkomst</td></tr>
          <tr><td>U bellen of mailen over de levering (daarom vragen we bij levering een gsm-nummer)</td><td>Uitvoering van de overeenkomst</td></tr>
          <tr><td>Facturen en boekhouding bewaren</td><td>Wettelijke verplichting</td></tr>
          <tr><td>Klantenbeheer: weten wat u eerder bestelde, als u ons opnieuw contacteert</td><td>Gerechtvaardigd belang</td></tr>
          <tr><td>De website beveiligen en spam weren</td><td>Gerechtvaardigd belang</td></tr>
          <tr><td>Statistieken over het websitegebruik (Google Analytics)</td><td>Uw toestemming (statistiekcookies)</td></tr>
          <tr><td>Onze advertenties meten en afstemmen (Meta Pixel)</td><td>Uw toestemming (marketingcookies)</td></tr>
        </tbody>
      </table>
      <p>We sturen u geen reclame of nieuwsbrief zonder uw toestemming, en we nemen geen beslissingen die alleen door een computer worden genomen.</p>

      <h2>Met wie we gegevens delen</h2>
      <p>We verkopen uw gegevens nooit. We werken met deze partijen, die uw gegevens alleen voor ons verwerken:</p>
      <ul>
        <li><strong>Cloudflare:</strong> hosting van de website, de beveiligde database waarin we aanvragen en bestellingen bewaren, en het verzenden van bevestigingsmails.</li>
        <li><strong>Microsoft (Microsoft 365):</strong> onze mailbox, waarin uw mails en aanvragen binnenkomen.</li>
        <li><strong>MultiSafepay:</strong> de online betalingen (Bancontact, kaarten, KBC/CBC, Belfius, iDEAL).</li>
        <li><strong>iBanFirst:</strong> onze bankrekening, waarop overschrijvingen binnenkomen.</li>
        <li><strong>Google</strong> (Tag Manager en Analytics) en <strong>Meta</strong> (Pixel): alleen als u daarvoor cookies toestaat.</li>
        <li><strong>WhatsApp</strong> (Meta): alleen als u ons zelf via WhatsApp contacteert.</li>
        <li><strong>Onze boekhouder</strong> en, als de wet het vraagt, de overheid (bijvoorbeeld de belastingadministratie).</li>
      </ul>
      <p>
        Sommige van deze partijen kunnen gegevens ook buiten de Europese Economische Ruimte verwerken, bijvoorbeeld in de Verenigde Staten. Dat
        gebeurt alleen met de waarborgen die de privacywetgeving (AVG) vraagt, zoals het EU-VS-gegevensprivacykader of standaardcontractbepalingen
        van de Europese Commissie.
      </p>

      <h2>Hoe lang we gegevens bewaren</h2>
      <ul>
        <li><strong>Vragen en offerteaanvragen</strong> zonder bestelling: tot twee jaar na het laatste contact.</li>
        <li><strong>Bestellingen en facturen:</strong> zolang de boekhoudkundige en fiscale wetgeving dat vereist (in België tot tien jaar).</li>
        <li><strong>Statistieken:</strong> volgens de bewaartermijn die in Google Analytics is ingesteld.</li>
        <li><strong>Uw cookiekeuze en winkelmandje</strong> staan in uw eigen browser; u kunt ze daar altijd wissen.</li>
      </ul>

      <h2>Uw rechten</h2>
      <p>U hebt het recht om:</p>
      <ul>
        <li>uw gegevens in te zien en er een kopie van te krijgen;</li>
        <li>onjuiste gegevens te laten verbeteren;</li>
        <li>uw gegevens te laten wissen, als we ze niet meer nodig hebben of wettelijk niet meer moeten bewaren;</li>
        <li>de verwerking te laten beperken of er bezwaar tegen te maken;</li>
        <li>uw gegevens in een gangbaar bestand te krijgen of aan een ander te laten bezorgen (overdraagbaarheid);</li>
        <li>uw toestemming voor cookies altijd in te trekken, via de knop “Cookie-instellingen” onderaan elke pagina.</li>
      </ul>
      <p>
        Hoe u dat vraagt, leest u op <Link href="/verzoek-toegang-tot-data/">verzoek toegang tot uw gegevens</Link>. We antwoorden binnen één maand, en
        het is gratis.
      </p>
      <p>
        Bent u niet tevreden over hoe we met uw gegevens omgaan, laat het ons dan eerst weten. U kunt ook klacht indienen bij de{" "}
        <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener">Gegevensbeschermingsautoriteit</a>, Drukpersstraat 35,
        1000 Brussel.
      </p>

      <h2>Beveiliging</h2>
      <p>
        De website werkt alleen via een beveiligde verbinding (https). Aanvragen en bestellingen staan in een afgeschermde database; alleen
        medewerkers van Natuurhout kunnen erbij, na aanmelding met een eenmalige code per e-mail. Online betalingen lopen via de beveiligde
        betaalpagina van MultiSafepay.
      </p>

      <h2>Kinderen</h2>
      <p>
        Onze website is niet bedoeld voor kinderen jonger dan 16 jaar. Denkt u dat we zonder toestemming gegevens van een minderjarige hebben, mail
        ons dan en we wissen ze.
      </p>

      <h2>Wijzigingen</h2>
      <p>Verandert er iets aan hoe we met gegevens omgaan, dan passen we deze verklaring aan. De datum bovenaan toont de laatste wijziging.</p>
    </LegalPage>
  );
}
