"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Clock, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import OrderRequestForm, { type RequestLine } from "@/components/OrderRequestForm";
import { cartCount, cartTotal, clearCart, setCartQty, useCart, type CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { orderTerm } from "@/lib/made-to-order";

/*
 * /winkelmandje/: everything chosen on the price lists, with quantities to
 * change, and one order form that sends it all (OrderRequestForm). Once the
 * order arrived, the basket empties.
 */

// Request-only price lists that live on another product's page.
const PAGE: Record<string, string> = {
  "maatwerk-poort": "/project/maatwerk-poorten/",
  "eiken-palen-met-postsaver": "/shop/eiken-palen/",
};
const pageOf = (line: CartLine) => PAGE[line.handle] ?? `/shop/${line.handle}/`;

function Qty({ line }: { line: CartLine }) {
  const button = "grid h-9 w-9 place-items-center text-ink/60 transition-colors hover:text-accent-deep";
  return (
    <span className="inline-flex items-center rounded-full border border-brand/25 bg-white">
      <button type="button" className={button} onClick={() => setCartQty(line.id, line.qty - 1)} aria-label={`Minder ${line.label}`}>
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{line.qty}</span>
      <button type="button" className={button} onClick={() => setCartQty(line.id, line.qty + 1)} aria-label={`Meer ${line.label}`}>
        <Plus className="h-4 w-4" />
      </button>
    </span>
  );
}

export default function CartView() {
  const cart = useCart();
  const [sent, setSent] = useState<{ onOrder: boolean } | null>(null);
  const onOrder = cart.filter((l) => !l.available);
  const notes = [...new Set(onOrder.map((l) => orderTerm(l.handle).note))];
  const requestLines: RequestLine[] = cart.map((l) => ({
    group: l.product,
    label: l.label,
    detail: l.available ? "Op voorraad" : orderTerm(l.handle).badge,
    qty: l.qty,
    unit: l.unit,
  }));

  if (!cart.length && !sent) {
    return (
      <div className="max-w-2xl rounded-card border border-line bg-white p-6 sm:p-8">
        <ShoppingCart aria-hidden className="h-8 w-8 text-accent" />
        <p className="mt-3 font-display text-xl font-semibold">Uw winkelmandje is leeg</p>
        <p className="mt-2 text-sm leading-6 text-ink/70">
          Kies op een productpagina in de prijslijst hoeveel u wilt en klik op <strong>In winkelmandje</strong>. Zo verzamelt u
          producten van verschillende pagina&apos;s en verstuurt u ze hier in één keer.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/shop/" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-deep">
            Naar de shop
          </Link>
          <Link href="/calculator/" className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-6 py-3 text-sm font-semibold hover:border-accent hover:text-accent-deep">
            Afsluiting berekenen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      {cart.length > 0 && (
        <section aria-label="Gekozen producten">
          <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
            {cart.map((line) => (
              <li key={line.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex-1 basis-56">
                  <Link href={pageOf(line)} className="font-semibold text-ink hover:text-accent-deep">
                    {line.product}
                  </Link>
                  <p className="text-sm text-ink/65">{line.label}</p>
                  <p className="text-xs text-ink/55">
                    {formatPrice(line.unit)} per stuk
                    {!line.available && (
                      <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 font-semibold text-accent-deep">
                        {orderTerm(line.handle).badge === "Uitverkocht" ? "Uitverkocht · op bestelling" : orderTerm(line.handle).badge}
                      </span>
                    )}
                  </p>
                </div>
                <Qty line={line} />
                <span className="w-24 text-right font-semibold tabular-nums">{formatPrice(line.unit * line.qty)}</span>
                <button
                  type="button"
                  onClick={() => setCartQty(line.id, 0)}
                  className="grid h-9 w-9 place-items-center rounded-full text-ink/45 transition-colors hover:bg-red-50 hover:text-red-700"
                  aria-label={`${line.product} ${line.label} verwijderen`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between gap-4 rounded-card bg-brand-dark px-4 py-3.5 text-white sm:px-5">
            <span className="text-sm">
              Totaal incl. btw ({cartCount(cart)} {cartCount(cart) === 1 ? "stuk" : "stuks"})
            </span>
            <span className="text-xl font-semibold tabular-nums">{formatPrice(cartTotal(cart))}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-ink/55">Levering mogelijk: de kosten hangen af van de locatie. Afhalen kan in Zele.</p>
          {notes.length > 0 && (
            <div className="mt-4 flex gap-2 rounded-xl border border-accent/25 bg-accent/5 px-3.5 py-3 text-sm leading-6 text-ink/80">
              <Clock aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent-deep" />
              <div>
                <strong className="text-ink">Op bestelling:</strong> u vraagt deze artikelen gewoon mee aan; wij mailen u de levertermijn.
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink/65">
                  {notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/shop/" className="inline-flex items-center gap-1.5 font-medium text-accent hover:text-accent-deep">
              <ArrowLeft className="h-4 w-4" /> Verder winkelen
            </Link>
            <button type="button" onClick={clearCart} className="font-medium text-ink/55 hover:text-red-700">
              Winkelmandje leegmaken
            </button>
          </div>
        </section>
      )}
      <section aria-label="Bestelling versturen" className="lg:sticky lg:top-24">
        <OrderRequestForm
          lines={requestLines}
          onOrder={sent ? sent.onOrder : onOrder.length > 0}
          onSent={() => {
            setSent({ onOrder: onOrder.length > 0 });
            clearCart();
          }}
        />
      </section>
    </div>
  );
}
