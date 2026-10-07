"use client";

import Image from "next/image";
import { ArrowUpRight, Leaf, Minus, Plus, ShieldCheck, ShoppingCart, Store, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  compareAtPrice,
  discountPercent,
  formatPrice,
  shopCartAddUrl,
  shopCartPermalink,
  type Product,
  type ProductVariant,
} from "@/lib/catalog";
import { productLead } from "@/lib/seo";

/*
 * Product page buy box, price-list style: a small photo on the side and the
 * full price list straight away — one row per shop variant with its price
 * and a quantity — so every price is visible without clicking through
 * options. Variant titles and prices are verbatim shop data.
 *
 * There is no cart on this site: one chosen line is added to the
 * natuurhout.shop cart (keeping what is already there); several lines open
 * the shop's checkout with exactly those lines (Shopify cart permalink).
 */

const assurances = [
  { icon: Truck, label: "Levering mogelijk" },
  { icon: Store, label: "Afhalen in Zele" },
  { icon: ShieldCheck, label: "+15 jaar ervaring" },
  { icon: Leaf, label: "Duurzaam hout" },
];

const ROLL = /\s*\((\d+(?:[.,]\d+)?)\s*m\s*rol\)\s*/i;

type Row = {
  variant: ProductVariant;
  cells: string[];
  /** Roll length in metres, from "(5m rol)" in the variant title. */
  roll: number | null;
  /** First option repeats the previous row's (shown once per group). */
  continued: boolean;
};

function priceList(product: Product): { columns: string[]; rows: Row[] } {
  const single = product.variants.length === 1 && product.variants[0].title === "Default Title";
  const axes = product.options.length;
  const split = product.variants.map((v) => v.title.split(" / ").map((s) => s.trim()));
  const byAxis = axes > 1 && split.every((parts) => parts.length === axes);
  const columns = single ? ["Artikel"] : byAxis ? product.options : [product.options[0] || "Uitvoering"];

  let previous = "";
  const rows = product.variants.map((variant, i) => {
    const raw = single ? [product.title] : byAxis ? split[i] : [variant.title];
    const match = raw.map((cell) => ROLL.exec(cell)).find(Boolean);
    const cells = raw.map((cell) => cell.replace(ROLL, " ").trim());
    const continued = byAxis && cells[0] === previous;
    previous = cells[0];
    return { variant, cells, roll: match ? parseFloat(match[1].replace(",", ".")) : null, continued };
  });
  return { columns, rows };
}

function Stepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const btn =
    "grid h-9 w-9 place-items-center text-ink/60 transition-colors hover:text-accent disabled:text-ink/25 disabled:hover:text-ink/25";
  return (
    <span className="inline-flex items-center rounded-full border border-brand/25 bg-white">
      <button
        type="button"
        className={`${btn} rounded-l-full`}
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
        aria-label={`Minder ${label}`}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value || ""}
        placeholder="0"
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isFinite(n) ? Math.min(n, 999) : 0);
        }}
        onFocus={(e) => e.target.select()}
        aria-label={`Aantal ${label}`}
        className="h-9 w-9 bg-transparent text-center text-sm font-semibold tabular-nums outline-none placeholder:text-ink/35 focus:bg-ground"
      />
      <button
        type="button"
        className={`${btn} rounded-r-full`}
        onClick={() => onChange(Math.min(999, value + 1))}
        aria-label={`Meer ${label}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

export default function ProductDetail({ product }: { product: Product }) {
  const [imageIdx, setImageIdx] = useState(0);
  const { columns, rows } = useMemo(() => priceList(product), [product]);
  // A single-variant product starts at 1, ready to order; a price list
  // starts empty so nothing is ordered that the customer did not pick.
  const [qty, setQty] = useState<Record<number, number>>(() =>
    rows.length === 1 && rows[0].variant.available ? { [rows[0].variant.id]: 1 } : {},
  );

  const lines = rows
    .filter((r) => r.variant.available && (qty[r.variant.id] ?? 0) > 0)
    .map((r) => ({ variant: r.variant, quantity: qty[r.variant.id] }));
  const pieces = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + parseFloat(l.variant.price) * l.quantity, 0);
  const saved = lines.reduce((sum, l) => {
    const was = compareAtPrice(l.variant);
    return was === null ? sum : sum + (was - parseFloat(l.variant.price)) * l.quantity;
  }, 0);
  const href =
    lines.length === 1
      ? shopCartAddUrl(product, lines[0].variant, lines[0].quantity)
      : lines.length > 1
        ? shopCartPermalink(product, lines)
        : null;

  const img = product.images[imageIdx] ?? product.images[0];
  const bestSaving = Math.max(0, ...product.variants.map((v) => discountPercent(v) ?? 0));
  const multi = columns.length > 1;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-start lg:gap-10">
      {/* Small gallery on the side */}
      <div className="md:sticky md:top-6">
        {img && (
          <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-card bg-white ring-1 ring-line md:aspect-square md:max-w-none">
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 100vw, 30vw"
              className="object-contain"
              priority
            />
            {bestSaving > 0 && (
              <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
                Tot −{bestSaving}%
              </span>
            )}
          </div>
        )}
        {product.images.length > 1 && (
          <div className="mx-auto mt-2.5 flex max-w-md gap-2 overflow-x-auto pb-1 md:max-w-none">
            {product.images.map((im, i) => (
              <button
                key={im.src}
                type="button"
                onClick={() => setImageIdx(i)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition ${
                  i === imageIdx ? "ring-accent" : "ring-line hover:ring-brand/40"
                }`}
                aria-label={`Afbeelding ${i + 1}`}
                aria-current={i === imageIdx}
              >
                <Image src={im.src} alt={im.alt} fill sizes="3.5rem" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <ul className="mt-5 hidden gap-2.5 rounded-card border border-line bg-white p-4 text-sm text-ink/75 md:grid">
          {assurances.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0 text-accent" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Title + price list */}
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{product.title}</h1>
        <p className="mt-3 line-clamp-3 max-w-2xl leading-7 text-ink/75">{productLead(product)}</p>
        <a href="#productinfo" className="mt-1 inline-flex text-sm font-medium text-accent hover:text-accent-deep">
          Lees meer over dit product ↓
        </a>

        <div className="mt-6 overflow-hidden rounded-card border border-line bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-brand-dark px-4 py-3 text-white sm:px-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Prijslijst</h2>
            <span className="text-xs text-white/70">Alle prijzen incl. btw</span>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-ground/70 text-left text-xs font-semibold uppercase tracking-wide text-ink/55">
              <tr>
                {columns.map((name) => (
                  <th key={name} scope="col" className={`px-4 py-2.5 sm:px-5 ${multi ? "hidden sm:table-cell" : ""}`}>
                    {name}
                  </th>
                ))}
                {multi && (
                  <th scope="col" className="px-4 py-2.5 sm:hidden">
                    {columns.join(" · ")}
                  </th>
                )}
                <th scope="col" className="px-2 py-2.5 text-right">Prijs</th>
                <th scope="col" className="px-4 py-2.5 text-right sm:px-5">Aantal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ variant, cells, roll, continued }, i) => {
                const n = qty[variant.id] ?? 0;
                const was = compareAtPrice(variant);
                const price = parseFloat(variant.price);
                const label = cells.join(" · ");
                const groupStart = multi && i > 0 && !continued;
                return (
                  <tr
                    key={variant.id}
                    className={`${groupStart ? "border-t-2 border-line" : i > 0 ? "border-t border-line/70" : ""} ${
                      n > 0 && variant.available ? "bg-accent/[0.06]" : ""
                    } ${variant.available ? "" : "text-ink/45"}`}
                  >
                    {cells.map((cell, c) => (
                      <td
                        key={c}
                        className={`px-4 py-2.5 align-middle sm:px-5 ${multi ? "hidden sm:table-cell" : ""} ${
                          c === 0 ? "font-medium" : ""
                        }`}
                      >
                        {c === 0 && continued ? <span className="sr-only">{cell}</span> : cell}
                        {c === cells.length - 1 && roll !== null && (
                          <span className="block text-xs font-normal text-ink/50">rol van {roll} m</span>
                        )}
                      </td>
                    ))}
                    {multi && (
                      <td className="px-4 py-2.5 align-middle font-medium sm:hidden">
                        {label}
                        {roll !== null && <span className="block text-xs font-normal text-ink/50">rol van {roll} m</span>}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-2 py-2.5 text-right align-middle">
                      <span className={`font-semibold ${was !== null ? "text-accent-deep" : ""}`}>{formatPrice(price)}</span>
                      {was !== null && (
                        <span className="block text-xs text-ink/45 line-through">{formatPrice(was)}</span>
                      )}
                      {roll !== null && (
                        <span className="block text-xs text-ink/50">{formatPrice(price / roll)} / m</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right align-middle sm:px-5">
                      {variant.available ? (
                        <Stepper
                          value={n}
                          label={label}
                          onChange={(value) => setQty((q) => ({ ...q, [variant.id]: value }))}
                        />
                      ) : (
                        <span className="inline-block rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-medium text-ink/55">
                          Uitverkocht
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals: sticks to the bottom of the screen while a long list scrolls */}
        <div className="sticky bottom-3 z-10 mt-4 rounded-card border border-line bg-white/95 p-4 shadow-lg shadow-ink/10 backdrop-blur sm:px-5">
          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
            <dt className="text-ink/60">Subtotaal{pieces > 0 ? ` (${pieces} ${pieces === 1 ? "stuk" : "stuks"})` : ""}</dt>
            <dd className="text-right tabular-nums">{formatPrice(total)}</dd>
            {saved > 0 && (
              <>
                <dt className="text-accent-deep">U bespaart</dt>
                <dd className="text-right tabular-nums text-accent-deep">−{formatPrice(saved)}</dd>
              </>
            )}
          </dl>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <p>
              <span className="block text-xs text-ink/60">Totaal incl. btw</span>
              <span className="text-2xl font-semibold tabular-nums">{formatPrice(total)}</span>
            </p>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep sm:flex-none"
              >
                <ShoppingCart className="h-4 w-4" />
                {lines.length > 1 ? "Bestellen" : "In winkelmand"}
                <ArrowUpRight className="h-4 w-4" />
              </a>
            ) : (
              <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink/10 px-6 py-3.5 text-sm font-semibold text-ink/50 sm:flex-none">
                <ShoppingCart className="h-4 w-4" />
                Kies een aantal
              </span>
            )}
          </div>
        </div>
        <p className="mt-2.5 text-xs leading-5 text-ink/55">
          {lines.length > 1
            ? "Opent de kassa van natuurhout.shop met deze artikelen — daar kiest u levering of afhalen en rekent u af."
            : lines.length === 1
              ? "Opent natuurhout.shop met dit artikel in uw winkelmand — daar rekent u af."
              : "Kies hierboven per uitvoering hoeveel u wilt — u kunt meerdere uitvoeringen tegelijk bestellen."}{" "}
          Levering mogelijk: de kosten hangen af van de locatie. Afhalen kan in Zele.
        </p>

        <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-ink/75 md:hidden">
          {assurances.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-accent" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
