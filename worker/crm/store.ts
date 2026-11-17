/*
 * Saves website form submissions in the CRM (worker/crm/schema.ts). Called by
 * POST /api/offerte/ (worker/offerte.ts) next to the e-mail: the e-mail stays
 * the notification, the CRM keeps the record, the status and the notes.
 */

import type { Quote } from "../../src/lib/quote-email";
import { ensureSchema, now } from "./schema";

export type MailStatus = "verstuurd" | "niet-ingesteld" | "mislukt";

export function requestTitle(q: Pick<Quote, "kind" | "inStock">): string {
  if (q.kind === "bestelling") return q.inStock ? "Bestelling" : "Aanvraag op bestelling";
  return q.kind === "vraag" ? "Offerteaanvraag" : "Offerte afsluiting (calculator)";
}

/** Finds the contact by e-mail (or creates it) and fills in what the form adds. */
export async function upsertContact(db: D1Database, q: Pick<Quote, "name" | "email" | "phone" | "street" | "postcode" | "city">, at: string): Promise<number> {
  const existing = await db
    .prepare("SELECT id, name, phone, street, postcode, city FROM contacts WHERE email = ? COLLATE NOCASE")
    .bind(q.email)
    .first<{ id: number; name: string; phone: string; street: string; postcode: string; city: string }>();
  if (!existing) {
    const row = await db
      .prepare(
        `INSERT INTO contacts (name, email, phone, street, postcode, city, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      )
      .bind(q.name, q.email, q.phone, q.street, q.postcode, q.city, at, at)
      .first<{ id: number }>();
    return row!.id;
  }
  // Newer details from the customer win, but an empty field never wipes a known one.
  const pick = (fresh: string, known: string) => fresh || known;
  await db
    .prepare("UPDATE contacts SET name = ?, phone = ?, street = ?, postcode = ?, city = ?, updated_at = ? WHERE id = ?")
    .bind(
      pick(q.name, existing.name),
      pick(q.phone, existing.phone),
      pick(q.street, existing.street),
      pick(q.postcode, existing.postcode),
      pick(q.city, existing.city),
      at,
      existing.id,
    )
    .run();
  return existing.id;
}

export async function saveSubmission(db: D1Database, q: Quote, photos: number): Promise<number> {
  await ensureSchema(db);
  const at = now();
  const contactId = await upsertContact(db, q, at);
  const data = {
    lines: q.lines,
    street: q.street,
    postcode: q.postcode,
    city: q.city,
    remarks: q.remarks,
    inStock: q.inStock,
  };
  const row = await db
    .prepare(
      `INSERT INTO requests (contact_id, kind, title, body, data, total, delivery, page, photos, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(contactId, q.kind, requestTitle(q), q.text, JSON.stringify(data), q.total, q.delivery ? 1 : 0, q.page, photos, at, at)
    .first<{ id: number }>();
  return row!.id;
}

export async function setMailStatus(db: D1Database, requestId: number, status: MailStatus): Promise<void> {
  await db.prepare("UPDATE requests SET mail_status = ? WHERE id = ?").bind(status, requestId).run();
}
