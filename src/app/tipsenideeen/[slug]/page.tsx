import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { ARTIKELS, artikelHref, getArtikel, longDate } from "@/lib/artikels";
import { siteUrl } from "@/lib/site";

/*
 * A Tips & Ideeën article written since the WordPress site
 * (src/lib/artikels.ts). New URLs below /tipsenideeen/, not in the inventory.
 */

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ARTIKELS.map((artikel) => ({ slug: artikel.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artikel = getArtikel((await params).slug);
  if (!artikel) return {};
  const canonical = `${siteUrl}${artikelHref(artikel)}`;
  return {
    title: `${artikel.title} | Natuurhout`,
    description: artikel.summary,
    alternates: { canonical },
    openGraph: {
      title: artikel.title,
      description: artikel.summary,
      url: canonical,
      locale: "nl_BE",
      type: "article",
      publishedTime: artikel.date,
      images: [{ url: artikel.image.src }],
    },
  };
}

export default async function ArtikelPage({ params }: Props) {
  const artikel = getArtikel((await params).slug);
  if (!artikel) notFound();
  const others = ARTIKELS.filter((a) => a.slug !== artikel.slug).slice(0, 3);

  return (
    <article className="mx-auto w-full max-w-[60rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: artikel.title,
          description: artikel.summary,
          datePublished: artikel.date,
          image: `${siteUrl}${artikel.image.src}`,
          author: { "@type": "Organization", name: "Natuurhout" },
          publisher: { "@type": "Organization", name: "Natuurhout" },
          mainEntityOfPage: `${siteUrl}${artikelHref(artikel)}`,
        }}
      />
      <nav aria-label="Kruimelpad" className="text-sm text-ink/60">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-accent-deep">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/tipsenideeen/" className="hover:text-accent-deep">Tips &amp; Ideeën</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-medium text-ink">{artikel.title}</li>
        </ol>
      </nav>

      <header className="mt-8">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
          <span aria-hidden className="h-px w-8 bg-accent" />
          Tips &amp; Ideeën
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">{artikel.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/70">{artikel.summary}</p>
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/55">
          <time dateTime={artikel.date}>{longDate(artikel.date)}</time>
          <span>Natuurhout</span>
          <span className="inline-flex items-center gap-1.5"><Clock aria-hidden className="h-4 w-4" /> {artikel.minutes} min lezen</span>
        </p>
      </header>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-card bg-brand-soft/50">
        <Image src={artikel.image.src} alt={artikel.image.alt} fill priority sizes="(max-width: 960px) 100vw, 900px" className="object-cover" />
      </div>

      <div className="artikel mt-10" dangerouslySetInnerHTML={{ __html: artikel.html }} />

      <nav aria-label="Meer tips" className="mt-12 border-t border-line pt-6">
        {others.length > 0 && (
          <ul className="mb-6 space-y-2">
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={artikelHref(other)} className="font-semibold text-accent-deep hover:text-ink">{other.title}</Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/tipsenideeen/" className="inline-flex items-center gap-2 font-semibold text-accent-deep hover:text-ink">
          <ArrowLeft aria-hidden className="h-4 w-4" /> Alle tips &amp; ideeën
        </Link>
      </nav>
    </article>
  );
}
