/*
 * The two mails a request produces — a calculator quote, or an order for
 * products that are not in stock ("op bestelling", from a product page's
 * price list): the request itself for Natuurhout's inbox, and a confirmation
 * for the customer with an overview.
 * Everything that arrives from the browser is untrusted: it is validated and
 * clipped here and HTML-escaped wherever it is rendered.
 */

export type QuoteLine = { group: string; label: string; detail: string; qty: number; unit: number | null };

export type Quote = {
  /**
   * "calculator": quote for a fence from the calculator; "vraag": free quote
   * request (offertepagina); "bestelling": order for products not in stock.
   */
  kind: "calculator" | "vraag" | "bestelling";
  /** Page the order was placed from (bestelling only). */
  page: string;
  name: string;
  email: string;
  phone: string;
  delivery: boolean;
  street: string;
  postcode: string;
  city: string;
  remarks: string;
  lines: QuoteLine[];
  total: number | null;
  /** Plain-text version of the whole request, as the calculator wrote it. */
  text: string;
};

import { logoImage, mascotImage, type EmailImage } from "@/lib/email-assets";

/** Inline images travel as attachments referenced by cid: in the HTML (Resend's attachment shape). */
export type MailAttachment = { filename: string; content: string; content_id?: string };
export type Mail = { subject: string; html: string; text: string; attachments: MailAttachment[] };

const INLINE_IMAGES: EmailImage[] = [logoImage, mascotImage];
const inlineAttachments = (): MailAttachment[] =>
  INLINE_IMAGES.map((i) => ({ filename: i.filename, content: i.base64, content_id: i.cid }));

function img(i: EmailImage, alt: string): string {
  return `<img src="cid:${i.cid}" width="${i.width}" height="${i.height}" alt="${alt}" style="display:block;border:0;outline:none;text-decoration:none;width:${i.width}px;height:${i.height}px">`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function num(value: unknown, max: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max ? value : null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function euro(n: number): string {
  return `€${n.toFixed(2).replace(".", ",")}`;
}

/** Validated quote, or the reason it is refused. */
export function parseQuote(body: Record<string, unknown>): Quote | { error: string } {
  const name = str(body.name, 200);
  const email = str(body.email, 200);
  const text = str(body.text, 20_000);
  if (!name || !EMAIL.test(email) || !text) return { error: "Naam, een geldig e-mailadres en de aanvraag zijn verplicht." };

  const rawLines = Array.isArray(body.lines) ? body.lines.slice(0, 100) : [];
  const lines: QuoteLine[] = [];
  for (const raw of rawLines) {
    if (!raw || typeof raw !== "object") continue;
    const l = raw as Record<string, unknown>;
    const label = str(l.label, 300);
    const qty = num(l.qty, 100_000);
    if (!label || qty === null) continue;
    lines.push({ group: str(l.group, 60) || "Overige", label, detail: str(l.detail, 300), qty, unit: num(l.unit, 100_000) });
  }

  const page = str(body.page, 200);
  return {
    kind: body.kind === "bestelling" || body.kind === "vraag" ? body.kind : "calculator",
    page: page.startsWith("/") ? page : "",
    name,
    email,
    phone: str(body.phone, 40),
    delivery: body.delivery === true,
    street: str(body.street, 200),
    postcode: str(body.postcode, 10),
    city: str(body.city, 100),
    remarks: str(body.remarks, 4_000),
    lines,
    total: num(body.total, 10_000_000),
    text,
  };
}

/**
 * Photos sent with a free quote request: at most 4 JPEGs, which the browser
 * has already scaled down. Anything else is dropped, never trusted.
 */
export const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 1_200_000;
const MAX_PHOTOS_TOTAL = 3_200_000;

export function parsePhotos(body: Record<string, unknown>): MailAttachment[] {
  const raw = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
  const photos: MailAttachment[] = [];
  let total = 0;
  for (const [i, item] of raw.entries()) {
    if (!item || typeof item !== "object") continue;
    const data = (item as Record<string, unknown>).data;
    if (typeof data !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) continue;
    const bytes = Buffer.from(data, "base64");
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (!isJpeg || bytes.length > MAX_PHOTO_BYTES || total + bytes.length > MAX_PHOTOS_TOTAL) continue;
    total += bytes.length;
    photos.push({ filename: `foto-${i + 1}.jpg`, content: data });
  }
  return photos;
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const C = { ink: "#303130", soft: "#5f6368", line: "#e3e3e0", ground: "#f5f5f3", accent: "#D77D1F", dark: "#303130" };
const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";

function linesTable(q: Quote): string {
  if (!q.lines.length) return "";
  const groups = [...new Set(q.lines.map((l) => l.group))];
  const rows = groups
    .map((g) => {
      const head = `<tr><td colspan="2" style="padding:14px 0 6px;${FONT};font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.soft}">${escapeHtml(g)}</td></tr>`;
      const items = q.lines
        .filter((l) => l.group === g)
        .map((l) => {
          const each = l.unit === null ? `${l.qty} ×` : `${l.qty} × ${euro(l.unit)}`;
          const sum = l.unit === null ? "op aanvraag" : euro(l.qty * l.unit);
          return `<tr>
<td style="padding:8px 12px 8px 0;border-top:1px solid ${C.line};${FONT};font-size:14px;line-height:1.45;color:${C.ink};vertical-align:top">${escapeHtml(l.label)}${
            l.detail ? `<br><span style="font-size:12px;color:${C.soft}">${escapeHtml(l.detail)}</span>` : ""
          }<br><span style="font-size:12px;color:${C.soft}">${each}</span></td>
<td style="padding:8px 0;border-top:1px solid ${C.line};${FONT};font-size:14px;font-weight:600;color:${C.ink};text-align:right;vertical-align:top;white-space:nowrap">${sum}</td>
</tr>`;
        })
        .join("");
      return head + items;
    })
    .join("");
  const onRequest = q.lines.some((l) => l.unit === null);
  const totalRow =
    q.total === null
      ? ""
      : `<tr><td style="padding:12px 12px 12px 0;border-top:2px solid ${C.ink};${FONT};font-size:14px;font-weight:700;color:${C.ink}">${q.kind === "bestelling" ? "Totaal" : "Richtprijs materiaal"}, incl. btw${
          onRequest ? " (+ posten op aanvraag)" : ""
        }</td><td style="padding:12px 0;border-top:2px solid ${C.ink};${FONT};font-size:16px;font-weight:700;color:${C.ink};text-align:right;white-space:nowrap">${euro(q.total)}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}${totalRow}</table>`;
}

function detailsTable(q: Quote, linkContact: boolean): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:3px 16px 3px 0;${FONT};font-size:13px;color:${C.soft};vertical-align:top;white-space:nowrap">${label}</td><td style="padding:3px 0;${FONT};font-size:13px;color:${C.ink}">${value}</td></tr>`;
  const email = linkContact ? `<a href="mailto:${escapeHtml(q.email)}" style="color:${C.accent}">${escapeHtml(q.email)}</a>` : escapeHtml(q.email);
  const phone = q.phone ? (linkContact ? `<a href="tel:${escapeHtml(q.phone.replace(/[^\d+]/g, ""))}" style="color:${C.accent}">${escapeHtml(q.phone)}</a>` : escapeHtml(q.phone)) : "";
  const delivery = q.delivery
    ? `Leveren aan ${escapeHtml([q.street, `${q.postcode} ${q.city}`.trim()].filter(Boolean).join(", "))}`
    : "Afhalen in Zele";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${[
    row("Naam", escapeHtml(q.name)),
    row("E-mail", email),
    phone ? row("Telefoon", phone) : "",
    row("Levering", delivery),
  ].join("")}</table>`;
}

function remarksBlock(q: Quote): string {
  return q.remarks
    ? `<p style="margin:20px 0 6px;${FONT};font-size:13px;font-weight:700;color:${C.ink}">Opmerkingen</p><p style="margin:0;${FONT};font-size:14px;line-height:1.55;color:${C.ink};white-space:pre-wrap">${escapeHtml(q.remarks)}</p>`
    : "";
}

/** Fallback when the request came without structured lines (e.g. an older page). */
function plainOverview(q: Quote): string {
  return `<pre style="margin:0;${FONT};font-size:13px;line-height:1.55;color:${C.ink};white-space:pre-wrap">${escapeHtml(q.text)}</pre>`;
}

function frame(inner: string): string {
  return `<!doctype html><html lang="nl"><body style="margin:0;padding:0;background:${C.ground}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${C.line};border-radius:6px">
<tr><td style="padding:16px 28px;background:#ffffff;border-bottom:3px solid ${C.accent};border-radius:6px 6px 0 0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:middle">${img(logoImage, "Natuurhout — scherpe prijzen kastanjehout")}</td>
<td align="right" style="vertical-align:middle">${img(mascotImage, "")}</td>
</tr></table></td></tr>
<tr><td style="padding:28px">${inner}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid ${C.line};${FONT};font-size:12px;line-height:1.6;color:${C.soft}">
Natuurhout · Adolf Van Der Moerenstraat 39, 9240 Zele<br>
052 55 88 58 · gsm +32 473 74 09 26 · <a href="mailto:info@natuurhout.be" style="color:${C.soft}">info@natuurhout.be</a><br>
Ma–vr 09:00–18:00 · za 09:00–12:00</td></tr>
</table></td></tr></table></body></html>`;
}

/* ------------------------------------------------------------------ */
/* The two mails                                                       */
/* ------------------------------------------------------------------ */

export function internalMail(q: Quote, photos: MailAttachment[] = []): Mail {
  const order = q.kind === "bestelling";
  const photoNote = photos.length
    ? ` ${photos.length === 1 ? "De klant stuurde 1 foto mee" : `De klant stuurde ${photos.length} foto's mee`} (in bijlage).`
    : "";
  const inner = `<p style="margin:0 0 4px;${FONT};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.accent}">${
    order ? "Nieuwe aanvraag op bestelling" : "Nieuwe offerteaanvraag"
  }</p>
<p style="margin:0 0 18px;${FONT};font-size:14px;color:${C.soft}">${
    order
      ? `Deze artikelen zijn niet (allemaal) op voorraad. Laat ${escapeHtml(q.name)} de levertermijn weten door deze mail te beantwoorden.${
          q.page ? ` Besteld via ${escapeHtml(q.page)}.` : ""
        }`
      : `Beantwoord deze mail om ${escapeHtml(q.name)} rechtstreeks te antwoorden.${photoNote}`
  }</p>
${detailsTable(q, true)}
<div style="margin-top:22px">${q.lines.length ? linesTable(q) : plainOverview(q)}</div>
${q.delivery ? `<p style="margin:14px 0 0;${FONT};font-size:13px;color:${C.soft}">Levering gevraagd: bepaal de kosten op basis van postcode ${escapeHtml(q.postcode)}.</p>` : ""}
${remarksBlock(q)}`;
  const subject = order
    ? `Aanvraag op bestelling – ${q.name}`
    : q.kind === "vraag"
      ? `Offerteaanvraag – ${q.name}`
      : `Offerteaanvraag afsluiting – ${q.name}`;
  return { subject, html: frame(inner), text: q.text, attachments: [...inlineAttachments(), ...photos] };
}

export function confirmationMail(q: Quote): Mail {
  const first = q.name.split(/\s+/)[0] || q.name;
  const order = q.kind === "bestelling";
  const thanks = order
    ? "Bedankt voor uw aanvraag. We hebben ze goed ontvangen en bekijken ze zo snel mogelijk. U krijgt per mail de levertermijn en het verdere verloop van uw bestelling."
    : q.kind === "vraag"
      ? "Bedankt voor uw offerteaanvraag. We hebben ze goed ontvangen en behandelen ze zo snel mogelijk. U krijgt onze offerte op dit e-mailadres."
      : "Bedankt voor uw offerteaanvraag via onze afsluitingscalculator. We hebben ze goed ontvangen en behandelen ze zo snel mogelijk. U krijgt onze offerte op dit e-mailadres.";
  const footnote = q.kind === "vraag"
    ? q.delivery
      ? "De leveringskosten (op basis van uw postcode) nemen we op in uw offerte."
      : ""
    : order
    ? `Prijzen incl. btw volgens onze webshop. De levertermijn${
        q.delivery ? " en de leveringskosten (op basis van uw postcode)" : ""
      } bevestigen we per mail.`
    : `Dit zijn richtprijzen incl. btw op basis van onze actuele webshopprijzen. Voorraad, maatwerk${
        q.delivery ? " en de leveringskosten (op basis van uw postcode)" : ""
      } bevestigen we in uw offerte.`;
  const inner = `<p style="margin:0 0 14px;${FONT};font-size:16px;color:${C.ink}">Beste ${escapeHtml(first)},</p>
<p style="margin:0 0 12px;${FONT};font-size:15px;line-height:1.6;color:${C.ink}">${thanks}</p>
<p style="margin:0 0 22px;${FONT};font-size:15px;line-height:1.6;color:${C.ink}">Iets vergeten of wilt u iets aanpassen? Antwoord gewoon op deze mail.</p>
<p style="margin:0 0 4px;${FONT};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.accent}">Overzicht van uw aanvraag</p>
${q.lines.length ? linesTable(q) : plainOverview(q)}
${footnote ? `<p style="margin:12px 0 0;${FONT};font-size:12px;line-height:1.55;color:${C.soft}">${footnote}</p>` : ""}
<p style="margin:22px 0 8px;${FONT};font-size:13px;font-weight:700;color:${C.ink}">Uw gegevens</p>
${detailsTable(q, false)}
${remarksBlock(q)}
<p style="margin:26px 0 0;${FONT};font-size:15px;line-height:1.6;color:${C.ink}">Met vriendelijke groeten,<br><strong>Het team van Natuurhout</strong></p>`;
  const text = [
    `Beste ${first},`,
    "",
    thanks,
    "Iets vergeten of wilt u iets aanpassen? Antwoord gewoon op deze mail.",
    "",
    "Overzicht van uw aanvraag",
    "-------------------------",
    q.text,
    "",
    "Met vriendelijke groeten,",
    "Het team van Natuurhout",
    "Adolf Van Der Moerenstraat 39, 9240 Zele · 052 55 88 58 · gsm +32 473 74 09 26 · info@natuurhout.be",
  ].join("\n");
  const subject = order ? "Bedankt voor uw aanvraag – Natuurhout" : "Bedankt voor uw offerteaanvraag – Natuurhout";
  return { subject, html: frame(inner), text, attachments: inlineAttachments() };
}
