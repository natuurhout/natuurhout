import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { groupHref, productMenu } from "@/lib/navigation";
import { PHONE } from "@/lib/contact";

/*
 * SEO batch 2 (Nov 2026): a Dutch 404 instead of Next's English default, with
 * the product groups, the calculator and contact, so a visitor on a dead link
 * still finds the products. Next serves it with status 404 and noindex.
 */
export const metadata: Metadata = {
  title: "Pagina niet gevonden | Natuurhout",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[60rem] px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Deze pagina bestaat niet (meer)</h1>
      <p className="mt-3 max-w-2xl leading-7 text-ink/75">
        Misschien is de link verouderd of bevat het adres een tikfout. Gebruik de zoekfunctie bovenaan, of kies hieronder wat u zoekt.
      </p>
      <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {productMenu.map((group) => (
          <li key={group.slug}>
            <Link
              href={groupHref(group)}
              className="flex items-center justify-between gap-3 rounded-card border border-line bg-white px-5 py-4 font-semibold text-ink transition-colors hover:border-accent hover:text-accent-deep"
            >
              {group.title}
              <ArrowRight aria-hidden className="h-4 w-4 text-accent" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/calculator/" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-deep">
          Prijs berekenen
        </Link>
        <Link href="/contact/" className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-6 py-3 text-sm font-semibold hover:border-accent hover:text-accent-deep">
          Contact
        </Link>
        <a href={PHONE.href} className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-6 py-3 text-sm font-semibold hover:border-accent hover:text-accent-deep">
          <Phone aria-hidden className="h-4 w-4" /> {PHONE.label}
        </a>
      </div>
    </div>
  );
}
