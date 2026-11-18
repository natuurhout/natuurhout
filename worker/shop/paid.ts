/*
 * Order steps shared by the backend (worker/admin/shop-orders.ts) and the
 * checkout (worker/shop/checkout.ts, MultiSafepay webhook): timeline notes,
 * the payment request mail, and "payment received" → invoice → mail.
 */

import { now } from "../crm/schema";
import { invoiceMail, paymentRequestMail } from "./mail";
import { getLines, issueInvoice, openInvoice, releaseStock, round2, type InvoiceData, type InvoiceRow, type OrderRow } from "./orders";
import { invoicePdf, orderPdf, pdfBase64 } from "./pdf";
import type { Mailer } from "./send";
import { getSettings, missingSettings } from "./settings";

const euro = (n: number) => `€ ${n.toFixed(2).replace(".", ",")}`;

export async function addOrderNote(db: D1Database, order: Pick<OrderRow, "id" | "contact_id">, body: string, author: string | null, kind: "note" | "event" = "event") {
  if (!order.contact_id) return;
  await db
    .prepare("INSERT INTO notes (contact_id, order_id, kind, author, body, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(order.contact_id, order.id, kind, author ?? "", body, now())
    .run();
}

export async function mailPaymentRequest(db: D1Database, mail: Mailer, order: OrderRow, message: string) {
  const [lines, settings] = await Promise.all([getLines(db, order.id), getSettings(db)]);
  const pdf = pdfBase64(orderPdf(order, lines, settings));
  await mail(order.email, paymentRequestMail(order, lines, settings, pdf, message));
}

export async function mailInvoice(db: D1Database, mail: Mailer, order: OrderRow, inv: InvoiceRow, author: string | null) {
  const data = JSON.parse(inv.data) as InvoiceData;
  const pdf = pdfBase64(invoicePdf(inv.number, inv.type, data));
  await mail(order.email, invoiceMail(order, inv.number, inv.type, inv.total, data.seller, pdf));
  await db.prepare("UPDATE invoices SET emailed_at = ? WHERE id = ?").bind(now(), inv.id).run();
  await addOrderNote(db, order, `${inv.type === "factuur" ? "Factuur" : "Creditnota"} ${inv.number} gemaild naar ${order.email}`, author);
}

/**
 * Payment received: status betaald, then the invoice, mailed when asked.
 * Idempotent: an order that is already paid is left alone (webhooks repeat).
 * Returns false when nothing changed.
 */
export async function markPaid(
  db: D1Database,
  mail: Mailer | null,
  order: OrderRow,
  opts: { amount: number; at: string; author: string | null; how: string; sendInvoice: boolean; /** false for test payments: no invoice number used. */ invoice?: boolean },
): Promise<boolean> {
  const at = now();
  const done = await db
    .prepare("UPDATE orders SET status = 'betaald', paid_at = ?, paid_amount = ?, updated_at = ? WHERE id = ? AND paid_at IS NULL AND status IN ('nieuw', 'bevestigd')")
    .bind(opts.at, round2(opts.amount), at, order.id)
    .run();
  if (!done.meta.changes) return false;
  const paid: OrderRow = { ...order, status: "betaald", paid_at: opts.at, paid_amount: round2(opts.amount) };
  await addOrderNote(db, order, `Betaling ontvangen: ${euro(opts.amount)} (${opts.how})`, opts.author);
  if (opts.invoice === false) {
    await addOrderNote(db, order, "Testbetaling: geen factuur gemaakt (de factuurnummering blijft onaangeroerd).", opts.author);
    return true;
  }
  if (await openInvoice(db, order.id)) return true;
  const [lines, settings] = await Promise.all([getLines(db, order.id), getSettings(db)]);
  const missing = missingSettings(settings);
  if (missing.length) {
    await addOrderNote(db, order, `Geen factuur gemaakt: vul bij Instellingen in: ${missing.join(", ")}.`, opts.author);
    return true;
  }
  const inv = await issueInvoice(db, paid, lines, settings, "factuur", opts.author ?? "", undefined);
  await addOrderNote(db, order, `Factuur ${inv.number} gemaakt (${euro(inv.total)})`, opts.author);
  if (opts.sendInvoice && mail && order.email) {
    try {
      await mailInvoice(db, mail, paid, inv, opts.author);
    } catch (error) {
      console.error("Invoice mail failed", order.number, error);
      await addOrderNote(db, order, `Factuur ${inv.number} kon niet gemaild worden; mail ze opnieuw vanuit de bestelling.`, opts.author);
    }
  }
  return true;
}

/** Cancels an unpaid order and gives counted stock back. */
export async function cancelUnpaid(db: D1Database, order: OrderRow, reason: string, author: string | null): Promise<boolean> {
  const at = now();
  const done = await db
    .prepare("UPDATE orders SET status = 'geannuleerd', cancelled_at = ?, updated_at = ? WHERE id = ? AND paid_at IS NULL AND status IN ('nieuw', 'bevestigd')")
    .bind(at, at, order.id)
    .run();
  if (!done.meta.changes) return false;
  await releaseStock(db, order.id, author, reason);
  await addOrderNote(db, order, `Geannuleerd: ${reason}`, author);
  return true;
}
