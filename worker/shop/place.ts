/*
 * A website order (POST /api/offerte/, kind "bestelling") becomes an order in
 * the backend. Every line is priced again with the live catalogue (the page
 * the customer saw may be older than a price change); the e-mails then show
 * the order as saved.
 */

import type { Quote, QuoteLine } from "../../src/lib/quote-email";
import { ensureSchema, now } from "../crm/schema";
import { upsertContact } from "../crm/store";
import { loadCatalog } from "./catalog";
import { createOrder, priceLine, type LineRow, type OrderRow } from "./orders";
import { volumeUnits } from "../../src/lib/volume-pricing";

export async function placeWebsiteOrder(db: D1Database, quote: Quote): Promise<{ order: OrderRow; lines: QuoteLine[] }> {
  await ensureSchema(db);
  const { byId } = await loadCatalog(db);
  const priced = quote.lines.map((l) => priceLine(byId, l));
  // Staffelprijzen (src/lib/volume-pricing.ts), as at /afrekenen/.
  const units = volumeUnits(priced.map((l) => ({ handle: l.handle, title: l.variant_id !== null ? (byId.get(l.variant_id)?.variant.title ?? "") : "", qty: l.qty })));
  priced.forEach((l, i) => {
    const unit = units[i];
    if (unit !== null && unit < l.unit) {
      l.unit = unit;
      l.label = `${l.label} (staffelprijs)`;
    }
  });
  const contactId = await upsertContact(db, quote, now());
  const order = await createOrder(db, {
    contact_id: contactId,
    source: "website",
    name: quote.name,
    email: quote.email,
    phone: quote.phone,
    delivery: quote.delivery,
    street: quote.street,
    postcode: quote.postcode,
    city: quote.city,
    remarks: quote.remarks,
    page: quote.page,
    lines: priced,
  });
  return {
    order,
    lines: priced.map((l) => ({ id: l.variant_id ?? undefined, group: l.product, label: l.label, detail: l.note || "Op voorraad", qty: l.qty, unit: l.unit })),
  };
}

export async function setOrderMailStatus(db: D1Database, orderId: number, status: string) {
  await db.prepare("UPDATE orders SET mail_status = ? WHERE id = ?").bind(status, orderId).run();
}

export type { LineRow };
