"use client";

import { useRef, useState } from "react";
import { Check, Clock, Copy, Loader2, Mail, Truck } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import { contactErrors, lineDetail, quoteText, total, type Line, type State } from "@/components/calculator/model";
import { Chip, Field, Question, inputClass } from "@/components/calculator/ui";
import type { StepProps } from "@/components/calculator/Steps";

const QUOTE_ADDRESS = "info@natuurhout.be";

export function MaterialTable({ lines }: { lines: Line[] }) {
  if (!lines.length) return <p className="text-sm text-ink/60">U heeft nog niets gekozen.</p>;
  const groups = [...new Set(lines.map((l) => l.group))];
  const onRequest = lines.some((l) => l.unit === null);
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-line">
      <table className="w-full text-sm">
        <thead className="bg-brand-soft text-left">
          <tr>
            <th className="px-4 py-2.5 font-semibold">Product</th>
            <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Aantal</th>
            <th className="px-4 py-2.5 text-right font-semibold">Subtotaal</th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group} className="divide-y divide-brand/10 bg-white">
            <tr className="bg-ground">
              <th colSpan={3} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink/55">
                {group}
              </th>
            </tr>
            {lines
              .filter((l) => l.group === group)
              .map((l, i) => (
                <tr key={`${l.label}-${i}`}>
                  <td className="px-4 py-2.5">
                    {l.url ? (
                      <a href={l.url} target="_blank" rel="noopener" className="font-medium text-ink hover:text-accent hover:underline">
                        {l.label}
                      </a>
                    ) : (
                      <span className="font-medium text-ink">{l.label}</span>
                    )}
                    {l.order && (
                      <span className="ml-2 inline-block rounded-full bg-accent/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-accent-deep">
                        {l.order.badge === "Uitverkocht" ? "Uitverkocht · op bestelling" : l.order.badge}
                      </span>
                    )}
                    {l.detail && <span className="block text-xs text-ink/55">{l.detail}</span>}
                    <span className="mt-0.5 block text-xs text-ink/70 sm:hidden">
                      {l.unit === null ? `${l.qty} ×` : `${l.qty} × ${formatPrice(l.unit)}`}
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-2.5 text-ink/75 sm:table-cell">
                    {l.unit === null ? `${l.qty} ×` : `${l.qty} × ${formatPrice(l.unit)}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold">
                    {l.unit === null ? <span className="font-medium text-accent-deep">op aanvraag</span> : formatPrice(l.qty * l.unit)}
                  </td>
                </tr>
              ))}
          </tbody>
        ))}
        <tfoot className="bg-brand-dark text-white">
          <tr>
            <td className="hidden px-4 py-3 font-semibold sm:table-cell" colSpan={2}>
              Richtprijs materiaal, incl. btw{onRequest ? " (+ posten op aanvraag)" : ""}
            </td>
            <td className="px-4 py-3 font-semibold sm:hidden">
              Richtprijs materiaal, incl. btw{onRequest ? " (+ posten op aanvraag)" : ""}
            </td>
            <td className="px-4 py-3 text-right text-lg font-semibold">{formatPrice(total(lines))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** When it arrives: stock within the week, sold-out and made-to-order items as their term says. */
function DeliveryTerms({ lines }: { lines: Line[] }) {
  const notes = [...new Set(lines.flatMap((l) => (l.order ? [l.order.note] : [])))];
  return (
    <div className="mt-4 space-y-2.5 rounded-xl border border-line bg-white p-4 text-sm leading-6 text-ink/75">
      <p className="font-semibold text-ink">Levertermijn</p>
      <p className="flex gap-2">
        <Truck aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent" />
        <span>
          <strong className="text-ink">Op voorraad:</strong> binnen de week geleverd (vaak sneller als het dringend is), of af te halen in
          Zele.
        </span>
      </p>
      {notes.length > 0 && (
        <div className="flex gap-2">
          <Clock aria-hidden className="mt-1 h-4 w-4 shrink-0 text-accent-deep" />
          <div>
            <strong className="text-ink">Uitverkocht of op bestelling:</strong> u vraagt deze artikelen gewoon mee aan; prijs en
            levertermijn bevestigen we in uw offerte.
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-ink/65">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function OverviewStep({ state, update, lines }: StepProps & { lines: Line[] }) {
  const [attempted, setAttempted] = useState(false);
  // sent = delivered to our inbox; mailto = handed to the customer's mail program
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "mailto" | "error">("idle");
  const [honeypot, setHoneypot] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [agreed, setAgreed] = useState(false);
  const c = state.contact;
  const errors: Record<string, string> = {
    ...contactErrors(state),
    ...(agreed ? {} : { agree: "Vink dit aan om uw aanvraag te versturen." }),
  };
  const shown: Record<string, string | undefined> = attempted ? errors : {};
  const set = (patch: Partial<State["contact"]>) => update((s) => ({ ...s, contact: { ...s.contact, ...patch } }));
  const text = quoteText(state, lines);
  const subject = `Offerteaanvraag afsluiting – ${c.name.trim() || c.email.trim() || "natuurhout.be"}`;

  function openMailProgram() {
    window.location.href = `mailto:${QUOTE_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    setStatus("mailto");
  }

  async function submit() {
    setAttempted(true);
    if (Object.keys(errors).length) {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/offerte/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.name,
          email: c.email,
          phone: c.phone,
          delivery: c.delivery,
          street: c.street,
          postcode: c.postcode,
          city: c.city,
          remarks: c.remarks,
          lines: lines.map((l) => ({ group: l.group, label: l.label, detail: lineDetail(l), qty: l.qty, unit: l.unit })),
          total: total(lines),
          text,
          website: honeypot,
          // Time since the page opened, not since this step appeared: browser
          // autofill lets a real customer finish this last step in seconds.
          elapsedMs: Math.round(performance.now()),
        }),
      });
      if (response.ok) {
        const result = (await response.json().catch(() => ({}))) as { confirmed?: boolean };
        setConfirmed(Boolean(result.confirmed));
        setStatus("sent");
      }
      // Sending not set up on this deployment yet: hand over to the mail program.
      else if (response.status === 503) openMailProgram();
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`Aan: ${QUOTE_ADDRESS}\nOnderwerp: ${subject}\n\n${text}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-9">
      <div>
        <p className="font-semibold text-ink">Uw materiaallijst</p>
        <div className="mt-3">
          <MaterialTable lines={lines} />
        </div>
        <p className="mt-3 text-xs leading-5 text-ink/60">
          Indicatieve richtprijs op basis van de actuele webshopprijzen — geen offerte. Voorraad, maatwerk en levering
          bevestigen we in uw offerte.
        </p>
        <DeliveryTerms lines={lines} />
      </div>

      <div ref={formRef} className="relative space-y-7 border-t border-line pt-8">
        <div>
          <h2 className="font-display text-2xl font-semibold">Offerte aanvragen</h2>
          <p className="mt-1 text-sm text-ink/65">
            We sturen u een offerte op maat met deze materiaallijst. Voor een offerte volstaat uw e-mailadres; wilt u levering, dan
            vragen we ook uw naam, telefoonnummer en adres.
          </p>
        </div>

        <Question title="Opmerkingen" hint="Bijvoorbeeld de ondergrond, plaatsing, of iets wat u in de calculator niet vond.">
          <textarea
            value={c.remarks}
            onChange={(e) => set({ remarks: e.target.value })}
            rows={4}
            className={`${inputClass} min-h-28 resize-y`}
            aria-label="Opmerkingen"
          />
        </Question>

        <Question title="Levering" hint="We leveren zelf in heel België en delen van Nederland; wat op voorraad is binnen de week.">
          <div className="flex flex-wrap gap-2">
            <Chip active={!c.delivery} onClick={() => set({ delivery: false })}>Ik haal af in Zele</Chip>
            <Chip active={c.delivery} onClick={() => set({ delivery: true })}>Graag leveren</Chip>
          </div>
          {c.delivery && (
            <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1fr_1.5fr]">
              <Field label="Straat en nummer" required error={shown.street}>
                {(p) => <input {...p} className={inputClass} autoComplete="street-address" value={c.street} onChange={(e) => set({ street: e.target.value })} />}
              </Field>
              <Field label="Postcode" required error={shown.postcode}>
                {(p) => <input {...p} className={inputClass} inputMode="numeric" autoComplete="postal-code" value={c.postcode} onChange={(e) => set({ postcode: e.target.value })} />}
              </Field>
              <Field label="Gemeente" required error={shown.city}>
                {(p) => <input {...p} className={inputClass} autoComplete="address-level2" value={c.city} onChange={(e) => set({ city: e.target.value })} />}
              </Field>
              <p className="text-xs text-ink/60 sm:col-span-3">
                De leveringskosten bekijken we op basis van uw postcode en laten we u per mail weten. We bellen u om de levering af te spreken.
              </p>
            </div>
          )}
        </Question>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Naam" required={c.delivery} error={shown.name}>
            {(p) => <input {...p} className={inputClass} autoComplete="name" value={c.name} onChange={(e) => set({ name: e.target.value })} />}
          </Field>
          <Field label="E-mailadres" required error={shown.email} hint="Hierop sturen we uw offerte.">
            {(p) => <input {...p} type="email" className={inputClass} autoComplete="email" value={c.email} onChange={(e) => set({ email: e.target.value })} />}
          </Field>
          <Field
            label="Telefoon of gsm"
            required={c.delivery}
            error={shown.phone}
            hint={c.delivery ? "Nodig om de levering met u af te spreken." : "Handig als we iets willen nagaan."}
          >
            {(p) => <input {...p} type="tel" className={inputClass} autoComplete="tel" value={c.phone} onChange={(e) => set({ phone: e.target.value })} />}
          </Field>
        </div>

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

        {attempted && Object.keys(errors).length > 0 && (
          <p className="text-sm font-medium text-red-700">Vul de aangeduide velden aan.</p>
        )}

        {/* Honeypot: invisible to people, irresistible to form bots. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>

        {status === "sent" ? (
          <div role="status" className="rounded-xl border border-emerald-600/30 bg-emerald-50 p-5 text-sm text-ink/80">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <Check className="h-4 w-4 text-emerald-700" /> Uw aanvraag is verstuurd.
            </p>
            <p className="mt-1">
              Bedankt{c.name.trim() ? `, ${c.name.trim().split(" ")[0]}` : ""}. We bekijken uw aanvraag en antwoorden zo snel mogelijk op{" "}
              <strong>{c.email.trim()}</strong>.
            </p>
            {confirmed && (
              <p className="mt-1">U ontvangt zo dadelijk een bevestiging met een overzicht van uw aanvraag in uw mailbox.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={status === "sending"}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-70"
            >
              {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {status === "sending" ? "Bezig met versturen…" : "Offerte aanvragen"}
            </button>
            <p className="text-xs text-ink/55">We antwoorden op het e-mailadres dat u hierboven invulde.</p>
          </div>
        )}

        {status === "error" && (
          <div role="alert" className="rounded-xl border border-red-700/30 bg-red-50 p-4 text-sm text-ink/80">
            <p className="font-semibold text-red-800">Het versturen is niet gelukt.</p>
            <p className="mt-1">Probeer het opnieuw, of verstuur uw aanvraag via uw eigen e-mailprogramma.</p>
            <button
              type="button"
              onClick={openMailProgram}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
            >
              <Mail className="h-4 w-4" /> Open in mijn e-mailprogramma
            </button>
          </div>
        )}

        {status === "mailto" && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-ink/80">
            <p className="font-semibold text-ink">Uw e-mailprogramma werd geopend — verstuur het bericht daar om uw aanvraag af te ronden.</p>
            <p className="mt-1">
              Opende er niets? Kopieer dan uw aanvraag en mail ze naar{" "}
              <a href={`mailto:${QUOTE_ADDRESS}`} className="font-medium text-accent underline">{QUOTE_ADDRESS}</a>.
            </p>
            <button
              type="button"
              onClick={copy}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Gekopieerd" : "Kopieer mijn aanvraag"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
