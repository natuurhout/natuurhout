import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calculator, Handshake, Leaf, Recycle, ShieldCheck, Store, Truck } from "lucide-react";
import CategoryCarousel from "@/components/CategoryCarousel";
import Faq, { type FaqItem } from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { PLACES, withPageMeta } from "@/components/LandingParts";
import ProductSlider from "@/components/ProductSlider";
import { formatPrice, getProduct, isListed, pricePerMeterFrom, products, type Product } from "@/lib/catalog";
import { CALCULATOR_HEKWERK_PHOTO, CALCULATOR_VLECHTSCHERM_PHOTO } from "@/lib/extra-photos";
import { categories } from "@/lib/categories";
import { SALE } from "@/lib/promotions";
import { ADDRESS, EMAIL, MOBILE, PHONE } from "@/lib/contact";
import { HOURS } from "@/lib/opening-hours";
import { siteUrl } from "@/lib/site";
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

// Approved SEO title, description and h1 (Xander, Oct 2026: the main goal is
// selling kastanje, robinia and hazelaar hekwerk and their gates), recorded
// in migration/handbuilt-routes.json.
const TITLE = "Kastanje, robinia & hazelaar hekwerk en poorten | Natuurhout";
const DESCRIPTION =
  "Hekwerk en houten poorten in kastanje, robinia en hazelaar, rechtstreeks van de specialist in Zele. Ook palen, vlechtschermen en moestuinbakken. Levering in heel Vlaanderen.";
const HEADING = "Hekwerk en poorten in kastanje, robinia en hazelaar";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: page?.canonical || "https://www.natuurhout.be/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: page?.canonical || "https://www.natuurhout.be/",
    locale: "nl_BE",
    type: "website",
    images: [{ url: CALCULATOR_HEKWERK_PHOTO }],
  },
};

// Local business data for Google (Maps, local results) and AI assistants.
const DAY_CODES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const localBusiness = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": `${siteUrl}/#localbusiness`,
  name: "Natuurhout",
  description: DESCRIPTION,
  url: `${siteUrl}/`,
  telephone: "+3252558858",
  email: EMAIL.label,
  image: `${siteUrl}${CALCULATOR_HEKWERK_PHOTO}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: ADDRESS.street,
    postalCode: ADDRESS.city.split(" ")[0],
    addressLocality: ADDRESS.city.split(" ").slice(1).join(" "),
    addressRegion: "Oost-Vlaanderen",
    addressCountry: "BE",
  },
  areaServed: [
    { "@type": "AdministrativeArea", name: "Vlaanderen" },
    { "@type": "Country", name: "België" },
  ],
  openingHoursSpecification: HOURS.flatMap((hours, day) =>
    hours ? [{ "@type": "OpeningHoursSpecification", dayOfWeek: DAY_CODES[day], opens: hhmm(hours.open), closes: hhmm(hours.close) }] : [],
  ),
  knowsAbout: [
    "kastanje hekwerk", "robinia hekwerk", "hazelaar hekwerk", "houten tuinpoorten", "kastanje palen",
    "robinia palen", "hazelaar vlechtschermen", "moestuinbakken", "Post & Rail", "schapengaas",
  ],
  parentOrganization: { "@id": `${siteUrl}/#organization` },
};

/**
 * The roll customers buy most (Xander: 1,20 m or 1 m with narrow spacing),
 * as "1,20 m · latafstand 4,5/5 cm" and its price for one roll. Hekwerk is
 * sold per roll, never per metre.
 */
function popularRoll(handle: string, titleStart: string, spacing: string) {
  const variant = getProduct(handle)?.variants.find((v) => v.title.startsWith(titleStart));
  const m = variant?.title.match(/^(\d+)cm.*\((\d+)m rol\)/);
  if (!variant || !m) return null;
  const height = (Number(m[1]) / 100).toFixed(2).replace(".", ",");
  return { label: `${height} m hoog · latafstand ${spacing}`, price: `${formatPrice(variant.price)} per rol van ${m[2]} m` };
}

/** Lowest current webshop price of a product ("€175,00"). */
const priceFrom = (handle: string) => {
  const price = getProduct(handle)?.priceFrom;
  return price ? formatPrice(price) : null;
};

// Main goal (Xander): hekwerk in kastanje, robinia and hazelaar, and their gates.
const mainProducts = [
  {
    title: "Kastanje hekwerk",
    href: "/project/rasterwerk-kastanjehout/",
    src: CALCULATOR_HEKWERK_PHOTO,
    text: "De klassieke landelijke afsluiting, van 60 cm tot 1,80 m hoog.",
    popular: popularRoll("kastanje-rasterwerk", "120cm / 4.5/5cm", "4,5/5 cm"),
  },
  {
    title: "Robinia hekwerk",
    href: "/project/robinia-rasterwerk/",
    src: "/fotos/robinia-hekwerk-hoofdfoto.jpg",
    text: "De duurzaamste Europese houtsoort, van 1 m tot 1,50 m hoog.",
    popular: popularRoll("robinia-hekwerk", "120cm / 4cm", "4 cm"),
  },
  {
    title: "Hazelaar hekwerk",
    href: "/project/hazelaarrasterwerk/",
    src: "/wp-content/uploads/2016/01/Hazelaar-afsluiting4-scaled.webp",
    text: "Licht en landelijk, van 60 cm tot 1,50 m hoog.",
    popular: popularRoll("hazelaar-hekwerk", "120cm / 3/5cm", "3/5 cm"),
  },
  {
    title: "Houten poorten",
    href: "/houten-tuinpoorten/",
    src: "/fotos/kastanje-premium-poort-hekwerk.jpg",
    text: "Kastanje, robinia en hazelaar poorten, ook op maat, met palen en beslag.",
    popular: { label: "Kastanje premium poort", price: `vanaf ${priceFrom("kastanje-poorten") ?? ""}` },
  },
];

// Secondary goal: posts, screens and planters.
const secondaryProducts = [
  { title: "Kastanje palen", href: "/project/kastanjepalen/", src: "/fotos/kastanje-palen.jpg", price: priceFrom("palen") },
  { title: "Robinia palen", href: "/project/robinia-palen/", src: "/wp-content/uploads/2026/04/Copy-of-Copy-of-Robinia-Hekwerk-1.20m-4cm.png", price: priceFrom("robinia-palen") },
  { title: "Hazelaar vlechtschermen", href: "/project/hazelaar-vlechtscherm-hasseltre/", src: CALCULATOR_VLECHTSCHERM_PHOTO, price: priceFrom("hazelaar-scherm-trepanel") },
  { title: "Moestuinbakken", href: "/project/moestuinbak/", src: "/wp-content/uploads/2016/01/IMG_7994-scaled.jpg", price: priceFrom("tuinbakken-hazelaar") },
];

// Category carousel in the order of what matters most to sell.
const CAROUSEL_ORDER = [
  "/project/rasterwerk-kastanjehout/", "/project/robinia-rasterwerk/", "/project/hazelaarrasterwerk/",
  "/project/franse-poorten/", "/project/maatwerk-poorten/", "/project/kastanje-poorten-geschroefd/", "/shop/robinia-poort/",
  "/project/hazelaar-poorten/", "/project/kastanjepalen/", "/project/robinia-palen/", "/shop/vierkant-gezaagde-robinia-palen/",
  "/project/hazelaar-vlechtscherm-hasseltre/", "/project/hazelaarvlechtschermen/", "/project/moestuinbak/",
  "/project/post-rail-2/", "/project/cleft-field-veldpoorten/", "/project/eiken-palen/", "/project/postsaver-voor-palen/",
];
const carouselRank = (href: string) => (CAROUSEL_ORDER.includes(href) ? CAROUSEL_ORDER.indexOf(href) : CAROUSEL_ORDER.length);
// The kaderpoort is a unique Sale item now; it is listed under Sale.
const carouselTiles = categories
  .filter((tile) => tile.href !== "/project/raamwerkpoort/")
  .sort((a, b) => carouselRank(a.href) - carouselRank(b.href));

function homeFaqs(): FaqItem[] {
  const kastanje = pricePerMeterFrom("kastanje-rasterwerk", 100);
  const roll = popularRoll("kastanje-rasterwerk", "120cm / 4.5/5cm", "4,5/5 cm");
  return [
    {
      q: "Welk hekwerk kies ik: kastanje, robinia of hazelaar?",
      text: "Kastanje is de klassieker: duurzaam zonder behandeling (ongeveer 15 tot 25 jaar) en in de meeste hoogtes. Robinia is de duurzaamste Europese houtsoort (ongeveer 25 tot 40 jaar) en heel stevig. Hazelaar is lichter en speelser van uitzicht en past mooi rond borders en moestuinen (ongeveer 8 tot 15 jaar).",
    },
    {
      q: "Wat kost kastanje hekwerk?",
      text: `Kastanje hekwerk wordt per rol verkocht, van 5 of 10 meter.${roll ? ` De meest gekozen rol, ${roll.label}, kost ${roll.price} (incl. btw)${kastanje ? `; voor 1 m hoog komt dat neer op vanaf ${kastanje} per meter` : ""}.` : ""} Reken daarbij een paal om de ±1,80 m. Met de calculator berekent u meteen hoeveel rollen en palen u nodig heeft, met de richtprijs van hekwerk, palen en poort samen.`,
    },
    {
      q: "Verkopen jullie ook houten poorten bij het hekwerk?",
      text: "Ja. Bij kastanje hekwerk horen de kastanje premium poorten, geschroefde poorten en poorten op maat; daarnaast zijn er robinia en hazelaar poorten en Cleft & Field veldpoorten voor weides. De meeste poorten worden geleverd met poortpalen en hang- en sluitwerk.",
    },
    {
      q: "Leveren jullie in heel Vlaanderen?",
      text: `Ja. Vanuit Zele (Oost-Vlaanderen) leveren we zelf in heel Vlaanderen, de rest van België en delen van Nederland. Wat op voorraad is, leveren we binnen de week, of sneller als het moet. Op aanvraag plaatsen we uw afsluiting. Afhalen kan in de ${ADDRESS.street} in ${ADDRESS.city}.`,
    },
    {
      q: "Moet kastanjehout behandeld worden?",
      text: "Nee. Tamme kastanje zit vol looizuren en is daardoor van nature bestand tegen weer en wind, zonder verf of chemische behandeling. Het hout vergrijst mooi na verloop van tijd.",
    },
  ];
}

const usps = [
  { icon: ShieldCheck, title: "Familiebedrijf, 15 jaar ervaring", text: "Advies van mensen die het hout kennen." },
  { icon: Store, title: "Grote voorraad", text: "Wat op voorraad is, leveren we binnen de week, of sneller als het moet." },
  { icon: Truck, title: "Eigen levering", text: "Wij leveren zelf in heel België en delen van Nederland, of u haalt af in Zele." },
  { icon: Handshake, title: "Hulp bij inladen", text: "Afhalen in Zele? We helpen u inladen en geven advies." },
];

// Shortcuts into the calculator, each opening with that product chosen.
const calculatorChoices = [
  { label: "Hekwerk", keuze: "hekwerk", src: CALCULATOR_HEKWERK_PHOTO },
  { label: "Poorten", keuze: "poorten", src: "/wp-content/uploads/2016/01/Dubbele-maatwerkpoort-scaled.jpg" },
  { label: "Vlechtschermen", keuze: "vlechtschermen", src: CALCULATOR_VLECHTSCHERM_PHOTO },
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

// Homepage order is Xander's priority, not the shop's collection order:
// fencing first (kastanje, robinia, hazelaar), then gates, then posts, screens
// and planters, then Post & Rail and mesh, the rest last. Within each rail the same species order holds.
// Handles are verbatim shop data. Anything the shop adds later that is not
// listed here lands in the "meer" rail, so a new product never disappears
// from the homepage; a handle the shop drops is simply skipped.
type HomeSection = { title: string; href: string; handles: string[]; catchAll?: boolean };

const homeSections: HomeSection[] = [
  {
    title: "Hekwerk",
    href: "/shop/#raster",
    handles: [
      "kastanje-rasterwerk",
      "robinia-hekwerk",
      "hazelaar-hekwerk",
    ],
  },
  {
    title: "Poorten",
    href: "/shop/#poorten",
    handles: [
      "kastanje-poorten",
      "kastanje-poort-geschroefd",
      "robinia-poort",
      "hazelaar-poort",
      "cleft-field-poorten",
      "hardhouten-veldpoort",
    ],
  },
  {
    title: "Palen",
    href: "/shop/#palen",
    handles: [
      "palen",
      "kastanje-palen-copy",
      "robinia-palen",
      "vierkant-gezaagde-robinia-palen",
      "halfronde-palen",
      "eiken-palen",
      "kastanje-paal-met-postsaver",
      "paalhouder-met-punt-rond",
    ],
  },
  {
    title: "Vlechtschermen & moestuinbakken",
    href: "/shop/#vlechtschermen",
    handles: [
      "hazelaar-vlechtscherm-hasseltre",
      "hazelaar-scherm-trepanel",
      "tuinbakken-hazelaar",
      "plantenbak-cortenstaal",
    ],
  },
  {
    title: "Post & Rail en schapengaas",
    href: "/shop/#post-rail",
    handles: [
      "post-rail-omheining",
      "schapengaas-nexum-basic",
      "schapengaas-nexum-licht",
      "schapengaas-nexum-zwaar",
      "nexum-x",
      "schapengaas-fx",
      "kippengaas",
    ],
  },
  {
    title: "Sale",
    href: "/aanbiedingen-2/#sale",
    handles: SALE,
  },
  {
    title: "Plaatsingsmateriaal & meer",
    href: "/shop/#plaatsing-materiaal",
    catchAll: true,
    handles: [
      "houtschroeven",
      "snelbeton",
      "hekwerk-draadverbinders",
      "beslag-hang-sluitwerk",
      "grondboor",
      "grondboor-kopie",
      "tuin-voorhamer",
      "lariks-planken-delen",
    ],
  },
];

const listed = new Set(homeSections.flatMap((section) => section.handles));
const unlisted = products.filter((product) => !listed.has(product.handle) && isListed(product));

const rails = homeSections
  .map((section) => ({
    ...section,
    items: [
      ...section.handles
        .map((handle) => getProduct(handle))
        .filter((product): product is Product => Boolean(product) && isListed(product!)),
      ...(section.catchAll ? unlisted : []),
    ],
  }))
  .filter((section) => section.items.length > 0);

export default function HomePage() {
  return (
    <>
      {page?.structuredData && <JsonLd data={withPageMeta(page.structuredData, TITLE, DESCRIPTION)} />}
      <JsonLd data={localBusiness} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-brand-dark">
        <Image
          src="/wp-content/uploads/2016/01/Frans-Rasterwerk-1.20m-scaled-e1601390421420.jpg"
          alt="Kastanje hekwerk van 1,20 meter langs een oprit"
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
        <div className="relative mx-auto grid w-full max-w-[80rem] items-center gap-x-12 gap-y-6 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-10 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-bright">
              Natuurhout — specialist in kastanjehout, Zele
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {HEADING}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">
              Onbehandeld hekwerk op rol en bijpassende houten tuinpoorten, rechtstreeks uit eigen voorraad in Zele. Ook
              palen, vlechtschermen en moestuinbakken. Al zo’n vijftien jaar, met levering in heel Vlaanderen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/producten/"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
              >
                Bekijk hekwerk &amp; poorten
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

          {/* Calculator shortcut; the waving mascot stands on its top edge. */}
          <div className="relative mt-24 lg:mt-20">
            <Image
              src="/mascotte-zwaai.webp"
              alt="De Natuurhout-eekhoorn zwaait"
              width={496}
              height={640}
              className="absolute bottom-full right-5 h-[112px] w-auto"
            />
            <div className="rounded-card bg-white p-5 shadow-xl shadow-black/25 sm:p-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-deep">
                <Calculator aria-hidden className="h-4 w-4" />
                Calculator
              </p>
              <h2 className="mt-2 font-display text-xl font-bold leading-snug text-ink">
                Bereken direct uw richtprijs
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/70">
                Kies wat u nodig hebt en zie meteen wat het kost, met de actuele webshopprijzen.
              </p>
              <ul className="mt-4 grid grid-cols-3 gap-2.5">
                {calculatorChoices.map((choice) => (
                  <li key={choice.keuze}>
                    <Link
                      href={`/calculator/?keuze=${choice.keuze}`}
                      className="group block overflow-hidden rounded-lg border border-line transition-colors hover:border-accent"
                    >
                      <span className="relative block aspect-[4/3] overflow-hidden bg-brand-soft/50">
                        <Image
                          src={choice.src}
                          alt=""
                          fill
                          sizes="120px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        />
                      </span>
                      <span className="block px-1.5 py-2 text-center text-xs font-semibold text-ink group-hover:text-accent-deep">
                        {choice.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/calculator/"
                className="mt-4 flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
              >
                Start de calculator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
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

      <div className="mx-auto w-full max-w-[80rem] overflow-x-clip px-4 sm:px-6 lg:px-10">
        {/* Main goal: hekwerk in kastanje, robinia and hazelaar, and their gates. */}
        <section className="pt-14" aria-labelledby="hekwerk-poorten">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
            <span aria-hidden className="h-px w-8 bg-accent" />
            Onze specialiteit
          </p>
          <h2 id="hekwerk-poorten" className="mt-3 font-display text-3xl font-bold tracking-tight">
            Kies uw hekwerk en bijpassende poort
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink/70">
            Hekwerk op rol in drie houtsoorten, met de poorten die erbij horen. Bij elk product ziet u de meest gekozen
            uitvoering; alle hoogtes, latafstanden en prijzen (incl. btw) vindt u op de productpagina.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {mainProducts.map((product) => (
              <li key={product.href}>
                <Link
                  href={product.href}
                  className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-ink/10"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden bg-brand-soft/50">
                    <Image src={product.src} alt={product.title} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  </span>
                  <span className="flex flex-1 flex-col p-4">
                    <span className="font-display text-lg font-semibold leading-tight text-ink group-hover:text-accent-deep">{product.title}</span>
                    <span className="mt-1 text-sm leading-snug text-ink/65">{product.text}</span>
                    {product.popular && (
                      <span className="mt-auto block border-t border-line pt-3 text-sm">
                        <span className="block text-[11px] font-semibold uppercase tracking-wide text-accent-deep">Meest gekozen</span>
                        <span className="block text-ink/65">{product.popular.label}</span>
                        <strong className="block text-ink">{product.popular.price}</strong>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Secondary goal: posts, screens and planters. */}
        <section className="pt-12" aria-labelledby="palen-schermen">
          <h2 id="palen-schermen" className="font-display text-2xl font-bold tracking-tight">Palen, vlechtschermen en moestuinbakken</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {secondaryProducts.map((product) => (
              <li key={product.href}>
                <Link href={product.href} className="group flex items-center gap-3 rounded-xl border border-line bg-white p-2.5 transition-colors hover:border-accent">
                  <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-soft/60">
                    <Image src={product.src} alt="" fill sizes="64px" className="object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-snug text-ink group-hover:text-accent-deep">{product.title}</span>
                    {product.price && <span className="block text-xs text-ink/60">vanaf {product.price}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Categories */}
        <section className="pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                <span aria-hidden className="h-px w-8 bg-accent" />
                Assortiment
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Alle productgroepen</h2>
            </div>
            <Link href="/producten/" className="text-sm font-medium text-accent hover:text-accent-deep">
              Alle productgroepen →
            </Link>
          </div>
          <div className="mt-6">
            <CategoryCarousel tiles={carouselTiles} />
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
                Ons volledige webshopassortiment: eerst hekwerk, dan poorten,
                palen, vlechtschermen en moestuinbakken. Prijzen zijn incl. btw;
                bestellen en betalen gebeurt op natuurhout.shop.
              </p>
            </div>
            <Link href="/shop/" className="text-sm font-medium text-accent hover:text-accent-deep">
              Naar de shop →
            </Link>
          </div>

          <div className="mt-10 space-y-14">
            {rails.map((section) => (
              <ProductSlider
                key={section.title}
                products={section.items}
                title={section.title}
                href={section.href}
              />
            ))}
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
                Wij leveren{" "}
                <Link href="/project/rasterwerk-kastanjehout/" className="font-medium text-accent underline underline-offset-2">kastanje hekwerk</Link>,{" "}
                <Link href="/project/robinia-rasterwerk/" className="font-medium text-accent underline underline-offset-2">robinia hekwerk</Link> en{" "}
                <Link href="/project/hazelaarrasterwerk/" className="font-medium text-accent underline underline-offset-2">hazelaar hekwerk</Link>, met
                de bijpassende{" "}
                <Link href="/houten-tuinpoorten/" className="font-medium text-accent underline underline-offset-2">houten poorten</Link>, aan
                particulieren, overheden en bedrijven in heel Vlaanderen — van
                één rol hekwerk voor een voortuin tot de volledige omheining
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
                Palen, vlechtschermen, Post &amp; Rail en schapengaas
              </h3>
              <p>
                Een goede afsluiting staat op goede palen:{" "}
                <Link href="/project/kastanjepalen/" className="font-medium text-accent underline underline-offset-2">kastanje palen</Link> en{" "}
                <Link href="/project/robinia-palen/" className="font-medium text-accent underline underline-offset-2">robinia palen</Link>, geschild
                en aan één kant gepunt, eventueel met een postsaver voor een langere levensduur. Wie privacy zoekt, kiest{" "}
                <Link href="/project/hazelaar-vlechtscherm-hasseltre/" className="font-medium text-accent underline underline-offset-2">hazelaar vlechtschermen</Link>.
                Voor paarden en vee is er{" "}
                <Link href="/project/post-rail-2/" className="font-medium text-accent underline underline-offset-2">Post &amp; Rail</Link> in kastanje,
                en <Link href="/shop/#gaas" className="font-medium text-accent underline underline-offset-2">schapengaas</Link> om kleinere dieren
                binnen te houden.
              </p>

              <h3 className="pt-4 font-display text-xl font-semibold text-ink">
                Geleverd en geplaatst in heel Vlaanderen
              </h3>
              <p>
                Vanuit Zele leveren we in heel Vlaanderen, en ook in de rest van België, of u haalt af in onze opslag. We plaatsten al
                afsluitingen en poorten in onder meer {PLACES.slice(0, 12).join(", ")} en {PLACES[12]}. Bekijk onze{" "}
                <Link href="/onze-realisaties/" className="font-medium text-accent underline underline-offset-2">realisaties</Link>{" "}
                of lees in de{" "}
                <Link href="/tipsenideeen/kastanje-hekwerk-en-poort-plaatsen/" className="font-medium text-accent underline underline-offset-2">handleiding</Link>{" "}
                hoe u zelf hekwerk en een poort plaatst.
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

            <aside className="lg:pt-2">
              <div className="rounded-card border border-line bg-white p-6">
                <div className="flex items-center gap-4">
                  <Image
                    src="/mascotte-welkom.webp"
                    alt="De Natuurhout-eekhoorn heet u welkom"
                    width={551}
                    height={640}
                    className="h-24 w-auto shrink-0"
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
                  <a href={PHONE.href} className="block font-semibold text-accent hover:text-accent-deep">
                    {PHONE.label}
                  </a>
                  <a href={MOBILE.href} className="block font-semibold text-accent hover:text-accent-deep">
                    Gsm {MOBILE.label}
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

        <Faq items={homeFaqs()} title="Veelgestelde vragen over hekwerk en poorten" />
      </div>

      {/* Closing CTA */}
      <section className="mt-20 border-b border-white/10 bg-brand-dark">
        <div className="relative mx-auto flex w-full max-w-[80rem] flex-col gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          {/* Thumbs-up mascot, standing on the bottom edge of the band. */}
          <Image
            src="/mascotte-duim.webp"
            alt="De Natuurhout-eekhoorn steekt zijn duim op"
            width={513}
            height={640}
            className="absolute bottom-0 right-4 h-32 w-auto sm:static sm:-mb-14 sm:h-44 sm:self-end"
          />
          <div className="lg:mr-auto">
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
