import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getNewProject, NEW_PROJECTS } from "@/lib/realisaties";
import { QUOTE_HREF } from "@/lib/navigation";

/*
 * A customer project added after the WordPress site (src/lib/realisaties.ts):
 * text and Natuurhout's own photos. New URLs, not in the WordPress inventory.
 */

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return NEW_PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getNewProject((await params).slug);
  if (!project) return {};
  const canonical = `https://www.natuurhout.be/realisaties/${project.slug}/`;
  return {
    title: `${project.title} | Natuurhout`,
    description: project.summary,
    alternates: { canonical },
    openGraph: {
      title: `${project.title} | Natuurhout`,
      description: project.summary,
      url: canonical,
      locale: "nl_BE",
      type: "article",
      images: [{ url: project.photos[0].src, width: project.photos[0].width, height: project.photos[0].height }],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const project = getNewProject((await params).slug);
  if (!project) notFound();
  const [hero, ...rest] = project.photos;

  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <nav aria-label="Kruimelpad" className="text-sm text-ink/60">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent-deep">Home</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/onze-realisaties/" className="hover:text-accent-deep">Realisaties</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-medium text-ink">{project.title}</li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <a href={hero.src} className="group relative block aspect-[4/3] overflow-hidden rounded-card bg-brand-soft/50">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </a>
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
            <span aria-hidden className="h-px w-8 bg-accent" />
            Realisatie
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h1>
          <div className="mt-4 space-y-4 leading-7 text-ink/75">
            {project.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={project.product.href}
              className="inline-flex items-center gap-2 rounded-full bg-accent-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9a520d]"
            >
              {project.product.label} <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <Link
              href={QUOTE_HREF}
              className="inline-flex items-center gap-2 rounded-full border border-brand-dark px-6 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
            >
              Offerte aanvragen
            </Link>
          </div>
        </div>
      </div>

      <section aria-labelledby="project-fotos" className="mt-12">
        <h2 id="project-fotos" className="font-display text-2xl font-semibold">Foto&apos;s van het project</h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {rest.map((photo) => (
            <li key={photo.src}>
              <a href={photo.src} className="group relative block aspect-[4/3] overflow-hidden rounded-card bg-brand-soft/50">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10">
        <Link href="/onze-realisaties/" className="text-sm font-semibold text-accent-deep hover:text-ink">
          ← Alle realisaties
        </Link>
      </p>
    </div>
  );
}
