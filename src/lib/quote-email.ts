/*
 * The two mails a calculator quote request produces: the request itself for
 * Natuurhout's inbox, and a confirmation for the customer with an overview.
 * Everything that arrives from the browser is untrusted: it is validated and
 * clipped here and HTML-escaped wherever it is rendered.
 */

export type QuoteLine = { group: string; label: string; detail: string; qty: number; unit: number | null };

export type Quote = {
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
export type MailAttachment = { filename: string; content: string; content_id: string };
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

  return {
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
      : `<tr><td style="padding:12px 12px 12px 0;border-top:2px solid ${C.ink};${FONT};font-size:14px;font-weight:700;color:${C.ink}">Richtprijs materiaal, incl. btw${
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
+32 5 255 88 58 · <a href="mailto:info@natuurhout.be" style="color:${C.soft}">info@natuurhout.be</a><br>
Ma–vr 09:00–18:00 · za 09:00–12:00</td></tr>
</table></td></tr></table></body></html>`;
}

/* ------------------------------------------------------------------ */
/* The two mails                                                       */
/* ------------------------------------------------------------------ */

export function internalMail(q: Quote): Mail {
  const inner = `<p style="margin:0 0 4px;${FONT};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.accent}">Nieuwe offerteaanvraag</p>
<p style="margin:0 0 18px;${FONT};font-size:14px;color:${C.soft}">Beantwoord deze mail om ${escapeHtml(q.name)} rechtstreeks te antwoorden.</p>
${detailsTable(q, true)}
<div style="margin-top:22px">${q.lines.length ? linesTable(q) : plainOverview(q)}</div>
${q.delivery ? `<p style="margin:14px 0 0;${FONT};font-size:13px;color:${C.soft}">Levering gevraagd: bepaal de kosten op basis van postcode ${escapeHtml(q.postcode)}.</p>` : ""}
${remarksBlock(q)}`;
  return { subject: `Offerteaanvraag afsluiting – ${q.name}`, html: frame(inner), text: q.text, attachments: inlineAttachments() };
}

export function confirmationMail(q: Quote): Mail {
  const first = q.name.split(/\s+/)[0] || q.name;
  const inner = `<p style="margin:0 0 14px;${FONT};font-size:16px;color:${C.ink}">Beste ${escapeHtml(first)},</p>
<p style="margin:0 0 12px;${FONT};font-size:15px;line-height:1.6;color:${C.ink}">Bedankt voor uw offerteaanvraag via onze afsluitingscalculator. We hebben ze goed ontvangen en behandelen ze zo snel mogelijk. U krijgt onze offerte op dit e-mailadres.</p>
<p style="margin:0 0 22px;${FONT};font-size:15px;line-height:1.6;color:${C.ink}">Iets vergeten of wilt u iets aanpassen? Antwoord gewoon op deze mail.</p>
<p style="margin:0 0 4px;${FONT};font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${C.accent}">Overzicht van uw aanvraag</p>
${q.lines.length ? linesTable(q) : plainOverview(q)}
<p style="margin:12px 0 0;${FONT};font-size:12px;line-height:1.55;color:${C.soft}">Dit zijn richtprijzen incl. btw op basis van onze actuele webshopprijzen. Voorraad, maatwerk${
    q.delivery ? " en de leveringskosten (op basis van uw postcode)" : ""
  } bevestigen we in uw offerte.</p>
<p style="margin:22px 0 8px;${FONT};font-size:13px;font-weight:700;color:${C.ink}">Uw gegevens</p>
${detailsTable(q, false)}
${remarksBlock(q)}
<p style="margin:26px 0 0;${FONT};font-size:15px;line-height:1.6;color:${C.ink}">Met vriendelijke groeten,<br><strong>Het team van Natuurhout</strong></p>`;
  const text = [
    `Beste ${first},`,
    "",
    "Bedankt voor uw offerteaanvraag via onze afsluitingscalculator. We hebben ze goed ontvangen en behandelen ze zo snel mogelijk. U krijgt onze offerte op dit e-mailadres.",
    "Iets vergeten of wilt u iets aanpassen? Antwoord gewoon op deze mail.",
    "",
    "Overzicht van uw aanvraag",
    "-------------------------",
    q.text,
    "",
    "Met vriendelijke groeten,",
    "Het team van Natuurhout",
    "Adolf Van Der Moerenstraat 39, 9240 Zele · +32 5 255 88 58 · info@natuurhout.be",
  ].join("\n");
  return { subject: "Bedankt voor uw offerteaanvraag – Natuurhout", html: frame(inner), text, attachments: inlineAttachments() };
}
