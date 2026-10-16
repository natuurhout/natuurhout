"use client";

import Link from "next/link";
import { Check, Clock, Minus, Plus, Send, ShoppingCart } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import OrderRequestForm, { type RequestLine } from "@/components/OrderRequestForm";
import {
  compareAtPrice,
  formatPrice,
  splitRoll,
  type Product,
  type ProductVariant,
} from "@/lib/catalog";
import { addToCart, cartCount, useCart } from "@/lib/cart";
import { orderTerm } from "@/lib/made-to-order";
import { oakWithPostsaver } from "@/lib/price-updates";

/*
 * Price list buy box: one row per shop variant with its price and a quantity,
 * so every price is visible without clicking through options. Variant titles
 * and prices are verbatim shop data. Several products (e.g. loose postsavers
 * and posts with a postsaver) share one total.
 *
 * This site replaced natuurhout.shop (Xander, Oct 2026) and has no online
 * checkout. The chosen lines go into the winkelmandje (src/lib/cart.ts, sent
 * from /winkelmandje/ together with what was chosen on other pages), or are
 * sent straight away from here ("Meteen bestellen"); either way as an order
 * (OrderRequestForm) that
 * Natuurhout confirms it by mail, with payment details and the pick-up or
 * delivery arrangement. Sold-out variants stay orderable "op bestelling":
 * Natuurhout then also mails the delivery term.
 */

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
    const parts = raw.map(splitRoll);
    const cells = parts.map((part) => part.text);
    const continued = byAxis && cells[0] === previous;
    previous = cells[0];
    return { variant, cells, roll: parts.find((part) => part.roll !== null)?.roll ?? null, continued };
  });
  return { columns, rows };
}

function rowLabel(row: Row) {
  const label = row.cells.join(" · ");
  return row.roll !== null ? `${label} (rol ${row.roll} m)` : label;
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
  list: { columns, rows },
  qty,
  setQty,
}: {
  product: Product;
  list: { columns: string[]; rows: Row[] };
  qty: Record<number, number>;
  setQty: (id: number, n: number) => void;
}) {
  const multi = columns.length > 1;
  // When nothing is in stock the banner above the table says it once.
  const allOnOrder = product.variants.every((v) => !v.available);

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
                n > 0 ? "bg-accent/[0.06]" : ""
              }`}
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
                {variant.promo && (
                  <span className="mb-0.5 inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">Promo</span>
                )}
                <span className={`block font-semibold ${was !== null || variant.promo ? "text-accent-deep" : ""}`}>{formatPrice(price)}</span>
                {was !== null && <span className="block text-xs text-ink/45 line-through">{formatPrice(was)}</span>}
                {roll !== null && <span className="block text-xs text-ink/50">{formatPrice(price / roll)} / m</span>}
              </td>
              <td className="px-4 py-2 text-right align-middle sm:px-5">
                <Stepper value={n} label={label} onChange={(value) => setQty(variant.id, value)} />
                {!variant.available && !allOnOrder && (
                  <span className="mt-1 block text-[11px] font-medium text-ink/50">op aanvraag*</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Small print under a product's price list (Xander).
const RENT = "Ook te huur bij Natuurhout: €10, met €50 borg die u terugkrijgt bij het terugbrengen.";
const NOTES: Record<string, string> = {
  "tuin-voorhamer": RENT,
  "grondboor-kopie": RENT,
  palen: "Palen van 150 cm kunnen ook 160 cm lang zijn, afhankelijk van de leverancier.",
  "kastanje-palen-copy": "Palen van 150 cm kunnen ook 160 cm lang zijn, afhankelijk van de leverancier.",
};

const allOnProductOrder = (product: Product) => product.variants.every((v) => !v.available);

export default function PriceList({ products: shown }: { products: Product[] }) {
  // Eiken palen come with a request-only list of the same posts with a postsaver.
  const products = useMemo(
    () => shown.flatMap((product) => (product.handle === "eiken-palen" ? [product, oakWithPostsaver(product)].filter((p): p is Product => p !== null) : [product])),
    [shown],
  );
  const lists = useMemo(() => products.map((product) => priceList(product)), [products]);
  // A lone single-variant product starts at 1, ready to order; a price list
  // starts empty so nothing is ordered that the customer did not pick.
  const [qty, setQtyState] = useState<Record<number, number>>(() => {
    const only = products.length === 1 && products[0].variants.length === 1 ? products[0].variants[0] : null;
    return only ? { [only.id]: 1 } : {};
  });
  const setQty = (id: number, n: number) => setQtyState((q) => ({ ...q, [id]: n }));
  const [requesting, setRequesting] = useState(false);
  const [added, setAdded] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const inCart = cartCount(cart);

  const lines = products.flatMap((product, p) =>
    lists[p].rows
      .filter((row) => (qty[row.variant.id] ?? 0) > 0)
      .map((row) => ({ product, row, variant: row.variant, quantity: qty[row.variant.id] })),
  );
  const inStock = lines.filter((l) => l.variant.available);
  const onOrder = lines.filter((l) => !l.variant.available);
  const pieces = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + parseFloat(l.variant.price) * l.quantity, 0);
  const saved = lines.reduce((sum, l) => {
    const was = compareAtPrice(l.variant);
    return was === null ? sum : sum + (was - parseFloat(l.variant.price)) * l.quantity;
  }, 0);
  const requestLines: RequestLine[] = lines.map((l) => ({
    group: l.product.title,
    label: rowLabel(l.row),
    detail: l.variant.available ? "Op voorraad" : orderTerm(l.product.handle).badge,
    qty: l.quantity,
    unit: parseFloat(l.variant.price),
  }));
  const showForm = requesting && lines.length > 0;

  function addLines() {
    addToCart(
      lines.map((l) => ({
        id: l.variant.id,
        handle: l.product.handle,
        product: l.product.title,
        label: rowLabel(l.row),
        unit: parseFloat(l.variant.price),
        qty: l.quantity,
        available: l.variant.available,
      })),
    );
    setAdded(pieces);
    setRequesting(false);
    setQtyState({});
  }

  function openForm() {
    setAdded(0);
    setRequesting(true);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const button =
    "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-colors sm:flex-none";

  return (
    <div>
      <div className="overflow-hidden rounded-card border border-line bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-brand-dark px-4 py-3 text-white sm:px-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Prijslijst</h2>
          <span className="text-xs text-white/70">Alle prijzen incl. btw</span>
        </div>
        {products.map((product, i) => {
          const soldOut = product.variants.some((v) => !v.available);
          return (
            <div key={product.handle} className={i > 0 ? "border-t-4 border-ground" : ""}>
              {products.length > 1 && (
                <h3 className="border-b border-line px-4 pb-2 pt-4 font-display text-base font-semibold sm:px-5">
                  {product.title}
                </h3>
              )}
              <PriceTable product={product} list={lists[i]} qty={qty} setQty={setQty} />
              {/* Under the table, so it explains rather than leads: the rows say "op aanvraag*". */}
              {soldOut && (
                <p className="flex items-start gap-2 border-t border-line bg-ground/60 px-4 py-2.5 text-xs leading-5 text-ink/65 sm:px-5">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/45" />
                  <span>
                    <strong className="font-semibold text-ink/80">{allOnProductOrder(product) ? orderTerm(product.handle).badge : "* Op aanvraag"}:</strong>{" "}
                    {orderTerm(product.handle).note}
                  </span>
                </p>
              )}
              {NOTES[product.handle] && (
                <p className="border-t border-line px-4 py-2.5 text-xs text-ink/55 sm:px-5">{NOTES[product.handle]}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Totals: sticks to the bottom of the screen while a long list scrolls */}
      <div data-sticky-cta className="sticky bottom-3 z-10 mt-4 rounded-card border border-line bg-white/95 p-4 shadow-lg shadow-ink/10 backdrop-blur sm:px-5">
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
          {lines.length > 0 ? (
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <button type="button" onClick={addLines} className={`${button} bg-accent text-white hover:bg-accent-deep`}>
                <ShoppingCart className="h-4 w-4" />
                In winkelmandje
              </button>
              <button type="button" onClick={openForm} className={`${button} border border-brand/25 bg-white text-ink hover:border-accent hover:text-accent-deep`}>
                <Send className="h-4 w-4" />
                {onOrder.length > 0 ? "Meteen aanvragen" : "Meteen bestellen"}
              </button>
            </div>
          ) : (
            <span className={`${button} bg-ink/10 text-ink/50`}>
              <ShoppingCart className="h-4 w-4" />
              Kies een aantal
            </span>
          )}
        </div>
        {added > 0 && lines.length === 0 ? (
          <p role="status" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-ink/80">
            <span className="flex items-center gap-1.5 font-medium text-ink">
              <Check className="h-4 w-4 text-emerald-700" /> {added} {added === 1 ? "stuk" : "stuks"} toegevoegd aan uw winkelmandje
            </span>
            <Link href="/winkelmandje/" className="font-semibold text-accent-deep underline underline-offset-2 hover:text-ink">
              Bekijk winkelmandje ({inCart})
            </Link>
          </p>
        ) : (
          inCart > 0 &&
          lines.length === 0 && (
            <p className="mt-3 text-sm text-ink/65">
              In uw winkelmandje: {inCart} {inCart === 1 ? "stuk" : "stuks"}.{" "}
              <Link href="/winkelmandje/" className="font-semibold text-accent-deep underline underline-offset-2 hover:text-ink">
                Bekijk en verstuur
              </Link>
            </p>
          )
        )}
      </div>
      <p className="mt-2.5 text-xs leading-5 text-ink/55">
        {onOrder.length > 0 ? (
          <>
            Uw keuze bevat artikelen op bestelling: u vraagt ze aan en wij mailen u de levertermijn.
          </>
        ) : inStock.length > 0 ? (
          "U stuurt ons uw bestelling; wij bevestigen ze per mail, met de afspraak voor levering of afhalen en hoe u betaalt."
        ) : (
          "Kies hierboven per uitvoering hoeveel u wilt en leg het in uw winkelmandje: zo bestelt u producten van verschillende pagina's in één keer, ook wat op bestelling is."
        )}{" "}
        Levering mogelijk: de kosten hangen af van de locatie. Afhalen kan in Zele.
      </p>

      {showForm && (
        <div ref={formRef} className="mt-4 scroll-mt-6">
          <OrderRequestForm lines={requestLines} onOrder={onOrder.length > 0} />
        </div>
      )}
    </div>
  );
}
