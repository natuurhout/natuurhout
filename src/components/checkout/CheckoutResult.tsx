"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, CreditCard, Landmark, Loader2, XCircle } from "lucide-react";
import { clearCart } from "@/lib/cart";
import { formatPrice } from "@/lib/catalog";
import { PHONE } from "@/lib/contact";

/*
 * /afrekenen/bedankt/?o=NH-00012&t=<token>: where MultiSafepay sends the
 * customer back (also after a cancelled payment), and where a bank-transfer
 * order lands. Asks the Worker how the payment stands (/api/afrekenen/status/,
 * which checks MultiSafepay itself), and offers to pay again or switch to a
 * transfer when an online payment did not go through.
 */

type Status = {
  number: string;
  state: "betaald" | "bezig" | "mislukt" | "overschrijving" | "geannuleerd";
  total: number;
  method: string | null;
  paidWith: string;
  email: string;
  delivery: boolean;
  test: boolean;
  transfer: { holder: string; iban: string; bic: string; reference: string; amount: number; days: number } | null;
};

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

  const box = "rounded-card border border-line bg-white p-6 sm:p-8";
  if (error && !s) return <div className={box}><p className="text-sm text-red-700">{error}</p></div>;
  if (!s)
    return (
      <div className={`${box} flex items-center gap-3 text-sm text-ink/70`}>
        <Loader2 className="h-5 w-5 animate-spin text-accent" /> Even kijken hoe uw betaling staat…
      </div>
    );

  const failed = s.state === "mislukt" || (s.state === "bezig" && (params?.cancelled || params?.failed));
  return (
    <div className="max-w-2xl space-y-4">
      {s.test && <p className="rounded-xl bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900">Testmodus: er werd niet echt betaald.</p>}

      {s.state === "betaald" && (
        <div className={box}>
          <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden />
          <h2 className="mt-3 font-display text-2xl font-semibold">Bedankt, uw betaling is gelukt!</h2>
          <p className="mt-2 text-sm leading-6 text-ink/75">
            Bestelling <strong>{s.number}</strong> · {formatPrice(s.total)}
            {s.paidWith ? ` · betaald met ${s.paidWith}` : ""}. U krijgt de factuur per mail op <strong>{s.email}</strong>.{" "}
            {s.delivery ? "We bellen u om de levering af te spreken." : "We laten u weten wanneer u de bestelling in Zele kunt afhalen."}
          </p>
        </div>
      )}

      {s.state === "overschrijving" && s.transfer && (
        <div className={box}>
          <Landmark className="h-9 w-9 text-accent" aria-hidden />
          <h2 className="mt-3 font-display text-2xl font-semibold">Bedankt voor uw bestelling!</h2>
          <p className="mt-2 text-sm leading-6 text-ink/75">
            Bestelling <strong>{s.number}</strong>. Schrijf het bedrag over binnen {s.transfer.days} dagen; zodra de betaling binnen is, maken we de bestelling klaar. U kreeg
            dit ook per mail op <strong>{s.email}</strong>, met een QR-code voor uw bankapp.
          </p>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-xl bg-[#f7f5f1] p-4 text-sm">
            <dt className="text-ink/60">Bedrag</dt>
            <dd className="font-semibold tabular-nums">{formatPrice(s.transfer.amount)}</dd>
            <dt className="text-ink/60">Rekening</dt>
            <dd className="font-mono">{s.transfer.iban}</dd>
            <dt className="text-ink/60">BIC</dt>
            <dd className="font-mono">{s.transfer.bic}</dd>
            <dt className="text-ink/60">Op naam van</dt>
            <dd>{s.transfer.holder}</dd>
            <dt className="text-ink/60">Mededeling</dt>
            <dd className="font-mono font-semibold">{s.transfer.reference}</dd>
          </dl>
        </div>
      )}

      {s.state === "bezig" && !failed && (
        <div className={box}>
          <Clock className="h-9 w-9 text-accent" aria-hidden />
          <h2 className="mt-3 font-display text-2xl font-semibold">Uw betaling wordt verwerkt</h2>
          <p className="mt-2 text-sm leading-6 text-ink/75">
            Bestelling <strong>{s.number}</strong>. Dit duurt meestal enkele seconden. {tries >= 20 ? "Het duurt langer dan normaal: u krijgt een mail zodra de betaling bevestigd is." : ""}
          </p>
          {tries < 20 && <Loader2 className="mt-4 h-5 w-5 animate-spin text-accent" aria-hidden />}
        </div>
      )}

      {failed && (
        <div className={box}>
          <XCircle className="h-9 w-9 text-red-600" aria-hidden />
          <h2 className="mt-3 font-display text-2xl font-semibold">De betaling is niet gelukt</h2>
          <p className="mt-2 text-sm leading-6 text-ink/75">
            Uw bestelling <strong>{s.number}</strong> ({formatPrice(s.total)}) staat klaar, maar is nog niet betaald. Probeer opnieuw, of betaal via overschrijving.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => again("online")}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" /> Opnieuw online betalen
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => again("overschrijving")}
              className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-accent disabled:opacity-60"
            >
              <Landmark className="h-4 w-4" /> Betalen via overschrijving
            </button>
          </div>
        </div>
      )}

      {s.state === "geannuleerd" && (
        <div className={box}>
          <XCircle className="h-9 w-9 text-ink/50" aria-hidden />
          <h2 className="mt-3 font-display text-2xl font-semibold">Deze bestelling is geannuleerd</h2>
          <p className="mt-2 text-sm leading-6 text-ink/75">
            Bestelling {s.number} werd niet betaald en is geannuleerd. Wilt u ze toch? Plaats ze opnieuw of bel {PHONE.label}.
          </p>
        </div>
      )}

      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      <p className="text-sm text-ink/60">
        Vragen? Bel {PHONE.label} of mail info@natuurhout.be met uw bestelnummer. <Link href="/shop/" className="font-medium text-accent-deep underline">Verder winkelen</Link>
      </p>
    </div>
  );
}
