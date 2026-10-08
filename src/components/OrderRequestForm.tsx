"use client";

import { Send } from "lucide-react";
import { useRef, useState } from "react";
import { formatPrice } from "@/lib/catalog";

/*
 * Order for products that are not in stock ("op bestelling"). Instead of a
 * dead "Uitverkocht", the customer sends the chosen lines with their details;
 * the request lands in Natuurhout's inbox through /api/offerte (Reply-To is
 * the customer) and the customer gets a confirmation with the overview.
 * Natuurhout then mails the delivery term.
 */

export type RequestLine = { group: string; label: string; detail: string; qty: number; unit: number };

const ADDRESS = "info@natuurhout.be";
const input =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 aria-[invalid=true]:border-red-600";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-700">{error}</span>}
    </label>
  );
}

export default function OrderRequestForm({ lines }: { lines: RequestLine[] }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", delivery: false, street: "", postcode: "", city: "", remarks: "" });
  const [agreed, setAgreed] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "mailto">("idle");
  const [confirmed, setConfirmed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }));

  const errors: Record<string, string> = {};
  if (!f.name.trim()) errors.name = "Vul uw naam in.";
  if (!EMAIL.test(f.email.trim())) errors.email = "Vul een geldig e-mailadres in.";
  if (f.delivery && !f.postcode.trim()) errors.postcode = "Vul de postcode in voor de levering.";
  if (!agreed) errors.agree = "Vink dit aan om uw aanvraag te versturen.";
  const shown: Record<string, string | undefined> = attempted ? errors : {};

  const total = lines.reduce((sum, l) => sum + l.qty * l.unit, 0);
  const groups = [...new Set(lines.map((l) => l.group))];

  function text(page: string) {
    return [
      "Aanvraag op bestelling",
      `Pagina: ${page}`,
      "",
      ...groups.flatMap((g) => [
        g,
        ...lines
          .filter((l) => l.group === g)
          .map((l) => `- ${l.qty} × ${l.label} (${l.detail}) à ${formatPrice(l.unit)} = ${formatPrice(l.qty * l.unit)}`),
        "",
      ]),
      `Totaal incl. btw: ${formatPrice(total)}`,
      "",
      `Naam: ${f.name.trim()}`,
      `E-mail: ${f.email.trim()}`,
      ...(f.phone.trim() ? [`Telefoon: ${f.phone.trim()}`] : []),
      f.delivery
        ? `Levering: ja, naar ${[f.street.trim(), `${f.postcode.trim()} ${f.city.trim()}`.trim()].filter(Boolean).join(", ")}`
        : "Levering: nee, wordt afgehaald in Zele",
      f.remarks.trim() ? `\nOpmerking:\n${f.remarks.trim()}` : "",
    ]
      .filter((line, i, all) => line !== "" || all[i - 1] !== "")
      .join("\n");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(errors).length) {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    const page = window.location.pathname;
    setStatus("sending");
    try {
      const response = await fetch("/api/offerte/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "bestelling",
          page,
          ...f,
          lines,
          total,
          text: text(page),
          website: honeypot,
          elapsedMs: Math.round(performance.now()),
        }),
      });
      if (response.ok) {
        const result = (await response.json().catch(() => ({}))) as { confirmed?: boolean };
        setConfirmed(Boolean(result.confirmed));
        setStatus("sent");
      } else if (response.status === 503) {
        // Sending not set up on this deployment: hand over to the mail program.
        const subject = `Aanvraag op bestelling – ${f.name.trim()}`;
        window.location.href = `mailto:${ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text(page))}`;
        setStatus("mailto");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-card border border-emerald-600/30 bg-emerald-50 p-5 text-sm leading-6 text-ink">
        <p className="font-display text-lg font-semibold">Bedankt, uw aanvraag is verstuurd!</p>
        <p className="mt-1 text-ink/75">
          {confirmed ? "U ontvangt zo dadelijk een bevestiging met het overzicht per mail. " : ""}
          We bekijken uw aanvraag zo snel mogelijk en laten u de levertermijn per mail weten.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="relative space-y-4 rounded-card border border-line bg-white p-4 sm:p-5">
      <div>
        <h3 className="font-display text-lg font-semibold">Aanvragen op bestelling</h3>
        <p className="mt-1 text-sm text-ink/65">
          We bekijken uw aanvraag en mailen u de levertermijn en hoe het verder gaat.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Naam *" error={shown.name}>
          <input className={input} autoComplete="name" value={f.name} aria-invalid={Boolean(shown.name)} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="E-mailadres *" error={shown.email}>
          <input type="email" className={input} autoComplete="email" value={f.email} aria-invalid={Boolean(shown.email)} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Telefoon of gsm">
          <input type="tel" className={input} autoComplete="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />
        </Field>
        <div className="text-sm">
          <span className="mb-1 block font-medium text-ink">Levering</span>
          <div className="flex gap-2">
            {[
              { value: false, label: "Ik haal af in Zele" },
              { value: true, label: "Leveren" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={f.delivery === o.value}
                onClick={() => set({ delivery: o.value })}
                className={`flex-1 rounded-full border px-3 py-2.5 text-sm font-medium transition-colors ${
                  f.delivery === o.value ? "border-accent bg-accent text-white" : "border-brand/25 bg-white hover:border-accent"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {f.delivery && (
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
          <Field label="Straat en nummer">
            <input className={input} autoComplete="street-address" value={f.street} onChange={(e) => set({ street: e.target.value })} />
          </Field>
          <Field label="Postcode *" error={shown.postcode}>
            <input className={input} inputMode="numeric" autoComplete="postal-code" value={f.postcode} aria-invalid={Boolean(shown.postcode)} onChange={(e) => set({ postcode: e.target.value })} />
          </Field>
          <Field label="Gemeente">
            <input className={input} autoComplete="address-level2" value={f.city} onChange={(e) => set({ city: e.target.value })} />
          </Field>
          <p className="text-xs text-ink/55 sm:col-span-3">De leveringskosten hangen af van de locatie; we laten ze u weten.</p>
        </div>
      )}
      <Field label="Opmerking">
        <textarea
          rows={3}
          className={`${input} resize-y`}
          placeholder="Bijvoorbeeld een andere maat, enkele of dubbele poort, of wanneer u het nodig hebt."
          value={f.remarks}
          onChange={(e) => set({ remarks: e.target.value })}
        />
      </Field>
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
      <div>
        <label className="flex items-start gap-3 text-sm leading-6 text-ink/70">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            aria-invalid={Boolean(shown.agree)}
            className="mt-1 h-4 w-4 accent-accent"
          />
          Ik ga ermee akkoord dat Natuurhout mijn gegevens gebruikt om deze aanvraag te beantwoorden.
        </label>
        {shown.agree && <p className="mt-1 text-xs font-medium text-red-700">{shown.agree}</p>}
      </div>
      {status === "error" && (
        <p className="text-sm font-medium text-red-700">
          Versturen lukte niet. Probeer het opnieuw, bel 052 55 88 58 of mail naar {ADDRESS}.
        </p>
      )}
      {status === "mailto" && (
        <p className="text-sm text-ink/70">Uw mailprogramma is geopend met de aanvraag — verstuur die mail naar {ADDRESS}.</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60 sm:w-auto"
      >
        <Send className="h-4 w-4" />
        {status === "sending" ? "Bezig met versturen…" : `Aanvraag versturen (${formatPrice(total)})`}
      </button>
    </form>
  );
}
