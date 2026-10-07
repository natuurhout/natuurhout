import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductTabs, { type ProductTab } from "@/components/ProductTabs";
import type { Product } from "@/lib/catalog";
import type { LegacyPhoto } from "@/lib/legacy-product";

/*
 * Everything below a product page's price list: the information tabs with a
 * contact aside, and "Vaak samen gekocht". Shared by the shop pages and the
 * WordPress product pages so both read the same way.
 */

// Shop and WordPress copy keep their own markup (lists, bold, tables); this styles it.
const prose =
  "max-w-3xl space-y-3 leading-7 text-ink/80 [&_a]:text-accent [&_a]:underline [&_h3:first-child]:mt-0 [&_h3]:mt-7 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ol>li]:list-decimal [&_li>p]:inline [&_strong]:text-ink [&_table]:my-4 [&_table]:w-full [&_table]:overflow-hidden [&_table]:rounded-card [&_table]:bg-white [&_table]:text-sm [&_table]:ring-1 [&_table]:ring-line [&_td]:border-b [&_td]:border-line [&_td]:px-3 [&_td]:py-2 [&_th]:border-b [&_th]:border-line [&_th]:bg-ground/70 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-ink/60";

export function Html({ html }: { html: string }) {
  return <div className={prose} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Wide price tables scroll sideways on a phone instead of widening the page. */
export function PriceTableHtml({ html }: { html: string }) {
  return (
    <div className="overflow-x-auto">
      <Html html={html} />
    </div>
  );
}

const linkClass = "font-medium text-accent hover:text-accent-deep";

export function productInfoTabs({
  omschrijving,
  prijzen,
  facts,
  kenmerken,
  pluspunten,
  tips,
  photos,
  fencing,
}: {
  omschrijving: string;
  /** Price tables of a WordPress page; omitted when they already show above. */
  prijzen?: string;
  facts: { label: string; value: string }[];
  kenmerken: string;
  pluspunten: string;
  tips: string;
  photos?: LegacyPhoto[];
  fencing: boolean;
}): ProductTab[] {
  const tabs: (ProductTab | null)[] = [
    {
      id: "omschrijving",
      label: "Omschrijving",
      content: omschrijving ? <Html html={omschrijving} /> : <p className="text-ink/60">Meer informatie volgt.</p>,
    },
    prijzen
      ? { id: "prijstabel", label: "Prijstabel", content: <PriceTableHtml html={prijzen} /> }
      : null,
    facts.length || kenmerken
      ? {
          id: "kenmerken",
          label: "Kenmerken",
          content: (
            <div className="space-y-8">
              {facts.length > 0 && (
                <dl className="max-w-3xl divide-y divide-line overflow-hidden rounded-card border border-line bg-white text-sm">
                  {facts.map(({ label, value }) => (
                    <div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-4 sm:px-5">
                      <dt className="font-semibold text-ink">{label}</dt>
                      <dd className="text-ink/75">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {kenmerken && <Html html={kenmerken} />}
            </div>
          ),
        }
      : null,
    {
      id: "pluspunten",
      label: "Pluspunten",
      content: pluspunten ? (
        <Html html={pluspunten} />
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
          {tips && <Html html={tips} />}
          <ul className="grid max-w-3xl gap-3 sm:grid-cols-2">
            {fencing && (
              <li className="rounded-card border border-line bg-white p-4 text-sm leading-6 text-ink/75">
                <strong className="block text-ink">Volledige afsluiting plannen?</strong>
                Bereken hekwerk, palen, poort en toebehoren in één keer met de{" "}
                <Link href="/calculator/" className={linkClass}>afsluitingscalculator</Link>.
              </li>
            )}
            <li className="rounded-card border border-line bg-white p-4 text-sm leading-6 text-ink/75">
              <strong className="block text-ink">Twijfelt u over maat of uitvoering?</strong>
              Bel ons op <a href="tel:+3252558858" className={linkClass}>+32 5 255 88 58</a> of
              mail naar <a href="mailto:info@natuurhout.be" className={linkClass}>info@natuurhout.be</a>.
            </li>
          </ul>
        </div>
      ),
    },
    photos && photos.length > 1
      ? {
          id: "fotos",
          label: "Foto's",
          content: (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <li key={photo.src}>
                  <a
                    href={photo.href}
                    target="_blank"
                    rel="noopener"
                    className="group block overflow-hidden rounded-card border border-line bg-white"
                  >
                    <span className="relative block aspect-square overflow-hidden bg-brand-soft/40">
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </span>
                    {photo.caption && <span className="block px-3 py-2 text-xs text-ink/70">{photo.caption}</span>}
                  </a>
                </li>
              ))}
            </ul>
          ),
        }
      : null,
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
  return tabs.filter((tab): tab is ProductTab => tab !== null);
}

export function ProductInfo({ tabs }: { tabs: ProductTab[] }) {
  return (
    <section id="productinfo" className="mt-14 grid scroll-mt-6 grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <h2 className="sr-only">Productinformatie</h2>
      <ProductTabs tabs={tabs} />
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
  );
}

export function BoughtTogether({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
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
        {products.map((item) => <ProductCard key={item.handle} product={item} />)}
      </div>
    </section>
  );
}
