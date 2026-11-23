import Link from "next/link";
import Faq, { type FaqItem } from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { formatPrice, type Product } from "@/lib/catalog";
import { ADDRESS } from "@/lib/contact";
import { orderTerm } from "@/lib/made-to-order";
import { metersOf, volumeRule } from "@/lib/volume-pricing";

/*
 * /project/lariks-schaal-delen-2/ (Xander, Nov 2026): the facts in one place for
 * search and AI assistants — price per metre and the staffel, a spec table,
 * the prices per length, how many metres per m², delivery and a FAQ, with
 * Product and FAQPage structured data. Only facts already on the site: the
 * product text (Europees lariks, ruw, ±22 mm, ±20 cm, duurzaamheidsklasse),
 * the WordPress text (17–25 cm, "geen onderhoud") and the FAQ page (delivery).
 * Prices follow the catalogue (a backend price change shows up here too).
 */

export const LARIKS_PATH = "/project/lariks-schaal-delen-2/";
const PAGE_URL = `https://www.natuurhout.be${LARIKS_PATH}`;
const euro = (n: number) => formatPrice(n);

/** Price per metre from the catalogue (the 2 m length), the staffel from src/lib/volume-pricing.ts. */
export function lariksPrices(product: Product) {
  const rule = volumeRule(product.handle);
  const rows = product.variants
    .map((v) => ({ variant: v, metres: metersOf(v.title) }))
    .filter((r): r is { variant: (typeof product.variants)[number]; metres: number } => r.metres !== null)
    .sort((a, b) => a.metres - b.metres)
    .map(({ variant, metres }) => ({
      variant,
      metres,
      price: parseFloat(variant.price),
      staffel: rule ? Math.round(metres * rule.perMeter * 100) / 100 : null,
    }));
  const perMeter = rows.length ? Math.round((rows[0].price / rows[0].metres) * 100) / 100 : 4.95;
  return { rows, perMeter, rule };
}

export function lariksLead(product: Product): string {
  const { perMeter, rule } = lariksPrices(product);
  return `Lariks schaaldelen (larikse schaaldelen of schorsplanken) zijn ongekante planken van Europees lariks, ±22 mm dik en 17 tot 25 cm breed (werkende breedte ±20 cm), in lengtes van 2, 3, 4 en 5 m. Ze kosten ${euro(perMeter)} per meter incl. btw${
    rule ? `, en ${euro(rule.perMeter)} per meter vanaf ${rule.fromMeters} m (lengtes mogen gemengd worden)` : ""
  }. Natuurhout zit in Zele (Oost-Vlaanderen): afhalen kan daar, en we leveren in heel België.`;
}

/** "€ 4,95 per meter incl. btw – € 4,55 per meter vanaf 100 m", prominent under the intro. */
export function LariksPriceLine({ product }: { product: Product }) {
  const { perMeter, rule } = lariksPrices(product);
  return (
    <p className="mt-4 inline-flex flex-wrap items-baseline gap-x-2 rounded-xl bg-brand-soft/70 px-4 py-2.5 text-ink">
      <strong className="text-lg">{euro(perMeter)} per meter incl. btw</strong>
      {rule && (
        <span className="font-semibold text-accent-deep">
          – {euro(rule.perMeter)} per meter vanaf {rule.fromMeters} m
        </span>
      )}
    </p>
  );
}

const cell = "border-b border-line px-4 py-2.5 text-left align-top";
const H2 = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="scroll-mt-28 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
    {children}
  </h2>
);
const link = "font-medium text-accent-deep underline underline-offset-2 hover:text-ink";

function faqs(perMeter: number, staffel: number, from: number): FaqItem[] {
  return [
    {
      q: "Wat kosten lariks schaaldelen per meter?",
      text: `${euro(perMeter)} per lopende meter, inclusief 21% btw. Vanaf ${from} m in totaal betaalt u ${euro(staffel)} per meter.`,
    },
    {
      q: "Vanaf wanneer geldt de staffelprijs?",
      text: `Vanaf ${from} meter in totaal in uw bestelling. De lengtes mogen gemengd worden: bijvoorbeeld 10 × 2 m, 10 × 3 m en 10 × 5 m is samen ${from} m. In het winkelmandje wordt de staffelprijs automatisch toegepast.`,
    },
    {
      q: "Welke lengtes zijn er?",
      text: "Lariks schaaldelen zijn er in 2, 3, 4 en 5 meter, ±22 mm dik en 17 tot 25 cm breed (werkende breedte ±20 cm).",
    },
    {
      q: "Hoeveel meter heb ik nodig per m²?",
      text: `Met een werkende breedte van ±20 cm rekent u ongeveer 5 lopende meter per m². Een wand van 10 m² vraagt dus ±50 m (${euro(50 * perMeter)}), 20 m² ±${from} m (${euro(from * staffel)} met de staffelprijs).`,
    },
    {
      q: "Moet lariks behandeld worden?",
      text: "Nee, lariks is een zeer duurzame houtsoort die geen onderhoud nodig heeft. Onbehandeld vergrijst het op natuurlijke wijze naar een zilvergrijze tint. Wie de originele kleur wil behouden, kan het hout behandelen met een geschikte olie of beits.",
    },
    {
      q: "Leveren jullie?",
      text: `Ja, in heel België. De leveringskost hangt af van de locatie; bij grotere bestellingen leveren we tegen een gereduceerd tarief. Afhalen kan in Zele (${ADDRESS.street}, ${ADDRESS.city}).`,
    },
  ];
}

export default function LariksGuide({ product, lead, images }: { product: Product; lead: string; images: string[] }) {
  const { rows, perMeter, rule } = lariksPrices(product);
  const staffel = rule?.perMeter ?? perMeter;
  const from = rule?.fromMeters ?? 100;
  const items = faqs(perMeter, staffel, from);

  const unitPrices = [
    {
      "@type": "UnitPriceSpecification",
      price: perMeter.toFixed(2),
      priceCurrency: "EUR",
      unitCode: "MTR",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MTR" },
      valueAddedTaxIncluded: true,
    },
    ...(rule
      ? [
          {
            "@type": "UnitPriceSpecification",
            price: rule.perMeter.toFixed(2),
            priceCurrency: "EUR",
            unitCode: "MTR",
            referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MTR" },
            eligibleQuantity: { "@type": "QuantitativeValue", minValue: rule.fromMeters, unitCode: "MTR" },
            valueAddedTaxIncluded: true,
          },
        ]
      : []),
  ];
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${PAGE_URL}#product`,
    name: "Lariks schaaldelen",
    description: lead,
    image: images.map((src) => (src.startsWith("http") ? src : `https://www.natuurhout.be${src}`)),
    brand: { "@type": "Brand", name: "Natuurhout" },
    material: "Europees lariks",
    mainEntityOfPage: { "@id": PAGE_URL },
    offers: rows.map((r) => ({
      "@type": "Offer",
      name: `Lariks schaaldeel ${r.metres} m`,
      sku: String(r.variant.id),
      url: PAGE_URL,
      price: r.price.toFixed(2),
      priceCurrency: "EUR",
      availability: r.variant.available ? "https://schema.org/InStock" : "https://schema.org/BackOrder",
      itemCondition: "https://schema.org/NewCondition",
      priceSpecification: unitPrices,
      seller: { "@type": "Organization", name: "Natuurhout" },
    })),
  };

  return (
    <div className="mt-12 space-y-12">
      <JsonLd data={schema} />

      <section aria-labelledby="afmetingen-en-prijzen">
        <H2 id="afmetingen-en-prijzen">Afmetingen en prijzen</H2>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-card border border-line bg-white">
            <table className="w-full text-sm">
              <caption className="bg-brand-soft px-4 py-2.5 text-left font-semibold text-ink">Specificaties</caption>
              <tbody>
                {[
                  ["Houtsoort", "Europees lariks"],
                  ["Dikte", "±22 mm"],
                  ["Breedte", "17 tot 25 cm (werkende breedte ±20 cm)"],
                  ["Lengtes", "2, 3, 4 en 5 m"],
                  ["Afwerking", "ruw / ongeschaafd, onbehandeld"],
                  ["Prijs per meter", `${euro(perMeter)} incl. btw`],
                  ["Staffelprijs", `${euro(staffel)} per meter vanaf ${from} m (lengtes gemengd)`],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row" className={`${cell} w-40 font-medium text-ink/65`}>{k}</th>
                    <td className={`${cell} text-ink`}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-hidden rounded-card border border-line bg-white">
            <table className="w-full text-sm">
              <caption className="bg-brand-soft px-4 py-2.5 text-left font-semibold text-ink">Prijzen per stuk, incl. btw</caption>
              <thead>
                <tr className="text-ink/60">
                  <th scope="col" className={cell}>Lengte</th>
                  <th scope="col" className={`${cell} text-right`}>Per stuk</th>
                  <th scope="col" className={`${cell} text-right`}>Vanaf {from} m</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.variant.id}>
                    <td className={cell}>
                      <span className="font-medium text-ink">{r.metres} m</span>
                      <span className="block text-xs text-ink/55">{r.variant.available ? "Op voorraad" : orderTerm(product.handle).badge}</span>
                    </td>
                    <td className={`${cell} text-right tabular-nums`}>{euro(r.price)}</td>
                    <td className={`${cell} text-right font-semibold tabular-nums text-accent-deep`}>{r.staffel !== null ? euro(r.staffel) : "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-xs leading-5 text-ink/60">
              Nieuwe voorraad komt meestal elke 4 à 5 weken binnen; de levertermijn bevestigen we per mail. De staffelprijs geldt vanaf {from} m in
              totaal en wordt in het winkelmandje automatisch toegepast.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="toepassingen">
        <H2 id="toepassingen">Toepassingen</H2>
        <p className="mt-4 max-w-3xl leading-7 text-ink/75">
          Larikse schaaldelen houden de natuurlijke, afgeronde rand van de stam. Dat geeft een rustieke, landelijke look, ideaal voor:
        </p>
        <ul className="mt-3 max-w-3xl list-disc space-y-1 pl-6 leading-7 text-ink/75">
          <li>Schaaldelen als gevelbekleding, verticaal of horizontaal</li>
          <li>Een schutting of tuinwand in lariks schaaldelen</li>
          <li>Tuinhuizen, bijgebouwen en carports</li>
          <li>Landelijke constructies en decoratieve buitenafwerking</li>
        </ul>
        <p className="mt-3 max-w-3xl leading-7 text-ink/75">
          Voor een schutting zet u de schaaldelen op palen: kies <Link href="/project/kastanjepalen/" className={link}>kastanje palen</Link>,{" "}
          <Link href="/project/robinia-palen/" className={link}>robinia palen</Link> of <Link href="/project/eiken-palen/" className={link}>eiken palen</Link>, eventueel
          met een <Link href="/project/postsaver-voor-palen/" className={link}>postsaver</Link>. Meer tuinproducten vindt u bij{" "}
          <Link href="/assortiment/tuinproducten/" className={link}>Tuinproducten</Link>.
        </p>
      </section>

      <section aria-labelledby="hoeveel-nodig">
        <H2 id="hoeveel-nodig">Hoeveel schaaldelen heb ik nodig?</H2>
        <p className="mt-4 max-w-3xl leading-7 text-ink/75">
          Met een werkende breedte van ±20 cm rekent u ongeveer <strong className="text-ink">5 lopende meter per m²</strong>. Een paar voorbeelden:
        </p>
        <div className="mt-4 max-w-xl overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-soft text-ink/70">
                <th scope="col" className={cell}>Oppervlakte</th>
                <th scope="col" className={cell}>Lopende meter</th>
                <th scope="col" className={`${cell} text-right`}>Prijs incl. btw</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={cell}>10 m²</td>
                <td className={cell}>±50 m</td>
                <td className={`${cell} text-right tabular-nums`}>{euro(50 * perMeter)}</td>
              </tr>
              <tr>
                <td className={cell}>20 m²</td>
                <td className={cell}>±{from} m</td>
                <td className={`${cell} text-right tabular-nums`}>
                  <span className="font-semibold text-accent-deep">{euro(from * staffel)}</span>
                  <span className="block text-xs text-ink/55">staffelprijs</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="levering-en-afhalen">
        <H2 id="levering-en-afhalen">Levering en afhalen</H2>
        <p className="mt-4 max-w-3xl leading-7 text-ink/75">
          Afhalen kan in Zele, Oost-Vlaanderen ({ADDRESS.street}, {ADDRESS.city}). We leveren lariks schaaldelen in heel België met onze
          eigen wagen: de leveringskost hangt af van de locatie, en bij grotere bestellingen leveren we tegen een gereduceerd tarief. In het{" "}
          <Link href="/winkelmandje/" className={link}>winkelmandje</Link> berekent u de leveringskost meteen met uw postcode. Vragen? Neem{" "}
          <Link href="/contact/" className={link}>contact</Link> op of lees de <Link href="/veelgesteldevragen/" className={link}>veelgestelde vragen</Link>.
        </p>
      </section>

      <Faq items={items} title="Veelgestelde vragen" id="veelgestelde-vragen-lariks" />
    </div>
  );
}
