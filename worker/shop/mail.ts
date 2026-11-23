/*
 * The shop's e-mails to customers, sent from offerte@natuurhout.be through
 * Email Sending (the EMAIL binding) with the PDF attached:
 * - payment request: order confirmed, pay by transfer (iBanFirst IBAN + reference);
 * - invoice / credit note;
 * - order received (online payment, at once: the invoice follows once paid).
 * Reply-To is Natuurhout's inbox. Plus the mail to Natuurhout's own inbox for
 * a webshop order (shopInboxMail): what was ordered, by whom, paid or not.
 */

import { escapeHtml, type MailAttachment } from "../../src/lib/quote-email";
import { logoImage } from "../../src/lib/email-assets";
import type { LineRow, OrderRow } from "./orders";
import { formatIban, type ShopSettings } from "./settings";
import { ADDRESS, PHONE } from "../../src/lib/contact";
import { HOURS_TEXT } from "../../src/lib/opening-hours";

export type ShopMail = {
  subject: string;
  html: string;
  text: string;
  attachments: MailAttachment[];
  /** No BCC to the inbox: the inbox already gets its own mail about this order. */
  noCopy?: boolean;
};

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

const lineName = (l: Pick<LineRow, "product" | "label">) => (l.product && l.product !== l.label ? `${l.product} – ${l.label}` : l.label);

function linesHtml(lines: LineRow[], total: number, notes = false): string {
  const rows = lines
    .map(
      (l) => `<tr><td style="padding:8px 8px 8px 0;border-bottom:1px solid #eee;${FONT};font-size:14px">${escapeHtml(lineName(l))}${
        notes && l.note ? `<br><span style="font-size:12px;color:#b5651d">${escapeHtml(l.note)}</span>` : ""
      }</td>
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

function button(href: string, label: string): string {
  return `<p style="margin:18px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#d77d1f;color:#fff;text-decoration:none;font-weight:700;padding:11px 20px;border-radius:999px;${FONT};font-size:14px">${escapeHtml(label)}</a></p>`;
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

/*
 * Natuurhout's own mail about a webshop order (Xander, Nov 2026): everything
 * to start preparing it (products with a gate's size and hinges, delivery,
 * customer, remarks) and, in the subject, whether it is paid yet.
 */
export type InboxState =
  | { kind: "transfer" }
  | { kind: "online"; test: boolean }
  | { kind: "paid"; how: string; amount: number; test: boolean };

export function shopInboxMail(order: OrderRow, lines: LineRow[], state: InboxState, adminUrl: string): ShopMail {
  const test = state.kind !== "transfer" && state.test ? " [TEST]" : "";
  const subject =
    state.kind === "paid"
      ? `Betaald: bestelling ${order.number} – ${order.name} – klaarzetten${test}`
      : `Nieuwe bestelling ${order.number} – ${order.name} – wacht op ${state.kind === "online" ? "online betaling" : "overschrijving"}${test}`;
  const status =
    state.kind === "paid"
      ? { bg: "#e3f4e8", color: "#1d6b35", title: `Betaald: ${eur(state.amount)}`, body: `Betaald ${state.how}. De klant krijgt de factuur per mail. Deze bestelling mag klaargezet worden.` }
      : state.kind === "online"
        ? {
            bg: "#fbeedd",
            color: "#8a4b0f",
            title: "Wacht op online betaling",
            body: "De klant is doorgestuurd naar MultiSafepay. Zodra de betaling bevestigd is, krijg je een tweede mail \"Betaald\". Niet betaald na 3 dagen: de bestelling wordt vanzelf geannuleerd.",
          }
        : {
            bg: "#fbeedd",
            color: "#8a4b0f",
            title: "Wacht op overschrijving",
            body: `De klant kreeg de betaalgegevens met mededeling ${order.ogm}. Duid de betaling aan in de backend (Betaling ontvangen) zodra ze binnen is.`,
          };
  const where = order.delivery ? `Leveren: ${order.street}, ${order.postcode} ${order.city}` : "Afhalen in Zele";
  const customer = [
    `<strong>${escapeHtml(order.name)}</strong>${order.company ? ` · ${escapeHtml(order.company)}${order.vat_number ? ` (${escapeHtml(order.vat_number)})` : ""}` : ""}`,
    `<a href="mailto:${escapeHtml(order.email)}" style="color:#b5651d">${escapeHtml(order.email)}</a>${order.phone ? ` · <a href="tel:${escapeHtml(order.phone.replace(/[^+\d]/g, ""))}" style="color:#b5651d">${escapeHtml(order.phone)}</a>` : ""}`,
    escapeHtml(where),
  ].join("<br>");
  const html = layout(
    state.kind === "paid" ? `Bestelling ${order.number} betaald` : `Nieuwe bestelling ${order.number}`,
    `<div style="background:${status.bg};border-radius:10px;padding:14px 18px;margin:0 0 18px">
<p style="margin:0 0 4px;${FONT};font-size:15px;font-weight:700;color:${status.color}">${escapeHtml(status.title)}</p>
<p style="margin:0;${FONT};font-size:14px;color:#2b2f32">${escapeHtml(status.body)}</p></div>
<p style="margin:0 0 6px;${FONT};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7076">Klant</p>
<p style="margin:0 0 18px">${customer}</p>
${order.remarks ? `<p style="margin:0 0 6px;${FONT};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7076">Opmerkingen</p><p style="margin:0 0 18px;white-space:pre-line">${escapeHtml(order.remarks)}</p>` : ""}
<p style="margin:0 0 2px;${FONT};font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7076">Bestelling</p>
${linesHtml(lines, order.total, true)}
${button(adminUrl, "Open in beheer")}
<p style="margin:0;${FONT};font-size:13px;color:#6b7076">Antwoorden op deze mail gaat naar de klant.</p>`,
  );
  const text = [
    `${state.kind === "paid" ? `Bestelling ${order.number} betaald` : `Nieuwe bestelling ${order.number}`}${test}`,
    "",
    `${status.title}. ${status.body}`,
    "",
    `Klant: ${order.name}${order.company ? `, ${order.company}${order.vat_number ? ` (${order.vat_number})` : ""}` : ""}`,
    `${order.email}${order.phone ? ` · ${order.phone}` : ""}`,
    where,
    order.remarks ? `\nOpmerkingen:\n${order.remarks}` : "",
    "",
    "Bestelling:",
    ...lines.map((l) => `- ${l.qty} × ${lineName(l)}: ${eur(l.qty * l.unit)}${l.note ? ` (${l.note})` : ""}`),
    `Totaal incl. btw: ${eur(order.total)}`,
    "",
    adminUrl,
  ].join("\n");
  return { subject, html, text, attachments: [logo] };
}

/** To the customer at once for an online payment: the order, and a way back to pay if it did not go through. */
export function orderReceivedMail(order: OrderRow, lines: LineRow[], s: ShopSettings, payUrl: string): ShopMail {
  const hi = firstName(order.name) ? `Beste ${firstName(order.name)},` : "Beste klant,";
  const when = order.delivery
    ? "Wij voeren de leveringen zelf uit en contacteren u op voorhand wanneer we komen leveren."
    : "We laten u weten wanneer u de bestelling in Zele kunt afhalen.";
  const html = layout(
    `Bestelling ${order.number} ontvangen`,
    `<p style="margin:0 0 12px">${escapeHtml(hi)}</p><p style="margin:0 0 12px">Bedankt voor uw bestelling. Zodra uw online betaling bevestigd is, krijgt u de factuur per mail.</p>
${linesHtml(lines, order.total)}
<p style="margin:16px 0 0">Betaling niet afgerond? Via deze knop betaalt u opnieuw, of kiest u voor een overschrijving.</p>${button(payUrl, "Mijn bestelling bekijken")}
<p style="margin:0 0 12px">${when}</p><p style="margin:0">Met vriendelijke groeten,<br>${escapeHtml(s.company)}</p>`,
  );
  const text = [
    hi,
    "",
    `Bedankt voor uw bestelling ${order.number}. Zodra uw online betaling bevestigd is, krijgt u de factuur per mail.`,
    "",
    ...lines.map((l) => `- ${l.qty} × ${lineName(l)}: ${eur(l.qty * l.unit)}`),
    `Totaal incl. btw: ${eur(order.total)}`,
    "",
    `Betaling niet afgerond? Betaal opnieuw of kies een overschrijving: ${payUrl}`,
    "",
    when,
    "",
    "Met vriendelijke groeten,",
    s.company,
  ].join("\n");
  return { subject: `Bestelling ${order.number} ontvangen – Natuurhout`, html, text, attachments: [logo], noCopy: true };
}

/*
 * "Klaar om af te halen" / "Klaar voor levering" in the backend (Xander, Nov 2026):
 * tells the customer the order is ready, with what is in it; for pickup the
 * address in Zele and the opening hours, for delivery that we call to agree a day.
 */
export function readyMail(order: OrderRow, lines: LineRow[], s: ShopSettings): ShopMail {
  const hi = firstName(order.name) ? `Beste ${firstName(order.name)},` : "Beste klant,";
  const goods = lines.filter((l) => l.product !== "Levering");
  const list = goods.map((l) => `<li style="margin:0 0 4px">${l.qty} × ${escapeHtml(lineName(l))}</li>`).join("");
  const hours = HOURS_TEXT.map((h) => `<tr><td style="padding:2px 16px 2px 0;${FONT};font-size:14px;color:#6b7076">${escapeHtml(h.days)}</td><td style="padding:2px 0;${FONT};font-size:14px">${escapeHtml(h.hours)}</td></tr>`).join("");
  const pickup = `<div style="background:#fbeedd;border-radius:10px;padding:16px 18px;margin:18px 0">
<p style="margin:0 0 6px;${FONT};font-size:15px;font-weight:700">Afhalen in Zele</p>
<p style="margin:0 0 10px;${FONT};font-size:14px"><a href="${escapeHtml(ADDRESS.maps)}" style="color:#b5651d">${escapeHtml(ADDRESS.street)}, ${escapeHtml(ADDRESS.city)}</a></p>
<table role="presentation" cellpadding="0" cellspacing="0">${hours}</table>
<p style="margin:10px 0 0;${FONT};font-size:13px;color:#6b7076">Vermeld uw bestelnummer ${escapeHtml(order.number)}. We helpen u graag met inladen.</p></div>`;
  const delivery = `<div style="background:#fbeedd;border-radius:10px;padding:16px 18px;margin:18px 0">
<p style="margin:0 0 6px;${FONT};font-size:15px;font-weight:700">Levering</p>
<p style="margin:0;${FONT};font-size:14px">Wij voeren de leveringen zelf uit. We contacteren u om een leverdag af te spreken${order.phone ? ` (op ${escapeHtml(order.phone)})` : ""}.</p>
<p style="margin:6px 0 0;${FONT};font-size:14px;color:#6b7076">Leveradres: ${escapeHtml([order.street, [order.postcode, order.city].filter(Boolean).join(" ")].filter(Boolean).join(", "))}</p></div>`;
  const html = layout(
    `Uw bestelling ${order.number} staat klaar`,
    `<p style="margin:0 0 12px">${escapeHtml(hi)}</p><p style="margin:0 0 12px">${
      order.delivery ? "Goed nieuws: uw bestelling is klaar voor levering." : "Goed nieuws: uw bestelling staat klaar om af te halen."
    }</p>
<ul style="margin:0 0 4px;padding-left:20px">${list}</ul>
${order.delivery ? delivery : pickup}
<p style="margin:0 0 12px">Vragen? Antwoord gewoon op deze mail of bel ons op ${escapeHtml(PHONE.label)}.</p><p style="margin:0">Met vriendelijke groeten,<br>${escapeHtml(s.company)}</p>`,
  );
  const text = [
    hi,
    "",
    order.delivery ? `Uw bestelling ${order.number} is klaar voor levering.` : `Uw bestelling ${order.number} staat klaar om af te halen.`,
    "",
    ...goods.map((l) => `- ${l.qty} × ${lineName(l)}`),
    "",
    ...(order.delivery
      ? [
          `Wij voeren de leveringen zelf uit. We contacteren u om een leverdag af te spreken${order.phone ? ` (op ${order.phone})` : ""}.`,
          `Leveradres: ${[order.street, [order.postcode, order.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}`,
        ]
      : [`Afhalen in Zele: ${ADDRESS.street}, ${ADDRESS.city}`, ...HOURS_TEXT.map((h) => `${h.days}: ${h.hours}`), `Vermeld uw bestelnummer ${order.number}.`]),
    "",
    `Vragen? Antwoord op deze mail of bel ${PHONE.label}.`,
    "",
    "Met vriendelijke groeten,",
    s.company,
  ].join("\n");
  return {
    subject: order.delivery ? `Bestelling ${order.number} klaar voor levering – Natuurhout` : `Bestelling ${order.number} staat klaar om af te halen – Natuurhout`,
    html,
    text,
    attachments: [logo],
  };
}

/*
 * Cancelled and/or refunded (backend, Xander Nov 2026): what happens to the
 * money, with the credit note attached when there is one.
 */
export type RefundState =
  | { kind: "none" } // nothing was paid
  | { kind: "pending"; amount: number } // paid, refund still to do
  | { kind: "online"; amount: number; method: string } // refunded through MultiSafepay
  | { kind: "transfer"; amount: number }; // refunded by bank transfer

export function cancelMail(order: OrderRow, s: ShopSettings, opts: { cancelled: boolean; refund: RefundState; credit?: { number: string; pdf: string } }): ShopMail {
  const hi = firstName(order.name) ? `Beste ${firstName(order.name)},` : "Beste klant,";
  const r = opts.refund;
  const money =
    r.kind === "online"
      ? `We hebben ${eur(r.amount)} teruggestort via MultiSafepay, op dezelfde manier als u betaalde${r.method ? ` (${r.method})` : ""}. Afhankelijk van uw bank staat het bedrag binnen enkele werkdagen op uw rekening.`
      : r.kind === "transfer"
        ? `We hebben ${eur(r.amount)} teruggestort op uw rekening. Afhankelijk van uw bank ziet u het binnen enkele werkdagen.`
        : r.kind === "pending"
          ? `U betaalde al ${eur(r.amount)}: dat bedrag storten we zo snel mogelijk terug. We laten u weten wanneer het gebeurd is.`
          : "U hoeft niets te betalen.";
  const intro = opts.cancelled ? `Uw bestelling ${order.number} is geannuleerd.` : `Goed nieuws over uw geannuleerde bestelling ${order.number}.`;
  const credit = opts.credit ? `In bijlage vindt u de creditnota ${opts.credit.number}.` : "";
  const html = layout(
    opts.cancelled ? `Bestelling ${order.number} geannuleerd` : `Terugbetaling bestelling ${order.number}`,
    `<p style="margin:0 0 12px">${escapeHtml(hi)}</p><p style="margin:0 0 12px">${escapeHtml(intro)}</p>
<div style="background:#fbeedd;border-radius:10px;padding:14px 18px;margin:16px 0"><p style="margin:0;${FONT};font-size:15px">${escapeHtml(money)}</p></div>
${credit ? `<p style="margin:0 0 12px">${escapeHtml(credit)}</p>` : ""}
<p style="margin:0 0 12px">Vragen? Antwoord gewoon op deze mail of bel ons op ${escapeHtml(PHONE.label)}.</p><p style="margin:0">Met vriendelijke groeten,<br>${escapeHtml(s.company)}</p>`,
  );
  const text = [hi, "", intro, "", money, credit ? `\n${credit}` : "", "", `Vragen? Antwoord op deze mail of bel ${PHONE.label}.`, "", "Met vriendelijke groeten,", s.company].join("\n");
  return {
    subject: opts.cancelled ? `Bestelling ${order.number} geannuleerd – Natuurhout` : `Terugbetaling bestelling ${order.number} – Natuurhout`,
    html,
    text,
    attachments: [logo, ...(opts.credit ? [pdf(`Natuurhout-creditnota-${opts.credit.number}.pdf`, opts.credit.pdf)] : [])],
  };
}
