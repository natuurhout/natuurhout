import Link from "next/link";
import { ArrowLeft, ArrowRight, Calculator, Phone } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { ProductHero } from "@/components/ProductDetail";
import { BoughtTogether, PriceTableHtml, ProductInfo, productInfoTabs, ShopPriceMatrix } from "@/components/ProductInfo";
import { getProduct, type Product } from "@/lib/catalog";
import { MOBILE, PHONE } from "@/lib/contact";
import type { LegacyPage } from "@/lib/legacy";
import { SHOP_PRICES_MARKER, type LegacyProduct } from "@/lib/legacy-product";
import { boughtTogether, productFacts } from "@/lib/product-info";

/*
 * A WordPress product page (/project/…) in the shop's product layout. The
 * route keeps its frozen title, description, canonical, structured data, h1
 * and all of its copy, photos and links (checked by audit-built-parity.mjs);
 * the price list comes from the webshop, so it can be ordered right here, and
 * the price overview shows the shop's prices where the old tables stood.
 */

function PriceOverview({ info }: { info: LegacyProduct }) {
  if (!info.pricesFromShop) return <PriceTableHtml html={info.sections.prijzen} />;
  const [before, ...after] = info.sections.prijzen.split(SHOP_PRICES_MARKER);
  const rest = after.join("");
  return (
    <div className="space-y-6">
      {before.trim() && <PriceTableHtml html={before} />}
      {info.overview.map((product) => (
        <ShopPriceMatrix key={product.handle} product={product} />
      ))}
      {rest.trim() && <PriceTableHtml html={rest} />}
    </div>
  );
}

// Pages without a webshop product borrow the closest one for "Vaak samen gekocht".
const NEIGHBOUR: Record<string, string> = {
  "/project/maatwerk-poorten/": "kastanje-poorten",
  "/project/boerenlandhekken/": "cleft-field-poorten",
};

export default function LegacyProductPage({ page, info }: { page: LegacyPage; info: LegacyProduct }) {
  const primary = info.products[0];
  const onPage = new Set(info.products.map((p) => p.handle));
  const neighbour = primary ? undefined : getProduct(NEIGHBOUR[page.pathname] ?? "");
  const together = (
    primary ? boughtTogether(primary, 6) : neighbour ? [neighbour, ...boughtTogether(neighbour, 5)] : []
  )
    .filter((p: Product) => !onPage.has(p.handle))
    .slice(0, 4);
  const listed = info.products.length > 0;
  const fencing = !/moestuinbak|vlechtscherm|lariks/.test(page.pathname);

  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-8 sm:px-6 lg:px-10" data-legacy-product={page.pathname}>
      {page.structuredData && <JsonLd data={page.structuredData} />}
      <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-accent">Home</Link></li>
          <li aria-hidden>›</li>
          <li><Link href="/producten/" className="hover:text-accent">Producten &amp; Prijzen</Link></li>
          <li aria-hidden>›</li>
          <li className="font-medium text-ink">{info.heading}</li>
        </ol>
      </nav>

      <div className="mt-6">
        <ProductHero heading={info.heading} lead={info.lead} images={info.photos} products={info.products}>
          {listed && info.sections.prijzen && (
            <a href="#tab-prijstabel" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-deep">
              Bekijk alle prijzen in één overzicht <ArrowRight className="h-4 w-4" />
            </a>
          )}
          {!listed && (
            <div className="rounded-card border border-line bg-white">
              <div className="flex items-center justify-between gap-3 rounded-t-card bg-brand-dark px-4 py-3 text-white sm:px-5">
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Prijslijst</h2>
                <span className="text-xs text-white/70">Op bestelling</span>
              </div>
              <div className="px-4 pb-5 sm:px-5">
                <PriceTableHtml html={info.sections.prijzen} />
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/offerte-aanvragen/#andere-vraag"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
                  >
                    Offerte aanvragen <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={PHONE.href}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-brand/25 bg-white px-6 py-3.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
                  >
                    <Phone className="h-4 w-4" /> {PHONE.label}
                  </a>
                </div>
                <p className="mt-2.5 text-center text-sm text-ink/65 sm:text-left">
                  Of bel de gsm:{" "}
                  <a href={MOBILE.href} className="font-semibold text-accent-deep hover:text-ink">{MOBILE.label}</a>
                </p>
                {fencing && (
                  <Link href="/calculator/" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-deep">
                    <Calculator className="h-4 w-4" /> Bereken een richtprijs met de afsluitingscalculator
                  </Link>
                )}
              </div>
            </div>
          )}
        </ProductHero>
      </div>

      <ProductInfo
        tabs={productInfoTabs({
          omschrijving: info.sections.omschrijving,
          prijzen: listed && info.sections.prijzen ? <PriceOverview info={info} /> : undefined,
          facts: info.pricesFromShop ? productFacts(primary) : [],
          kenmerken: info.sections.kenmerken,
          pluspunten: info.sections.pluspunten,
          tips: info.sections.tips,
          photos: info.photos,
          fencing,
        })}
      />
      <BoughtTogether products={together} />

      {info.nav.length > 0 && (
        <nav aria-label="Andere producten" className="mt-12 flex flex-wrap justify-between gap-4 border-t border-line pt-6 text-sm">
          {info.nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              rel={link.rel}
              className={`group inline-flex max-w-full items-center gap-2 font-medium text-ink/70 hover:text-accent ${
                link.rel === "next" ? "ml-auto text-right" : ""
              }`}
            >
              {link.rel === "prev" && <ArrowLeft className="h-4 w-4 shrink-0" />}
              <span>
                <span className="block text-xs font-normal text-ink/50">{link.rel === "prev" ? "Vorig product" : "Volgend product"}</span>
                {link.title}
              </span>
              {link.rel === "next" && <ArrowRight className="h-4 w-4 shrink-0" />}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
