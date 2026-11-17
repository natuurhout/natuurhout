/*
 * Shop settings, kept in D1 (table settings) and edited in the backend
 * (Instellingen): the company details on invoices and the bank account
 * customers pay to (iBanFirst). Nothing secret: these are printed on every
 * invoice anyway.
 */

export type ShopSettings = {
  company: string;
  street: string;
  postcode: string;
  city: string;
  country: string;
  vat: string;
  email: string;
  phone: string;
  iban: string;
  bic: string;
  accountHolder: string;
  /** Days to pay a payment request / invoice. */
  paymentDays: string;
  invoiceFooter: string;
};

export const SETTING_FIELDS: { key: keyof ShopSettings; label: string; hint?: string; required?: boolean }[] = [
  { key: "company", label: "Bedrijfsnaam", required: true },
  { key: "vat", label: "Btw-nummer", hint: "BE0123.456.789", required: true },
  { key: "street", label: "Straat + nr", required: true },
  { key: "postcode", label: "Postcode", required: true },
  { key: "city", label: "Gemeente", required: true },
  { key: "country", label: "Land" },
  { key: "email", label: "E-mail op facturen" },
  { key: "phone", label: "Telefoon op facturen" },
  { key: "accountHolder", label: "Rekeninghouder (iBanFirst)", required: true },
  { key: "iban", label: "IBAN (iBanFirst)", hint: "BE.. of het IBAN dat iBanFirst gaf", required: true },
  { key: "bic", label: "BIC", required: true },
  { key: "paymentDays", label: "Betaaltermijn (dagen)" },
  { key: "invoiceFooter", label: "Tekst onderaan facturen", hint: "Bv. algemene voorwaarden, handelsregister" },
];

const DEFAULTS: ShopSettings = {
  company: "Natuurhout",
  street: "",
  postcode: "",
  city: "Zele",
  country: "België",
  vat: "",
  email: "info@natuurhout.be",
  phone: "",
  iban: "",
  bic: "",
  accountHolder: "",
  paymentDays: "8",
  invoiceFooter: "",
};

export async function getSettings(db: D1Database): Promise<ShopSettings> {
  const { results } = await db.prepare("SELECT key, value FROM settings").all<{ key: string; value: string }>();
  const out = { ...DEFAULTS };
  for (const r of results) if (r.key in out) out[r.key as keyof ShopSettings] = r.value;
  return out;
}

export async function saveSettings(db: D1Database, values: Partial<ShopSettings>) {
  await db.batch(
    Object.entries(values).map(([k, v]) =>
      db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value").bind(k, v ?? ""),
    ),
  );
}

/** What is still missing before payment requests and invoices can go out. */
export const missingSettings = (s: ShopSettings) => SETTING_FIELDS.filter((f) => f.required && !s[f.key].trim()).map((f) => f.label);

export const compactIban = (iban: string) => iban.replace(/\s+/g, "").toUpperCase();
export const formatIban = (iban: string) => compactIban(iban).replace(/(.{4})/g, "$1 ").trim();

/** IBAN checksum (mod 97), so a typo in the settings is caught. */
export function validIban(iban: string): boolean {
  const s = compactIban(iban);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(s)) return false;
  const moved = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const ch of moved) rest = (rest * 10 + Number(ch)) % 97;
  return rest === 1;
}
