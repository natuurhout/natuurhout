import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Leaf, Recycle, ShieldCheck, Store, Truck } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import ProductSlider from "@/components/ProductSlider";
import ProductCard from "@/components/ProductCard";
import { collectionProducts, collections } from "@/lib/catalog";
import { getLegacyPageByPath } from "@/lib/legacy";

/*
 * Purpose-built homepage. The WordPress snapshot for "/" is no longer
 * rendered here — Xander approved replacing it, and the holiday ("Verlof")
 * notice that was its only image is gone with it. The SEO surface the
 * inventory froze is carried over deliberately: same title, description and
 * canonical, the same h1, and every internal link the snapshot pointed at.
 * `/` is listed in migration/handbuilt-routes.json so the parity gate checks
 * those invariants instead of verbatim snapshot text.
 */

const page = getLegacyPageByPath("/");

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description || undefined,
  alternates: { canonical: page?.canonical || "https://www.natuurhout.be/" },
  openGraph: {
    title: page?.title,
    description: page?.description || undefined,
    url: page?.canonical || "https://www.natuurhout.be/",
    locale: "nl_BE",
    type: "website",
  },
};

const usps = [
  { icon: Leaf, title: "Duurzame producten", text: "Onbehandeld hout dat tegen ons klimaat kan." },
  { icon: Truck, title: "Levering mogelijk", text: "Thuislevering of zelf ophalen in Zele." },
  { icon: ShieldCheck, title: "+15 jaar ervaring", text: "Advies van mensen die het hout kennen." },
  { icon: Store, title: "Groot assortiment", text: "Hekwerk, poorten, palen en plaatsingsmateriaal." },
];

// Labels and hrefs are the snapshot's own — link targets stay untouched so
// the homepage keeps feeding the same pages. Images are the lead photo of
// each destination page.
const categories = [
  { label: "Kastanje Rasterwerk", href: "/project/rasterwerk-kastanjehout/", src: "/wp-content/uploads/2023/01/Kastanjeafsluiting3-scaled.jpg" },
  { label: "Franse Poorten", href: "/project/franse-poorten/", src: "/wp-content/uploads/2024/10/Kopie-van-Kopie-van-Kopie-van-Kopie-van-Kopie-van-Kopie-van-Kopie-van-Kopie-van-Religieuze-Labels-1.png" },
  { label: "Hazelaar Rasterwerk", href: "/project/robiniarasterwerk/", src: "/wp-content/uploads/2016/01/Hazelaar-afsluiting4-scaled.webp" },
  { label: "Franse Maatwerk poorten", href: "/project/maatwerk-poorten/", src: "/wp-content/uploads/2016/01/Dubbele-maatwerkpoort-scaled.jpg" },
  { label: "Kastanje Palen", href: "/project/kastanjepalen/", src: "/wp-content/uploads/2016/01/901799_752360984796607_487253914146542605_o.jpg" },
  { label: "Lariks Schaal delen", href: "/project/lariks-schaal-delen-2/", src: "/wp-content/uploads/2019/10/Lariks5-Project-Overemere-scaled.jpg" },
  { label: "Eiken Palen", href: "/project/eiken-palen/", src: "/wp-content/uploads/2020/09/ffa351a0-0fc0-4adc-8cf9-392cf0a0c642.jpg" },
  { label: "Robinia Rasterwerk", href: "/project/robinia-rasterwerk/", src: "/wp-content/uploads/2022/05/2-1.png" },
  { label: "Hazelaar Vlechtscherm", href: "/project/hazelaar-vlechtschermen-halve-latten/", src: "/wp-content/uploads/2016/01/Promotie-vlechtscherm.jpg" },
  { label: "Cleft & Field Veldpoorten", href: "/project/cleft-field-veldpoorten/", src: "/wp-content/uploads/2016/01/Untitled-design-3.png" },
];

const principles = [
  {
    icon: Leaf,
    title: "Hout dat geen behandeling nodig heeft",
    text: "Tamme kastanje (Castanea sativa) zit vol looizuren. Dat maakt het van nature bestand tegen weer en wind, zonder verduurzaming, verf of chemie. Het vergrijst mooi en gaat decennia mee.",
  },
  {
    icon: Recycle,
    title: "Uit hakhoutbeheer, niet uit grootschalige kap",
    text: "Ons hout komt vrij bij het snoeien en knotten van kastanjebossen. Na tien tot vijftien jaar zijn de scheuten opnieuw uitgegroeid. Een eerlijk alternatief voor tropisch hardhout en behandeld naaldhout.",
  },
  {
    icon: ShieldCheck,
    title: "Advies van vakmensen, geen verkooppraat",
    text: "Wij leveren aan particulieren, overheden en bedrijven. U krijgt het hekwerk dat bij uw terrein en budget past — ook als dat een eenvoudigere uitvoering is dan u in gedachten had.",
  },
];

// A rail needs enough products to fill a row; the collections that fall short
// (one or two items each) are pooled into a single grid so the homepage never
// shows a lone card beside three empty columns.
const RAIL_MIN = 4;

const grouped = collections
  .map((collection) => ({ collection, items: collectionProducts(collection) }))
  .filter(({ items }) => items.length > 0);

const rails = grouped.filter(({ items }) => items.length >= RAIL_MIN);

const remainder = [
  ...new Map(
    grouped
      .filter(({ items }) => items.length < RAIL_MIN)
      .flatMap(({ items }) => items)
      .map((product) => [product.handle, product] as const),
  ).values(),
];

export default function HomePage() {
  return (
    <>
      {page?.structuredData && <JsonLd data={page.structuredData} />}

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-brand-dark">
        <Image
          src="/wp-content/uploads/2016/01/Frans-Rasterwerk-1.20m-scaled-e1601390421420.jpg"
          alt="Frans kastanje rasterwerk van 1,20 meter langs een oprit"
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-60"
        />
        {/* Scrim: the fence photo is bright on the left, where the copy sits. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-brand-dark/95 via-brand-dark/75 to-brand-dark/35"
        />
        <div className="relative mx-auto w-full max-w-[80rem] px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-bright">
            Natuurhout — Zele, België
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Specialist in Kastanjehout
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
            Duurzaam hekwerk, poorten, palen en tuinschermen uit onbehandeld
            kastanje-, hazelaar-, robinia-, lariks- en eikenhout. Al meer dan
            vijftien jaar, rechtstreeks uit eigen voorraad.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/producten/"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
            >
              Bekijk ons assortiment
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/offerte-aanvragen/"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/70 hover:bg-white/10"
            >
              Offerte aanvragen
            </Link>
          </div>
        </div>
      </section>

      {/* USP band */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid w-full max-w-[80rem] gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-10">
          {usps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-ink/65">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-[80rem] px-4 sm:px-6 lg:px-10">
        {/* Categories */}
        <section className="pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                <span aria-hidden className="h-px w-8 bg-accent" />
                Assortiment
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Onze producten</h2>
            </div>
            <Link href="/producten/" className="text-sm font-medium text-accent hover:text-accent-deep">
              Alle productgroepen →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.label}
                href={category.href}
                className="group flex flex-col overflow-hidden rounded-card border border-line bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-ink/10"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft/50">
                  <Image
                    src={category.src}
                    alt={category.label}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                </div>
                <p className="flex flex-1 items-center justify-between gap-2 p-3.5 text-sm font-medium leading-snug text-ink group-hover:text-accent">
                  {category.label}
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink/30 transition-colors group-hover:text-accent" />
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Product rails, one per collection */}
        <section className="pt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                <span aria-hidden className="h-px w-8 bg-accent" />
                Webshop
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
                Direct leverbaar uit voorraad
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-ink/70">
                Ons volledige webshopassortiment, per groep. Prijzen zijn incl.
                btw; bestellen en betalen gebeurt op natuurhout.shop.
              </p>
            </div>
            <Link href="/shop/" className="text-sm font-medium text-accent hover:text-accent-deep">
              Naar de shop →
            </Link>
          </div>

          <div className="mt-10 space-y-14">
            {rails.map(({ collection, items }) => (
              <ProductSlider
                key={collection.handle}
                products={items}
                title={collection.title}
                href={`/shop/#${collection.handle}`}
              />
            ))}

            {remainder.length > 0 && (
              <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <h3 className="font-display text-xl font-semibold text-ink">
                    Verder in het assortiment
                  </h3>
                  <Link href="/shop/" className="text-sm font-medium text-accent hover:text-accent-deep">
                    Alles bekijken →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                  {remainder.map((product) => (
                    <ProductCard key={product.handle} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SEO / company text */}
        <section className="pt-20">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            <span aria-hidden className="h-px w-8 bg-accent" />
            Over Natuurhout
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight">
            Waar wij voor staan
          </h2>
          <div className="mt-5 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="max-w-3xl space-y-4 leading-7 text-ink/80">
              <p>
                Natuurhout is de specialist in onbehandeld kastanjehout in Zele.
                Wij leveren duurzaam hekwerk en sfeervolle tuinproducten aan
                particulieren, overheden en bedrijven in heel Vlaanderen — van
                één rol rasterwerk voor een voortuin tot de volledige omheining
                van een paardenweide.
              </p>
              <p>
                Natuurlijke schoonheid en duurzaamheid komen samen in
                hoogwaardige houtconstructies voor buitengebruik. Dankzij een
                diepgewortelde passie voor ambacht en vakmanschap werken wij
                uitsluitend met houtsoorten die bestand zijn tegen weer en wind.
                Elk project wordt met de grootste zorg uitgevoerd, waarbij
                esthetiek en functionaliteit hand in hand gaan.
              </p>

              <div className="space-y-5 pt-2">
                {principles.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-ink">{title}</h3>
                      <p className="mt-1 leading-7 text-ink/75">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="pt-4 font-display text-xl font-semibold text-ink">
                Tijdloze en duurzame houten tuinproducten
              </h3>
              <p>
                Een tuin verdient een natuurlijke en stijlvolle afwerking.
                Daarom bieden wij een breed assortiment{" "}
                <Link href="/producten/" className="font-medium text-accent underline underline-offset-2">
                  houten tuinproducten
                </Link>{" "}
                die functionaliteit en een mooi uiterlijk combineren. Onze{" "}
                <Link href="/landelijke-afsluiting/" className="font-medium text-accent underline underline-offset-2">
                  landelijke afsluitingen
                </Link>{" "}
                en{" "}
                <Link href="/houten-tuinpoorten/" className="font-medium text-accent underline underline-offset-2">
                  tuinpoorten
                </Link>{" "}
                zorgen voor privacy en veiligheid zonder in te boeten op
                uitstraling. Houten palen vormen een solide basis voor elke
                buitenruimte, terwijl onze{" "}
                <Link href="/project/moestuinbak/" className="font-medium text-accent underline underline-offset-2">
                  moestuinbakken
                </Link>{" "}
                de perfecte oplossing bieden voor liefhebbers van vers geteelde
                groenten en kruiden. Elk product is vervaardigd uit duurzame
                houtsoorten, waardoor een lange levensduur en minimale
                onderhoudsbehoefte gegarandeerd zijn.
              </p>

              <h3 className="pt-4 font-display text-xl font-semibold text-ink">
                Vraag een offerte aan en ontdek de mogelijkheden
              </h3>
              <p>
                Bent u op zoek naar een houten oplossing die perfect aansluit bij
                uw tuin? Vraag vandaag nog een{" "}
                <Link href="/offerte-aanvragen/" className="font-medium text-accent underline underline-offset-2">
                  vrijblijvende offerte
                </Link>{" "}
                aan of ga meteen naar de{" "}
                <Link href="/shop/" className="font-medium text-accent underline underline-offset-2">
                  webshop
                </Link>
                . Wij denken graag met u mee en bieden deskundig advies op maat.
                Wij staan garant voor kwaliteit en vakmanschap. Kies voor
                duurzaamheid en elegantie en laat uw tuin tot zijn recht komen
                met natuurhout.
              </p>
            </div>

            {/* Mascot sits on white, matching its own background */}
            <aside className="lg:pt-2">
              <div className="rounded-card border border-line bg-white p-6">
                <div className="flex items-center gap-4">
                  <Image
                    src="/mascotte-natuurhout.webp"
                    alt="De mascotte van Natuurhout, een eekhoorn met pet"
                    width={96}
                    height={96}
                    className="h-20 w-20 shrink-0 object-contain"
                  />
                  <div>
                    <p className="font-display text-lg font-semibold leading-tight">
                      Even meedenken?
                    </p>
                    <p className="mt-1 text-sm text-ink/65">
                      Wij rekenen graag mee aan uw afsluiting.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
                  <a href="tel:+3252558858" className="block font-semibold text-accent hover:text-accent-deep">
                    +32 5 255 88 58
                  </a>
                  <a href="mailto:info@natuurhout.be" className="block text-ink/70 hover:text-accent">
                    info@natuurhout.be
                  </a>
                  <p className="pt-2 text-ink/60">
                    Adolf Van Der Moerenstraat 39, 9240 Zele
                  </p>
                  <p className="text-ink/60">Ma–vr 09:00–18:00 · za 09:00–12:00</p>
                </div>
                <Link
                  href="/calculator/"
                  className="mt-5 inline-flex text-sm font-medium text-accent hover:text-accent-deep"
                >
                  Bereken uw afsluiting →
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {/* Closing CTA */}
      <section className="mt-20 bg-brand-dark">
        <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
              Uw afsluiting samenstellen?
            </h2>
            <p className="mt-2 max-w-xl text-white/70">
              Stel hekwerk, palen en poort samen en zie meteen een richtprijs, of
              vraag een offerte op maat aan.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/calculator/"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
            >
              Naar de calculator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://natuurhout.shop/"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/70 hover:bg-white/10"
            >
              Naar de webshop
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
