import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calculator } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { getProduct, type Product } from "@/lib/catalog";
import { categories } from "@/lib/categories";
import { groupHref, productMenu, QUOTE_HREF } from "@/lib/navigation";

/*
 * Overview page per product group of the main menu (Afsluitingen, Poorten,
 * Palen …): the group's product pages as photo tiles, then every webshop
 * product of the group with its price. New pages, not in the WordPress
 * inventory; the group titles in the menu link here.
 */

type Props = { params: Promise<{ groep: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return productMenu.map((group) => ({ groep: group.slug }));
}

const groupFor = (slug: string) => productMenu.find((group) => group.slug === slug);
const tilePhoto = new Map(categories.map((tile) => [tile.href, tile.src]));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const group = groupFor((await params).groep);
  if (!group) return {};
  const canonical = `https://www.natuurhout.be${groupHref(group)}`;
  return {
    title: `${group.title} | Natuurhout`,
    description: group.intro,
    alternates: { canonical },
    openGraph: { title: `${group.title} | Natuurhout`, description: group.intro, url: canonical, locale: "nl_BE", type: "website" },
  };
}

export default async function ProductGroupPage({ params }: Props) {
  const group = groupFor((await params).groep);
  if (!group) notFound();
  const items = group.products.map((handle) => getProduct(handle)).filter((product): product is Product => Boolean(product));

  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <nav aria-label="Kruimelpad" className="text-sm text-ink/60">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent-deep">Home</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/producten/" className="hover:text-accent-deep">Producten</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-medium text-ink">{group.title}</li>
        </ol>
      </nav>

      <p className="mt-8 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
        <span aria-hidden className="h-px w-8 bg-accent" />
        Producten &amp; Prijzen
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{group.title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/70">{group.intro}</p>

      <section aria-labelledby="groep-producten" className="mt-10">
        <h2 id="groep-producten" className="sr-only">Productpagina&apos;s</h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {group.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-ink/10"
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-brand-soft/50">
                  {tilePhoto.get(link.href) && (
                    <Image
                      src={tilePhoto.get(link.href)!}
                      alt={link.label}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  )}
                </span>
                <span className="flex flex-1 items-center justify-between gap-2 p-4 font-semibold leading-snug text-ink group-hover:text-accent-deep">
                  {link.label}
                  <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ink/30 transition-colors group-hover:text-accent" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {items.length > 0 && (
        <section aria-labelledby="groep-prijzen" className="mt-16">
          <h2 id="groep-prijzen" className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Prijzen en maten
          </h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-ink/70">
            Alle {group.title.toLocaleLowerCase("nl")} uit onze webshop, met de actuele prijzen incl. btw.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.handle} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-16 flex flex-col gap-5 rounded-card bg-brand-soft p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Twijfelt u wat u nodig hebt?</h2>
          <p className="mt-1.5 text-ink/70">Bereken een richtprijs met de calculator, of vraag een offerte op maat aan.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/calculator/"
            className="inline-flex items-center gap-2 rounded-full bg-accent-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9a520d]"
          >
            <Calculator aria-hidden className="h-4 w-4" />
            Naar de calculator
          </Link>
          <Link
            href={QUOTE_HREF}
            className="inline-flex items-center gap-2 rounded-full border border-brand-dark px-6 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
          >
            Offerte aanvragen
          </Link>
        </div>
      </section>
    </div>
  );
}
