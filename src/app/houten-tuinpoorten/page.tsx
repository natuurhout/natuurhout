import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import PreviewLink from "@/components/PreviewLink";
import Realisaties from "@/components/Realisaties";
import { categories } from "@/lib/categories";
import { getLegacyPageByPath } from "@/lib/legacy";
import { QUOTE_HREF } from "@/lib/navigation";
import { realisatiesFor } from "@/lib/realisaties";

/*
 * "Houten tuinpoorten": the WordPress landing page, rewritten with Xander
 * (Oct 2026) around the gates Natuurhout sells: kastanje (premium,
 * geschroefd, maatwerk), robinia, hazelaar and Cleft & Field. Every link
 * shows a small photo on hover. Canonical and structured data are the
 * snapshot's; title, description and h1 are approved replacements and the
 * snapshot's internal links all stay (handbuilt-routes.json).
 */
const page = getLegacyPageByPath("/houten-tuinpoorten/");

const TITLE = "Houten tuinpoorten in Vlaanderen | Natuurhout";
const DESCRIPTION =
  "Houten tuinpoorten in kastanje, robinia en hazelaar: premium, geschroefd of op maat, en Cleft & Field veldpoorten. Levering in heel Vlaanderen vanuit Zele.";
const HEADING = "Houten tuinpoorten in Vlaanderen";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: page?.canonical },
  openGraph: { title: TITLE, description: DESCRIPTION, url: page?.canonical, locale: "nl_BE", type: "website", images: [{ url: "/fotos/kastanje-premium-poort-hekwerk.jpg" }] },
};

const photo = (href: string) => categories.find((tile) => tile.href === href)?.src;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 leading-7 text-ink/75">{children}</div>
    </section>
  );
}

function Gate({ href, name, children }: { href: string; name: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <PreviewLink href={href} image={photo(href)}>{name}</PreviewLink>
      <p className="mt-1 text-[15px] leading-6 text-ink/70">{children}</p>
    </li>
  );
}

export default function HoutenTuinpoortenPage() {
  if (!page) throw new Error("The WordPress /houten-tuinpoorten/ snapshot is missing.");
  const projects = realisatiesFor({ pathname: "/project/maatwerk-poorten/" });

  return (
    <>
      {page.structuredData && <JsonLd data={page.structuredData} />}
      <article className="mx-auto w-full max-w-[64rem] overflow-x-clip px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
          <span aria-hidden className="h-px w-8 bg-accent" />
          Tuinpoorten
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{HEADING}</h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-4 text-lg leading-relaxed text-ink/75">
            <p>
              Een houten tuinpoort maakt uw tuin of erf af: ze sluit veilig af en geeft meteen een natuurlijke,
              landelijke uitstraling. Natuurhout in Zele maakt en levert houten tuinpoorten in <strong className="text-ink">kastanje</strong>,{" "}
              <strong className="text-ink">robinia</strong> en <strong className="text-ink">hazelaar</strong>, uit voorraad of op maat.
            </p>
            <p>We leveren in heel Vlaanderen en België, of u haalt uw poort af in Zele.</p>
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
                src="/fotos/kastanje-premium-poort-hekwerk.jpg"
                alt="Kastanje premium poort, half open, in een kastanje hekwerk"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 460px"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-2 text-sm text-ink/55">Een kastanje premium poort in kastanje hekwerk.</figcaption>
          </figure>
        </div>

        <Section title="Kastanje tuinpoorten">
          <p>
            Kastanjehout is van nature duurzaam: het gaat zonder behandeling jarenlang mee en vergrijst mooi. In kastanje
            hebben we drie soorten tuinpoorten:
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            <Gate href="/project/franse-poorten/" name="Kastanje premium poorten">
              Onze stevigste kastanje poort, met kader en schoor, inclusief twee poortpalen en hang- en sluitwerk.
            </Gate>
            <Gate href="/project/kastanje-poorten-geschroefd/" name="Kastanje poorten geschroefd">
              Een eenvoudigere, voordelige kastanje poort met geschroefde latten, ook met poortpalen en beslag.
            </Gate>
            <Gate href="/project/maatwerk-poorten/" name="Kastanje premium maatwerk poorten">
              Gemaakt op uw maten, tot 2,10 m breed en 1,80 m hoog per vleugel, als enkele of dubbele poort.
            </Gate>
          </ul>
        </Section>

        <Section title="Robinia en hazelaar tuinpoorten">
          <ul className="grid gap-3 sm:grid-cols-2">
            <Gate href="/shop/robinia-poort/" name="Robinia poort">
              Robinia is de duurzaamste Europese houtsoort. De poort komt met hang- en sluitwerk; de palen kiest u apart, bv.{" "}
              <PreviewLink href="/project/robinia-palen/" image={photo("/project/robinia-palen/")}>robinia palen</PreviewLink>.
            </Gate>
            <Gate href="/project/hazelaar-poorten/" name="Hazelaar poort">
              Een lichte, landelijke poort in hazelaar, geleverd met kastanje poortpalen en hang- en sluitwerk.
            </Gate>
          </ul>
        </Section>

        <Section title="Veldpoorten: Cleft & Field">
          <p>
            Voor weides, paddocks en bredere opritten kiest u een robuuste{" "}
            <PreviewLink href="/project/cleft-field-veldpoorten/" image={photo("/project/cleft-field-veldpoorten/")}>Cleft &amp; Field veldpoort</PreviewLink>{" "}
            in kastanje. Beslag en palen zijn apart verkrijgbaar; we raden vierkante{" "}
            <PreviewLink href="/project/eiken-palen/" image={photo("/project/eiken-palen/")}>eiken palen</PreviewLink> aan.
          </p>
        </Section>

        <Section title="Voordelen van houten tuinpoorten">
          <ul className="list-disc space-y-2 pl-5">
            <li><strong className="text-ink">Natuurlijke uitstraling</strong> die past bij landelijke tuinen en erven in Vlaanderen.</li>
            <li><strong className="text-ink">Duurzaam</strong>: kastanje en robinia gaan zonder behandeling jarenlang mee.</li>
            <li><strong className="text-ink">Op maat</strong>: enkel of dubbel, in de hoogte en breedte die u nodig heeft.</li>
            <li>
              <strong className="text-ink">Eén geheel met uw afsluiting</strong>: combineer de poort met{" "}
              <PreviewLink href="/project/rasterwerk-kastanjehout/" image={photo("/project/rasterwerk-kastanjehout/")}>kastanje hekwerk</PreviewLink>,{" "}
              <PreviewLink href="/project/robinia-rasterwerk/" image={photo("/project/robinia-rasterwerk/")}>robinia hekwerk</PreviewLink>,{" "}
              <PreviewLink href="/project/hazelaarrasterwerk/" image={photo("/project/hazelaarrasterwerk/")}>hazelaar hekwerk</PreviewLink> of{" "}
              <PreviewLink href="/project/hazelaarvlechtschermen/" image={photo("/project/hazelaarvlechtschermen/")}>vlechtschermen</PreviewLink>{" "}
              voor een mooie <Link href="/landelijke-afsluiting/" className="font-semibold text-accent-deep underline decoration-accent/40 underline-offset-2 hover:text-ink">landelijke afsluiting</Link>.
            </li>
          </ul>
        </Section>

        <Section title="Plaatsing en levering in Vlaanderen">
          <p>
            Vanuit Zele (Oost-Vlaanderen) leveren we in heel Vlaanderen en België; afhalen kan ook. Liever niet zelf
            plaatsen? Wij plaatsen uw tuinpoort en afsluiting. Zelf aan de slag? Lees onze{" "}
            <Link href="/tipsenideeen/kastanje-hekwerk-en-poort-plaatsen/" className="font-semibold text-accent-deep underline decoration-accent/40 underline-offset-2 hover:text-ink">handleiding hekwerk en poort plaatsen</Link>.
          </p>
          <p>
            Een poort draait standaard naar binnen open. Zet stevige{" "}
            <PreviewLink href="/project/kastanjepalen/" image={photo("/project/kastanjepalen/")}>kastanje palen</PreviewLink> en geef de poortpalen een{" "}
            <PreviewLink href="/project/postsaver-voor-palen/" image={photo("/project/postsaver-voor-palen/")}>postsaver</PreviewLink> voor een langere levensduur.
          </p>
        </Section>

        <section className="mt-12 rounded-card bg-brand-soft p-6 sm:p-8">
          <h3 className="font-display text-2xl font-bold text-ink">Vraag een offerte aan voor uw houten tuinpoort</h3>
          <p className="mt-3 leading-7 text-ink/75">
            Wilt u een houten tuinpoort kopen die perfect bij uw tuin en omheining past?{" "}
            <Link href={QUOTE_HREF} className="font-semibold text-accent-deep underline underline-offset-2">Vraag vandaag nog een offerte aan</Link>,
            bereken uw poort en afsluiting met de <Link href="/calculator/?keuze=poorten" className="font-semibold text-accent-deep underline underline-offset-2">calculator</Link> of
            bestel rechtstreeks in onze <Link href="/shop/" className="font-semibold text-accent-deep underline underline-offset-2">webshop</Link>. Natuurhout is uw{" "}
            <Link href="/" className="font-semibold text-accent-deep underline underline-offset-2">specialist in natuurhout</Link> in Vlaanderen.
          </p>
        </section>

        <Realisaties items={projects} title="Tuinpoorten bij onze klanten" intro="Poorten geplaatst door Natuurhout." />
      </article>
    </>
  );
}
