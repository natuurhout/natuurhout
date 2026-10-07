import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import ProductTabs, { type ProductTab } from "@/components/ProductTabs";
import JsonLd from "@/components/JsonLd";
import { getProduct, products, type Product } from "@/lib/catalog";
import { boughtTogether, productFacts, productSections } from "@/lib/product-info";
import {
  productDescription,
  productMetadataTitle,
  productStructuredData,
} from "@/lib/seo";

export function generateStaticParams() {
  return products.map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) return {};
  const title = productMetadataTitle(product);
  return {
    title,
    description: productDescription(product),
    alternates: { canonical: `https://www.natuurhout.be/shop/${product.handle}/` },
    openGraph: {
      title,
      description: productDescription(product),
      url: `https://www.natuurhout.be/shop/${product.handle}/`,
      images: product.images[0] ? [product.images[0].src] : [],
    },
  };
}

// Shop copy keeps its own markup (lists, bold, tables); this styles it.
const prose =
  "max-w-3xl space-y-3 leading-7 text-ink/80 [&_a]:text-accent [&_a]:underline [&_h3:first-child]:mt-0 [&_h3]:mt-7 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ol>li]:list-decimal [&_li>p]:inline [&_strong]:text-ink [&_table]:w-full [&_table]:text-sm [&_td]:border-b [&_td]:border-line [&_td]:py-2 [&_td]:pr-4 [&_th]:border-b [&_th]:border-line [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left";

function Html({ html }: { html: string }) {
  return <div className={prose} dangerouslySetInnerHTML={{ __html: html }} />;
}

const fenceKinds = /hekwerk|rasterwerk|poort|palen|paal|postsaver|gaas|post-rail/;

function productTabs(product: Product): ProductTab[] {
  const sections = productSections(product);
  const facts = productFacts(product);
  const fencing = fenceKinds.test(product.handle);

  return [
    {
      id: "omschrijving",
      label: "Omschrijving",
      content: sections.omschrijving ? <Html html={sections.omschrijving} /> : <p className="text-ink/60">Meer informatie volgt.</p>,
    },
    {
      id: "kenmerken",
      label: "Kenmerken",
      content: (
        <div className="space-y-8">
          <dl className="max-w-3xl divide-y divide-line overflow-hidden rounded-card border border-line bg-white text-sm">
            {facts.map(({ label, value }) => (
              <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4 sm:px-5">
                <dt className="font-semibold text-ink">{label}</dt>
                <dd className="text-ink/75">{value}</dd>
              </div>
            ))}
          </dl>
          {sections.kenmerken && <Html html={sections.kenmerken} />}
        </div>
      ),
    },
    {
      id: "pluspunten",
      label: "Pluspunten",
      content: sections.pluspunten ? (
        <Html html={sections.pluspunten} />
      ) : (
        <Html
          html={`<h3>Waarom bij Natuurhout?</h3><ul>
<li><strong>Ruim 15 jaar ervaring</strong> met natuurlijke tuinafsluitingen in kastanje, robinia en hazelaar.</li>
<li><strong>Persoonlijk advies</strong> — bel of mail ons, we denken graag mee over uw project.</li>
<li><strong>Afhalen in Zele</strong> of <strong>levering</strong>: de kosten hangen af van de locatie, grotere bestellingen leveren we aan een gereduceerd tarief.</li>
</ul>`}
        />
      ),
    },
    {
      id: "tips",
      label: "Tips",
      content: (
        <div className="space-y-6">
          {sections.tips && <Html html={sections.tips} />}
          <ul className="grid max-w-3xl gap-3 sm:grid-cols-2">
            {fencing && (
              <li className="rounded-card border border-line bg-white p-4 text-sm leading-6 text-ink/75">
                <strong className="block text-ink">Volledige afsluiting plannen?</strong>
                Bereken hekwerk, palen, poort en toebehoren in één keer met de{" "}
                <Link href="/calculator/" className="font-medium text-accent hover:text-accent-deep">afsluitingscalculator</Link>.
              </li>
            )}
            <li className="rounded-card border border-line bg-white p-4 text-sm leading-6 text-ink/75">
              <strong className="block text-ink">Twijfelt u over maat of uitvoering?</strong>
              Bel ons op <a href="tel:+3252558858" className="font-medium text-accent hover:text-accent-deep">+32 5 255 88 58</a> of
              mail naar <a href="mailto:info@natuurhout.be" className="font-medium text-accent hover:text-accent-deep">info@natuurhout.be</a>.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "levering",
      label: "Levering & afhalen",
      content: (
        <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
          <div className="rounded-card border border-line bg-white p-5 text-sm leading-6 text-ink/75">
            <strong className="block font-display text-base text-ink">Afhalen in Zele</strong>
            Adolf Van Der Moerenstraat 39, 9240 Zele. Bel of mail even vooraf, dan staat uw bestelling klaar.
          </div>
          <div className="rounded-card border border-line bg-white p-5 text-sm leading-6 text-ink/75">
            <strong className="block font-display text-base text-ink">Levering</strong>
            Levering is mogelijk. De kosten hangen af van de locatie; grotere bestellingen leveren we aan een gereduceerd tarief.
          </div>
        </div>
      ),
    },
  ];
}

export default async function ShopProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = getProduct(handle);
  if (!product) notFound();
  const together = boughtTogether(product, 4);

  // Shop pages are additive (they are not in the frozen WordPress inventory),
  // so this route uses a capped reading width instead of the full-bleed
  // container the migrated pages need. Order follows the storefront funnel:
  // photo + price list, then product information in tabs, then cross-sell.
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-8 sm:px-6 lg:px-10">
      <JsonLd data={productStructuredData(product)} />
      <nav className="text-sm text-ink/60" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-accent">Home</Link></li>
          <li aria-hidden>›</li>
          <li><Link href="/shop/" className="hover:text-accent">Shop</Link></li>
          <li aria-hidden>›</li>
          <li className="font-medium text-ink">{product.title}</li>
        </ol>
      </nav>

      <div className="mt-6"><ProductDetail product={product} /></div>

      <section id="productinfo" className="mt-14 grid scroll-mt-6 grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <h2 className="sr-only">Productinformatie</h2>
        <ProductTabs tabs={productTabs(product)} />
        <aside className="space-y-4 lg:pt-14">
          <div className="rounded-card border border-line bg-white p-6">
            <p className="font-display text-lg font-semibold">Vragen over dit product?</p>
            <p className="mt-2 text-sm text-ink/70">
              Bel of mail ons voor advies op maat, een prijs voor een grotere hoeveelheid of een afspraak in Zele.
            </p>
            <div className="mt-4 space-y-1.5 text-sm">
              <a href="tel:+3252558858" className="block font-medium text-accent hover:text-accent-deep">+32 5 255 88 58</a>
              <a href="mailto:info@natuurhout.be" className="block text-ink/70 hover:text-accent">info@natuurhout.be</a>
            </div>
            <Link href="/offerte-aanvragen/" className="mt-4 inline-flex text-sm font-medium text-accent hover:text-accent-deep">
              Offerte aanvragen →
            </Link>
          </div>
          <div className="rounded-card bg-brand-dark p-6 text-white">
            <p className="font-display text-lg font-semibold">Complete afsluiting?</p>
            <p className="mt-2 text-sm text-white/70">Stel hekwerk, palen en poort samen en zie meteen een richtprijs.</p>
            <Link href="/calculator/" className="mt-4 inline-flex text-sm font-medium text-accent-bright hover:text-white">Naar de calculator →</Link>
          </div>
        </aside>
      </section>

      {together.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Vaak samen gekocht</h2>
              <p className="mt-1 text-sm text-ink/60">Wat u meestal nodig hebt om dit product te plaatsen of aan te vullen.</p>
            </div>
            <Link href="/shop/" className="text-sm font-medium text-accent hover:text-accent-deep">
              Bekijk het volledige assortiment →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {together.map((item) => <ProductCard key={item.handle} product={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}
