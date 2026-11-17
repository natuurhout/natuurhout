/*
 * Orders: from the website (POST /api/offerte/, kind "bestelling"), entered
 * by hand in the backend, or made from a quote request.
 *
 * Flow: nieuw → (Natuurhout checks it, adds delivery) bevestigd = payment
 * request sent (iBanFirst IBAN + structured reference) → betaald (invoice) →
 * klaar → geleverd. Or geannuleerd (stock back, credit note if invoiced).
 *
 * Stock: a variant whose stock is counted (variant_overrides.stock not null)
 * is reserved when the order is placed and given back when it is cancelled
 * or its lines change.
 */

import { now } from "../crm/schema";
import type { LiveProduct, LiveVariant } from "./catalog";
import { variantLabel } from "./catalog";
import type { ShopSettings } from "./settings";

export const ORDER_STATUSES = [
  ["nieuw", "Nieuw"],
  ["bevestigd", "Wacht op betaling"],
  ["betaald", "Betaald"],
  ["klaar", "Klaar"],
  ["geleverd", "Geleverd / afgehaald"],
  ["geannuleerd", "Geannuleerd"],
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number][0];
export const orderStatusLabel = (s: string) => ORDER_STATUSES.find(([k]) => k === s)?.[1] ?? s;
export const isOrderStatus = (s: string): s is OrderStatus => ORDER_STATUSES.some(([k]) => k === s);
/** Lines can still change (no invoice yet). */
export const EDITABLE: OrderStatus[] = ["nieuw", "bevestigd"];
export const VAT_RATE = 21;

export type OrderRow = {
  id: number;
  number: string;
  contact_id: number | null;
  request_id: number | null;
  source: string;
  status: string;
  paid_at: string | null;
  paid_amount: number | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  vat_number: string;
  delivery: number;
  street: string;
  postcode: string;
  city: string;
  remarks: string;
  page: string;
  total: number;
  ogm: string;
  mail_status: string | null;
  assigned_to: string | null;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type LineRow = {
  id: number;
  order_id: number;
  position: number;
  variant_id: number | null;
  handle: string;
  product: string;
  label: string;
  qty: number;
  unit: number;
  vat_rate: number;
  reserved: number;
  note: string;
};
export type NewLine = Omit<LineRow, "id" | "order_id" | "position" | "reserved" | "vat_rate"> & { vat_rate?: number };
export type InvoiceRow = {
  id: number;
  number: string;
  type: "factuur" | "creditnota";
  order_id: number;
  credit_of: number | null;
  year: number;
  seq: number;
  issued_at: string;
  total: number;
  vat: number;
  data: string;
  emailed_at: string | null;
  created_by: string | null;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Belgian structured reference (OGM/VCS) for an order: +++123/4567/89012+++. */
export function ogm(orderId: number): string {
  const base = String(orderId).padStart(10, "0").slice(-10);
  const check = Number(BigInt(base) % 97n) || 97;
  const d = base + String(check).padStart(2, "0");
  return `+++${d.slice(0, 3)}/${d.slice(3, 7)}/${d.slice(7)}+++`;
}

export const orderNumber = (id: number) => `NH-${String(id).padStart(5, "0")}`;

/** Totals incl. btw, with the btw in it per rate (prices are incl. btw). */
export function totals(lines: Pick<LineRow, "qty" | "unit" | "vat_rate">[]) {
  const byRate = new Map<number, number>();
  for (const l of lines) byRate.set(l.vat_rate, round2((byRate.get(l.vat_rate) ?? 0) + l.qty * l.unit));
  const rates = [...byRate].map(([rate, gross]) => {
    const vat = round2((gross * rate) / (100 + rate));
    return { rate, gross, vat, net: round2(gross - vat) };
  });
  const total = round2(rates.reduce((t, r) => t + r.gross, 0));
  const vat = round2(rates.reduce((t, r) => t + r.vat, 0));
  return { total, vat, net: round2(total - vat), rates };
}

/** A website line priced with the live catalogue; unknown ids keep the page's price, flagged. */
export function priceLine(
  byId: Map<number, { product: LiveProduct; variant: LiveVariant }>,
  line: { id?: number; group: string; label: string; detail: string; qty: number; unit: number | null },
): NewLine {
  const qty = Math.max(1, Math.round(line.qty));
  const hit = line.id !== undefined ? byId.get(line.id) : undefined;
  if (hit) {
    return {
      variant_id: hit.variant.id,
      handle: hit.product.handle,
      product: hit.product.title,
      label: variantLabel(hit.product, hit.variant),
      qty,
      unit: round2(parseFloat(hit.variant.price)),
      note: hit.variant.available ? "" : "op bestelling",
    };
  }
  return {
    variant_id: null,
    handle: "",
    product: line.group,
    label: line.label,
    qty,
    unit: round2(line.unit ?? 0),
    note: "prijs nakijken: niet in de catalogus gevonden",
  };
}

export type OrderInput = {
  contact_id: number | null;
  request_id?: number | null;
  source: "website" | "manueel" | "offerte";
  name: string;
  email: string;
  phone: string;
  company?: string;
  vat_number?: string;
  delivery: boolean;
  street: string;
  postcode: string;
  city: string;
  remarks: string;
  page?: string;
  created_by?: string | null;
  assigned_to?: string | null;
  lines: NewLine[];
};

function lineInserts(db: D1Database, orderId: number, lines: NewLine[]) {
  return lines.map((l, i) =>
    db
      .prepare(
        `INSERT INTO order_lines (order_id, position, variant_id, handle, product, label, qty, unit, vat_rate, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(orderId, i, l.variant_id, l.handle, l.product, l.label, l.qty, l.unit, l.vat_rate ?? VAT_RATE, l.note),
  );
}

export async function createOrder(db: D1Database, input: OrderInput): Promise<OrderRow> {
  const at = now();
  const { total } = totals(input.lines.map((l) => ({ ...l, vat_rate: l.vat_rate ?? VAT_RATE })));
  const row = await db
    .prepare(
      `INSERT INTO orders (number, contact_id, request_id, source, name, email, phone, company, vat_number, delivery, street, postcode, city,
         remarks, page, total, created_by, assigned_to, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(
      `tmp-${crypto.randomUUID()}`,
      input.contact_id,
      input.request_id ?? null,
      input.source,
      input.name,
      input.email,
      input.phone,
      input.company ?? "",
      input.vat_number ?? "",
      input.delivery ? 1 : 0,
      input.street,
      input.postcode,
      input.city,
      input.remarks,
      input.page ?? "",
      total,
      input.created_by ?? null,
      input.assigned_to ?? null,
      at,
      at,
    )
    .first<{ id: number }>();
  const id = row!.id;
  await db.batch([
    db.prepare("UPDATE orders SET number = ?, ogm = ? WHERE id = ?").bind(orderNumber(id), ogm(id), id),
    ...lineInserts(db, id, input.lines),
  ]);
  await reserveStock(db, id, input.created_by ?? null);
  return (await getOrder(db, id))!;
}

export const getOrder = (db: D1Database, id: number) => db.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first<OrderRow>();
export const getLines = async (db: D1Database, id: number) =>
  (await db.prepare("SELECT * FROM order_lines WHERE order_id = ? ORDER BY position, id").bind(id).all<LineRow>()).results;

/** Reserves counted stock for the lines not reserved yet. */
export async function reserveStock(db: D1Database, orderId: number, author: string | null) {
  const { results } = await db
    .prepare(
      `SELECT l.id, l.variant_id, l.qty FROM order_lines l JOIN variant_overrides v ON v.variant_id = l.variant_id
       WHERE l.order_id = ? AND l.reserved = 0 AND v.stock IS NOT NULL`,
    )
    .bind(orderId)
    .all<{ id: number; variant_id: number; qty: number }>();
  if (!results.length) return;
  const at = now();
  await db.batch(
    results.flatMap((l) => {
      const qty = Math.round(l.qty);
      return [
        db.prepare("UPDATE variant_overrides SET stock = stock - ?, updated_at = ? WHERE variant_id = ?").bind(qty, at, l.variant_id),
        db.prepare("INSERT INTO stock_moves (variant_id, delta, reason, order_id, author, created_at) VALUES (?, ?, 'bestelling', ?, ?, ?)").bind(l.variant_id, -qty, orderId, author, at),
        db.prepare("UPDATE order_lines SET reserved = ? WHERE id = ?").bind(qty, l.id),
      ];
    }),
  );
}

/** Gives reserved stock back (cancel, or before the lines are replaced). */
export async function releaseStock(db: D1Database, orderId: number, author: string | null, reason: string) {
  const { results } = await db
    .prepare("SELECT id, variant_id, reserved FROM order_lines WHERE order_id = ? AND reserved > 0 AND variant_id IS NOT NULL")
    .bind(orderId)
    .all<{ id: number; variant_id: number; reserved: number }>();
  if (!results.length) return;
  const at = now();
  await db.batch(
    results.flatMap((l) => [
      db.prepare("UPDATE variant_overrides SET stock = stock + ?, updated_at = ? WHERE variant_id = ? AND stock IS NOT NULL").bind(l.reserved, at, l.variant_id),
      db.prepare("INSERT INTO stock_moves (variant_id, delta, reason, order_id, author, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(l.variant_id, l.reserved, reason, orderId, author, at),
      db.prepare("UPDATE order_lines SET reserved = 0 WHERE id = ?").bind(l.id),
    ]),
  );
}

/** Replaces the lines of an order that has no invoice yet. */
export async function replaceLines(db: D1Database, orderId: number, lines: NewLine[], author: string | null) {
  await releaseStock(db, orderId, author, "bestelling gewijzigd");
  const { total } = totals(lines.map((l) => ({ ...l, vat_rate: l.vat_rate ?? VAT_RATE })));
  await db.batch([
    db.prepare("DELETE FROM order_lines WHERE order_id = ?").bind(orderId),
    ...lineInserts(db, orderId, lines),
    db.prepare("UPDATE orders SET total = ?, updated_at = ? WHERE id = ?").bind(total, now(), orderId),
  ]);
  await reserveStock(db, orderId, author);
}

/** Today in Belgium, YYYY-MM-DD. */
export const todayBE = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(new Date());

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Everything an invoice prints, frozen when it is issued. */
export type InvoiceData = {
  seller: ShopSettings;
  customer: { name: string; company: string; vat: string; email: string; phone: string; street: string; postcode: string; city: string };
  order: { number: string; ogm: string; created_at: string; delivery: boolean };
  lines: { product: string; label: string; qty: number; unit: number; vat_rate: number }[];
  totals: ReturnType<typeof totals>;
  date: string;
  due: string | null;
  paid: boolean;
  creditOf?: string;
};

/** Issues the next invoice (or credit note) number of the year: gapless, never reused. */
export async function issueInvoice(
  db: D1Database,
  order: OrderRow,
  lines: LineRow[],
  seller: ShopSettings,
  type: "factuur" | "creditnota",
  by: string,
  credit?: InvoiceRow,
): Promise<InvoiceRow> {
  const date = todayBE();
  const year = Number(date.slice(0, 4));
  const sign = type === "creditnota" ? -1 : 1;
  const invLines = lines.map((l) => ({ product: l.product, label: l.label, qty: l.qty * sign, unit: l.unit, vat_rate: l.vat_rate }));
  const t = totals(invLines);
  const data: InvoiceData = {
    seller,
    customer: {
      name: order.name,
      company: order.company,
      vat: order.vat_number,
      email: order.email,
      phone: order.phone,
      street: order.street,
      postcode: order.postcode,
      city: order.city,
    },
    order: { number: order.number, ogm: order.ogm, created_at: order.created_at, delivery: order.delivery === 1 },
    lines: invLines,
    totals: t,
    date,
    due: type === "factuur" && !order.paid_at ? addDays(date, Number(seller.paymentDays) || 8) : null,
    paid: type === "factuur" && Boolean(order.paid_at),
    creditOf: credit?.number,
  };
  const row = await db
    .prepare(
      `INSERT INTO invoices (number, type, order_id, credit_of, year, seq, issued_at, total, vat, data, created_by)
       SELECT ?1 || '-' || printf('%04d', COALESCE(MAX(seq), 0) + 1), ?2, ?3, ?4, ?5, COALESCE(MAX(seq), 0) + 1, ?6, ?7, ?8, ?9, ?10
       FROM invoices WHERE year = ?5 RETURNING *`,
    )
    .bind(String(year), type, order.id, credit?.id ?? null, year, now(), t.total, t.vat, JSON.stringify(data), by)
    .first<InvoiceRow>();
  return row!;
}

/** The order's invoice that has not been credited yet, if any. */
export async function openInvoice(db: D1Database, orderId: number): Promise<InvoiceRow | null> {
  return db
    .prepare(
      `SELECT * FROM invoices i WHERE i.order_id = ? AND i.type = 'factuur'
       AND NOT EXISTS (SELECT 1 FROM invoices c WHERE c.credit_of = i.id) ORDER BY i.id DESC LIMIT 1`,
    )
    .bind(orderId)
    .first<InvoiceRow>();
}

/** EPC ("SEPA QR") payload that Belgian banking apps scan to fill in a transfer. */
export function epcPayload(s: ShopSettings, amount: number, reference: string): string {
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    s.bic.replace(/\s+/g, "").toUpperCase(),
    (s.accountHolder || s.company).slice(0, 70),
    s.iban.replace(/\s+/g, "").toUpperCase(),
    `EUR${amount.toFixed(2)}`,
    "",
    "",
    reference.slice(0, 140),
  ].join("\n");
}
