import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import JsonLd from "@/components/JsonLd";
import ProductTabs from "@/components/ProductTabs";
import { ADDRESS, EMAIL, PHONE } from "@/lib/contact";
import { QUOTE_HREF } from "@/lib/navigation";

/*
 * Bottom of /producten/: the WordPress "Services / FAQ" block, rebuilt as two
 * tabs. Questions keep their wording; delivery, pick-up and payment answers
 * were updated by Natuurhout, and the Engels/Frans rasterwerk question gave
 * way to the difference between hazelaar, kastanje and robinia (summarised
 * from Natuurhout's own product texts).
 */

const link = "font-semibold text-accent-deep underline underline-offset-2 hover:text-ink";

type Faq = { q: string; a: ReactNode; plain: string };

const WOODS = [
  {
    wood: "Kastanje",
    traits: "Gekloofde, gepunte latten · onbehandeld, beschermd door het natuurlijke looizuur · vergrijst mooi",
    life: "tot ± 25 jaar",
    use: "De klassieker voor tuin, weide en dierenomheining",
  },
  {
    wood: "Robinia",
    traits: "Hardste en meest duurzame Europese houtsoort (duurzaamheidsklasse 1) · geen onderhoud · vergrijst zilvergrijs",
    life: "25 tot 40 jaar",
    use: "Wie de langste levensduur wil; iets duurder dan kastanje",
  },
  {
    wood: "Hazelaar",
    traits: "Handgevlochten uit soepele hazelaartakken met verzinkt draad · licht, luchtig en sierlijk",
    life: "iets korter dan kastanje",
    use: "Betaalbare, decoratieve afsluiting: tuin, bloemenperk, kippenren",
  },
];

const FAQS: Faq[] = [
  {
    q: "Levering goederen mogelijk:",
    plain:
      "Ja, wij leveren in heel België en ook levering in Nederland is mogelijk. De leveringsprijs is aan te vragen: die hangt af van de plaats en de grootte van uw bestelling.",
    a: (
      <>
        <p>
          Ja, wij leveren in <strong>heel België</strong> en ook levering in <strong>Nederland</strong> is mogelijk. De
          leveringsprijs is aan te vragen: die hangt af van de plaats en de grootte van uw bestelling.
        </p>
        <p>
          <Link href="/offerte-aanvragen/#andere-vraag" className={link}>Vraag een leveringsprijs aan</Link>
        </p>
      </>
    ),
  },
  {
    q: "Zijn de artikelen ook zelf af te halen:",
    plain:
      "Ja, alle materialen zijn af te halen in Zele. Mail of bel ons best even op voorhand, dan kijken we of alles voorradig is.",
    a: (
      <p>
        Ja, alle materialen zijn af te halen in Zele ({ADDRESS.street}, {ADDRESS.city}). Mail of bel ons best even op
        voorhand, dan kijken we of alles voorradig is: <a href={PHONE.href} className={link}>{PHONE.label}</a> of{" "}
        <a href={EMAIL.href} className={link}>{EMAIL.label}</a>.
      </p>
    ),
  },
  {
    q: "Kan ik ook afrekenen bij het ophalen van de artikelen:",
    plain:
      "Ja. Bij afhaling kunt u contant, met Payconiq of met Bancontact betalen. Voor artikelen die besteld of speciaal op maat gemaakt moeten worden, wordt vaak alles (of na overleg een gedeelte) vooraf betaald.",
    a: (
      <p>
        Ja. Bij afhaling kunt u <strong>contant</strong>, met <strong>Payconiq</strong> of met <strong>Bancontact</strong>{" "}
        betalen. Voor artikelen die besteld of speciaal op maat gemaakt moeten worden, wordt vaak alles (of na overleg een
        gedeelte) vooraf betaald.
      </p>
    ),
  },
  {
    q: "Kunnen jullie ook de artikelen monteren en/of plaatsen:",
    plain:
      "Wij kunnen een afspraak maken om langs te komen, en dit ter plaatse te overleggen. Indien u hiervan gebruik wilt maken, kunnen wij uw op verzoek een offerte opmaken Voor meer vragen kunt u ons altijd bellen/mailen.",
    a: (
      <p>
        Wij kunnen een afspraak maken om langs te komen, en dit ter plaatse te overleggen. Indien u hiervan gebruik wilt
        maken, kunnen wij uw op verzoek een offerte opmaken Voor meer vragen kunt u ons altijd bellen/mailen.
      </p>
    ),
  },
  {
    q: "Wat is het verschil tussen hazelaar, kastanje en robinia hekwerk?",
    plain:
      "Kastanje is de onbehandelde klassieker, beschermd door natuurlijk looizuur, met een levensduur tot ongeveer 25 jaar. Robinia is de hardste en meest duurzame Europese houtsoort (duurzaamheidsklasse 1) en gaat 25 tot 40 jaar mee, zonder onderhoud. Hazelaar is handgevlochten, licht en sierlijk, betaalbaar, maar iets minder duurzaam dan kastanje.",
    a: (
      <div className="space-y-4">
        <p>Alle drie zijn natuurlijke, onbehandelde houtsoorten die mooi vergrijzen. Het verschil zit in de duurzaamheid en de uitstraling:</p>
        <div className="overflow-x-auto rounded-card ring-1 ring-line">
          <table className="w-full min-w-[34rem] bg-white text-left text-sm">
            <thead className="bg-ground text-xs uppercase tracking-wide text-ink/60">
              <tr>
                <th scope="col" className="px-4 py-2.5">Houtsoort</th>
                <th scope="col" className="px-4 py-2.5">Kenmerken</th>
                <th scope="col" className="px-4 py-2.5">Levensduur</th>
                <th scope="col" className="px-4 py-2.5">Ideaal voor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {WOODS.map((w) => (
                <tr key={w.wood} className="align-top">
                  <th scope="row" className="px-4 py-3 font-semibold text-ink">{w.wood}</th>
                  <td className="px-4 py-3 text-ink/75">{w.traits}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink/75">{w.life}</td>
                  <td className="px-4 py-3 text-ink/75">{w.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong>Kortom:</strong> kies robinia voor de langste levensduur, kastanje voor de klassieke en veelzijdige
          afsluiting, en hazelaar voor een betaalbare, sierlijke afscheiding. Hazelaar gaat langer mee als u het net iets
          boven de grond plaatst.
        </p>
      </div>
    ),
  },
  {
    q: "Kan ik ook artikelen op maat laten maken:",
    plain:
      "Bij heel veel artikelen die op onze website staan, is maatwerk al standaard mogelijk. Indien dit niet aangegeven is, vraag ons dan om aanvullende gegevens voor maatwerk, en wij zenden U de benodigde gegevens toe.",
    a: (
      <p>
        Bij heel veel artikelen die op onze website staan, is maatwerk al standaard mogelijk. Indien dit niet aangegeven
        is, vraag ons dan om aanvullende gegevens voor maatwerk, en wij zenden U de benodigde gegevens toe.
      </p>
    ),
  },
];

function FaqList() {
  return (
    <div className="max-w-4xl divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
      {FAQS.map((faq, i) => (
        <details key={faq.q} open={i === 0} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-[17px] font-semibold text-ink hover:text-accent-deep [&::-webkit-details-marker]:hidden">
            <h3 className="m-0 text-[17px]">{faq.q}</h3>
            <ChevronDown aria-hidden className="h-5 w-5 shrink-0 text-ink/50 transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-3 px-5 pb-5 leading-7 text-ink/80">{faq.a}</div>
        </details>
      ))}
    </div>
  );
}

function ServiceBlock() {
  const card = "rounded-card border border-line bg-white p-5 sm:p-6";
  const title = "font-display text-lg font-semibold text-ink";
  return (
    <div className="grid max-w-5xl gap-4 md:grid-cols-2">
      <div className={`${card} md:row-span-2`}>
        <h3 className={title}>Thuislevering</h3>
        <a href="/wp-content/uploads/2016/04/auto.png" target="_blank" rel="noopener" className="mt-4 block">
          <Image src="/wp-content/uploads/2016/04/auto.png" alt="Bestelwagen van Natuurhout" width={444} height={260} className="h-auto w-full max-w-sm" />
        </a>
        <p className="mt-4 leading-7 text-ink/80">
          Het is altijd mogelijk van thuis uit bestellingen te doen via telefoon, fax of e-mail.
          <br />
          Alles wordt door ons netjes klaargemaakt en indien gewenst aan huis geleverd*.
        </p>
        <p className="mt-3">
          <a href="/contact-page/" className={link}>Vraag Info &amp; leveringsvoorwaarden*</a>
        </p>
      </div>
      <div className={card}>
        <h3 className={title}>Hulp bij het inladen</h3>
        <p className="mt-2 leading-7 text-ink/80">
          Haalt u zelf af in Zele? Dan helpen we u graag met het inladen van uw materialen.
        </p>
      </div>
      <div className={card}>
        <h3 className={title}>Samen uw plannen bekijken</h3>
        <p className="mt-2 leading-7 text-ink/80">
          Twijfelt u over de hoogte, de houtsoort of het aantal palen? We bespreken en bekijken uw plannen graag samen met u.
          Kom langs in Zele, of bel of mail ons.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link href={QUOTE_HREF} className={link}>Offerte aanvragen</Link>
          <Link href="/calculator/" className={link}>Afsluitingscalculator</Link>
        </div>
      </div>
    </div>
  );
}

export default function ProductenFaq() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q.replace(/:$/, "?"),
      acceptedAnswer: { "@type": "Answer", text: f.plain },
    })),
  };

  return (
    <section aria-labelledby="goed-om-te-weten" className="mx-auto mb-14 mt-12 w-[calc(100%-2rem)] max-w-[1160px] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-5rem)]">
      <JsonLd data={faqSchema} />
      <h2 id="goed-om-te-weten" className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Goed om te weten
      </h2>
      <div className="mt-5">
        <ProductTabs
          tabs={[
            { id: "faq", label: "Veelgestelde vragen (FAQ)", content: <FaqList /> },
            { id: "service", label: "Service", content: <ServiceBlock /> },
          ]}
        />
      </div>
    </section>
  );
}
