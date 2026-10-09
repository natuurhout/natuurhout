import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { QUOTE_HREF } from "@/lib/navigation";
import type { ProjectProduct } from "@/lib/realisaties";

type Photo = { src: string; alt: string };
type NavLink = { href: string; rel: "prev" | "next"; title: string };

/*
 * One layout for every customer project (realisatie), old and new: the lead
 * photo beside the title and description, links to the products used, then
 * the other photos. Each photo opens full size.
 */
export default function ProjectLayout({
  title,
  label = "Omschrijving",
  description,
  products,
  photos,
  nav = [],
  rootProps,
}: {
  title: string;
  /** Heading above the description. */
  label?: string;
  description: React.ReactNode;
  products: ProjectProduct[];
  photos: Photo[];
  nav?: NavLink[];
  /** Attributes for the outer element (the migration audit's content root). */
  rootProps?: Record<string, string>;
}) {
  const [hero, ...rest] = photos;

  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14" {...rootProps}>
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
          <li aria-current="page" className="font-medium text-ink">{title}</li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        {hero && (
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
        )}
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
            <span aria-hidden className="h-px w-8 bg-accent" />
            Realisatie
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">{label}</h2>
          <div className="mt-2 space-y-4 leading-7 text-ink/75 [&_a]:font-medium [&_a]:text-accent-deep [&_a:hover]:text-ink">
            {description}
          </div>

          {products.length > 0 && (
            <div className="mt-7">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/55">Gebruikt in dit project</h2>
              <ul className="mt-3 space-y-2">
                {products.map((product) => (
                  <li key={product.href}>
                    <Link
                      href={product.href}
                      className="group flex items-center gap-3 rounded-xl border border-line bg-white p-2 pr-4 transition-colors hover:border-accent"
                    >
                      <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-soft/60">
                        {product.image && <Image src={product.image} alt="" fill sizes="64px" className="object-cover" />}
                      </span>
                      <span className="flex-1 font-semibold text-ink group-hover:text-accent-deep">{product.label}</span>
                      <span className="text-sm font-medium text-accent-deep">Bekijk prijzen</span>
                      <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-accent" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            href={QUOTE_HREF}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9a520d]"
          >
            Zoiets voor u? Vraag een offerte aan <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {rest.length > 0 && (
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
      )}

      <nav aria-label="Andere realisaties" className="mt-12 flex flex-wrap justify-between gap-4 border-t border-line pt-6 text-sm">
        {nav.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            rel={link.rel}
            className={`group inline-flex max-w-full items-center gap-2 font-medium text-ink/70 hover:text-accent ${
              link.rel === "next" ? "ml-auto text-right" : ""
            }`}
          >
            {link.rel === "prev" && <ArrowLeft aria-hidden className="h-4 w-4 shrink-0" />}
            <span>
              <span className="block text-xs font-normal text-ink/50">{link.rel === "prev" ? "Vorige realisatie" : "Volgende realisatie"}</span>
              {link.title}
            </span>
            {link.rel === "next" && <ArrowRight aria-hidden className="h-4 w-4 shrink-0" />}
          </Link>
        ))}
        {nav.length === 0 && (
          <Link href="/onze-realisaties/" className="inline-flex items-center gap-2 font-semibold text-accent-deep hover:text-ink">
            <ArrowLeft aria-hidden className="h-4 w-4" /> Alle realisaties
          </Link>
        )}
      </nav>
    </div>
  );
}
