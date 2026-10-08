import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import ProductCard from "@/components/ProductCard";
import ProductTabs, { type ProductTab } from "@/components/ProductTabs";
import { compareAtPrice, formatPrice, splitRoll, type Product, type ProductVariant } from "@/lib/catalog";
import { orderTerm } from "@/lib/made-to-order";
import { WHATSAPP } from "@/lib/contact";
import { WhatsAppIcon } from "@/components/WhatsApp";
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

const th = "border-b border-line bg-ground/70 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink/60";
const td = "border-b border-line px-3 py-2";

function PriceCell({ variant, roll }: { variant: ProductVariant; roll: number | null }) {
  const was = compareAtPrice(variant);
  return (
    <>
      {was !== null && <del className="mr-1.5 text-ink/45">{formatPrice(was)}</del>}
      <span className={was !== null ? "font-semibold text-accent-deep" : ""}>{formatPrice(variant.price)}</span>
      {!variant.available && <sup className="ml-0.5 font-semibold text-accent-deep">*</sup>}
      {roll !== null && <span className="block text-xs text-ink/50">rol {roll} m</span>}
    </>
  );
}

/**
 * All prices of a webshop product at a glance, laid out like the WordPress
 * price tables (first option down, second option across), so the overview
 * always carries the shop's current prices.
 */
export function ShopPriceMatrix({ product }: { product: Product }) {
  const split = product.variants.map((v) => v.title.split(" / ").map((part) => splitRoll(part.trim())));
  const grid = product.options.length === 2 && split.every((parts) => parts.length === 2);
  const single = product.variants.length === 1 && product.variants[0].title === "Default Title";
  const term = orderTerm(product.handle);
  const anySoldOut = product.variants.some((v) => !v.available);

  let table: ReactNode;
  if (grid) {
    const rows = [...new Set(split.map((parts) => parts[0].text))];
    const cols = [...new Set(split.map((parts) => parts[1].text))];
    const cell = (r: string, c: string) => {
      const i = split.findIndex((parts) => parts[0].text === r && parts[1].text === c);
      return i < 0 ? null : { variant: product.variants[i], roll: split[i][1].roll ?? split[i][0].roll };
    };
    table = (
      <table className="w-full min-w-[28rem] text-sm">
        <thead>
          <tr>
            <th scope="col" className={th}>{product.options[0]}</th>
            {cols.map((c) => (
              <th key={c} scope="col" className={th}>{product.options[1]} {c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th scope="row" className={`${td} text-left font-medium`}>{r}</th>
              {cols.map((c) => {
                const hit = cell(r, c);
                return <td key={c} className={td}>{hit ? <PriceCell {...hit} /> : <span className="text-ink/30">—</span>}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  } else {
    table = (
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th scope="col" className={th}>{single ? "Artikel" : product.options[0] || "Uitvoering"}</th>
            <th scope="col" className={`${th} text-right`}>Prijs</th>
          </tr>
        </thead>
        <tbody>
          {product.variants.map((variant, i) => (
            <tr key={variant.id}>
              <td className={td}>{single ? product.title : split[i].map((part) => part.text).join(" / ")}</td>
              <td className={`${td} text-right`}><PriceCell variant={variant} roll={split[i].find((part) => part.roll !== null)?.roll ?? null} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <figure className="max-w-3xl">
      <figcaption className="mb-2 font-display text-base font-semibold text-ink">{product.title}</figcaption>
      <div className="overflow-x-auto rounded-card bg-white ring-1 ring-line">{table}</div>
      <p className="mt-2 text-xs leading-5 text-ink/55">
        Prijzen incl. btw, zoals in onze webshop.
        {anySoldOut && <> <span className="font-semibold text-accent-deep">*</span> {term.badge}: {term.note}</>}
      </p>
    </figure>
  );
}

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
  /** Price overview of a WordPress page; omitted when it already shows above. */
  prijzen?: ReactNode;
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
      ? { id: "prijstabel", label: "Prijstabel", content: prijzen }
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
              Bel ons op <a href="tel:+3252558858" className={linkClass}>052 55 88 58</a> of
              mail naar <a href="mailto:info@natuurhout.be" className={linkClass}>info@natuurhout.be</a>. Ook via{" "}
              <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className={linkClass}>WhatsApp</a> bent u welkom.
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
            Bel, mail of WhatsApp ons voor advies op maat, een prijs voor een grotere hoeveelheid of een afspraak in Zele.
          </p>
          <div className="mt-4 space-y-1.5 text-sm">
            <a href="tel:+3252558858" className="block font-medium text-accent hover:text-accent-deep">052 55 88 58</a>
            <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-[#128c43] hover:text-ink">
              <WhatsAppIcon className="h-4 w-4" /> Stuur ons een WhatsApp
            </a>
            <a href="mailto:info@natuurhout.be" className="block text-ink/70 hover:text-accent">info@natuurhout.be</a>
          </div>
          <Link href="/offerte-aanvragen/#andere-vraag" className="mt-4 inline-flex text-sm font-medium text-accent hover:text-accent-deep">
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
