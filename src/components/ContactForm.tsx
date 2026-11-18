"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import { useRef, useState } from "react";
import { Chip, Field, inputClass } from "@/components/calculator/ui";
import { EMAIL, MOBILE, PHONE } from "@/lib/contact";
import { trackLead } from "@/lib/tracking";

/*
 * The contact page's form: a question in a few words. It sends through
 * /api/offerte/ as kind "vraag" from /contact/, which the mails and the CRM
 * label as a question from the contact page (isContactMessage). A price for
 * a fence goes through the calculator or the quote page instead.
 */

const TOPICS = ["Een vraag over een product", "Advies voor mijn tuin", "Levering of afhalen", "Een bestelling", "Iets anders"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [topic, setTopic] = useState("");
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [agreed, setAgreed] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "mailto">("idle");
  const [confirmed, setConfirmed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }));

  const errors: Record<string, string> = {};
  if (!f.name.trim()) errors.name = "Vul uw naam in.";
  if (!EMAIL_PATTERN.test(f.email.trim())) errors.email = "Vul een geldig e-mailadres in.";
  if (f.phone.trim() && !/^[+()\d\s./-]{6,}$/.test(f.phone.trim())) errors.phone = "Dit telefoonnummer lijkt niet te kloppen.";
  if (f.message.trim().length < 5) errors.message = "Schrijf kort uw vraag.";
  if (!agreed) errors.agree = "Vink dit aan om uw bericht te versturen.";
  const shown: Record<string, string | undefined> = attempted ? errors : {};

  function text() {
    return [
      "Vraag via de contactpagina",
      "",
      `Onderwerp: ${topic || "niet aangeduid"}`,
      "",
      f.message.trim(),
      "",
      `Naam: ${f.name.trim()}`,
      `E-mail: ${f.email.trim()}`,
      ...(f.phone.trim() ? [`Telefoon: ${f.phone.trim()}`] : []),
    ].join("\n");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
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
          kind: "vraag",
          page: "/contact/",
          name: f.name,
          email: f.email,
          phone: f.phone,
          delivery: false,
          text: text(),
          website: honeypot,
          elapsedMs: Math.round(performance.now()),
        }),
      });
      if (response.ok) {
        const result = (await response.json().catch(() => ({}))) as { confirmed?: boolean };
        setConfirmed(Boolean(result.confirmed));
        setStatus("sent");
        trackLead("contact");
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (response.status === 503) {
        // Sending not set up on this deployment: hand over to the mail program.
        const subject = `Vraag via de website – ${f.name.trim()}`;
        window.location.href = `${EMAIL.href}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text())}`;
        setStatus("mailto");
      } else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-card border border-emerald-600/30 bg-emerald-50 p-6 sm:p-8">
        <CheckCircle2 aria-hidden className="h-8 w-8 text-emerald-600" />
        <p className="mt-3 font-display text-2xl font-semibold">Bedankt, uw bericht is verstuurd!</p>
        <p className="mt-2 max-w-2xl leading-7 text-ink/75">
          {confirmed ? "U ontvangt zo dadelijk een bevestiging per mail. " : ""}
          We antwoorden zo snel mogelijk op {f.email.trim()}.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="relative scroll-mt-24 space-y-6 rounded-card border border-line bg-white p-5 sm:p-8">
      <div>
        <p className="text-sm font-semibold text-ink">Waarover gaat het?</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {TOPICS.map((item) => (
            <Chip key={item} active={topic === item} onClick={() => setTopic(topic === item ? "" : item)}>
              {item}
            </Chip>
          ))}
        </div>
      </div>

      <Field label="Uw vraag of bericht" required error={shown.message}>
        {(p) => (
          <textarea
            {...p}
            rows={5}
            className={`${inputClass} min-h-32 resize-y`}
            placeholder="Bijvoorbeeld: welke hoogte raden jullie aan voor een kleine hond?"
            value={f.message}
            onChange={(e) => set({ message: e.target.value })}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Naam" required error={shown.name}>
          {(p) => <input {...p} className={inputClass} autoComplete="name" value={f.name} onChange={(e) => set({ name: e.target.value })} />}
        </Field>
        <Field label="E-mailadres" required error={shown.email} hint={shown.email ? undefined : "Hierop antwoorden we."}>
          {(p) => <input {...p} type="email" className={inputClass} autoComplete="email" value={f.email} onChange={(e) => set({ email: e.target.value })} />}
        </Field>
        <Field label="Telefoon of gsm" error={shown.phone} hint={shown.phone ? undefined : "Liever teruggebeld? Vul uw nummer in."}>
          {(p) => <input {...p} type="tel" className={inputClass} autoComplete="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />}
        </Field>
      </div>

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
          Ik ga ermee akkoord dat Natuurhout mijn gegevens gebruikt om mijn vraag te beantwoorden.
        </label>
        {shown.agree && <p className="mt-1 text-xs font-medium text-red-700">{shown.agree}</p>}
      </div>

      {status === "error" && (
        <p className="text-sm font-medium text-red-700">
          Versturen lukte niet. Probeer het opnieuw, bel {PHONE.label} of {MOBILE.label}, of mail naar {EMAIL.label}.
        </p>
      )}
      {status === "mailto" && (
        <p className="text-sm text-ink/70">Uw mailprogramma is geopend met uw bericht — verstuur die mail naar {EMAIL.label}.</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-deep disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Send aria-hidden className="h-4 w-4" />}
        {status === "sending" ? "Bezig met versturen…" : "Bericht versturen"}
      </button>
    </form>
  );
}
