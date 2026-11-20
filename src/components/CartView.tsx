"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Clock, CreditCard, Lock, Minus, Plus, ShoppingCart, Store, Trash2, Truck } from "lucide-react";
import { DeliveryEstimator } from "@/components/DeliveryCheck";
import OrderRequestForm, { type RequestLine } from "@/components/OrderRequestForm";
import PaymentLogos, { SecuredBy } from "@/components/PaymentLogos";
import { cartCount, cartTotal, clearCart, setCartQty, useCart, type CartLine } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { orderTerm } from "@/lib/made-to-order";
import { stockNote } from "@/lib/order-limits";
import { useStock } from "@/lib/stock";

/*
 * /winkelmandje/: everything chosen on the price lists, with quantities to
 * change, a "Leveringskost berekenen" box (price and minimum for a postcode,
 * DeliveryEstimator) and one order form that sends it all (OrderRequestForm),
 * which starts from that postcode. Once the order arrived, the basket empties.
 *
 * Paying (Xander, Nov 2026): when checkout is ready (GET /api/afrekenen/beschikbaar/:
 * company and bank details complete), the right column offers "Afrekenen"
 * (/afrekenen/: pickup or delivery, online payment or bank transfer) and the
 * order form stays one click away for whoever wants a confirmation first.
 * Request-only items (maatwerk) always go through the order form.
 *
 * Stock (Xander, Nov 2026): the counted stock comes live from the Worker
 * (GET /api/afrekenen/voorraad/). A line above it is lowered to it, with a
 * note that this is all there is and to mail for the next freight. Lines with
 * 0 counted stay as "op bestelling". Checkout refuses more on the server too.
 */

// Request-only price lists that live on another product's page.
const PAGE: Record<string, string> = {
  "maatwerk-poort": "/project/maatwerk-poorten/",
  "eiken-palen-met-postsaver": "/shop/eiken-palen/",
};
const pageOf = (line: CartLine) => PAGE[line.handle] ?? `/shop/${line.handle}/`;

type Availability = { ready: boolean; online: boolean; testOnline: boolean };

function CheckoutCard({ total, online, href, onRequest }: { total: number; online: boolean; href: string; onRequest: () => void }) {
  return (
    <div className="rounded-card border border-line bg-white p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold text-ink">Afrekenen</h2>
      <p className="mt-1.5 text-sm leading-6 text-ink/70">
        {online
          ? "Betaal meteen online of via overschrijving."
          : "Betaal via overschrijving: u krijgt meteen het rekeningnummer en een QR-code om te scannen met uw bank-app."}
      </p>
      {online && <PaymentLogos className="mt-3" />}
      <ul className="mt-4 space-y-2.5 text-sm leading-6 text-ink/75">
        <li className="flex gap-2.5">
          <Store aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent" />
          <span>
            <strong className="text-ink">Afhalen in Zele:</strong> gratis. We laten weten wanneer uw bestelling klaarstaat.
          </span>
        </li>
        <li className="flex gap-2.5">
          <Truck aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent" />
          <span>
            <strong className="text-ink">Laten leveren:</strong> met onze eigen wagen, in heel België. Geef uw gsm-nummer op: we mailen u wanneer
            we komen leveren en bellen als dat nodig is.
          </span>
        </li>
        {online && (
          <li className="flex gap-2.5">
            <Lock aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent" />
            <SecuredBy />
          </li>
        )}
      </ul>
      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-sm text-ink/70">Producten incl. btw</span>
        <span className="text-xl font-semibold tabular-nums">{formatPrice(total)}</span>
      </div>
      <p className="mt-1 text-xs text-ink/55">De leveringskost ziet u bij het afrekenen, zodra uw postcode bekend is.</p>
      <Link
        href={href}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-accent-deep"
      >
        <CreditCard aria-hidden className="h-5 w-5" /> Afrekenen <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>
      <button type="button" onClick={onRequest} className="mt-3 w-full text-center text-sm font-medium text-ink/60 underline underline-offset-2 hover:text-accent-deep">
        Liever eerst een bevestiging per mail? Bestelling versturen zonder te betalen
      </button>
    </div>
  );
}

function Qty({ line, max, onMax }: { line: CartLine; max: number | null; onMax: () => void }) {
  const button = "grid h-9 w-9 place-items-center text-ink/60 transition-colors hover:text-accent-deep";
  const atMax = max !== null && max > 0 && line.qty >= max;
  return (
    <span className="inline-flex items-center rounded-full border border-brand/25 bg-white">
      <button type="button" className={button} onClick={() => setCartQty(line.id, line.qty - 1)} aria-label={`Minder ${line.label}`}>
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{line.qty}</span>
      <button
        type="button"
        className={`${button} ${atMax ? "opacity-40" : ""}`}
        onClick={() => (atMax ? onMax() : setCartQty(line.id, line.qty + 1))}
        aria-label={`Meer ${line.label}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </span>
  );
}

export default function CartView() {
  const cart = useCart();
  const [sent, setSent] = useState<{ onOrder: boolean } | null>(null);
  const [place, setPlace] = useState<{ postcode: string; city: string } | null>(null);
  const onPostcode = useCallback((postcode: string, city: string) => setPlace({ postcode, city }), []);
  const priced = cart.filter((l) => l.id > 0).map((l) => ({ id: l.id, qty: l.qty }));
  const [checkout, setCheckout] = useState<Availability | null>(null);
  const [asRequest, setAsRequest] = useState(false);
  const stock = useStock(cart.map((l) => l.id));
  const [atStock, setAtStock] = useState<Record<number, true>>({});
  // More than the counted stock: lower the line to it (0 counted stays "op bestelling").
  useEffect(() => {
    const lowered: Record<number, true> = {};
    for (const line of cart) {
      const max = stock[line.id];
      if (max !== undefined && max > 0 && line.qty > max) {
        lowered[line.id] = true;
        setCartQty(line.id, max);
      }
    }
    if (Object.keys(lowered).length) setAtStock((a) => ({ ...a, ...lowered }));
  }, [cart, stock]);
  useEffect(() => {
    fetch("/api/afrekenen/beschikbaar/", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((a: Availability | null) => a && setCheckout(a))
      .catch(() => {});
  }, []);
  // Maatwerk and other request-only lines cannot be paid online.
  const requestOnly = cart.some((l) => l.handle in PAGE);
  const canPay = Boolean(checkout?.ready) && !requestOnly;
  const checkoutHref = `/afrekenen/${place?.postcode ? `?postcode=${place.postcode}${place.city ? `&gemeente=${encodeURIComponent(place.city)}` : ""}` : ""}`;
  const onOrder = cart.filter((l) => !l.available);
  const notes = [...new Set(onOrder.map((l) => orderTerm(l.handle).note))];
  const requestLines: RequestLine[] = cart.map((l) => ({
    id: l.id,
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
                        {orderTerm(line.handle).badge}
                      </span>
                    )}
                  </p>
                  {atStock[line.id] && stock[line.id] > 0 && line.qty >= stock[line.id] && (
                    <p className="mt-1 text-xs leading-5 font-medium text-accent-deep">{stockNote(stock[line.id])}</p>
                  )}
                </div>
                <Qty line={line} max={stock[line.id] ?? null} onMax={() => setAtStock((a) => ({ ...a, [line.id]: true }))} />
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
          <DeliveryEstimator lines={priced} onPostcode={onPostcode} />
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
      <section aria-label={canPay && !asRequest && !sent ? "Afrekenen" : "Bestelling versturen"} className="lg:sticky lg:top-24">
        {canPay && !asRequest && !sent ? (
          <CheckoutCard total={cartTotal(cart)} online={Boolean(checkout?.online)} href={checkoutHref} onRequest={() => setAsRequest(true)} />
        ) : (
          <>
            {canPay && !sent && (
              <button type="button" onClick={() => setAsRequest(false)} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-deep hover:text-ink">
                <ArrowLeft aria-hidden className="h-4 w-4" /> Toch meteen afrekenen en betalen
              </button>
            )}
            <OrderRequestForm
              lines={requestLines}
              onOrder={sent ? sent.onOrder : onOrder.length > 0}
              place={place}
              onSent={() => {
                setSent({ onOrder: onOrder.length > 0 });
                clearCart();
              }}
            />
          </>
        )}
      </section>
    </div>
  );
}
