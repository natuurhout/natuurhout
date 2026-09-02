"use client";

import { FormEvent, useState } from "react";

const fieldClass =
  "mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

type Props = { kind: "contact" | "offerte" };

export default function EmailRequestForm({ kind }: Props) {
  const [opened, setOpened] = useState(false);
  const isQuote = kind === "offerte";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lines = Array.from(data.entries()).map(([key, value]) => `${key}: ${String(value)}`);
    const subject = isQuote ? "Offerteaanvraag via natuurhout.be" : "Vraag via natuurhout.be";
    window.location.href = `mailto:info@natuurhout.be?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setOpened(true);
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-line bg-white p-6 shadow-sm sm:p-9">
      {isQuote && (
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Waarvoor wilt u een offerte?</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {["Kastanje Rasterwerk", "Hazelaar Rasterwerk", "Robinia Rasterwerk", "Vlechtschermen", "Post & Rail", "Lariks schaaldelen", "Poorten", "Palen", "Plaatsing"].map((option) => (
              <label key={option} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm text-ink/75">
                <input type="checkbox" name="Product" value={option} className="h-4 w-4 accent-accent" />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className={`grid gap-5 ${isQuote ? "mt-7" : ""} sm:grid-cols-2`}>
        <label className="text-sm font-medium text-ink">
          Naam
          <input className={fieldClass} name="Naam" autoComplete="name" required />
        </label>
        <label className="text-sm font-medium text-ink">
          E-mail
          <input className={fieldClass} name="E-mail" type="email" autoComplete="email" required />
        </label>
        {isQuote && (
          <>
            <label className="text-sm font-medium text-ink">
              Telefoon
              <input className={fieldClass} name="Telefoon" type="tel" autoComplete="tel" />
            </label>
            <label className="text-sm font-medium text-ink">
              Aantal meter / stuks
              <input className={fieldClass} name="Aantal meter of stuks" />
            </label>
            <label className="text-sm font-medium text-ink sm:col-span-2">
              Adres
              <input className={fieldClass} name="Adres" autoComplete="street-address" />
            </label>
            <label className="text-sm font-medium text-ink">
              Postcode
              <input className={fieldClass} name="Postcode" autoComplete="postal-code" />
            </label>
            <label className="text-sm font-medium text-ink">
              Stad
              <input className={fieldClass} name="Stad" autoComplete="address-level2" />
            </label>
          </>
        )}
        <label className="text-sm font-medium text-ink sm:col-span-2">
          {isQuote ? "Omschrijving en afmetingen" : "Uw bericht of vraag"}
          <textarea className={`${fieldClass} min-h-40 resize-y`} name="Bericht" required />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-ink/65">
        <input type="checkbox" required className="mt-1 h-4 w-4 accent-accent" />
        Ik ga ermee akkoord dat Natuurhout mijn gegevens gebruikt om deze aanvraag te beantwoorden.
      </label>

      <button type="submit" className="mt-6 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent-deep">
        Open in mijn e-mailprogramma
      </button>
      <p className="mt-3 text-xs leading-5 text-ink/55">
        U controleert en verstuurt het bericht zelf in uw e-mailprogramma. Voeg daar desgewenst foto&apos;s of plannen toe.
      </p>
      {opened && <p className="mt-3 text-sm font-medium text-accent">Uw e-mailprogramma werd geopend.</p>}
    </form>
  );
}
