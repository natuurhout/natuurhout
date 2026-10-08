"use client";

import { Camera, CheckCircle2, Loader2, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { Chip, Field, Question, inputClass } from "@/components/calculator/ui";
import { EMAIL, PHONE } from "@/lib/contact";

/*
 * Free quote request for everything the calculator does not cover: made to
 * measure, placement, a mix of products, or simply a question. Photos of the
 * situation are scaled down in the browser (max 1600px JPEG) before they are
 * sent, and reach Natuurhout's inbox as attachments through /api/offerte.
 */

const WHAT = [
  "Hekwerk / rasterwerk",
  "Poort",
  "Palen",
  "Vlechtschermen",
  "Post & Rail",
  "Plantenbakken",
  "Lariks schaaldelen",
  "Plaatsing",
  "Iets anders",
];
const WOODS = ["Kastanje", "Robinia", "Hazelaar", "Eik", "Lariks", "Weet ik nog niet"];
const MAX_PHOTOS = 4;
const MAX_EDGE = 1600;
const TARGET_BYTES = 700_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Photo = { name: string; data: string; preview: string };

function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

async function shrink(file: File): Promise<Photo> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  let quality = 0.82;
  let blob = await toBlob(canvas, quality);
  while (blob && blob.size > TARGET_BYTES && quality > 0.45) {
    quality -= 0.12;
    blob = await toBlob(canvas, quality);
  }
  if (!blob) throw new Error("encode");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { name: file.name, data: btoa(binary), preview: URL.createObjectURL(blob) };
}

export default function FreeQuoteForm() {
  const [what, setWhat] = useState<string[]>([]);
  const [woods, setWoods] = useState<string[]>([]);
  const [f, setF] = useState({
    sizes: "",
    description: "",
    name: "",
    email: "",
    phone: "",
    delivery: false,
    street: "",
    postcode: "",
    city: "",
  });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "mailto">("idle");
  const [confirmed, setConfirmed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }));
  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const errors: Record<string, string> = {};
  if (f.description.trim().length < 10) errors.description = "Beschrijf kort wat u nodig hebt.";
  if (!f.name.trim()) errors.name = "Vul uw naam in.";
  if (!EMAIL_PATTERN.test(f.email.trim())) errors.email = "Vul een geldig e-mailadres in.";
  if (f.delivery && !f.postcode.trim()) errors.postcode = "Vul de postcode in voor de levering.";
  if (!agreed) errors.agree = "Vink dit aan om uw aanvraag te versturen.";
  const shown: Record<string, string | undefined> = attempted ? errors : {};

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setPhotoError("");
    const room = MAX_PHOTOS - photos.length;
    const chosen = [...files].filter((file) => file.type.startsWith("image/")).slice(0, room);
    if (files.length > room) setPhotoError(`U kunt maximaal ${MAX_PHOTOS} foto's meesturen.`);
    setPhotoBusy(true);
    const added: Photo[] = [];
    for (const file of chosen) {
      try {
        added.push(await shrink(file));
      } catch {
        setPhotoError(`"${file.name}" kunnen we niet lezen. Probeer een JPG- of PNG-foto.`);
      }
    }
    setPhotos((current) => [...current, ...added].slice(0, MAX_PHOTOS));
    setPhotoBusy(false);
  }

  function removePhoto(index: number) {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, i) => i !== index);
    });
  }

  function text() {
    return [
      "Offerteaanvraag via de offertepagina",
      "",
      `Gevraagd: ${what.length ? what.join(", ") : "niet aangeduid"}`,
      `Houtsoort: ${woods.length ? woods.join(", ") : "niet aangeduid"}`,
      f.sizes.trim() ? `Afmetingen / aantallen: ${f.sizes.trim()}` : "",
      "",
      "Omschrijving:",
      f.description.trim(),
      photos.length ? `\nFoto's: ${photos.length} (in bijlage)` : "",
      "",
      `Naam: ${f.name.trim()}`,
      `E-mail: ${f.email.trim()}`,
      ...(f.phone.trim() ? [`Telefoon: ${f.phone.trim()}`] : []),
      f.delivery
        ? `Levering: ja, naar ${[f.street.trim(), `${f.postcode.trim()} ${f.city.trim()}`.trim()].filter(Boolean).join(", ")}`
        : "Levering: nee, wordt afgehaald in Zele",
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
    setStatus("sending");
    try {
      const response = await fetch("/api/offerte/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "vraag",
          page: window.location.pathname,
          name: f.name,
          email: f.email,
          phone: f.phone,
          delivery: f.delivery,
          street: f.street,
          postcode: f.postcode,
          city: f.city,
          text: text(),
          photos: photos.map(({ name, data }) => ({ name, data })),
          website: honeypot,
          elapsedMs: Math.round(performance.now()),
        }),
      });
      if (response.ok) {
        const result = (await response.json().catch(() => ({}))) as { confirmed?: boolean };
        setConfirmed(Boolean(result.confirmed));
        setStatus("sent");
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (response.status === 503) {
        // Sending not set up on this deployment: hand over to the mail program (without photos).
        const subject = `Offerteaanvraag – ${f.name.trim()}`;
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
        <p className="mt-3 font-display text-2xl font-semibold">Bedankt, uw aanvraag is verstuurd!</p>
        <p className="mt-2 max-w-2xl leading-7 text-ink/75">
          {confirmed ? "U ontvangt zo dadelijk een bevestiging met een overzicht per mail. " : ""}
          We bekijken uw aanvraag zo snel mogelijk en sturen u onze offerte op {f.email.trim()}.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="relative scroll-mt-24 space-y-8 rounded-card border border-line bg-white p-5 sm:p-8">
      <Question title="Waarvoor wilt u een offerte?" hint="Duid aan wat van toepassing is — meerdere keuzes kan.">
        <div className="flex flex-wrap gap-2">
          {WHAT.map((item) => (
            <Chip key={item} active={what.includes(item)} onClick={() => setWhat((list) => toggle(list, item))}>
              {item}
            </Chip>
          ))}
        </div>
      </Question>

      <Question title="Welke houtsoort?" hint="Twijfelt u? Dan adviseren we u graag.">
        <div className="flex flex-wrap gap-2">
          {WOODS.map((wood) => (
            <Chip key={wood} active={woods.includes(wood)} onClick={() => setWoods((list) => toggle(list, wood))}>
              {wood}
            </Chip>
          ))}
        </div>
      </Question>

      <div className="grid gap-5">
        <Field label="Afmetingen of aantallen" hint="Bijvoorbeeld: 25 meter, 1,20 m hoog, één poort van 1 m breed.">
          {(p) => <input {...p} className={inputClass} value={f.sizes} onChange={(e) => set({ sizes: e.target.value })} />}
        </Field>
        <Field
          label="Omschrijving van uw vraag"
          required
          error={shown.description}
          hint={shown.description ? undefined : "Hoe meer we weten (ondergrond, hoeken, plaatsing, timing …), hoe juister de offerte."}
        >
          {(p) => (
            <textarea
              {...p}
              rows={5}
              className={`${inputClass} min-h-32 resize-y`}
              value={f.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          )}
        </Field>
      </div>

      <Question title="Foto's van de situatie" hint={`Optioneel, maximaal ${MAX_PHOTOS}. Handig voor maatwerk en plaatsing.`}>
        <div className="flex flex-wrap items-start gap-3">
          {photos.map((photo, i) => (
            <div key={photo.preview} className="relative h-24 w-24 overflow-hidden rounded-xl ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={photo.preview} alt={`Foto ${i + 1}: ${photo.name}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label={`Foto ${i + 1} verwijderen`}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/80 text-white hover:bg-ink"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-brand/30 text-center text-xs font-semibold text-ink/65 transition-colors focus-within:border-accent hover:border-accent hover:text-accent-deep">
              {photoBusy ? (
                <Loader2 aria-hidden className="h-6 w-6 animate-spin" />
              ) : (
                <span className="grid justify-items-center gap-1">
                  <Camera aria-hidden className="h-6 w-6" />
                  Foto toevoegen
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={photoBusy}
                onChange={(e) => {
                  void addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
        {photoError && <p className="mt-2 text-xs font-medium text-red-700">{photoError}</p>}
      </Question>

      <div className="space-y-5 border-t border-line pt-8">
        <h3 className="font-display text-xl font-semibold">Uw gegevens</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Naam" required error={shown.name}>
            {(p) => <input {...p} className={inputClass} autoComplete="name" value={f.name} onChange={(e) => set({ name: e.target.value })} />}
          </Field>
          <Field label="E-mailadres" required error={shown.email} hint={shown.email ? undefined : "Hierop sturen we uw offerte."}>
            {(p) => <input {...p} type="email" className={inputClass} autoComplete="email" value={f.email} onChange={(e) => set({ email: e.target.value })} />}
          </Field>
          <Field label="Telefoon of gsm" hint="Handig als we iets willen nagaan.">
            {(p) => <input {...p} type="tel" className={inputClass} autoComplete="tel" value={f.phone} onChange={(e) => set({ phone: e.target.value })} />}
          </Field>
        </div>
        <Question title="Levering">
          <div className="flex flex-wrap gap-2">
            <Chip active={!f.delivery} onClick={() => set({ delivery: false })}>Ik haal af in Zele</Chip>
            <Chip active={f.delivery} onClick={() => set({ delivery: true })}>Graag leveren</Chip>
          </div>
        </Question>
        {f.delivery && (
          <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.5fr)]">
            <Field label="Straat en nummer">
              {(p) => <input {...p} className={inputClass} autoComplete="street-address" value={f.street} onChange={(e) => set({ street: e.target.value })} />}
            </Field>
            <Field label="Postcode" required error={shown.postcode}>
              {(p) => <input {...p} className={inputClass} inputMode="numeric" autoComplete="postal-code" value={f.postcode} onChange={(e) => set({ postcode: e.target.value })} />}
            </Field>
            <Field label="Gemeente">
              {(p) => <input {...p} className={inputClass} autoComplete="address-level2" value={f.city} onChange={(e) => set({ city: e.target.value })} />}
            </Field>
            <p className="-mt-2 text-xs text-ink/55 sm:col-span-3">De leveringskosten hangen af van de locatie; we nemen ze op in uw offerte.</p>
          </div>
        )}
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
          Ik ga ermee akkoord dat Natuurhout mijn gegevens gebruikt om deze aanvraag te beantwoorden.
        </label>
        {shown.agree && <p className="mt-1 text-xs font-medium text-red-700">{shown.agree}</p>}
      </div>

      {attempted && Object.keys(errors).length > 0 && (
        <p className="text-sm font-medium text-red-700">Vul de aangeduide velden aan.</p>
      )}
      {status === "error" && (
        <p className="text-sm font-medium text-red-700">
          Versturen lukte niet. Probeer het opnieuw, bel {PHONE.label} of mail naar {EMAIL.label}.
        </p>
      )}
      {status === "mailto" && (
        <p className="text-sm text-ink/70">
          Uw mailprogramma is geopend met de aanvraag — verstuur die mail naar {EMAIL.label}
          {photos.length ? " en voeg uw foto's er zelf aan toe" : ""}.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending" || photoBusy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent-deep px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-[#9a520d] disabled:opacity-60 sm:w-auto"
      >
        <Send aria-hidden className="h-4 w-4" />
        {status === "sending" ? "Bezig met versturen…" : "Offerte aanvragen"}
      </button>
    </form>
  );
}
