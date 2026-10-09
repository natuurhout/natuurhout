import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Phone, Smartphone } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import ProductCard from "@/components/ProductCard";
import { WhatsAppIcon } from "@/components/WhatsApp";
import { promotions, saleProducts } from "@/lib/catalog";
import { MOBILE, PHONE, WHATSAPP } from "@/lib/contact";
import { getLegacyPageByPath } from "@/lib/legacy";
import { QUOTE_HREF } from "@/lib/navigation";

/*
 * Promotions page. The WordPress page was only its heading, so it is rebuilt
 * around the current promotions (src/lib/promotions.ts), approved by Xander
 * and recorded in migration/handbuilt-routes.json. Title, description,
 * canonical and structured data stay the snapshot's own; the h1 is new.
 */
const page = getLegacyPageByPath("/aanbiedingen-2/");

// Approved new h1 (Xander), recorded as approvedHeading in handbuilt-routes.json.
// The page title and description in Google stay the snapshot's own.
const HEADING = "Promo's van het moment";

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description || undefined,
  alternates: { canonical: page?.canonical },
};

export default function OffersPage() {
  if (!page) throw new Error("The WordPress offers-page snapshot is missing.");
  const items = promotions();
  const sale = saleProducts();

  return (
    <>
      {page.structuredData && <JsonLd data={page.structuredData} />}
      <div className="mx-auto w-full max-w-[80rem] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent-deep">
          <span aria-hidden className="h-px w-8 bg-accent" />
          Aanbiedingen
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">{HEADING}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/70">
          Onze lopende promo&apos;s op kastanjehout en tuinproducten. De prijzen zijn incl. btw; bestellen kan
          meteen online, of vraag een offerte aan voor een grotere hoeveelheid.
        </p>

        {items.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={`${product.handle}-${product.title}`} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-card border border-line bg-white p-6 text-ink/75">
            Op dit moment lopen er geen promo&apos;s. Bekijk ons{" "}
            <Link href="/producten/" className="font-semibold text-accent-deep hover:text-ink">volledige assortiment</Link>{" "}
            of vraag ons naar de mogelijkheden.
          </div>
        )}

        {sale.length > 0 && (
          <section id="sale" aria-labelledby="sale-titel" className="mt-16 scroll-mt-24 border-t border-line pt-10">
            <h2 id="sale-titel" className="font-display text-3xl font-bold tracking-tight">Sale</h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-ink/70">
              Oudere rollen en producten met een klein foutje, die we aan een voordelige prijs verkopen. Twijfelt u
              of het iets voor u is? Vraag ons gerust hoe ze eruitzien.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {sale.map((product) => (
                <ProductCard key={product.handle} product={product} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 flex flex-col gap-5 rounded-card bg-brand-soft p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Vragen over een promo?</h2>
            <p className="mt-1.5 text-ink/70">Bel, sms of WhatsApp ons, we helpen u graag verder.</p>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[15px] font-semibold">
              <a href={PHONE.href} className="inline-flex items-center gap-2 text-accent-deep hover:text-ink">
                <Phone aria-hidden className="h-4 w-4" /> {PHONE.label}
              </a>
              <a href={MOBILE.href} className="inline-flex items-center gap-2 text-accent-deep hover:text-ink">
                <Smartphone aria-hidden className="h-4 w-4" /> {MOBILE.label}
              </a>
              <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#128c43] hover:text-ink">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
            </p>
          </div>
          <Link
            href={QUOTE_HREF}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-deep px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#9a520d]"
          >
            Offerte aanvragen <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </>
  );
}
