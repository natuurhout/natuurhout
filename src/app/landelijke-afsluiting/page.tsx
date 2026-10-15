import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import { P, PLACES, ProductItem, Section, textLink, withPageMeta } from "@/components/LandingParts";
import Realisaties from "@/components/Realisaties";
import { formatPrice, getProduct } from "@/lib/catalog";
import { ADDRESS } from "@/lib/contact";
import { getLegacyPageByPath } from "@/lib/legacy";
import { QUOTE_HREF } from "@/lib/navigation";
import { realisatiesFor } from "@/lib/realisaties";

/*
 * "Landelijke afsluitingen": the WordPress landing page, rewritten with
 * Xander (Oct 2026) for "tuinafsluiting in Vlaanderen" around what
 * Natuurhout sells: hekwerk in kastanje, robinia and hazelaar, vlechtschermen,
 * lariks, Post & Rail and veldpoorten, gates and posts. Product links show a
 * small photo on hover. Canonical and structured data are the snapshot's;
 * title, description and h1 are approved replacements and the snapshot's
 * internal links all stay (handbuilt-routes.json).
 */
const page = getLegacyPageByPath("/landelijke-afsluiting/");

const TITLE = "Landelijke tuinafsluiting in Vlaanderen | Natuurhout";
const DESCRIPTION =
  "Landelijke tuinafsluitingen in kastanje, robinia en hazelaar: hekwerk, vlechtschermen, lariks en Post & Rail. Levering en plaatsing in heel Vlaanderen vanuit Zele.";
const HEADING = "Landelijke afsluitingen in Vlaanderen";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: page?.canonical },
  openGraph: { title: TITLE, description: DESCRIPTION, url: page?.canonical, locale: "nl_BE", type: "website", images: [{ url: "/fotos/realisaties/lievegem-robinia-1.jpg" }] },
};

/** Lowest price per running metre of a fence at one height ("100cm / … (10m rol)"), current at build time. */
function perMeter(handle: string, height: number): string | null {
  const prices = (getProduct(handle)?.variants ?? []).flatMap((variant) => {
    const m = variant.title.match(/^(\d+)cm\s*\/.*\((\d+)m rol\)/);
    return m && Number(m[1]) === height && !variant.promo ? [parseFloat(variant.price) / Number(m[2])] : [];
  });
  return prices.length ? formatPrice(Math.min(...prices)) : null;
}

function faqs(): FaqItem[] {
  const kastanje = perMeter("kastanje-rasterwerk", 100);
  const robinia = perMeter("robinia-hekwerk", 100);
  const hazelaar = perMeter("hazelaar-hekwerk", 90);
  const palen = getProduct("palen")?.priceFrom;
  const cost = [
    kastanje && `kastanje hekwerk van 1 m hoog vanaf ${kastanje}`,
    robinia && `robinia hekwerk van 1 m hoog vanaf ${robinia}`,
    hazelaar && `hazelaar hekwerk van 90 cm hoog vanaf ${hazelaar}`,
  ].filter(Boolean).join(", ");
  const costText = `Bij Natuurhout kost ${cost} per lopende meter (incl. btw). Reken daarbij een paal om de ±1,80 m${palen ? `; kastanje palen kosten vanaf ${formatPrice(palen)} per stuk` : ""}. Met de calculator berekent u meteen de richtprijs van uw volledige afsluiting.`;
  return [
    {
      q: "Wat kost een landelijke afsluiting per meter?",
      text: costText,
      body: (
        <>
          {costText.replace(" Met de calculator berekent u meteen de richtprijs van uw volledige afsluiting.", "")} Met de{" "}
          <Link href="/calculator/?keuze=hekwerk" className={textLink}>calculator</Link> berekent u meteen de richtprijs van uw volledige afsluiting.
        </>
      ),
    },
    {
      q: "Hoeveel palen heb ik nodig voor hekwerk?",
      text: "Wij raden gemiddeld een paal om de 1,80 m aan, plus een eindpaal: voor 20 meter hekwerk zijn dat 13 palen. Bij hoog hekwerk (1,50 m en hoger) zet u de palen liefst om de 1,50 m. Het hangt ook af van de ondergrond: op zachte grond zet u ze dichter bij elkaar dan op stevige grond. Laat nooit meer dan 2 meter tussen twee palen. Bij vlechtschermen heeft u altijd één paal meer dan schermen: een begin- en eindpaal en één tussen elke twee schermen.",
    },
    {
      q: "Hoe diep moeten de palen in de grond?",
      text: "Zet de palen ongeveer een derde van hun lengte in de grond. Voor hekwerk van 1 m hoog kiest u dus palen van 1,50 m. Zet eerst de hoek- en eindpalen, span een touw en plaats daarna de tussenpalen.",
    },
    {
      q: "Welke hoogte kies ik voor mijn tuinafsluiting?",
      text: "Hekwerk van 60 tot 90 cm is mooi om een border, moestuin of voortuin af te bakenen. Van 1 m tot 1,20 m is de klassieke tuinafsluiting, die ook kinderen of een hond binnenhoudt. Hekwerk van 1,50 tot 1,80 m hoog kiest u voor een hogere afsluiting, bijvoorbeeld voor grotere honden of om dieren binnen of buiten te houden. Door hekwerk kijkt u tussen de latten door; wilt u privacy, kies dan vlechtschermen.",
    },
    {
      q: "Hoe lang gaat een houten afsluiting mee?",
      text: "Zonder behandeling gaat kastanje hekwerk ongeveer 15 tot 25 jaar mee, robinia ongeveer 25 tot 40 jaar en hazelaar ongeveer 8 tot 15 jaar. Een postsaver rond de voet van de palen verlengt de levensduur van de palen.",
      body: (
        <>
          Zonder behandeling gaat kastanje hekwerk ongeveer 15 tot 25 jaar mee, robinia ongeveer 25 tot 40 jaar en hazelaar ongeveer 8 tot 15
          jaar. Een <Link href="/project/postsaver-voor-palen/" className={textLink}>postsaver</Link> rond de voet van de palen verlengt de
          levensduur van de palen. Lees ook{" "}
          <Link href="/kastanje-hazelaar-of-robinia-hekwerk-wat-is-het-verschil/" className={textLink}>het verschil tussen kastanje, hazelaar en robinia</Link>.
        </>
      ),
    },
    {
      q: "Moet ik een houten afsluiting behandelen?",
      text: "Nee. Kastanje en robinia zijn van nature duurzaam en worden zonder chemische behandeling geleverd. Het hout vergrijst na verloop van tijd tot een mooie zilvergrijze kleur.",
    },
    {
      q: "Kan ik een landelijke afsluiting zelf plaatsen?",
      text: "Ja. Met een grondboor, een slaghamer, houtschroeven en een spantouw plaatst u hekwerk zelf. Natuurhout verhuurt een slaghamer of handboor voor €10, met €50 borg. Onze handleiding legt het stap voor stap uit.",
      body: (
        <>
          Ja. Met een grondboor, een slaghamer, houtschroeven en een spantouw plaatst u hekwerk zelf. Natuurhout verhuurt een slaghamer of
          handboor voor €10, met €50 borg. Onze{" "}
          <Link href="/tipsenideeen/kastanje-hekwerk-en-poort-plaatsen/" className={textLink}>handleiding</Link> legt het stap voor stap uit.
        </>
      ),
    },
    {
      q: "Leveren en plaatsen jullie afsluitingen in heel Vlaanderen?",
      text: `Ja. Vanuit Zele leveren we in heel Vlaanderen en België, en op aanvraag plaatsen we uw afsluiting. Afhalen kan ook, in de ${ADDRESS.street} in ${ADDRESS.city}.`,
    },
  ];
}

const USPS = ["FSC®- en PEFC-gecertificeerd hout", "Hout vrij van chemische behandelingen", "Handgemaakte producten"];

export default function LandelijkeAfsluitingPage() {
  if (!page) throw new Error("The WordPress /landelijke-afsluiting/ snapshot is missing.");
  const projects = realisatiesFor({ pathname: "/project/rasterwerk-kastanjehout/" });

  return (
    <>
      {page.structuredData && <JsonLd data={withPageMeta(page.structuredData, TITLE, DESCRIPTION)} />}
      <article className="mx-auto w-full max-w-[64rem] overflow-x-clip px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
          <span aria-hidden className="h-px w-8 bg-accent" />
          Tuinafsluitingen
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{HEADING}</h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-4 text-lg leading-relaxed text-ink/75">
            <p>
              Een landelijke afsluiting bakent uw tuin, erf of weide op een natuurlijke manier af, met hout dat opgaat in
              het landschap en jarenlang meegaat. Natuurhout in Zele levert landelijke tuinafsluitingen in{" "}
              <strong className="text-ink">kastanje</strong>, <strong className="text-ink">robinia</strong> en{" "}
              <strong className="text-ink">hazelaar</strong>: van hekwerk op rol tot vlechtschermen, lariks en Post &amp; Rail.
            </p>
            <p>We leveren in heel Vlaanderen en België, en plaatsen uw afsluiting ook voor u.</p>
            <ul className="space-y-1.5 text-base">
              {USPS.map((usp) => (
                <li key={usp} className="flex items-center gap-2 font-medium text-ink">
                  <Check aria-hidden className="h-4 w-4 shrink-0 text-accent-deep" /> {usp}
                </li>
              ))}
            </ul>
            <p className="flex flex-wrap gap-3 pt-1 text-base">
              <Link href="/producten/" className="inline-flex items-center gap-2 rounded-full border border-accent-deep px-5 py-2.5 font-semibold text-accent-deep hover:bg-accent-deep hover:text-white">
                Bekijk onze producten
              </Link>
              <Link href={QUOTE_HREF} className="inline-flex items-center gap-2 rounded-full bg-accent-deep px-5 py-2.5 font-semibold text-white hover:bg-[#9a520d]">
                Vraag een offerte aan <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </p>
          </div>
          <figure>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-brand-soft/50">
              <Image
                src="/fotos/realisaties/lievegem-robinia-1.jpg"
                alt="Robinia hekwerk langs de straat in Lievegem, geplaatst door Natuurhout"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 460px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-sm text-ink/55">Robinia hekwerk in Lievegem, geplaatst door Natuurhout.</figcaption>
          </figure>
        </div>

        <Section title="Hekwerk: de klassieke landelijke afsluiting">
          <p>
            Hekwerk of rasterwerk bestaat uit gekloven latten die met verzinkte draad op een rol zijn gebonden. Het volgt
            vlot de lijn van uw tuin, ook op oneffen terrein, en is snel geplaatst tussen houten palen: gemiddeld om de
            1,80 m, bij hoog hekwerk om de 1,50 m en nooit meer dan 2 m uit elkaar. Het hekwerk blijft open, u kijkt
            tussen de latten door.
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            <ProductItem href="/project/rasterwerk-kastanjehout/" name="Kastanje hekwerk">
              De klassieker: van 60 cm tot 1,80 m hoog, met smalle (4,5/5 cm) of brede (7,5/8 cm) latafstand.
            </ProductItem>
            <ProductItem href="/project/robinia-rasterwerk/" name="Robinia hekwerk">
              Het duurzaamste hout van Europa, van 1 m tot 1,50 m hoog. Kleurt na verloop van tijd zilvergrijs.
            </ProductItem>
            <ProductItem href="/project/hazelaarrasterwerk/" name="Hazelaar hekwerk">
              Lichter en speelser van uitzicht, van 60 cm tot 1,50 m hoog. Mooi rond borders en moestuinen.
            </ProductItem>
          </ul>
        </Section>

        <Section title="Vlechtschermen en lariks: meer privacy">
          <ul className="grid gap-3 sm:grid-cols-3">
            <ProductItem href="/project/hazelaarvlechtschermen/" name="Hazelaar vlechtschermen">
              Handgevlochten schermen in hazelaar: een natuurlijke tuinafscheiding die inkijk tegenhoudt.
            </ProductItem>
            <ProductItem href="/project/hazelaar-vlechtscherm-hasseltre/" name="Vlechtschermen met halve latten">
              Stevige schermen met halve hazelaar latten, ook 1,80 m hoog, voor een strakke en dichte afsluiting.
            </ProductItem>
            <ProductItem href="/project/lariks-schaal-delen-2/" name="Lariks schaaldelen">
              Planken met schors aan de rand, horizontaal of verticaal, voor een robuuste schutting.
            </ProductItem>
          </ul>
        </Section>

        <Section title="Weide- en paardenomheining">
          <p>
            Voor paarden, vee of een erfafscheiding kiest u een open omheining met palen en liggers:{" "}
            <P href="/project/post-rail-2/">Post &amp; Rail</P> in kastanje, met 2 of 3 liggers. Voor de toegang tot de weide
            zijn er robuuste <P href="/project/cleft-field-veldpoorten/">Cleft &amp; Field veldpoorten</P>.
          </p>
        </Section>

        <Section title="Poorten en palen bij uw afsluiting">
          <p>
            Maak uw afsluiting af met een bijpassende poort: bekijk onze{" "}
            <Link href="/houten-tuinpoorten/" className={textLink}>houten tuinpoorten</Link>, zoals de{" "}
            <P href="/project/franse-poorten/">kastanje premium poorten</P> of een poort op maat. Zet het geheel op stevige{" "}
            <P href="/project/kastanjepalen/">kastanje palen</P>, <P href="/project/robinia-palen/">robinia palen</P> of{" "}
            <P href="/project/eiken-palen/">eiken palen</P>, en bescherm de voet met een{" "}
            <P href="/project/postsaver-voor-palen/">postsaver</P>.
          </p>
        </Section>

        <Section title="Welke houtsoort kiest u?">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink">Kastanje</strong>: van nature duurzaam en bestand tegen vocht en insecten, zonder
              chemische behandeling. De populairste keuze voor <Link href="/project/rasterwerk-kastanjehout/" className={textLink}>hekwerk</Link>.
            </li>
            <li>
              <strong className="text-ink">Robinia</strong>: nog steviger en de langste levensduur van alle Europese
              houtsoorten. Ideaal voor <Link href="/project/robinia-rasterwerk/" className={textLink}>hekwerk</Link> en poortpalen.
            </li>
            <li>
              <strong className="text-ink">Hazelaar</strong>: buigzaam en rustiek, de klassieker voor{" "}
              <Link href="/project/hazelaarrasterwerk/" className={textLink}>hekwerk</Link> en gevlochten schermen.
            </li>
          </ul>
        </Section>

        <Section title="Levering en plaatsing in heel Vlaanderen">
          <p>
            Vanuit Zele (Oost-Vlaanderen) leveren we in heel Vlaanderen en België; afhalen kan ook. Wij plaatsen uw
            afsluiting graag voor u, of u doet het zelf met onze{" "}
            <Link href="/tipsenideeen/kastanje-hekwerk-en-poort-plaatsen/" className={textLink}>handleiding hekwerk en poort plaatsen</Link>.
            Met de <Link href="/calculator/?keuze=hekwerk" className={textLink}>calculator</Link> berekent u meteen hoeveel rollen,
            palen en schermen u nodig heeft, met een richtprijs. Bekijk ook onze{" "}
            <Link href="/onze-realisaties/" className={textLink}>realisaties</Link>.
          </p>
        </Section>

        <Section title="Tuinafsluitingen geplaatst in heel Vlaanderen">
          <p>
            Natuurhout zit in Zele, in het hart van Oost-Vlaanderen, en heeft meer dan 15 jaar ervaring met kastanjehout. We
            plaatsten al landelijke afsluitingen in onder meer {PLACES.slice(0, -1).join(", ")} en {PLACES[PLACES.length - 1]}.
            Bekijk onze <Link href="/onze-realisaties/" className={textLink}>realisaties</Link> of kom langs in Zele.
          </p>
        </Section>

        <Faq items={faqs()} title="Veelgestelde vragen over landelijke afsluitingen" />

        <section className="mt-12 rounded-card bg-brand-soft p-6 sm:p-8">
          <h3 className="font-display text-2xl font-bold text-ink">Kies een landelijke afsluiting volgens uw wensen</h3>
          <p className="mt-3 leading-7 text-ink/75">
            Wilt u een landelijke omheining kopen die perfect bij uw tuin of erf past? Vraag een{" "}
            <Link href={QUOTE_HREF} className={textLink}>vrijblijvende offerte</Link> aan of bestel meteen in onze{" "}
            <Link href="/shop/" className={textLink}>webshop</Link>. Natuurhout is uw{" "}
            <Link href="/" className={textLink}>specialist in natuurhout</Link> in Vlaanderen.
          </p>
        </section>

        <Realisaties items={projects} title="Afsluitingen bij onze klanten" intro="Hekwerk geplaatst door Natuurhout." />
      </article>
    </>
  );
}
