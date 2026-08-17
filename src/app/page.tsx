import Image from "next/image";
import Link from "next/link";
import Button from "@/components/Button";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { collections, products } from "@/lib/catalog";

/*
 * Homepage — layout per Xander (2026-08-17): full-width, hero = main card
 * left + two cards right (calculator + assortiment), kastanjegjerde.no as
 * structural reference, Natuurhout logo browns as palette.
 * ALL Dutch copy is verbatim from the live natuurhout.be homepage
 * (migration/html-snapshot/homepage.html). Do not reword — migration rule 1.
 * Product data is verbatim from natuurhout.shop per Xander.
 */

export default function Home() {
  const featured = products.filter((p) => p.available && p.images.length).slice(0, 8);
  return (
    <>
      {/* Hero: main card left, two cards right */}
      <section className="w-full px-4 pt-6 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main card */}
          <div className="overflow-hidden rounded-card bg-brand-dark lg:col-span-2">
            <div className="grid h-full gap-8 p-8 sm:p-10 xl:grid-cols-2 xl:items-center">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Specialist in{" "}
                  <span className="text-accent-bright">Kastanjehout</span>
                </h1>
                <p className="mt-6 max-w-xl text-white/80">
                  Natuurlijke schoonheid en duurzaamheid komen samen in
                  hoogwaardige houtconstructies voor buitengebruik van
                  Natuurhout.be uit Zele. Als ervaren specialist in natuurhout
                  creëren wij tijdloze oplossingen voor tuinen, opritten en
                  buitenruimtes. Dankzij een diepgewortelde passie voor
                  ambacht en vakmanschap werken wij uitsluitend met duurzame
                  houtsoorten die bestand zijn tegen weer en wind. Elk project
                  wordt met de grootste zorg uitgevoerd, waarbij esthetiek en
                  functionaliteit hand in hand gaan.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button href="https://natuurhout.shop/" external>
                    Naar webshop
                  </Button>
                  <Button
                    href="/producten/"
                    variant="outline"
                    className="border-white/30 text-white hover:border-accent-bright hover:bg-transparent hover:text-accent-bright"
                  >
                    Producten &amp; Prijzen
                  </Button>
                </div>
              </div>
              <div className="relative min-h-[260px] overflow-hidden rounded-card xl:h-full">
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
          <div className="flex flex-col gap-6">
            {/* Calculator card */}
            <Link
              href="/calculator/"
              className="group flex flex-1 flex-col justify-between rounded-card bg-brand-soft p-7 transition-shadow hover:shadow-md"
            >
              <div>
                <span className="inline-flex rounded-full bg-accent-tan px-3 py-1 text-xs font-semibold text-ink">
                  Nieuw
                </span>
                <h2 className="mt-4 text-2xl font-semibold text-ink">
                  Afsluitingscalculator
                </h2>
                <p className="mt-2 text-sm text-ink/70">
                  Kies houtsoort, hoogte en lengte — en krijg meteen een
                  richtprijs met aanbevolen materiaallijst.
                </p>
              </div>
              <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-accent-deep">
                Start de calculator →
              </span>
            </Link>

            {/* Assortiment card */}
            <Link
              href="/producten/"
              className="group relative flex flex-1 flex-col justify-end overflow-hidden rounded-card p-7 transition-shadow hover:shadow-md"
            >
              <Image
                src="https://www.natuurhout.be/wp-content/uploads/2022/05/Rasterwerk-1.20m-1-768x1024.jpg"
                alt="Rasterwerk 1.20m"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
              <div className="relative">
                <h2 className="text-2xl font-semibold text-white">
                  Onze producten
                </h2>
                <p className="mt-1 text-sm text-white/80">
                  Het volledige assortiment met actuele webshopprijzen.
                </p>
                <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors group-hover:bg-accent">
                  Bekijk assortiment →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Categorie-chips (shop collections, verbatim titles) */}
      <section className="w-full px-4 py-10 sm:px-6 lg:px-10">
        <div className="flex flex-wrap gap-2">
          {collections.map((c) => (
            <Link
              key={c.handle}
              href={`/producten/#${c.handle}`}
              className="rounded-full bg-brand-soft px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-accent hover:text-white"
            >
              {c.title}
            </Link>
          ))}
        </div>
      </section>

      {/* Onze producten (verbatim heading from live homepage) */}
      <section className="w-full px-4 pb-16 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading underline="producten">Onze</SectionHeading>
          <Link
            href="/producten/"
            className="text-sm font-semibold text-accent hover:text-accent-deep"
          >
            Bekijk alles →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.handle} product={p} />
          ))}
        </div>
      </section>

      {/* Verbatim content section from live homepage */}
      <section className="bg-brand-soft/60">
        <div className="grid w-full gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-10">
          <div>
            <SectionHeading underline="tuinproducten">
              Tijdloze en duurzame houten
            </SectionHeading>
            <p className="mt-6 max-w-3xl text-ink/80">
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
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-card">
            <Image
              src="https://www.natuurhout.be/wp-content/uploads/2025/01/IMG_3482-scaled-1-1024x768.webp"
              alt="Kastanje afsluiting"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Offerte CTA — verbatim heading + paragraph from live homepage */}
      <section className="w-full px-4 py-16 sm:px-6 lg:px-10">
        <div className="rounded-card bg-brand-dark p-8 sm:p-12">
          <h3 className="text-2xl font-semibold text-white sm:text-3xl">
            Vraag een offerte aan en ontdek de mogelijkheden
          </h3>
          <p className="mt-4 max-w-3xl text-white/80">
            Bent u op zoek naar een houten oplossing die perfect aansluit bij
            uw tuin? Vraag vandaag nog een vrijblijvende offerte aan of ga
            meteen naar de webshop. Wij denken graag met u mee en bieden
            deskundig advies op maat. Wij staan garant voor kwaliteit en
            vakmanschap. Kies voor duurzaamheid en elegantie en laat uw tuin
            tot zijn recht komen met natuurhout.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/offerte-aanvragen/">Offerte aanvragen</Button>
            <Button
              href="https://natuurhout.shop/"
              variant="dark"
              external
              className="bg-white/10 hover:bg-white/20"
            >
              Naar webshop
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
