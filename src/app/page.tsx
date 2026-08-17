import Image from "next/image";
import Link from "next/link";
import Button from "@/components/Button";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { collections, products } from "@/lib/catalog";

/*
 * Homepage — GardenGlory-style skin, Natuurhout content.
 * ALL Dutch copy below is verbatim from the live natuurhout.be homepage
 * (migration/html-snapshot/homepage.html). Do not reword — migration rule 1.
 * Product data is verbatim from natuurhout.shop per Xander (2026-08-17).
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
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="overflow-hidden rounded-card bg-brand-dark">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
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
                buitenruimtes. Dankzij een diepgewortelde passie voor ambacht
                en vakmanschap werken wij uitsluitend met duurzame houtsoorten
                die bestand zijn tegen weer en wind. Elk project wordt met de
                grootste zorg uitgevoerd, waarbij esthetiek en functionaliteit
                hand in hand gaan.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="https://natuurhout.shop/" external>
                  Naar webshop
                </Button>
                <Button href="/producten/" variant="outline" className="border-white/30 text-white hover:border-accent-bright hover:bg-transparent hover:text-accent-bright">
                  Producten &amp; Prijzen
                </Button>
              </div>
              <ul className="mt-10 flex flex-wrap gap-2">
                {usps.map((u) => (
                  <li
                    key={u}
                    className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-white/90"
                  >
                    ✓ {u}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-card lg:aspect-auto lg:h-full lg:min-h-[420px]">
              {/* Real project photo from the live .be homepage */}
              <Image
                src="https://www.natuurhout.be/wp-content/uploads/2025/01/IMG_3482-scaled-1-1024x768.webp"
                alt="Kastanje afsluitingen"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categorie-chips (shop collections, verbatim titles) */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-2">
          {collections.map((c) => (
            <Link
              key={c.handle}
              href={`/producten/#${c.handle}`}
              className="rounded-full bg-brand-soft px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-accent hover:text-brand-dark"
            >
              {c.title}
            </Link>
          ))}
        </div>
      </section>

      {/* Onze producten (verbatim heading from live homepage) */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-4">
          <SectionHeading underline="producten">Onze</SectionHeading>
          <Link
            href="/producten/"
            className="text-sm font-semibold text-brand hover:text-accent"
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
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading underline="tuinproducten">
              Tijdloze en duurzame houten
            </SectionHeading>
            <p className="mt-6 text-ink/80">
              Een tuin verdient een natuurlijke en stijlvolle afwerking. Daarom
              bieden wij een breed assortiment aan houten tuinproducten die
              functionaliteit en een mooi uiteerlijk combineren. Onze
              landelijke afsluitingen en tuinpoorten zorgen voor privacy en
              veiligheid zonder in te boeten op uitstraling. Houten palen
              vormen een solide basis voor elke buitenruimte, terwijl onze
              moestuinbakken de perfecte oplossing bieden voor liefhebbers van
              vers geteelde groenten en kruiden. Elk product is vervaardigd
              uit duurzame houtsoorten, waardoor een lange levensduur en
              minimale onderhoudsbehoefte gegarandeerd zijn.
            </p>
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
      <section className="mx-auto max-w-6xl px-4 py-16">
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
            <Button href="https://natuurhout.shop/" variant="dark" external className="bg-white/10 hover:bg-white/20">
              Naar webshop
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
