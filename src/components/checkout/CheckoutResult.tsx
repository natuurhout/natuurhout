"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  CreditCard,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShoppingCart,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { clearCart } from "@/lib/cart";
import { formatPrice, getProduct } from "@/lib/catalog";
import { ADDRESS, EMAIL, PHONE, WHATSAPP } from "@/lib/contact";
import { HOURS_TEXT } from "@/lib/opening-hours";

/*
 * /afrekenen/bedankt/?o=NH-00012&t=<token>: where MultiSafepay sends the
 * customer back (also after a cancelled payment), and where a bank-transfer
 * order lands. Asks the Worker how the payment stands (/api/afrekenen/status/,
 * which checks MultiSafepay itself), and offers to pay again or switch to a
 * transfer when an online payment did not go through.
 *
 * Paid and bank-transfer orders get the full confirmation: a hero, "what
 * happens now" steps, the order summary and pickup/delivery details.
 */

type Line = { handle: string; product: string; label: string; qty: number; total: number };
type Status = {
  number: string;
  state: "betaald" | "bezig" | "mislukt" | "overschrijving" | "geannuleerd";
  total: number;
  method: string | null;
  paidWith: string;
  email: string;
  firstName?: string;
  delivery: boolean;
  place?: { street: string; postcode: string; city: string } | null;
  lines?: Line[];
  deliveryCost?: number;
  test: boolean;
  transfer: { holder: string; iban: string; bic: string; reference: string; amount: number; days: number } | null;
};

const card = "rounded-card border border-line bg-white";

function imageOf(handle: string): string | null {
  const src = handle ? getProduct(handle)?.images[0]?.src : undefined;
  return src ? `${src}${src.includes("?") ? "&" : "?"}width=120` : null;
}

function CopyValue({ value, mono = true }: { value: string; mono?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <span className="flex items-center justify-between gap-3">
      <span className={`${mono ? "font-mono" : ""} break-all font-semibold text-ink`}>{value}</span>
      <button
        type="button"
        onClick={() =>
          navigator.clipboard
            ?.writeText(value.replace(/\s/g, value.startsWith("+++") ? "" : " "))
            .then(() => {
              setDone(true);
              setTimeout(() => setDone(false), 1500);
            })
            .catch(() => {})
        }
        className="inline-flex flex-none items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink/65 transition-colors hover:border-accent hover:text-accent-deep"
        aria-label={`${value} kopiëren`}
      >
        {done ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
        {done ? "Gekopieerd" : "Kopieer"}
      </button>
    </span>
  );
}

type Step = { title: string; text: ReactNode; done?: boolean; current?: boolean; icon: typeof Check };

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const Icon = step.done ? Check : step.icon;
        const last = i === steps.length - 1;
        return (
          <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span aria-hidden className={`absolute left-[17px] top-10 bottom-1 w-px ${step.done ? "bg-emerald-300" : "bg-line"}`} />
            )}
            <span
              className={`relative z-10 grid h-9 w-9 flex-none place-items-center rounded-full ${
                step.done
                  ? "bg-emerald-600 text-white"
                  : step.current
                    ? "bg-accent text-white ring-4 ring-accent/15"
                    : "border border-line bg-white text-ink/45"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="pt-1.5">
              <p className={`text-sm font-semibold ${step.done || step.current ? "text-ink" : "text-ink/60"}`}>
                {step.title}
                {step.done && <span className="sr-only"> (klaar)</span>}
              </p>
              <p className="mt-0.5 text-sm leading-6 text-ink/65">{step.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Summary({ s }: { s: Status }) {
  const lines = s.lines ?? [];
  const delivery = s.deliveryCost ?? 0;
  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);
  return (
    <section aria-label="Overzicht van uw bestelling" className={`${card} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 border-b border-line bg-[#f7f5f1] px-5 py-4 sm:px-6">
        <h2 className="font-display text-lg font-semibold text-ink">Uw bestelling</h2>
        <span className="rounded-full bg-white px-3 py-1 font-mono text-xs font-semibold text-ink/75 ring-1 ring-line">{s.number}</span>
      </div>
      {lines.length > 0 && (
        <ul className="divide-y divide-line px-5 sm:px-6">
          {lines.map((line, i) => {
            const img = imageOf(line.handle);
            return (
              <li key={`${line.handle}-${i}`} className="flex items-center gap-3.5 py-3.5 text-sm">
                <span className="relative grid h-14 w-14 flex-none place-items-center rounded-lg border border-line bg-[#f7f5f1] text-ink/35">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-full w-full rounded-lg object-cover" loading="lazy" />
                  ) : (
                    <Package className="h-5 w-5" aria-hidden />
                  )}
                  <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-ink/75 px-1 text-[11px] font-semibold text-white">
                    {line.qty}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-5 text-ink">{line.product}</span>
                  {line.label && <span className="block text-ink/60">{line.label}</span>}
                </span>
                <span className="font-semibold tabular-nums text-ink">{formatPrice(line.total)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <dl className="space-y-2 border-t border-line px-5 py-4 text-sm sm:px-6">
        {lines.length > 0 && (
          <div className="flex justify-between text-ink/70">
            <dt>Subtotaal</dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
        )}
        <div className="flex justify-between text-ink/70">
          <dt>{s.delivery ? "Levering" : "Afhalen in Zele"}</dt>
          <dd className="tabular-nums">{s.delivery ? formatPrice(delivery) : "Gratis"}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="font-semibold text-ink">Totaal</dt>
          <dd className="font-display text-2xl font-semibold tabular-nums text-ink">{formatPrice(s.total)}</dd>
        </div>
        <p className="text-right text-xs text-ink/50">incl. 21% btw</p>
      </dl>
    </section>
  );
}

function Help() {
  const link =
    "flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent-deep";
  return (
    <section aria-label="Vragen" className={`${card} p-5 sm:p-6`}>
      <h2 className="font-display text-lg font-semibold text-ink">Vragen over uw bestelling?</h2>
      <p className="mt-1 text-sm text-ink/65">Vermeld uw bestelnummer, dan helpen we u meteen verder.</p>
      <div className="mt-4 grid gap-2.5">
        <a href={PHONE.href} className={link}>
          <Phone className="h-4 w-4 text-accent" aria-hidden /> Bel {PHONE.label}
        </a>
        <a href={WHATSAPP.href} target="_blank" rel="noopener noreferrer" className={link}>
          <MessageCircle className="h-4 w-4 text-[#25d366]" aria-hidden /> WhatsApp
        </a>
        <a href={EMAIL.href} className={link}>
          <Mail className="h-4 w-4 text-accent" aria-hidden /> {EMAIL.label}
        </a>
      </div>
    </section>
  );
}

function Where({ s }: { s: Status }) {
  if (s.delivery && s.place) {
    return (
      <section aria-label="Leveradres" className={`${card} flex gap-4 p-5 sm:p-6`}>
        <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-accent/10 text-accent-deep">
          <Truck className="h-5 w-5" aria-hidden />
        </span>
        <div className="text-sm leading-6">
          <h2 className="font-semibold text-ink">Wij leveren op</h2>
          <p className="text-ink/70">
            {s.place.street}
            <br />
            {s.place.postcode} {s.place.city}
          </p>
          <p className="mt-1.5 text-ink/60">Wij voeren de leveringen zelf uit en contacteren u op voorhand wanneer we komen leveren.</p>
        </div>
      </section>
    );
  }
  return (
    <section aria-label="Afhaaladres" className={`${card} flex flex-wrap gap-4 p-5 sm:p-6`}>
      <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-accent/10 text-accent-deep">
        <Store className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-sm leading-6">
        <h2 className="font-semibold text-ink">Afhalen in Zele</h2>
        <p className="text-ink/70">
          {ADDRESS.street}, {ADDRESS.city}
        </p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 text-ink/65">
          {HOURS_TEXT.map((h) => (
            <div key={h.days} className="contents">
              <dt>{h.days}</dt>
              <dd className="tabular-nums">{h.hours}</dd>
            </div>
          ))}
        </dl>
        <a
          href={ADDRESS.maps}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 font-semibold text-accent-deep hover:text-ink"
        >
          <MapPin className="h-4 w-4" aria-hidden /> Route plannen
        </a>
      </div>
    </section>
  );
}

function Hero({ icon, tone, eyebrow, title, children }: { icon: ReactNode; tone: "ok" | "wait"; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
      <span
        className={`grid h-16 w-16 flex-none place-items-center rounded-full ${
          tone === "ok" ? "bg-emerald-600 text-white ring-8 ring-emerald-600/10" : "bg-accent text-white ring-8 ring-accent/10"
        } motion-safe:animate-[pop_.5s_ease-out]`}
      >
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">{eyebrow}</p>
        <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-xl text-base leading-7 text-ink/70">{children}</p>
      </div>
    </div>
  );
}

function Confirmation({ s }: { s: Status }) {
  const paid = s.state === "betaald";
  const name = s.firstName ? `, ${s.firstName}` : "";
  const finalStep: Step = s.delivery
    ? { title: "Levering", icon: Truck, text: "Wij voeren de levering zelf uit en contacteren u op voorhand wanneer we komen leveren." }
    : { title: "Afhalen in Zele", icon: Store, text: "We laten u weten wanneer uw bestelling klaarstaat." };
  const steps: Step[] = paid
    ? [
        { title: "Betaling ontvangen", icon: CreditCard, done: true, text: s.paidWith ? `Betaald met ${s.paidWith}.` : "Uw betaling is binnen." },
        { title: "Factuur verstuurd", icon: Mail, done: true, text: <>Per mail naar <strong className="text-ink/80">{s.email}</strong>.</> },
        { title: "We maken uw bestelling klaar", icon: Package, current: true, text: "Alles wordt klaargezet op onze werf in Zele." },
        finalStep,
      ]
    : [
        { title: "Bestelling ontvangen", icon: ShoppingCart, done: true, text: <>Bevestiging met QR-code gemaild naar <strong className="text-ink/80">{s.email}</strong>.</> },
        { title: "Schrijf het bedrag over", icon: Landmark, current: true, text: `Binnen ${s.transfer?.days ?? 8} dagen, met de gestructureerde mededeling.` },
        { title: "We maken uw bestelling klaar", icon: Package, text: "Zodra uw betaling binnen is." },
        finalStep,
      ];

  return (
    <div className="space-y-8">
      {paid ? (
        <Hero icon={<Check className="h-8 w-8" strokeWidth={3} aria-hidden />} tone="ok" eyebrow={`Bestelling ${s.number}`} title={`Bedankt${name}!`}>
          Uw betaling van <strong className="text-ink">{formatPrice(s.total)}</strong> is gelukt. De factuur staat in uw mailbox.
        </Hero>
      ) : (
        <Hero icon={<Landmark className="h-7 w-7" aria-hidden />} tone="wait" eyebrow={`Bestelling ${s.number}`} title={`Bedankt${name}, nog één stap`}>
          Uw bestelling is ontvangen. Schrijf <strong className="text-ink">{formatPrice(s.transfer?.amount ?? s.total)}</strong> over en we gaan meteen aan de
          slag.
        </Hero>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
        <div className="space-y-6">
          {!paid && s.transfer && (
            <section aria-label="Betaalgegevens" className="overflow-hidden rounded-card border-2 border-accent/40 bg-white">
              <div className="flex items-center gap-2 bg-accent/10 px-5 py-3 text-sm font-semibold text-accent-deep sm:px-6">
                <Landmark className="h-4 w-4" aria-hidden /> Betaalgegevens
              </div>
              <dl className="divide-y divide-line px-5 text-sm sm:px-6">
                {[
                  ["Bedrag", <span key="a" className="font-display text-xl font-semibold tabular-nums">{formatPrice(s.transfer.amount)}</span>],
                  ["Rekening (IBAN)", <CopyValue key="i" value={s.transfer.iban} />],
                  ["Gestructureerde mededeling", <CopyValue key="r" value={s.transfer.reference} />],
                  ["Op naam van", <span key="h" className="font-semibold text-ink">{s.transfer.holder}</span>],
                  ["BIC", <span key="b" className="font-mono text-ink/80">{s.transfer.bic}</span>],
                ].map(([label, value]) => (
                  <div key={label as string} className="grid gap-1 py-3 sm:grid-cols-[13rem_1fr] sm:items-center">
                    <dt className="text-ink/60">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="border-t border-line bg-[#f7f5f1] px-5 py-3 text-xs leading-5 text-ink/60 sm:px-6">
                Liever scannen? In de mail staat een QR-code voor uw bankapp. Gebruik de mededeling precies zo, dan koppelen we uw betaling meteen.
              </p>
            </section>
          )}

          <section aria-label="Wat gebeurt er nu?" className={`${card} p-5 sm:p-6`}>
            <h2 className="mb-5 font-display text-lg font-semibold text-ink">Wat gebeurt er nu?</h2>
            <Steps steps={steps} />
          </section>

          <Where s={s} />
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <Summary s={s} />
          <Help />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <Link
          href="/shop/"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-deep"
        >
          Verder winkelen <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link href="/" className="inline-flex items-center rounded-full border border-brand/25 bg-white px-6 py-3 text-sm font-semibold text-ink hover:border-accent hover:text-accent-deep">
          Naar de homepage
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutResult() {
  const [params, setParams] = useState<{ o: string; t: string; cancelled: boolean; failed: boolean } | null>(null);
  const [s, setS] = useState<Status | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setParams({ o: q.get("o") ?? "", t: q.get("t") ?? "", cancelled: q.has("geannuleerd"), failed: q.has("mislukt") });
  }, []);

  const load = useCallback(async () => {
    if (!params) return;
    try {
      const r = await fetch(`/api/afrekenen/status/?o=${encodeURIComponent(params.o)}&t=${encodeURIComponent(params.t)}`, { cache: "no-store" });
      if (!r.ok) {
        setError("We vinden deze bestelling niet. Kijk in uw mailbox of neem contact op.");
        return;
      }
      setS((await r.json()) as Status);
    } catch {
      setError("Geen verbinding. Herlaad de pagina.");
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  // A payment that is still being processed: ask again for about a minute.
  useEffect(() => {
    if (s?.state !== "bezig" || params?.cancelled || params?.failed || tries >= 20) return;
    const timer = setTimeout(() => {
      setTries((n) => n + 1);
      load();
    }, 3000);
    return () => clearTimeout(timer);
  }, [s, tries, load, params]);

  useEffect(() => {
    if (s?.state === "betaald" || s?.state === "overschrijving") clearCart();
  }, [s?.state]);

  async function again(method: "online" | "overschrijving") {
    if (!params) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/afrekenen/opnieuw/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ o: params.o, t: params.t, method }),
      });
      const result = (await r.json().catch(() => ({}))) as { redirect?: string; error?: string };
      if (r.ok && result.redirect) {
        window.location.href = result.redirect;
        return;
      }
      setError(result.error || "Dat lukte niet. Probeer het opnieuw.");
    } catch {
      setError("Geen verbinding. Probeer het opnieuw.");
    }
    setBusy(false);
  }

  const box = `${card} mx-auto max-w-xl p-8 text-center sm:p-10`;
  const helpLine = (
    <p className="mt-6 text-center text-sm text-ink/60">
      Vragen? Bel {PHONE.label} of mail {EMAIL.label} met uw bestelnummer.
    </p>
  );

  if (error && !s)
    return (
      <div className={box}>
        <XCircle className="mx-auto h-10 w-10 text-ink/40" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold">Bestelling niet gevonden</h1>
        <p className="mt-2 text-sm text-ink/70">{error}</p>
        {helpLine}
      </div>
    );
  if (!s)
    return (
      <div className={box}>
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-accent" aria-hidden />
        <h1 className="mt-4 font-display text-2xl font-semibold">Even geduld…</h1>
        <p className="mt-2 text-sm text-ink/70">We kijken hoe uw betaling staat.</p>
      </div>
    );

  const failed = s.state === "mislukt" || (s.state === "bezig" && (params?.cancelled || params?.failed));
  return (
    <div>
      {s.test && <p className="mb-6 rounded-xl bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900">Testmodus: er werd niet echt betaald.</p>}

      {(s.state === "betaald" || (s.state === "overschrijving" && s.transfer)) && <Confirmation s={s} />}

      {s.state === "bezig" && !failed && (
        <div className={box}>
          <Loader2 className={`mx-auto h-10 w-10 text-accent ${tries < 20 ? "animate-spin" : ""}`} aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-semibold">Uw betaling wordt verwerkt</h1>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            Bestelling <strong>{s.number}</strong>. Dit duurt meestal enkele seconden.{" "}
            {tries >= 20 ? "Het duurt langer dan normaal: u krijgt een mail zodra de betaling bevestigd is." : ""}
          </p>
          {helpLine}
        </div>
      )}

      {failed && (
        <div className={box}>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
            <XCircle className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold">De betaling is niet gelukt</h1>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            Uw bestelling <strong>{s.number}</strong> ({formatPrice(s.total)}) staat klaar, maar is nog niet betaald. Probeer opnieuw, of betaal via overschrijving.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => again("online")}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" aria-hidden /> Opnieuw online betalen
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => again("overschrijving")}
              className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-accent disabled:opacity-60"
            >
              <Landmark className="h-4 w-4" aria-hidden /> Betalen via overschrijving
            </button>
          </div>
          {error && <p className="mt-4 text-sm font-medium text-red-700">{error}</p>}
          {helpLine}
        </div>
      )}

      {s.state === "geannuleerd" && (
        <div className={box}>
          <XCircle className="mx-auto h-10 w-10 text-ink/40" aria-hidden />
          <h1 className="mt-4 font-display text-2xl font-semibold">Deze bestelling is geannuleerd</h1>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            Bestelling {s.number} werd niet betaald en is geannuleerd. Wilt u ze toch? Plaats ze opnieuw of bel {PHONE.label}.
          </p>
          <Link href="/shop/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-deep">
            Naar de shop <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}
