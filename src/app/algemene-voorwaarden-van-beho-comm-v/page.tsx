import type { Metadata } from "next";
import Link from "next/link";
import { load } from "cheerio/slim";
import LegalPage, { CompanyBlock } from "@/components/LegalPage";
import { approvedSeo, getLegacyPageByPath } from "@/lib/legacy";

/*
 * Algemene voorwaarden, updated in Nov 2026 (handbuilt-routes.json). The
 * WordPress conditions were written for quotes and business customers; with
 * online ordering and payment for consumers, Part A adds what the law asks
 * for distance sales (identity, prices, payment, delivery, the 14-day right
 * of withdrawal with the model form, the 2-year legal guarantee, complaints)
 * and says it wins over Part B for consumers. Part B is the existing text,
 * with its obvious errors corrected (see cleanPartB).
 */
const page = getLegacyPageByPath("/algemene-voorwaarden-van-beho-comm-v/");
const seo = approvedSeo("/algemene-voorwaarden-van-beho-comm-v/");

export const metadata: Metadata = {
  title: { absolute: seo.approvedTitle ?? page?.title ?? "Algemene voorwaarden | Natuurhout" },
  description: seo.approvedDescription ?? page?.description,
  alternates: { canonical: page?.canonical },
};

/**
 * The WordPress text with its obvious errors corrected: stray "br/>",
 * the garantie and geschillen articles that were glued into others, the
 * double article 18, a broken cross-reference in article 5, the prices
 * sentence (prices are incl. btw) and a stray "1." at the end.
 */
function cleanPartB(html: string): string {
  const fixes: [string, string][] = [
    ["Beho.br/&gt; b.", "Beho.<br>\nb."],
    ["levering.br/&gt; c.", "levering.<br>\nc."],
    ["nakoming.<br>\n18. Garantie a. Beho", "nakoming.</p>\n<h4>Garantie</h4>\n<p>a. Beho"],
    ["voortvloeit. 21. Geschillen a. Alle", "voortvloeit.</p>\n<h4>Geschillen</h4>\n<p>a. Alle"],
    ["als bedoeld in dit artikel 5 sub<br>\nd. Op eerste verzoek", "als bedoeld in dit artikel 5 sub a. op eerste verzoek"],
    [
      "a. De prijzen zijn inclusief tenzij anders aangeven exclusief BTW.<br>\n(1) omzetbelasting en andere heffingen welke van overheidswege worden opgelegd;",
      "a. De prijzen zijn inclusief btw, tenzij anders vermeld. Tenzij anders overeengekomen, zijn niet in de prijs inbegrepen:<br>\n(1) andere heffingen welke van overheidswege worden opgelegd;",
    ],
    ["garanties worden ontleend.1.</p>", "garanties worden ontleend.</p>"],
  ];
  let out = html;
  for (const [from, to] of fixes) out = out.split(from).join(to);
  const $ = load(out, null, false);
  const body = $(".gdlr-main-content").first();
  body.find(".clear").remove();
  // Number the articles again in order (1 to 22).
  body.find("h4").each((i, h) => {
    const title = $(h).text().replace(/^\s*\d+\.\s*/, "").trim();
    $(h).replaceWith(`<h3>${i + 1}. ${title}</h3>`);
  });
  return body.html() ?? "";
}

export default function TermsPage() {
  if (!page) throw new Error("The WordPress /algemene-voorwaarden-van-beho-comm-v/ snapshot is missing.");
  return (
    <LegalPage
      page={page}
      heading={seo.approvedHeading ?? "Algemene voorwaarden van BEHO comm.v."}
      intro={
        <p>
          Deze voorwaarden gelden voor elke offerte, bestelling en levering van Natuurhout. Deel A regelt bestellingen via de website en de rechten
          van consumenten; deel B bevat de algemene bepalingen.
        </p>
      }
    >
      <h2>Wie we zijn</h2>
      <CompanyBlock />

      <h2>Deel A. Bestellen via de website en consumenten</h2>
      <p>
        Deel A geldt voor elke bestelling via natuurhout.be (het winkelmandje en het afrekenen) en voor elke overeenkomst met een consument. Een
        consument is iemand die koopt voor privégebruik, niet voor zijn beroep of bedrijf. Voor consumenten gaan deel A en de dwingende regels van
        het consumentenrecht altijd voor op deel B: een bepaling uit deel B die hun wettelijke rechten zou beperken, geldt niet voor hen.
      </p>

      <h3>A1. Prijzen</h3>
      <p>
        Alle prijzen op de website zijn in euro, inclusief 21% btw. De leveringskost staat er apart bij en hangt af van de afstand tot onze werf in
        Zele; u ziet hem bij het afrekenen, voor u betaalt. Afhalen in Zele is gratis. Kennelijke vergissingen in een prijs (bijvoorbeeld een
        tikfout) binden ons niet; we laten het u dan meteen weten en u kunt de bestelling kosteloos annuleren.
      </p>

      <h3>A2. Bestellen en bevestiging</h3>
      <p>
        U bestelt door bij het afrekenen uw gegevens in te vullen, te kiezen voor afhalen of leveren, een betaalmethode te kiezen en op “Betalen” of
        “Bestelling plaatsen” te klikken. De overeenkomst komt tot stand op dat moment; u krijgt meteen een bevestiging per e-mail. Verstuurt u uw
        bestelling als aanvraag (zonder te betalen), dan komt de overeenkomst pas tot stand als wij ze per e-mail bevestigen.
      </p>
      <p>
        Producten “op bestelling” zijn niet op voorraad; we laten u de levertermijn weten. Kunnen we een product toch niet leveren, dan laten we het
        u zo snel mogelijk weten en betalen we wat u ervoor betaalde binnen 14 dagen terug.
      </p>

      <h3>A3. Betalen</h3>
      <ul>
        <li>
          <strong>Online</strong> via de beveiligde betaalpagina van MultiSafepay (Bancontact, Visa, Mastercard, KBC/CBC, Belfius of iDEAL). Een
          online bestelling die na drie dagen niet betaald is, vervalt.
        </li>
        <li>
          <strong>Overschrijving:</strong> u krijgt meteen ons rekeningnummer, een gestructureerde mededeling en een QR-code. Betaal vóór de
          vervaldatum op de bestelbevestiging (standaard 8 dagen). We maken de bestelling klaar zodra de betaling binnen is.
        </li>
      </ul>
      <p>U krijgt de factuur per e-mail zodra de betaling binnen is. De producten blijven onze eigendom tot ze volledig betaald zijn.</p>

      <h3>A4. Afhalen en levering</h3>
      <p>
        <strong>Afhalen</strong> kan op onze werf, A. Van Der Moerenstraat 39 in Zele. We laten u weten wanneer uw bestelling klaarstaat en helpen
        u inladen.
      </p>
      <p>
        <strong>Leveren</strong> doen we met onze eigen wagen in België. De prijs hangt af van de afstand; voor verdere afstanden geldt een
        minimumbedrag per bestelling, dat u ziet zodra uw postcode bekend is. Bij levering vragen we uw gsm-nummer. We mailen u wanneer we komen
        leveren en bellen u als dat nodig is. Zorg dat de leveringsplaats vlot bereikbaar is voor onze wagen.
      </p>
      <p>
        Wat op voorraad is, leveren we meestal binnen de week; andere producten volgens de levertermijn die we u meedelen. Een consument draagt
        het risico op verlies of schade pas vanaf het moment dat hij (of iemand die hij aanwijst) de producten in ontvangst neemt.
      </p>

      <h3>A5. Herroepingsrecht (14 dagen bedenktijd)</h3>
      <p>
        Als consument mag u een bestelling via de website binnen 14 dagen herroepen, zonder reden. Die termijn begint de dag nadat u (of iemand die
        u aanwijst) de producten ontvangt of afhaalt; bij een bestelling in meerdere leveringen, de dag nadat u de laatste ontvangt.
      </p>
      <p>
        <strong>Hoe:</strong> laat het ons binnen die termijn ondubbelzinnig weten, bijvoorbeeld per e-mail naar info@natuurhout.be. U mag het
        modelformulier hieronder gebruiken, maar dat is niet verplicht.
      </p>
      <p>
        <strong>Terugsturen:</strong> breng of stuur de producten binnen 14 dagen na uw melding terug, onbeschadigd en zoveel mogelijk in de
        originele staat. De rechtstreekse kosten van het terugsturen zijn voor u. Onze producten zijn groot en zwaar en kunnen niet met de post
        terug: u brengt ze terug naar onze werf in Zele, of wij halen ze op tegen dezelfde prijs als een levering naar uw postcode.
      </p>
      <p>
        <strong>Terugbetaling:</strong> we betalen alles wat u betaalde, inclusief de standaard leveringskost, terug binnen 14 dagen na uw melding,
        met dezelfde betaalmethode. We mogen wachten tot we de producten terug hebben. U bent aansprakelijk voor waardevermindering door een
        behandeling die verder gaat dan nodig om de producten te bekijken (zoals u dat in een winkel zou doen); geplaatst of verzaagd hout kan
        niet meer terug.
      </p>
      <p>
        <strong>Uitzondering:</strong> het herroepingsrecht geldt niet voor producten die we volgens uw specificaties maken of aanpassen, zoals
        maatwerkpoorten en op maat gemaakte producten.
      </p>
      <p>
        <strong>Modelformulier voor herroeping</strong> (alleen invullen en terugsturen als u de overeenkomst wilt herroepen):
      </p>
      <div className="mt-3 rounded-xl border border-line bg-white p-4 text-[15px] leading-7">
        <p className="!mt-0">Aan BEHO comm.v. (Natuurhout), A. Van Der Moerenstraat 39, 9240 Zele, info@natuurhout.be:</p>
        <p>
          Ik deel u hierbij mee dat ik onze overeenkomst betreffende de verkoop van de volgende goederen herroep: …
          <br />
          Besteld op / ontvangen op: …
          <br />
          Bestelnummer: …
          <br />
          Naam: …
          <br />
          Adres: …
          <br />
          Handtekening (alleen als u dit formulier op papier indient): …
          <br />
          Datum: …
        </p>
      </div>

      <h3>A6. Huur van gereedschap</h3>
      <p>
        De grondboor en de rubberen slaghamer kunt u huren voor €60: €10 huur en €50 borg. U krijgt de borg terug als u het gereedschap volledig en
        in goede staat terugbrengt, binnen de termijn die we afspreken. Bij schade of verlies mogen we de herstel- of vervangingskost van de borg
        afhouden.
      </p>

      <h3>A7. Wettelijke garantie</h3>
      <p>
        Als consument hebt u recht op de wettelijke garantie van twee jaar vanaf de levering, voor gebreken die er bij de levering al waren. Meld
        een gebrek zo snel mogelijk en uiterlijk binnen twee maanden nadat u het vaststelt, bij voorkeur met foto’s, via info@natuurhout.be. We
        herstellen of vervangen het product, of als dat niet mogelijk is, geven we (een deel van) de prijs terug.
      </p>
      <p>
        Onze producten zijn van onbehandeld natuurhout. Kleur- en vormverschillen, scheurtjes, kwasten, vergrijzing en lichte kromming zijn eigen aan
        het hout en geen gebrek. De garantie geldt niet voor schade door verkeerde plaatsing, ongeschikt gebruik of normale slijtage.
      </p>

      <h3>A8. Klachten</h3>
      <p>
        Hebt u een klacht, mail dan naar info@natuurhout.be of bel 052 55 88 58; we zoeken samen met u een oplossing. Komen we er samen niet uit,
        dan kunt u als consument terecht bij de{" "}
        <a href="https://consumentenombudsdienst.be" target="_blank" rel="noopener">Consumentenombudsdienst</a>, Koning Albert II-laan 8 bus 1, 1000
        Brussel.
      </p>

      <h3>A9. Privacy</h3>
      <p>
        Hoe we met uw gegevens omgaan, leest u in onze <Link href="/privacyverklaring/">privacyverklaring</Link>.
      </p>

      <h2>Deel B. Algemene bepalingen</h2>
      <p>
        Deel B geldt voor alle offertes en overeenkomsten van BEHO comm.v. (hierna “Beho”), voor consumenten alleen voor zover deel A en het
        consumentenrecht niet anders bepalen.
      </p>
      <div dangerouslySetInnerHTML={{ __html: cleanPartB(page.html) }} />
    </LegalPage>
  );
}
