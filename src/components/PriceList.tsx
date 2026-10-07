"use client";

import { ArrowUpRight, Minus, Plus, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import {
  compareAtPrice,
  formatPrice,
  shopCartAddUrl,
  shopCartPermalink,
  type Product,
  type ProductVariant,
} from "@/lib/catalog";

/*
 * Price list buy box: one row per shop variant with its price and a quantity,
 * so every price is visible without clicking through options. Variant titles
 * and prices are verbatim shop data. Several products (e.g. loose postsavers
 * and posts with a postsaver) share one total.
 *
 * There is no cart on this site: one chosen line is added to the
 * natuurhout.shop cart (keeping what is already there); several lines open
 * the shop's checkout with exactly those lines (Shopify cart permalink).
 */

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

function PriceTable({
  product,
  qty,
  setQty,
}: {
  product: Product;
  qty: Record<number, number>;
  setQty: (id: number, n: number) => void;
}) {
  const { columns, rows } = useMemo(() => priceList(product), [product]);
  const multi = columns.length > 1;

  return (
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
                {was !== null && <span className="block text-xs text-ink/45 line-through">{formatPrice(was)}</span>}
                {roll !== null && <span className="block text-xs text-ink/50">{formatPrice(price / roll)} / m</span>}
              </td>
              <td className="px-4 py-2 text-right align-middle sm:px-5">
                {variant.available ? (
                  <Stepper value={n} label={label} onChange={(value) => setQty(variant.id, value)} />
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
  );
}

export default function PriceList({ products }: { products: Product[] }) {
  // A lone single-variant product starts at 1, ready to order; a price list
  // starts empty so nothing is ordered that the customer did not pick.
  const [qty, setQtyState] = useState<Record<number, number>>(() => {
    const only = products.length === 1 && products[0].variants.length === 1 ? products[0].variants[0] : null;
    return only?.available ? { [only.id]: 1 } : {};
  });
  const setQty = (id: number, n: number) => setQtyState((q) => ({ ...q, [id]: n }));

  const lines = products.flatMap((product) =>
    product.variants
      .filter((variant) => variant.available && (qty[variant.id] ?? 0) > 0)
      .map((variant) => ({ product, variant, quantity: qty[variant.id] })),
  );
  const pieces = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + parseFloat(l.variant.price) * l.quantity, 0);
  const saved = lines.reduce((sum, l) => {
    const was = compareAtPrice(l.variant);
    return was === null ? sum : sum + (was - parseFloat(l.variant.price)) * l.quantity;
  }, 0);
  const href =
    lines.length === 1
      ? shopCartAddUrl(lines[0].product, lines[0].variant, lines[0].quantity)
      : lines.length > 1
        ? shopCartPermalink(lines[0].product, lines)
        : null;

  return (
    <div>
      <div className="overflow-hidden rounded-card border border-line bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-brand-dark px-4 py-3 text-white sm:px-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Prijslijst</h2>
          <span className="text-xs text-white/70">Alle prijzen incl. btw</span>
        </div>
        {products.map((product, i) => (
          <div key={product.handle} className={i > 0 ? "border-t-4 border-ground" : ""}>
            {products.length > 1 && (
              <h3 className="border-b border-line px-4 pb-2 pt-4 font-display text-base font-semibold sm:px-5">
                {product.title}
              </h3>
            )}
            <PriceTable product={product} qty={qty} setQty={setQty} />
          </div>
        ))}
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
    </div>
  );
}
