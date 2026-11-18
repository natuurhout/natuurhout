/*
 * The shop's e-mails to customers, sent from offerte@natuurhout.be through
 * Email Sending (the EMAIL binding) with the PDF attached:
 * - payment request: order confirmed, pay by transfer (iBanFirst IBAN + reference);
 * - invoice / credit note.
 * Reply-To is Natuurhout's inbox.
 */

import { escapeHtml, type MailAttachment } from "../../src/lib/quote-email";
import { logoImage } from "../../src/lib/email-assets";
import type { LineRow, OrderRow } from "./orders";
import { formatIban, type ShopSettings } from "./settings";

export type ShopMail = { subject: string; html: string; text: string; attachments: MailAttachment[] };

const eur = (n: number) => `€ ${n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
const FONT = "font-family:Arial,Helvetica,sans-serif";

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="nl"><body style="margin:0;background:#f5f5f3;padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;border-top:5px solid #d77d1f">
<tr><td style="padding:28px 28px 8px"><img src="cid:${logoImage.cid}" width="${logoImage.width}" height="${logoImage.height}" alt="Natuurhout" style="display:block;border:0"></td></tr>
<tr><td style="padding:12px 28px 28px;${FONT};font-size:15px;line-height:1.55;color:#2b2f32">
<h1 style="${FONT};font-size:21px;margin:0 0 14px;color:#2b2f32">${escapeHtml(title)}</h1>${body}</td></tr></table>
<p style="${FONT};font-size:12px;color:#888;margin:14px 0 0">Natuurhout · natuurhout.be</p></td></tr></table></body></html>`;
}

function linesHtml(lines: LineRow[], total: number): string {
  const rows = lines
    .map(
      (l) => `<tr><td style="padding:8px 8px 8px 0;border-bottom:1px solid #eee;${FONT};font-size:14px">${escapeHtml(l.product && l.product !== l.label ? `${l.product} – ${l.label}` : l.label)}</td>
<td style="padding:8px;border-bottom:1px solid #eee;${FONT};font-size:14px;text-align:right;white-space:nowrap">${l.qty} ×</td>
<td style="padding:8px 0;border-bottom:1px solid #eee;${FONT};font-size:14px;text-align:right;white-space:nowrap">${eur(l.qty * l.unit)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 4px">${rows}
<tr><td colspan="2" style="padding:10px 8px 0 0;${FONT};font-size:15px;font-weight:700">Totaal incl. btw</td><td style="padding:10px 0 0;${FONT};font-size:15px;font-weight:700;text-align:right;white-space:nowrap">${eur(total)}</td></tr></table>`;
}

function paymentHtml(s: ShopSettings, amount: number, reference: string): string {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:3px 16px 3px 0;${FONT};font-size:14px;color:#6b7076">${k}</td><td style="padding:3px 0;${FONT};font-size:14px;font-weight:700">${escapeHtml(v)}</td></tr>`;
  return `<div style="background:#fbeedd;border-radius:10px;padding:16px 18px;margin:18px 0">
<p style="margin:0 0 8px;${FONT};font-size:15px;font-weight:700">Betalen via overschrijving</p>
<table role="presentation" cellpadding="0" cellspacing="0">${row("Bedrag", eur(amount))}${row("Begunstigde", s.accountHolder || s.company)}${row("IBAN", formatIban(s.iban))}${row(
    "BIC",
    s.bic.toUpperCase(),
  )}${row("Mededeling", reference)}</table>
<p style="margin:10px 0 0;${FONT};font-size:13px;color:#6b7076">Gebruik de gestructureerde mededeling, dan koppelen we uw betaling meteen aan uw bestelling. In de PDF staat een QR-code die u met uw bank-app kunt scannen.</p></div>`;
}

const logo: MailAttachment = { disposition: "inline", contentId: logoImage.cid, filename: logoImage.filename, type: "image/png", content: logoImage.base64 };
const pdf = (filename: string, content: string): MailAttachment => ({ disposition: "attachment", filename, type: "application/pdf", content });
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "";

export function paymentRequestMail(order: OrderRow, lines: LineRow[], s: ShopSettings, pdfB64: string, message: string): ShopMail {
  const hi = firstName(order.name) ? `Beste ${firstName(order.name)},` : "Beste klant,";
  const when = order.delivery ? "We nemen contact op om de levering af te spreken zodra de betaling binnen is." : "Zodra de betaling binnen is, laten we weten wanneer u de bestelling in Zele kunt afhalen.";
  const html = layout(
    `Bestelling ${order.number} bevestigd`,
    `<p style="margin:0 0 12px">${escapeHtml(hi)}</p><p style="margin:0 0 12px">Bedankt voor uw bestelling. Hieronder het overzicht en de betaalgegevens; de bestelbevestiging zit als PDF in bijlage.</p>
${message ? `<p style="margin:0 0 12px;white-space:pre-line">${escapeHtml(message)}</p>` : ""}${linesHtml(lines, order.total)}${paymentHtml(s, order.total, order.ogm)}
<p style="margin:0 0 12px">${when}</p><p style="margin:0">Met vriendelijke groeten,<br>${escapeHtml(s.company)}</p>`,
  );
  const text = [
    hi,
    "",
    `Bedankt voor uw bestelling ${order.number}. De bestelbevestiging zit als PDF in bijlage.`,
    message ? `\n${message}` : "",
    "",
    ...lines.map((l) => `- ${l.qty} × ${l.product && l.product !== l.label ? `${l.product} – ${l.label}` : l.label}: ${eur(l.qty * l.unit)}`),
    `Totaal incl. btw: ${eur(order.total)}`,
    "",
    "Betalen via overschrijving:",
    `Bedrag: ${eur(order.total)}`,
    `Begunstigde: ${s.accountHolder || s.company}`,
    `IBAN: ${formatIban(s.iban)}`,
    `BIC: ${s.bic.toUpperCase()}`,
    `Mededeling: ${order.ogm}`,
    "",
    when,
    "",
    "Met vriendelijke groeten,",
    s.company,
  ].join("\n");
  return { subject: `Bestelling ${order.number} bevestigd – betaalgegevens`, html, text, attachments: [logo, pdf(`Natuurhout-bestelling-${order.number}.pdf`, pdfB64)] };
}

export function invoiceMail(order: OrderRow, number: string, type: "factuur" | "creditnota", total: number, s: ShopSettings, pdfB64: string): ShopMail {
  const hi = firstName(order.name) ? `Beste ${firstName(order.name)},` : "Beste klant,";
  const what = type === "factuur" ? `de factuur ${number}` : `de creditnota ${number}`;
  const paid = type === "factuur" && order.paid_at;
  const body = `<p style="margin:0 0 12px">${escapeHtml(hi)}</p><p style="margin:0 0 12px">In bijlage vindt u ${escapeHtml(what)} voor bestelling ${escapeHtml(order.number)} (${eur(Math.abs(total))}).</p>
${type === "factuur" && !paid ? paymentHtml(s, total, order.ogm) : paid ? `<p style="margin:0 0 12px">Deze factuur is betaald, bedankt!</p>` : ""}
<p style="margin:0">Met vriendelijke groeten,<br>${escapeHtml(s.company)}</p>`;
  const text = [hi, "", `In bijlage vindt u ${what} voor bestelling ${order.number} (${eur(Math.abs(total))}).`, paid ? "Deze factuur is betaald, bedankt!" : "", "", "Met vriendelijke groeten,", s.company].join("\n");
  return {
    subject: `${type === "factuur" ? "Factuur" : "Creditnota"} ${number} – Natuurhout`,
    html: layout(type === "factuur" ? `Factuur ${number}` : `Creditnota ${number}`, body),
    text,
    attachments: [logo, pdf(`Natuurhout-${type}-${number}.pdf`, pdfB64)],
  };
}
