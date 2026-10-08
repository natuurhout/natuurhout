import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { getLegacyPageByPath, type LegacyBlock } from "@/lib/legacy";
import { QUOTE_HREF } from "@/lib/navigation";

/*
 * "Over ons", rebuilt (handbuilt-routes.json, preserveContent): the text now
 * opens the page and the photos sit between the sections, instead of a wall
 * of 150px thumbnails above the text. Every heading, paragraph, photo and
 * photo link of the frozen snapshot is still on the page, verbatim.
 */
const page = getLegacyPageByPath("/over-ons/");

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description || undefined,
  alternates: { canonical: page?.canonical },
};

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

/*
 * The team (portraits supplied by Natuurhout, public/fotos/team/). Add a name
 * and role per person to show them under the photo.
 */
const TEAM: { src: string; name?: string; role?: string }[] = [
  { src: "/fotos/team/team-1.jpg" },
  { src: "/fotos/team/team-2.jpg" },
  { src: "/fotos/team/team-3.jpg" },
  { src: "/fotos/team/team-4.jpg" },
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
    <a href={p.src} target="_blank" rel="noopener" className={`group relative block overflow-hidden rounded-card bg-brand-soft ${className}`}>
      <Image src={p.src} alt={p.alt} fill sizes={sizes} className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
    </a>
  );
}

function Section({ title, blocks, photo: p, flip = false }: { title: string; blocks: LegacyBlock[]; photo: Photo; flip?: boolean }) {
  return (
    <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={flip ? "lg:order-2" : undefined}>
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
        <div className="mt-4">
          <Paragraphs blocks={blocks} />
        </div>
      </div>
      <Figure photo={p} className="aspect-[4/3]" sizes="(max-width: 1024px) 100vw, 50vw" />
    </section>
  );
}

export default function AboutPage() {
  if (!page) throw new Error("The WordPress /over-ons/ snapshot is missing.");
  const blocks = page.blocks;
  const eyebrow = blocks.find((b) => b.type === "heading" && b.level === 3);
  const intro = eyebrow && eyebrow.type === "heading" ? after(blocks, eyebrow.text) : [];
  const strong = "Kastanjehout is sterk, veelzijdig en mooi";
  const uses = "Toepassingen kastanjehout";
  const range = "Assortiment kastanjehout";

  return (
    <div className="mx-auto w-full max-w-[72rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14" data-legacy-product={page.pathname}>
      {page.structuredData && <JsonLd data={page.structuredData} />}

      {/* Text first */}
      <header className="max-w-3xl">
        {eyebrow && eyebrow.type === "heading" && (
          <h2 className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
            <span aria-hidden className="h-px w-8 bg-accent" />
            {eyebrow.text}
          </h2>
        )}
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">{page.heading}</h1>
        <div className="mt-6">
          <Paragraphs blocks={intro} />
        </div>
      </header>

      {/* Stock and yard */}
      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {STOCK.map((p, i) => (
          <Figure key={p.src} photo={p} className={`aspect-[4/3] ${i === 0 ? "col-span-2 md:col-span-1" : ""}`} sizes="(max-width: 768px) 50vw, 33vw" />
        ))}
      </div>

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
        <Section title={strong} blocks={after(blocks, strong)} photo={MAKER} />

        <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-8 lg:order-2">
            {[uses, range].map((title) => (
              <div key={title}>
                <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
                <div className="mt-4">
                  <Paragraphs blocks={after(blocks, title)} />
                </div>
              </div>
            ))}
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
    </div>
  );
}
