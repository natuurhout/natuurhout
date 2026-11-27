import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calculator, Phone } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import PhotoLightbox from "@/components/PhotoLightbox";
import { getLegacyPageByPath, type LegacyBlock } from "@/lib/legacy";
import { QUOTE_HREF } from "@/lib/navigation";
import { pricePerMeterFrom } from "@/lib/catalog";
import { categories } from "@/lib/categories";
import { PHONE } from "@/lib/contact";

/*
 * "Over ons", rebuilt (handbuilt-routes.json, preserveContent): the text now
 * opens the page and the photos sit between the sections, instead of a wall
 * of 150px thumbnails above the text. Every heading, paragraph, photo and
 * photo link of the frozen snapshot is still on the page, verbatim. A photo
 * opens large in a pop-up (PhotoLightbox) with the others, not in a new tab.
 *
 * Nov 2026 (Xander): a sharper title, description and h1 (handbuilt-routes:
 * approvedTitle/-Description/-Heading), a Dutch eyebrow instead of the
 * snapshot's "Something About Us", and the three woods side by side: hazelaar
 * as the budget fence (about 10 years), kastanje the classic, robinia lasting
 * longer than kastanje, each with its price per metre and product links.
 */
const page = getLegacyPageByPath("/over-ons/");

const TITLE = "Tuinafsluitingen in kastanje, robinia en hazelaar | Over Natuurhout";
const DESCRIPTION =
  "Natuurhout uit Zele: begonnen en gespecialiseerd in kastanje, nu ook robinia en hazelaar. Tuinafsluitingen, hekwerk, poorten en palen, geleverd in heel België.";
const HEADING = "Over Natuurhout: tuinafsluitingen uit Zele";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: page?.canonical },
  openGraph: { title: TITLE, description: DESCRIPTION, url: page?.canonical, locale: "nl_BE", type: "website" },
};

const tilePhoto = (href: string) => categories.find((tile) => tile.href === href)?.src;

/** The three woods, from the budget fence to the longest-lasting one (Xander, Nov 2026). */
const WOODS = [
  {
    name: "Hazelaar",
    badge: "Budgetvriendelijk",
    life: "Zo’n 10 jaar",
    href: "/project/hazelaarrasterwerk/",
    perMeter: pricePerMeterFrom("hazelaar-hekwerk"),
    text: "De voordeligste natuurlijke afsluiting. Hazelaar hekwerk gaat zo’n 10 jaar mee zonder behandeling, en geeft uw tuin meteen een warme, landelijke uitstraling. Ideaal als u duurzaam wilt afsluiten met een kleiner budget.",
    links: [
      { href: "/project/hazelaarrasterwerk/", label: "Hazelaar hekwerk" },
      { href: "/project/hazelaarvlechtschermen/", label: "Hazelaar vlechtschermen" },
      { href: "/project/hazelaar-poorten/", label: "Hazelaar poorten" },
    ],
  },
  {
    name: "Kastanje",
    badge: "De klassieker",
    life: "15 tot 25 jaar",
    href: "/project/rasterwerk-kastanjehout/",
    perMeter: pricePerMeterFrom("kastanje-rasterwerk"),
    text: "Onbehandeld kastanjehout is van nature beschermd door looizuur. Kastanje hekwerk gaat 15 tot 25 jaar mee en heeft het breedste assortiment: hekwerk in vele hoogtes, poorten (ook op maat) en palen.",
    links: [
      { href: "/project/rasterwerk-kastanjehout/", label: "Kastanje hekwerk" },
      { href: "/project/franse-poorten/", label: "Kastanje poorten" },
      { href: "/project/kastanjepalen/", label: "Kastanje palen" },
    ],
  },
  {
    name: "Robinia",
    badge: "Langste levensduur",
    life: "25 tot 40 jaar",
    href: "/project/robinia-rasterwerk/",
    perMeter: pricePerMeterFrom("robinia-hekwerk"),
    text: "Nog duurzamer dan kastanje: robinia is de hardste en meest duurzame Europese houtsoort (duurzaamheidsklasse 1). Robinia hekwerk gaat 25 tot 40 jaar mee, zonder onderhoud. De keuze voor wie één keer en voor lang wil afsluiten.",
    links: [
      { href: "/project/robinia-rasterwerk/", label: "Robinia hekwerk" },
      { href: "/project/robinia-palen/", label: "Robinia palen" },
      { href: "/shop/robinia-poort/", label: "Robinia poort" },
    ],
  },
];

function Woods() {
  return (
    <section aria-labelledby="houtsoorten" className="mt-16 lg:mt-20">
      <h2 id="houtsoorten" className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Drie houtsoorten, voor elk budget en elke levensduur
      </h2>
      <p className="mt-3 max-w-3xl text-[17px] leading-8 text-ink/80">
        Naast kastanje leveren we ook hazelaar en robinia. Zo vindt u bij ons altijd een natuurlijke afsluiting die past: van een
        budgetvriendelijke afsluiting in hazelaar die zo’n 10 jaar duurzaam meegaat, tot robinia, dat nog langer meegaat dan kastanje. Alle
        drie onbehandeld, uit voorraad in Zele, met levering in heel België.
      </p>
      <ul className="mt-8 grid gap-5 md:grid-cols-3">
        {WOODS.map((wood) => {
          const photo = tilePhoto(wood.href);
          return (
            <li key={wood.name} className="flex flex-col overflow-hidden rounded-card border border-line bg-white">
              <Link href={wood.href} className="group relative block aspect-[4/3] overflow-hidden bg-brand-soft">
                {photo && (
                  <Image
                    src={photo}
                    alt={`${wood.name} hekwerk van Natuurhout`}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-accent-deep shadow-sm">{wood.badge}</span>
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-xl font-bold text-ink">
                  <Link href={wood.href} className="hover:text-accent-deep">
                    {wood.name} hekwerk
                  </Link>
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-brand-soft/60 px-3.5 py-2.5 text-sm">
                  <div>
                    <dt className="text-xs text-ink/55">Levensduur</dt>
                    <dd className="font-semibold text-ink">{wood.life}</dd>
                  </div>
                  {wood.perMeter && (
                    <div>
                      <dt className="text-xs text-ink/55">Hekwerk</dt>
                      <dd className="font-semibold text-ink">vanaf {wood.perMeter}/m</dd>
                    </div>
                  )}
                </dl>
                <p className="mt-3 text-[15px] leading-7 text-ink/75">{wood.text}</p>
                <ul className="mt-auto space-y-1 border-t border-line pt-4 text-sm">
                  {wood.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="group/l inline-flex items-center gap-1.5 font-semibold text-accent-deep hover:text-ink">
                        {link.label} <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover/l:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink/70">
        Twijfelt u tussen de houtsoorten?
        <a href={PHONE.href} className="inline-flex items-center gap-1.5 font-semibold text-accent-deep hover:text-ink">
          <Phone aria-hidden className="h-4 w-4" /> Bel {PHONE.label}
        </a>
        <Link href="/calculator/" className="inline-flex items-center gap-1.5 font-semibold text-accent-deep hover:text-ink">
          <Calculator aria-hidden className="h-4 w-4" /> Bereken een richtprijs
        </Link>
      </p>
    </section>
  );
}

const UP = "/wp-content/uploads";
type Photo = { src: string; alt: string };
const photo = (path: string, alt: string): Photo => ({ src: `${UP}/${path}`, alt });

const STOCK: Photo[] = [
  photo("2019/09/Foto-Opslag.jpg", "Kastanje hekwerk op voorraad in Zele"),
  photo("2019/09/IMG_9193.jpg", "Onze opslagplaats met kastanjehout"),
  photo("2016/01/bg-palen.jpg", "kastanje palen opslag"),
];
const MAKER = photo("2015/02/8610836261_d57a55318e.jpg", "Een kastanje poort in de maak in onze werkplaats");
const DELIVERY = photo("2015/02/8613562273_4d873b9e66.jpg", "Een vracht kastanjehout komt aan in Zele");
const WORKSHOP: Photo[] = [
  photo("2015/02/8614671122_e7b08ba0af.jpg", "Aan het werk in de werkplaats"),
  photo("2015/02/8610835143_3c1485100a.jpg", "Een poort wordt in elkaar gezet"),
  photo("2015/02/8610834781_45e7cf42b5.jpg", "Latten van een poort worden vastgezet"),
  photo("2015/02/8611943010_a8958f85bb.jpg", "Afwerking van een kastanje poort"),
  photo("2015/02/8611944184_97515e6bf2.jpg", "Een lat wordt op maat geschaafd"),
  photo("2015/02/8610835869_272fac33d9.jpg", "Pen-en-gatverbinding in kastanjehout"),
  photo("2015/02/8610840139_d84997f6f1.jpg", "Een paal wordt op maat geboord"),
  photo("2015/02/8610840535_4b2264b992.jpg", "Boren van een poortpaal"),
  photo("2015/02/8610839575_9d0b7bd10a.jpg", "Kastanje palen klaar voor een poort"),
  photo("2015/02/8613561581_dea58309f2.jpg", "Lossen van een vracht kastanjehout"),
];

/** Every linked photo in page order: each opens the pop-up viewer at its place. */
const ALL: Photo[] = [...STOCK, MAKER, DELIVERY, ...WORKSHOP];

/*
 * The team (portraits supplied by Natuurhout, public/fotos/team/; made into the
 * same neutral black and white, Nov 2026: *-zw.jpg). Add a name
 * and role per person to show them under the photo.
 */
const TEAM: { src: string; name?: string; role?: string }[] = [
  { src: "/fotos/team/team-1-zw.jpg" },
  { src: "/fotos/team/team-2-zw.jpg" },
  { src: "/fotos/team/team-3-zw.jpg" },
  { src: "/fotos/team/team-4-zw.jpg" },
];

/** The snapshot's blocks after a heading, up to the next heading. */
function after(blocks: LegacyBlock[], heading: string): LegacyBlock[] {
  const start = blocks.findIndex((b) => b.type === "heading" && b.text === heading);
  if (start < 0) return [];
  const rest = blocks.slice(start + 1);
  const end = rest.findIndex((b) => b.type === "heading");
  return (end < 0 ? rest : rest.slice(0, end)).filter((b) => b.type !== "image");
}

function Paragraphs({ blocks }: { blocks: LegacyBlock[] }) {
  return (
    <div className="space-y-4 text-[17px] leading-8 text-ink/80">
      {blocks.map((b, i) => ("html" in b ? <p key={i} dangerouslySetInnerHTML={{ __html: b.html }} /> : null))}
    </div>
  );
}

function Figure({ photo: p, className = "", sizes }: { photo: Photo; className?: string; sizes: string }) {
  return (
    <a href={p.src} data-lightbox-index={ALL.indexOf(p)} className={`group relative block cursor-zoom-in overflow-hidden rounded-card bg-brand-soft ${className}`}>
      <Image src={p.src} alt={p.alt} fill sizes={sizes} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
    </a>
  );
}

const inline = "font-semibold text-accent-deep underline decoration-accent/40 underline-offset-2 hover:text-ink hover:decoration-ink";

/*
 * The range, replacing the snapshot's "Assortiment kastanjehout" (which
 * still listed furniture) on Xander's request, Nov 2026: every product group
 * with links to its pages, then how to order.
 */
const RANGE: { name: string; links: { href: string; label: string }[] }[] = [
  {
    name: "Hekwerk",
    links: [
      { href: "/project/rasterwerk-kastanjehout/", label: "kastanje" },
      { href: "/project/robinia-rasterwerk/", label: "robinia" },
      { href: "/project/hazelaarrasterwerk/", label: "hazelaar" },
    ],
  },
  {
    name: "Poorten",
    links: [
      { href: "/project/franse-poorten/", label: "kastanje premium" },
      { href: "/project/kastanje-poorten-geschroefd/", label: "kastanje geschroefd" },
      { href: "/project/maatwerk-poorten/", label: "maatwerk" },
      { href: "/shop/robinia-poort/", label: "robinia" },
      { href: "/project/hazelaar-poorten/", label: "hazelaar" },
      { href: "/project/cleft-field-veldpoorten/", label: "veldpoorten" },
    ],
  },
  {
    name: "Palen",
    links: [
      { href: "/project/kastanjepalen/", label: "kastanje" },
      { href: "/shop/halfronde-palen/", label: "halfronde kastanje" },
      { href: "/project/robinia-palen/", label: "robinia" },
      { href: "/shop/vierkant-gezaagde-robinia-palen/", label: "gezaagde robinia" },
      { href: "/project/eiken-palen/", label: "eiken" },
      { href: "/project/postsaver-voor-palen/", label: "postsaver" },
    ],
  },
  {
    name: "Vlechtschermen",
    links: [
      { href: "/project/hazelaarvlechtschermen/", label: "hazelaar" },
      { href: "/project/hazelaar-vlechtscherm-hasseltre/", label: "hazelaar halve latten" },
    ],
  },
  { name: "Post & Rail", links: [{ href: "/project/post-rail-2/", label: "omheining voor weides en paddocks" }] },
  {
    name: "Tuin",
    links: [
      { href: "/project/moestuinbak/", label: "plantenbakken" },
      { href: "/project/lariks-schaal-delen-2/", label: "lariks schaaldelen" },
    ],
  },
  {
    name: "Plaatsingsmateriaal",
    links: [
      { href: "/shop/beslag-hang-sluitwerk/", label: "hang- en sluitwerk" },
      { href: "/assortiment/plaatsingsmateriaal/", label: "schroeven, grondboren en meer" },
    ],
  },
];

function Range() {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Ons assortiment: hekwerk, poorten en palen</h2>
      <p className="mt-4 text-[17px] leading-8 text-ink/80">
        Alles voor een natuurlijke afsluiting, in kastanje, robinia en hazelaar, in verschillende hoogtes en maten:
      </p>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {RANGE.map((group) => (
          <li key={group.name} className="grid gap-x-4 gap-y-0.5 py-2.5 text-[15px] leading-7 sm:grid-cols-[9.5rem_1fr]">
            <span className="font-semibold text-ink">{group.name}</span>
            <span className="text-ink/80">
              {group.links.map((link, i) => (
                <span key={link.href}>
                  {i > 0 && (i === group.links.length - 1 ? " en " : ", ")}
                  <Link href={link.href} className={inline}>
                    {link.label}
                  </Link>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[17px] leading-8 text-ink/80">
        Haal uw bestelling af in Zele, laat ze leveren in heel België, bestel meteen via de prijslijsten of{" "}
        <Link href={QUOTE_HREF} className={inline}>vraag een offerte op maat</Link> aan.
      </p>
    </div>
  );
}

/*
 * The opening text, replacing the snapshot's two paragraphs (kastanje only)
 * on Xander's request, Nov 2026: tuinafsluitingen and afsluitingen first,
 * started with and specialised in kastanje, now robinia and hazelaar too.
 */
function Intro() {
  return (
    <div className="mt-6 space-y-4 text-[17px] leading-8 text-ink/80">
      <p>
        Natuurhout is een familiebedrijf uit Zele, gespecialiseerd in natuurlijke <strong className="font-semibold text-ink">tuinafsluitingen</strong>{" "}
        en afsluitingen voor weides. We zijn begonnen met kastanjehout en zijn daarin gespecialiseerd. Intussen leveren we ook{" "}
        <Link href="/project/robinia-rasterwerk/" className={inline}>robinia</Link> en{" "}
        <Link href="/project/hazelaarrasterwerk/" className={inline}>hazelaar</Link>: allemaal onbehandeld hout, voor particulieren, overheden en
        bedrijven.
      </p>
      <p>
        Ons assortiment omvat{" "}
        <Link href="/project/rasterwerk-kastanjehout/" className={inline}>kastanje hekwerk</Link>, robinia en hazelaar hekwerk,{" "}
        <Link href="/houten-tuinpoorten/" className={inline}>houten poorten</Link>, palen en vlechtschermen. Een afsluiting van natuurhout
        gebruikt u als tuinafsluiting of erfafscheiding, maar ook als schapenhek of omheining voor paarden-, koeien- en hertenweides. Andere
        toepassingen zijn windbreking, het creëren van afzonderlijke ruimtes, het beveiligen van een zwembad of vijver en het afschermen van
        lelijke plekken, zoals de composthoop.
      </p>
    </div>
  );
}

/** Where Natuurhout comes from and how the range grew (Xander, Nov 2026), with links to the products. */
function History() {
  return (
    <div className="mt-4 space-y-4 text-[17px] leading-8 text-ink/80">
      <p>
        Natuurhout is begonnen met kastanjehout, en daar zijn we in gespecialiseerd. In onze eigen werkplaats maken we kastanje poorten:{" "}
        <Link href="/project/kastanje-poorten-geschroefd/" className={inline}>geschroefde poorten</Link>,{" "}
        <Link href="/project/franse-poorten/" className={inline}>premium poorten</Link> en{" "}
        <Link href="/project/maatwerk-poorten/" className={inline}>premium maatwerkpoorten</Link> op uw eigen maten.
      </p>
      <p>
        In de loop der jaren is ons assortiment gegroeid. Naast kastanje leveren we nu ook{" "}
        <Link href="/project/hazelaarrasterwerk/" className={inline}>hazelaar hekwerk</Link> en{" "}
        <Link href="/project/hazelaarvlechtschermen/" className={inline}>hazelaar vlechtschermen</Link>, en{" "}
        <Link href="/project/robinia-rasterwerk/" className={inline}>robinia hekwerk</Link>,{" "}
        <Link href="/shop/robinia-poort/" className={inline}>robinia poorten</Link> en{" "}
        <Link href="/project/robinia-palen/" className={inline}>robinia palen</Link>.
      </p>
    </div>
  );
}

function Section({
  title,
  blocks,
  photo: p,
  flip = false,
  children,
}: {
  title: string;
  blocks: LegacyBlock[];
  photo: Photo;
  flip?: boolean;
  /** Website text after the snapshot's paragraphs. */
  children?: React.ReactNode;
}) {
  return (
    <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={flip ? "lg:order-2" : undefined}>
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
        <div className="mt-4">
          <Paragraphs blocks={blocks} />
          {children}
        </div>
      </div>
      <Figure photo={p} className="aspect-[4/3]" sizes="(max-width: 1024px) 100vw, 50vw" />
    </section>
  );
}

export default function AboutPage() {
  if (!page) throw new Error("The WordPress /over-ons/ snapshot is missing.");
  const blocks = page.blocks;
  const strong = "Kastanjehout is sterk, veelzijdig en mooi";
  const uses = "Toepassingen kastanjehout";

  return (
    <div className="mx-auto w-full max-w-[72rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14" data-legacy-product={page.pathname}>
      {page.structuredData && <JsonLd data={page.structuredData} />}

      {/* Text first */}
      <header className="max-w-3xl">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
          <span aria-hidden className="h-px w-8 bg-accent" />
          Familiebedrijf uit Zele · 15 jaar ervaring
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">{HEADING}</h1>
        <Intro />
      </header>

      {/* Stock and yard */}
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {STOCK.map((p, i) => (
          <Figure key={p.src} photo={p} className={`aspect-[4/3] ${i === 0 ? "col-span-2 md:col-span-1" : ""}`} sizes="(max-width: 768px) 50vw, 33vw" />
        ))}
      </div>

      <Woods />

      {/* Team */}
      <section aria-labelledby="team" className="mt-16 lg:mt-20">
        <h2 id="team" className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Het team achter Natuurhout
        </h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {TEAM.map((member, i) => (
            <li key={member.src}>
              <div className="relative aspect-square overflow-hidden rounded-card bg-brand-soft">
                <Image
                  src={member.src}
                  alt={member.name ? `${member.name}, Natuurhout` : `Teamlid ${i + 1} van Natuurhout`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              {member.name && (
                <p className="mt-3">
                  <span className="block font-display text-lg font-semibold text-ink">{member.name}</span>
                  {member.role && <span className="text-sm text-ink/65">{member.role}</span>}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16 space-y-16 lg:mt-20 lg:space-y-20">
        <Section title={strong} blocks={after(blocks, strong)} photo={MAKER}>
          <History />
        </Section>

        <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-8 lg:order-2">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{uses}</h2>
              <div className="mt-4">
                <Paragraphs blocks={after(blocks, uses)} />
              </div>
            </div>
            <Range />
          </div>
          <Figure photo={DELIVERY} className="aspect-[4/3]" sizes="(max-width: 1024px) 100vw, 50vw" />
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">Uit onze werkplaats</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {WORKSHOP.map((p) => (
              <Figure key={p.src} photo={p} className="aspect-[4/3]" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-16 flex flex-col items-start gap-5 rounded-card bg-brand-dark p-8 text-white sm:flex-row sm:items-center sm:justify-between lg:mt-20">
        <p className="font-display text-xl font-semibold sm:text-2xl">Benieuwd wat we voor u kunnen maken?</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/producten/" className="inline-flex items-center gap-2 rounded-sm border border-white/45 px-5 py-3 text-sm font-bold hover:bg-white hover:text-brand-dark">
            Bekijk onze producten
          </Link>
          <Link href={QUOTE_HREF} className="inline-flex items-center gap-2 rounded-sm bg-accent-deep px-5 py-3 text-sm font-bold hover:bg-[#9a520d]">
            Offerte aanvragen <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <PhotoLightbox photos={ALL} />
    </div>
  );
}
