import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calculator, Check } from "lucide-react";
import Button from "@/components/Button";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { collections, products } from "@/lib/catalog";

/*
 * Homepage — structure per Xander: full-width, hero = main card left + two
 * cards right (calculator + assortiment). Editorial skin: Satoshi
 * (self-hosted, Fontshare FFL), logo-brown palette, hairlines over cards.
 * ALL Dutch copy is verbatim from the live natuurhout.be homepage
 * (migration/html-snapshot/homepage.html). Do not reword — migration rule 1.
 * Product data is verbatim from natuurhout.shop per Xander.
 */

// Verbatim USP labels from the live homepage.
const usps = [
  "Duurzame Producten",
  "Levering mogelijk",
  "+15 jaar ervaring",
  "Groot assortiment",
];

export default function Home() {
  const featured = products.filter((p) => p.available && p.images.length).slice(0, 8);
  return (
    <>
      {/* Hero: main card left, two cards right */}
      <section className="w-full px-4 pt-6 sm:px-6 lg:px-10">
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Main card */}
          <div className="relative overflow-hidden rounded-card bg-brand-dark lg:col-span-2">
            <div className="grid h-full gap-10 p-8 sm:p-12 xl:grid-cols-[1.1fr_1fr] xl:items-center">
              <div className="relative z-10">
                <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-bright">
                  <span aria-hidden className="h-px w-8 bg-accent-bright" />
                  Kastanjehout uit Zele
                </p>
                <h1 className="mt-4 font-display text-4xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl">
                  Specialist in{" "}
                  <em className="italic text-accent-bright">Kastanjehout</em>
                </h1>
                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/70">
                  Natuurlijke schoonheid en duurzaamheid komen samen in
                  hoogwaardige houtconstructies voor buitengebruik van
                  Natuurhout.be uit Zele. Als ervaren specialist in natuurhout
                  creëren wij tijdloze oplossingen voor tuinen, opritten en
                  buitenruimtes. Dankzij een diepgewortelde passie voor ambacht
                  en vakmanschap werken wij uitsluitend met duurzame houtsoorten
                  die bestand zijn tegen weer en wind. Elk project wordt met de
                  grootste zorg uitgevoerd, waarbij esthetiek en functionaliteit
                  hand in hand gaan.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button href="/producten/">Bekijk producten</Button>
                  <a
                    href="https://natuurhout.shop/"
                    target="_blank"
                    rel="noopener"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
                  >
                    Naar de webshop
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                </div>
                <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-white/70 sm:flex sm:flex-wrap sm:gap-x-8">
                  {usps.map((u) => (
                    <li key={u} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-accent-bright" />
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative min-h-[280px] overflow-hidden rounded-[0.9rem] xl:h-full">
                {/* Real project photo from the live .be homepage */}
                <Image
                  src="https://www.natuurhout.be/wp-content/uploads/2025/01/IMG_3482-scaled-1-1024x768.webp"
                  alt="Kastanje afsluitingen"
                  fill
                  sizes="(max-width: 1280px) 100vw, 40vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Right column: two cards */}
          <div className="flex flex-col gap-5">
            {/* Calculator card */}
            <Link
              href="/calculator/"
              className="group flex flex-1 flex-col justify-between rounded-card border border-line bg-white p-7 transition-colors hover:border-accent/50"
            >
              <div>
                <span className="inline-flex rounded-full bg-brand-soft p-3 text-accent">
                  <Calculator className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-display text-2xl font-semibold text-ink">
                  Afsluitingscalculator
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  Kies houtsoort, hoogte en lengte — en krijg meteen een
                  richtprijs met aanbevolen materiaallijst.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent">
                Start de calculator
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* Assortiment card */}
            <Link
              href="/producten/"
              className="group relative flex flex-1 flex-col justify-end overflow-hidden rounded-card p-7"
            >
              <Image
                src="https://www.natuurhout.be/wp-content/uploads/2022/05/Rasterwerk-1.20m-1-768x1024.jpg"
                alt="Rasterwerk 1.20m"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/25 to-transparent" />
              <div className="relative">
                <h2 className="font-display text-2xl font-semibold text-white">
                  Onze producten
                </h2>
                <p className="mt-1 text-sm text-white/75">
                  Het volledige assortiment met actuele webshopprijzen.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-bright">
                  Bekijk assortiment
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Onze producten (verbatim heading from live homepage) */}
      <section className="w-full px-4 pb-20 pt-16 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading kicker="Assortiment">Onze producten</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {collections.slice(0, 6).map((c) => (
              <Link
                key={c.handle}
                href={`/producten/#${c.handle}`}
                className="rounded-full border border-line bg-white px-4 py-1.5 text-sm text-ink/70 transition-colors hover:border-accent hover:text-accent"
              >
                {c.title}
              </Link>
            ))}
            <Link
              href="/producten/"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-accent hover:text-accent-deep"
            >
              Alles
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
        <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.handle} product={p} />
          ))}
        </div>
      </section>

      {/* Verbatim content section from live homepage */}
      <section className="border-y border-line bg-white">
        <div className="grid w-full gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-10">
          <div>
            <SectionHeading kicker="Vakmanschap">
              Tijdloze en duurzame houten tuinproducten
            </SectionHeading>
            <p className="mt-6 max-w-2xl leading-relaxed text-ink/70">
              Een tuin verdient een natuurlijke en stijlvolle afwerking.
              Daarom bieden wij een breed assortiment aan houten
              tuinproducten die functionaliteit en een mooi uiteerlijk
              combineren. Onze landelijke afsluitingen en tuinpoorten zorgen
              voor privacy en veiligheid zonder in te boeten op uitstraling.
              Houten palen vormen een solide basis voor elke buitenruimte,
              terwijl onze moestuinbakken de perfecte oplossing bieden voor
              liefhebbers van vers geteelde groenten en kruiden. Elk product
              is vervaardigd uit duurzame houtsoorten, waardoor een lange
              levensduur en minimale onderhoudsbehoefte gegarandeerd zijn.
            </p>
            <div className="mt-8">
              <Button href="/producten/" variant="outline">
                Ontdek het assortiment
              </Button>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-card">
            <Image
              src="https://www.natuurhout.be/wp-content/uploads/2022/05/Rasterwerk-1.20m-1-768x1024.jpg"
              alt="Rasterwerk 1.20m"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Offerte CTA — verbatim heading + paragraph from live homepage */}
      <section className="w-full px-4 py-20 sm:px-6 lg:px-10">
        <div className="rounded-card bg-brand-dark px-8 py-14 sm:px-14">
          <div className="max-w-3xl">
            <SectionHeading kicker="Offerte" light>
              Vraag een offerte aan en ontdek de mogelijkheden
            </SectionHeading>
            <p className="mt-5 leading-relaxed text-white/70">
              Bent u op zoek naar een houten oplossing die perfect aansluit
              bij uw tuin? Vraag vandaag nog een vrijblijvende offerte aan of
              ga meteen naar de webshop. Wij denken graag met u mee en bieden
              deskundig advies op maat. Wij staan garant voor kwaliteit en
              vakmanschap. Kies voor duurzaamheid en elegantie en laat uw
              tuin tot zijn recht komen met natuurhout.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button href="/offerte-aanvragen/">Offerte aanvragen</Button>
              <a
                href="https://natuurhout.shop/"
                target="_blank"
                rel="noopener"
                className="group inline-flex items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                Naar de webshop
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
