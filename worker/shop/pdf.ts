/*
 * A small PDF writer (PDF 1.4, standard Helvetica fonts, WinAnsi encoding)
 * and the shop's documents: the order confirmation with payment request,
 * the invoice and the credit note. No dependencies besides the QR encoder,
 * so it runs in the Worker without a browser.
 */

import qrcode from "qrcode-generator";
import { epcPayload, type InvoiceData, type LineRow, type OrderRow, totals } from "./orders";
import { formatIban, type ShopSettings } from "./settings";

// Helvetica / Helvetica-Bold advance widths (1/1000 em) for ASCII 32..126.
const W_REG = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const W_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

const WIN_ANSI: Record<string, number> = { "€": 0x80, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "ø": 0xf8 };

/** One byte per character: WinAnsi, unknown characters as "?". */
function encode(text: string): string {
  let out = "";
  for (const ch of text.normalize("NFC")) {
    const code = ch.charCodeAt(0);
    const b = WIN_ANSI[ch] ?? (code < 256 && (code >= 0xa0 || (code >= 32 && code < 127)) ? code : 63);
    out += String.fromCharCode(b);
  }
  return out;
}

function width(text: string, size: number, bold = false): number {
  const table = bold ? W_BOLD : W_REG;
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += c >= 32 && c <= 126 ? table[c - 32] : 556;
  }
  return (w * size) / 1000;
}

type Rgb = [number, number, number];
const INK: Rgb = [0.15, 0.16, 0.17];
const SOFT: Rgb = [0.42, 0.44, 0.46];
const ACCENT: Rgb = [0.69, 0.37, 0.06];
const LINE: Rgb = [0.85, 0.86, 0.84];

class Doc {
  readonly W = 595.28;
  readonly H = 841.89;
  private pages: string[] = [];
  private ops: string[] = [];
  y = 0;

  constructor() {
    this.newPage();
  }
  newPage() {
    if (this.ops.length) this.pages.push(this.ops.join("\n"));
    this.ops = [];
    this.y = 50;
  }
  private color(c: Rgb, stroke = false) {
    return `${c.map((n) => n.toFixed(3)).join(" ")} ${stroke ? "RG" : "rg"}`;
  }
  text(x: number, y: number, s: string, o: { size?: number; bold?: boolean; color?: Rgb; align?: "left" | "right" } = {}) {
    const size = o.size ?? 10;
    const bold = o.bold ?? false;
    const tx = o.align === "right" ? x - width(s, size, bold) : x;
    const esc = encode(s).replace(/[\\()]/g, (m) => `\\${m}`);
    this.ops.push(`BT ${this.color(o.color ?? INK)} /${bold ? "F2" : "F1"} ${size} Tf ${tx.toFixed(2)} ${(this.H - y).toFixed(2)} Td (${esc}) Tj ET`);
  }
  /** Wraps text into lines that fit the width. */
  wrap(s: string, maxWidth: number, size: number, bold = false): string[] {
    const out: string[] = [];
    let line = "";
    for (const word of s.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (width(next, size, bold) <= maxWidth || !line) line = next;
      else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
    return out.length ? out : [""];
  }
  rect(x: number, y: number, w: number, h: number, fill: Rgb) {
    this.ops.push(`${this.color(fill)} ${x.toFixed(2)} ${(this.H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }
  hline(x1: number, x2: number, y: number, c: Rgb = LINE, w = 0.7) {
    this.ops.push(`${this.color(c, true)} ${w} w ${x1.toFixed(2)} ${(this.H - y).toFixed(2)} m ${x2.toFixed(2)} ${(this.H - y).toFixed(2)} l S`);
  }
  qr(x: number, y: number, size: number, data: string) {
    const q = qrcode(0, "M");
    // The encoder takes one byte per character: hand it the UTF-8 bytes (EPC charset 1).
    q.addData(String.fromCharCode(...new TextEncoder().encode(data)), "Byte");
    q.make();
    const n = q.getModuleCount();
    const m = size / n;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) this.rect(x + c * m, y + r * m, m + 0.02, m + 0.02, [0, 0, 0]);
  }
  bytes(): Uint8Array {
    if (this.ops.length) this.pages.push(this.ops.join("\n"));
    this.ops = [];
    const objs: string[] = [];
    const n = this.pages.length;
    objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objs[2] = `<< /Type /Pages /Count ${n} /Kids [${this.pages.map((_, i) => `${5 + i * 2} 0 R`).join(" ")}] >>`;
    objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    this.pages.forEach((content, i) => {
      objs[5 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`;
      objs[6 + i * 2] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    });
    let out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
    const offsets: number[] = [];
    for (let i = 1; i < objs.length; i++) {
      offsets[i] = out.length;
      out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
    }
    const xref = out.length;
    out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objs.length; i++) out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }
}

const eur = (n: number) => `€ ${n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
const day = (iso: string) => new Intl.DateTimeFormat("nl-BE", { timeZone: "Europe/Brussels", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
const qtyText = (q: number) => (Number.isInteger(q) ? String(q) : q.toFixed(2).replace(".", ","));

type Party = { name: string; company: string; vat: string; email: string; phone: string; street: string; postcode: string; city: string };

const M = 50; // page margin

function header(d: Doc, s: ShopSettings, title: string, meta: [string, string][]) {
  d.rect(0, 0, d.W, 6, ACCENT);
  d.text(M, 62, s.company || "Natuurhout", { size: 20, bold: true });
  const addr = [s.street, [s.postcode, s.city].filter(Boolean).join(" "), s.country].filter(Boolean).join(" · ");
  d.text(M, 78, addr, { size: 8.5, color: SOFT });
  d.text(M, 90, [s.vat && `Btw ${s.vat}`, s.email, s.phone].filter(Boolean).join(" · "), { size: 8.5, color: SOFT });
  d.text(d.W - M, 62, title, { size: 16, bold: true, align: "right", color: ACCENT });
  meta.forEach(([k, v], i) => {
    d.text(d.W - M - 110, 82 + i * 13, k, { size: 9, color: SOFT, align: "right" });
    d.text(d.W - M, 82 + i * 13, v, { size: 9, bold: true, align: "right" });
  });
  d.y = Math.max(120, 82 + meta.length * 13 + 14);
}

function customerBlock(d: Doc, c: Party, deliveryText: string) {
  const y = d.y + 8;
  d.text(M, y, "Klant", { size: 8.5, color: SOFT, bold: true });
  const rows = [c.company, c.name, c.street, [c.postcode, c.city].filter(Boolean).join(" "), c.vat && `Btw ${c.vat}`, c.email, c.phone].filter(Boolean) as string[];
  rows.forEach((r, i) => d.text(M, y + 14 + i * 12.5, r, { size: 10, bold: i === 0 }));
  d.text(330, y, "Levering", { size: 8.5, color: SOFT, bold: true });
  d.wrap(deliveryText, 215, 10).forEach((r, i) => d.text(330, y + 14 + i * 12.5, r, { size: 10 }));
  d.y = y + 14 + rows.length * 12.5 + 14;
}

function linesTable(d: Doc, lines: { product: string; label: string; qty: number; unit: number; vat_rate: number }[]) {
  const xQty = 360, xUnit = 440, xTot = d.W - M;
  const head = () => {
    d.rect(M, d.y, d.W - 2 * M, 20, [0.96, 0.96, 0.95]);
    d.text(M + 8, d.y + 13.5, "Omschrijving", { size: 8.5, bold: true, color: SOFT });
    d.text(xQty, d.y + 13.5, "Aantal", { size: 8.5, bold: true, color: SOFT, align: "right" });
    d.text(xUnit, d.y + 13.5, "Prijs incl. btw", { size: 8.5, bold: true, color: SOFT, align: "right" });
    d.text(xTot - 8, d.y + 13.5, "Totaal", { size: 8.5, bold: true, color: SOFT, align: "right" });
    d.y += 30;
  };
  head();
  for (const l of lines) {
    const title = d.wrap(l.product === l.label || !l.product ? l.label : l.product, 280, 10, true);
    const sub = l.product && l.product !== l.label ? d.wrap(l.label, 280, 9) : [];
    const h = title.length * 12.5 + sub.length * 11.5 + 8;
    if (d.y + h > d.H - 120) {
      d.newPage();
      head();
    }
    title.forEach((t, i) => d.text(M + 8, d.y + i * 12.5, t, { size: 10, bold: true }));
    sub.forEach((t, i) => d.text(M + 8, d.y + title.length * 12.5 + i * 11.5, t, { size: 9, color: SOFT }));
    d.text(xQty, d.y, qtyText(l.qty), { size: 10, align: "right" });
    d.text(xUnit, d.y, eur(l.unit), { size: 10, align: "right" });
    d.text(xTot - 8, d.y, eur(l.qty * l.unit), { size: 10, align: "right", bold: true });
    d.y += h;
    d.hline(M, d.W - M, d.y - 6);
    d.y += 6;
  }
}

function totalsBlock(d: Doc, t: ReturnType<typeof totals>, label = "Totaal incl. btw") {
  if (d.y > d.H - 170) d.newPage();
  const x = d.W - M - 8;
  const row = (k: string, v: string, bold = false, size = 10) => {
    d.text(x - 120, d.y, k, { size, bold, align: "right", color: bold ? INK : SOFT });
    d.text(x, d.y, v, { size, bold, align: "right" });
    d.y += size + 6;
  };
  d.y += 4;
  for (const r of t.rates) {
    row(`Totaal excl. btw (${r.rate}%)`, eur(r.net));
    row(`Btw ${r.rate}%`, eur(r.vat));
  }
  d.hline(x - 230, d.W - M, d.y - 4, INK, 1);
  d.y += 6;
  row(label, eur(t.total), true, 12);
  d.y += 6;
}

function paymentBox(d: Doc, s: ShopSettings, amount: number, reference: string, due: string | null) {
  if (d.y > d.H - 190) d.newPage();
  const top = d.y + 6;
  d.rect(M, top, d.W - 2 * M, 128, [0.985, 0.94, 0.88]);
  d.text(M + 14, top + 22, "Betalen via overschrijving", { size: 12, bold: true });
  const rows: [string, string][] = [
    ["Bedrag", eur(amount)],
    ["Begunstigde", s.accountHolder || s.company],
    ["IBAN", formatIban(s.iban)],
    ["BIC", s.bic.toUpperCase()],
    ["Mededeling", reference],
  ];
  if (due) rows.push(["Te betalen vóór", day(due)]);
  rows.forEach(([k, v], i) => {
    d.text(M + 14, top + 42 + i * 13.5, k, { size: 9.5, color: SOFT });
    d.text(M + 110, top + 42 + i * 13.5, v, { size: 9.5, bold: true });
  });
  d.qr(d.W - M - 112, top + 10, 100, epcPayload(s, amount, reference));
  d.text(d.W - M - 62, top + 120, "Scan met uw bank-app", { size: 7.5, color: SOFT, align: "right" });
  d.y = top + 128 + 18;
}

function footer(d: Doc, s: ShopSettings) {
  const text = s.invoiceFooter || [s.company, s.vat && `btw ${s.vat}`, s.email, s.iban && `IBAN ${formatIban(s.iban)}`].filter(Boolean).join(" · ");
  d.wrap(text, d.W - 2 * M, 8).forEach((t, i) => d.text(M, d.H - 40 + i * 10, t, { size: 8, color: SOFT }));
}

const deliveryText = (delivery: boolean, c: Party) =>
  delivery ? `Levering naar ${[c.street, [c.postcode, c.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}` : "Afhalen in Zele";

/** Order confirmation + payment request, sent when Natuurhout confirms the order. */
export function orderPdf(order: OrderRow, lines: LineRow[], s: ShopSettings): Uint8Array {
  const d = new Doc();
  const due = new Date(Date.now() + (Number(s.paymentDays) || 8) * 86_400_000).toISOString().slice(0, 10);
  header(d, s, "Bestelbevestiging", [
    ["Bestelling", order.number],
    ["Datum", day(order.confirmed_at ?? order.created_at)],
  ]);
  const party: Party = { name: order.name, company: order.company, vat: order.vat_number, email: order.email, phone: order.phone, street: order.street, postcode: order.postcode, city: order.city };
  customerBlock(d, party, deliveryText(order.delivery === 1, party));
  linesTable(d, lines);
  const t = totals(lines);
  totalsBlock(d, t);
  paymentBox(d, s, t.total, order.ogm, due);
  d.text(M, d.y, "Na ontvangst van de betaling bereiden we uw bestelling voor en ontvangt u de factuur.", { size: 9, color: SOFT });
  footer(d, s);
  return d.bytes();
}

/** Invoice or credit note, from the data frozen when it was issued. */
export function invoicePdf(number: string, type: "factuur" | "creditnota", data: InvoiceData): Uint8Array {
  const d = new Doc();
  const s = data.seller;
  const meta: [string, string][] = [
    [type === "factuur" ? "Factuurnummer" : "Creditnota", number],
    ["Datum", day(data.date)],
    ["Bestelling", data.order.number],
  ];
  if (data.creditOf) meta.push(["Op factuur", data.creditOf]);
  header(d, s, type === "factuur" ? "Factuur" : "Creditnota", meta);
  customerBlock(d, data.customer, deliveryText(data.order.delivery, data.customer));
  linesTable(d, data.lines);
  totalsBlock(d, data.totals, type === "factuur" ? "Totaal incl. btw" : "Te crediteren incl. btw");
  if (type === "factuur") {
    if (data.paid) {
      d.rect(M, d.y + 4, 150, 26, [0.88, 0.95, 0.9]);
      d.text(M + 12, d.y + 21, "Betaald, bedankt!", { size: 11, bold: true, color: [0.09, 0.4, 0.2] });
      d.y += 44;
    } else paymentBox(d, s, data.totals.total, data.order.ogm, data.due);
  }
  footer(d, s);
  return d.bytes();
}

export const pdfBase64 = (bytes: Uint8Array) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};

