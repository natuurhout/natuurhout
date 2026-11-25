import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { prose } from "@/components/LegalPage";
import { approvedSeo, getLegacyPageByPath } from "@/lib/legacy";
import { breadcrumbStructuredData } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

/*
 * "Kastanjes bewaren", rewritten by Natuurhout on 25 Nov 2026
 * (handbuilt-routes.json): edible sweet chestnut versus horse chestnut, the
 * unsupported medical claims and the "Bron: notenspecialist" line removed,
 * storage times checked, and a closing part on chestnut wood.
 */
const PATH = "/kastanjes-bewaren/";
const page = getLegacyPageByPath(PATH);
const seo = approvedSeo(PATH);
const HEADING = seo.approvedHeading ?? "Kastanjes bewaren: zo blijven ze lang lekker";
const DESCRIPTION = seo.approvedDescription ?? page?.description ?? "";
const PUBLISHED = "2013-12-03";
const UPDATED = "2026-11-25";
const PHOTO = { src: "/fotos/kastanje-hekwerk-weide.jpg", alt: "Kastanje hekwerk van jong kastanjehout, pas geplaatst langs een grasveld" };

export const metadata: Metadata = {
  title: { absolute: seo.approvedTitle ?? "Kastanjes bewaren: zo blijven ze lang lekker | Natuurhout" },
  description: DESCRIPTION,
  alternates: { canonical: `${siteUrl}${PATH}` },
  openGraph: { title: HEADING, description: DESCRIPTION, url: `${siteUrl}${PATH}`, locale: "nl_BE", type: "article", publishedTime: PUBLISHED, modifiedTime: UPDATED },
};

export default function KastanjesBewarenPage() {
  return (
    <article className="mx-auto w-full max-w-[52rem] px-4 py-10 sm:px-6 lg:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: HEADING,
          description: DESCRIPTION,
          datePublished: PUBLISHED,
          dateModified: UPDATED,
          inLanguage: "nl-BE",
          image: `${siteUrl}${PHOTO.src}`,
          author: { "@type": "Organization", name: "Natuurhout", url: `${siteUrl}/` },
          publisher: { "@type": "Organization", name: "Natuurhout", url: `${siteUrl}/` },
          mainEntityOfPage: `${siteUrl}${PATH}`,
        }}
      />
      <JsonLd
        data={breadcrumbStructuredData([
          { name: "Home", path: "/" },
          { name: "Tips & Ideeën", path: "/tipsenideeen/" },
          { name: "Kastanjes bewaren", path: PATH },
        ])}
      />
      <nav aria-label="Kruimelpad" className="text-sm text-ink/60">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-accent-deep">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/tipsenideeen/" className="hover:text-accent-deep">Tips &amp; Ideeën</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-medium text-ink">Kastanjes bewaren</li>
        </ol>
      </nav>

      <header className="mt-8">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
          <span aria-hidden className="h-px w-8 bg-accent" />
          Tips &amp; Ideeën
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">{HEADING}</h1>
        <p className="mt-4 text-sm text-ink/55">
          Bijgewerkt op <time dateTime={UPDATED}>25 november 2026</time> · Natuurhout
        </p>
      </header>

      <div className={`mt-6 ${prose}`}>
        <p className="!mt-0 text-lg leading-8">
          Bij Natuurhout draait alles om hout: palen, hekwerk en poorten in kastanje, hazelaar, eik en robinia. Een blog over kastanjes
          eten is voor ons dus een kleine zijsprong. Maar wie het hele jaar met kastanjehout werkt, kan in de herfst niet naast de vruchten
          van diezelfde boom kijken. De tamme kastanje geeft ons sterk en duurzaam hout, en elk najaar ook een heerlijke noot. Daarom delen
          we hier graag wat we weten over het bewaren en bereiden ervan, met onderaan nog iets meer over het hout.
        </p>

        <h2>Eerst dit: tamme kastanje of paardenkastanje?</h2>
        <p>Niet elke kastanje is eetbaar. Je kunt ze zo uit elkaar houden:</p>
        <ul>
          <li>
            <strong>Tamme kastanje (eetbaar):</strong> een bolster vol lange, fijne stekels, zoals een egeltje, met meestal twee of drie
            vruchten erin. De vrucht is wat platter en heeft bovenaan een puntje met een pluimpje.
          </li>
          <li>
            <strong>Paardenkastanje (niet eetbaar):</strong> een groene bolster met maar een paar korte, dikke stekels en meestal één grote,
            ronde, glanzende vrucht zonder puntje. Paardenkastanjes zijn licht giftig en kunnen buikpijn en braken geven.
          </li>
        </ul>
        <p>Twijfel je? Dan eet je ze beter niet.</p>

        <h2>Goede kastanjes kiezen</h2>
        <p>
          Verse kastanjes voelen stevig en zwaar aan en hebben een glanzende schil zonder gaatjes. Een handige test is ze in een kom water te
          leggen. Kastanjes die blijven drijven, zijn meestal uitgedroogd of aangevreten door larven, dus die gooi je weg.
        </p>

        <h2>Kastanjes bewaren</h2>
        <p>
          Kastanjes lijken stevig, maar ze zijn kwetsbaar. Ze bevatten veel vocht en zetmeel, dus ze kunnen snel schimmelen of uitdrogen.
          Zo bewaar je ze het best:
        </p>
        <ul>
          <li>
            <strong>Vers, in de schil, op kamertemperatuur:</strong> ongeveer een week, op een koele, droge en luchtige plek. Gebruik een
            papieren zak of een netje, geen afgesloten plastic.
          </li>
          <li>
            <strong>Vers, in de schil, in de koelkast:</strong> twee tot drie weken, in een papieren zak of een zakje met gaatjes. Ze moeten
            kunnen ademen, anders gaan ze schimmelen.
          </li>
          <li>
            <strong>Gepeld of gekookt:</strong> in een luchtdichte doos in de koelkast, waar ze drie à vier dagen goed blijven. Zo nemen ze
            ook geen geuren van ander voedsel op.
          </li>
          <li>
            <strong>In de diepvries:</strong> kook of rooster ze eerst kort en pel ze. Vries ze daarna in porties in. Ze blijven tot zes à
            negen maanden goed, maar het lekkerst zijn ze binnen zes maanden. Je kunt ze meestal rechtstreeks uit de diepvries koken of
            roosteren. Ontdooi je ze toch, doe dat dan in de koelkast met de verpakking open, zodat het vocht weg kan.
          </li>
          <li>
            <strong>Gedroogd:</strong> gedroogde kastanjes blijven maandenlang goed als je ze droog en afgesloten bewaart. Laat ze voor
            gebruik een nacht weken in water.
          </li>
        </ul>

        <h2>Kastanjes bereiden en eten</h2>
        <p>
          Snijd altijd eerst een kruisje of een snede in de bolle kant van de schil. Anders kan de kastanje door de stoom openbarsten.
        </p>
        <ul>
          <li>
            <strong>Roosteren:</strong> ongeveer 20 tot 30 minuten in de oven op 200 °C, of in een pan met gaatjes boven een vuur, zoals op
            de kerstmarkt. Pel ze terwijl ze nog warm zijn, want dan gaat de schil en het vliesje er het makkelijkst af.
          </li>
          <li>
            <strong>Koken:</strong> 15 tot 25 minuten in water, tot ze zacht zijn.
          </li>
        </ul>
        <p>
          In veel landen zijn geroosterde kastanjes typisch winters straatvoedsel. Bij ons komen ze vooral op tafel als groentebijgerecht,
          bijvoorbeeld met spruitjes of bij wild en gevogelte. Ze zijn ook lekker in een vulling of puree, en in desserts zoals mousse, taart
          of de klassieke Mont Blanc. In Frankrijk is <em>crème de marrons</em>, een zoete kastanjepasta, een vaste klassieker op
          pannenkoeken.
        </p>
        <p>
          Kastanjes zijn eigenlijk eerder een zetmeelrijke vrucht dan een typische noot. Ze bevatten ongeveer dubbel zoveel koolhydraten als
          aardappelen en veel minder vet dan andere noten. Gemalen tot meel geven ze een licht zoet, glutenvrij meel voor brood, pannenkoeken
          of het Italiaanse <em>castagnaccio</em>. In de bergstreken van Zuid-Europa was de kastanje eeuwenlang een basisvoedsel en werd hij
          zelfs &ldquo;de broodboom&rdquo; genoemd.
        </p>

        <h2>En de verhalen over kastanje tegen spataders?</h2>
        <p>
          Je leest weleens dat kastanje helpt tegen spataders of een slechte doorbloeding. Dat gaat over extracten van de{" "}
          <strong>paardenkastanje</strong>, een heel andere boom dan de tamme kastanje. Het is ook geen reden om paardenkastanjes te eten.
          Heb je klachten, vraag dan raad aan je arts of apotheker.
        </p>

        <h2>Van de boom naar de tuin: kastanjehout</h2>
        <p>
          Nu komen we bij ons vak. De tamme kastanje levert een van de mooiste houtsoorten voor buitengebruik. Kastanje is hardhout en familie
          van de eik. Het lijkt er ook sterk op, waardoor het vaak met eik wordt verward.
        </p>
        <p>
          Het hout zit van nature vol looizuren (tannine). Daardoor is het zonder chemische behandeling al duurzaam, en het valt in
          duurzaamheidsklasse 2. Kastanje wordt traditioneel als hakhout beheerd. De bomen worden om de 15 à 25 jaar afgezet en lopen daarna
          vanzelf weer uit. Zo is het een echt hernieuwbare grondstof. Die jonge stammen hebben maar een smalle rand spinthout en bestaan dus
          bijna volledig uit duurzaam kernhout. Oudere, dikke stammen zijn gevoeliger voor ringscheur, en daarom werken we vooral met jong
          kastanjehout.
        </p>
      </div>

      <figure className="mt-8">
        <div className="relative aspect-[16/9] overflow-hidden rounded-card bg-brand-soft/50">
          <Image src={PHOTO.src} alt={PHOTO.alt} fill sizes="(max-width: 840px) 100vw, 800px" className="object-cover" />
        </div>
        <figcaption className="mt-2 text-sm text-ink/60">Kastanje hekwerk van Natuurhout, gemaakt van jong kastanjehout.</figcaption>
      </figure>

      <div className={`mt-6 ${prose}`}>
        <p className="!mt-0">
          Boven de grond gaat kastanjehout bij ons 15 tot 25 jaar mee. Wist je trouwens dat kastanjehout ook gebruikt wordt voor de vaatjes
          van de echte <em>Aceto Balsamico Tradizionale</em> uit Modena? De azijn rijpt er jarenlang in een reeks vaatjes van verschillende
          houtsoorten, waaronder kastanje, eik en kers.
        </p>
        <p className="!mt-6 rounded-card border border-dashed border-accent/50 bg-white p-5 sm:p-6">
          <strong>Benieuwd naar kastanjehout in je eigen tuin?</strong> Bekijk ons{" "}
          <Link href="/project/rasterwerk-kastanjehout/">kastanjehekwerk</Link>, onze <Link href="/project/kastanjepalen/">palen</Link> en{" "}
          <Link href="/project/franse-poorten/">poorten</Link> in de webshop, of vraag vrijblijvend een{" "}
          <Link href="/offerte-aanvragen/">offerte</Link> aan. We helpen je graag verder.
        </p>
      </div>

      <nav aria-label="Meer tips" className="mt-12 border-t border-line pt-6">
        <Link href="/tipsenideeen/" className="inline-flex items-center gap-2 font-semibold text-accent-deep hover:text-ink">
          <ArrowLeft aria-hidden className="h-4 w-4" /> Alle tips &amp; ideeën
        </Link>
      </nav>
    </article>
  );
}
