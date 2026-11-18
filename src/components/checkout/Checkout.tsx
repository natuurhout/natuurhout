"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Building2, CreditCard, Landmark, Lock, ShoppingCart, Store, Trash2, Truck } from "lucide-react";
import { setCartQty, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { ADDRESS, PHONE } from "@/lib/contact";

/*
 * /afrekenen/ (checkout v2): the basket from /winkelmandje/, paid at once.
 * Prices, delivery and the total come from the Worker (/api/afrekenen/prijs/),
 * never from this page; placing the order (/api/afrekenen/) sends the
 * customer to MultiSafepay or, for a bank transfer, to the return page with
 * the payment details. worker/shop/checkout.ts has the rules.
 */

const input =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 aria-[invalid=true]:border-red-600";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Quote = {
  lines: { id: number; product: string; label: string; qty: number; unit: number; note: string; image: string | null }[];
  invalid: number[];
  subtotal: number;
  delivery: { price: number; label: string } | null;
  deliverable: boolean;
  total: number;
  vat: number;
};

function Field({ label, error, children, className = "" }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-700">{error}</span>}
    </label>
  );
}

function Choice({ checked, onSelect, icon, title, children }: { checked: boolean; onSelect: () => void; icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <label
      className={`flex cursor-pointer gap-3 border px-4 py-3.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl [&+&]:-mt-px ${
        checked ? "relative z-10 border-accent bg-accent/5" : "border-line bg-white hover:bg-ink/[0.02]"
      }`}
    >
      <input type="radio" checked={checked} onChange={onSelect} className="mt-0.5 h-4 w-4 flex-none accent-accent" />
      <span className="flex-1">
        <span className="flex items-center gap-2 font-medium text-ink">
          {icon}
          {title}
        </span>
        {children && <span className="mt-1 block text-ink/65">{children}</span>}
      </span>
    </label>
  );
}

export default function Checkout() {
  const cart = useCart();
  const [f, setF] = useState({ email: "", phone: "", name: "", company: "", vat: "", street: "", postcode: "", city: "", remarks: "" });
  const [delivery, setDelivery] = useState(true);
  const [method, setMethod] = useState<"online" | "overschrijving">("online");
  const [business, setBusiness] = useState(false);
  const [terms, setTerms] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const set = (patch: Partial<typeof f>) => setF((old) => ({ ...old, ...patch }));

  const basket = cart.map((l) => ({ id: l.id, qty: l.qty }));
  const basketKey = JSON.stringify(basket);
  const postcode = f.postcode.trim();

  // Server prices + delivery, refreshed when the basket, delivery or postcode changes.
  useEffect(() => {
    if (!cart.length) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/afrekenen/prijs/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: JSON.parse(basketKey), delivery, postcode }),
        signal: ctrl.signal,
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((q: Quote | null) => q && setQuote(q))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [basketKey, delivery, postcode, cart.length]);

  const errors: Record<string, string> = {};
  if (!EMAIL.test(f.email.trim())) errors.email = "Vul een geldig e-mailadres in.";
  if (!f.phone.trim()) errors.phone = "Vul uw telefoonnummer in.";
  if (f.name.trim().length < 2) errors.name = "Vul uw naam in.";
  if (delivery && !f.street.trim()) errors.street = "Vul straat en nummer in.";
  if (delivery && !/^\d{4}$/.test(postcode)) errors.postcode = "Een Belgische postcode van 4 cijfers.";
  if (delivery && !f.city.trim()) errors.city = "Vul de gemeente in.";
  if (!terms) errors.terms = "Ga akkoord met de algemene voorwaarden.";
  const shown = attempted ? errors : {};

  const invalid = new Set(quote?.invalid ?? []);
  const blocked = invalid.size > 0 || (delivery && quote !== null && /^\d{4}$/.test(postcode) && !quote.deliverable);
  const total = quote?.total ?? null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setError("");
    if (Object.keys(errors).length) {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    if (blocked || !quote) return;
    setStatus("sending");
    try {
      const response = await fetch("/api/afrekenen/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: basket,
          delivery,
          method,
          ...f,
          company: business ? f.company : "",
          vat: business ? f.vat : "",
          terms,
          website: honeypot,
          elapsedMs: Math.round(performance.now()),
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { redirect?: string; error?: string };
      if (response.ok && result.redirect) {
        window.location.href = result.redirect;
        return;
      }
      setError(result.error || `Er ging iets mis. Probeer het opnieuw of bel ${PHONE.label}.`);
      setStatus("error");
    } catch {
      setError("Geen verbinding. Probeer het opnieuw.");
      setStatus("error");
    }
  }

  if (!cart.length) {
    return (
      <div className="max-w-2xl rounded-card border border-line bg-white p-6 sm:p-8">
        <ShoppingCart aria-hidden className="h-8 w-8 text-accent" />
        <p className="mt-3 font-display text-xl font-semibold">Uw winkelmandje is leeg</p>
        <p className="mt-2 text-sm leading-6 text-ink/70">Kies eerst producten in de prijslijsten.</p>
        <Link href="/shop/" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-deep hover:underline">
          <ArrowLeft className="h-4 w-4" /> Naar de webshop
        </Link>
      </div>
    );
  }

  const summary = (
    <div className="space-y-4">
      <ul className="space-y-3">
        {cart.map((line) => {
          const priced = quote?.lines.find((l) => l.id === line.id);
          const bad = invalid.has(line.id);
          return (
            <li key={line.id} className="flex items-start gap-3 text-sm">
              <span className="relative grid h-12 w-12 flex-none place-items-center rounded-lg border border-line bg-white text-ink/40">
                {priced?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${priced.image}${priced.image.includes("?") ? "&" : "?"}width=96`} alt="" className="h-full w-full rounded-lg object-cover" loading="lazy" />
                ) : (
                  <ShoppingCart className="h-5 w-5" aria-hidden />
                )}
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-ink/70 px-1 text-[11px] font-semibold text-white">{line.qty}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink">{priced?.product ?? line.product}</span>
                {(priced ? priced.label : line.label) && <span className="block text-ink/60">{priced ? priced.label : line.label}</span>}
                {priced?.note && <span className="block text-xs text-amber-700">Op bestelling: we laten de levertermijn weten</span>}
                {bad && (
                  <span className="mt-1 flex items-center gap-2 text-xs font-medium text-red-700">
                    Niet online te bestellen (vraag een offerte)
                    <button type="button" onClick={() => setCartQty(line.id, 0)} className="inline-flex items-center gap-1 underline">
                      <Trash2 className="h-3 w-3" /> verwijderen
                    </button>
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap font-medium tabular-nums">{priced ? formatPrice(priced.unit * priced.qty) : bad ? "–" : "…"}</span>
            </li>
          );
        })}
      </ul>
      <dl className="space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink/70">Subtotaal</dt>
          <dd className="tabular-nums">{quote ? formatPrice(quote.subtotal) : "…"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink/70">{delivery ? "Levering" : "Afhalen in Zele"}</dt>
          <dd className="text-right tabular-nums">
            {!delivery
              ? "Gratis"
              : !/^\d{4}$/.test(postcode)
                ? <span className="text-ink/55">Vul uw postcode in</span>
                : !quote
                  ? "…"
                  : quote.delivery
                    ? quote.delivery.price === 0
                      ? "Gratis"
                      : formatPrice(quote.delivery.price)
                    : <span className="text-red-700">Niet via de webshop</span>}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-display text-lg font-semibold">Totaal</dt>
          <dd className="font-display text-xl font-bold tabular-nums">{total !== null && !blocked ? formatPrice(total) : "…"}</dd>
        </div>
        {quote && <p className="text-right text-xs text-ink/55">incl. {formatPrice(quote.vat)} btw (21%)</p>}
      </dl>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
      <form ref={formRef} onSubmit={submit} noValidate className="relative order-2 space-y-8 lg:order-1">
        <section>
          <h2 className="font-display text-xl font-semibold">Contact</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="E-mailadres *" error={shown.email}>
              <input type="email" className={input} autoComplete="email" value={f.email} aria-invalid={Boolean(shown.email)} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field label="Telefoon of gsm *" error={shown.phone}>
              <input type="tel" className={input} autoComplete="tel" value={f.phone} aria-invalid={Boolean(shown.phone)} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">Levering</h2>
          <div className="mt-3">
            <Choice checked={delivery} onSelect={() => setDelivery(true)} icon={<Truck className="h-4 w-4 text-accent" />} title="Leveren">
              Met onze eigen wagen; we bellen om een moment af te spreken.
            </Choice>
            <Choice checked={!delivery} onSelect={() => setDelivery(false)} icon={<Store className="h-4 w-4 text-accent" />} title="Afhalen in Zele (gratis)">
              {ADDRESS.street}, {ADDRESS.city}. We laten weten wanneer het klaarstaat.
            </Choice>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
            <Field label="Naam *" error={shown.name} className="sm:col-span-3">
              <input className={input} autoComplete="name" value={f.name} aria-invalid={Boolean(shown.name)} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            {delivery && (
              <>
                <Field label="Straat en nummer *" error={shown.street}>
                  <input className={input} autoComplete="street-address" value={f.street} aria-invalid={Boolean(shown.street)} onChange={(e) => set({ street: e.target.value })} />
                </Field>
                <Field label="Postcode *" error={shown.postcode}>
                  <input className={input} inputMode="numeric" maxLength={4} autoComplete="postal-code" value={f.postcode} aria-invalid={Boolean(shown.postcode)} onChange={(e) => set({ postcode: e.target.value })} />
                </Field>
                <Field label="Gemeente *" error={shown.city}>
                  <input className={input} autoComplete="address-level2" value={f.city} aria-invalid={Boolean(shown.city)} onChange={(e) => set({ city: e.target.value })} />
                </Field>
                {quote && /^\d{4}$/.test(postcode) && !quote.deliverable && (
                  <p className="text-sm text-red-700 sm:col-span-3">
                    Naar deze postcode leveren we niet via de webshop. Kies afhalen in Zele, of{" "}
                    <Link href="/offerte-aanvragen/" className="font-semibold underline">
                      vraag een offerte
                    </Link>{" "}
                    met levering.
                  </p>
                )}
              </>
            )}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-ink/75">
            <input type="checkbox" checked={business} onChange={(e) => setBusiness(e.target.checked)} className="h-4 w-4 accent-accent" />
            <Building2 className="h-4 w-4 text-ink/50" aria-hidden /> Factuur op bedrijfsnaam
          </label>
          {business && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Bedrijfsnaam">
                <input className={input} autoComplete="organization" value={f.company} onChange={(e) => set({ company: e.target.value })} />
              </Field>
              <Field label="Btw-nummer">
                <input className={input} placeholder="BE0123.456.789" value={f.vat} onChange={(e) => set({ vat: e.target.value })} />
              </Field>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">Betaling</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/60">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Alle betalingen zijn beveiligd.
          </p>
          <div className="mt-3">
            <Choice checked={method === "online"} onSelect={() => setMethod("online")} icon={<CreditCard className="h-4 w-4 text-accent" />} title="Online betalen">
              Bancontact, Visa, Mastercard, KBC/CBC, Belfius of iDEAL, via de beveiligde betaalpagina van MultiSafepay.
            </Choice>
            <Choice checked={method === "overschrijving"} onSelect={() => setMethod("overschrijving")} icon={<Landmark className="h-4 w-4 text-accent" />} title="Overschrijving">
              U krijgt ons rekeningnummer en een gestructureerde mededeling (met QR-code). We maken de bestelling klaar zodra de betaling binnen is.
            </Choice>
          </div>
        </section>

        <section>
          <Field label="Opmerking (optioneel)">
            <textarea rows={3} className={`${input} resize-y`} placeholder="Bijvoorbeeld wanneer u het nodig hebt of waar we mogen leveren." value={f.remarks} onChange={(e) => set({ remarks: e.target.value })} />
          </Field>
        </section>

        {/* Honeypot: hidden from people, filled in by bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="absolute left-[-9999px] h-px w-px opacity-0"
        />

        <div className="space-y-4 border-t border-line pt-6">
          <label className="flex items-start gap-3 text-sm leading-6 text-ink/75">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} aria-invalid={Boolean(shown.terms)} className="mt-1 h-4 w-4 accent-accent" />
            <span>
              Ik ga akkoord met de{" "}
              <a href="/algemene-voorwaarden-van-beho-comm-v/" target="_blank" className="font-medium text-accent-deep underline">
                algemene voorwaarden
              </a>{" "}
              en de{" "}
              <a href="/privacyverklaring/" target="_blank" className="font-medium text-accent-deep underline">
                privacyverklaring
              </a>
              .
            </span>
          </label>
          {shown.terms && <p className="-mt-2 text-xs font-medium text-red-700">{shown.terms}</p>}
          {error && (
            <p role="alert" className="rounded-xl border border-red-600/30 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "sending" || blocked || !quote}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
          >
            <Lock className="h-4 w-4" aria-hidden />
            {status === "sending"
              ? "Even geduld…"
              : `${method === "online" ? "Betalen" : "Bestelling plaatsen"}${total !== null && !blocked ? ` · ${formatPrice(total)}` : ""}`}
          </button>
          <Link href="/winkelmandje/" className="inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-accent-deep">
            <ArrowLeft className="h-4 w-4" /> Terug naar het winkelmandje
          </Link>
        </div>
      </form>

      <aside className="order-1 lg:order-2">
        <div className="rounded-card border border-line bg-[#f7f5f1] p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 font-display text-lg font-semibold">Overzicht</h2>
          {summary}
        </div>
      </aside>
    </div>
  );
}
