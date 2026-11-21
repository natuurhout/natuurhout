/*
 * The CRM database (Cloudflare D1, binding DB in wrangler.jsonc).
 *
 * The schema is applied by the Worker itself: ensureSchema() runs the
 * migrations below that the database has not seen yet, once per isolate.
 * So a deploy is all it takes, no separate `wrangler d1 migrations` step.
 *
 * To change the schema: append a new migration to MIGRATIONS (never edit or
 * reorder one that has shipped; it has already run on the live database).
 */

import { DELIVERY_SETTINGS_2026_11 } from "../shop/delivery-defaults";

const MIGRATIONS: string[][] = [
  // 1: contacts, requests (form submissions and manual entries), notes, users.
  [
    `CREATE TABLE contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      email TEXT,
      phone TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      street TEXT NOT NULL DEFAULT '',
      postcode TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE UNIQUE INDEX contacts_email ON contacts (email COLLATE NOCASE) WHERE email IS NOT NULL`,
    `CREATE TABLE requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL REFERENCES contacts (id),
      kind TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'nieuw',
      assigned_to TEXT,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      data TEXT,
      total REAL,
      delivery INTEGER NOT NULL DEFAULT 0,
      page TEXT NOT NULL DEFAULT '',
      photos INTEGER NOT NULL DEFAULT 0,
      mail_status TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE INDEX requests_status ON requests (status, created_at)`,
    `CREATE INDEX requests_contact ON requests (contact_id)`,
    `CREATE TABLE notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contact_id INTEGER NOT NULL REFERENCES contacts (id),
      request_id INTEGER REFERENCES requests (id),
      kind TEXT NOT NULL DEFAULT 'note',
      author TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX notes_contact ON notes (contact_id, created_at)`,
    `CREATE INDEX notes_request ON notes (request_id, created_at)`,
    `CREATE TABLE users (
      email TEXT PRIMARY KEY COLLATE NOCASE,
      name TEXT NOT NULL DEFAULT '',
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL
    )`,
  ],
  // 2: follow-up tasks (to-dos with a due date, optionally tied to a request or customer).
  [
    `CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      due_date TEXT,
      assigned_to TEXT,
      contact_id INTEGER REFERENCES contacts (id),
      request_id INTEGER REFERENCES requests (id),
      done_at TEXT,
      done_by TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX tasks_open ON tasks (done_at, due_date)`,
    `CREATE INDEX tasks_request ON tasks (request_id)`,
    `CREATE INDEX tasks_contact ON tasks (contact_id)`,
  ],
  // 3: webshop. Orders + lines, invoices/credit notes with gapless numbering per
  // year, catalogue edits on top of the site's catalogue (variant/product
  // overrides), stock movements and shop settings (company, bank).
  [
    `CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      contact_id INTEGER REFERENCES contacts (id),
      request_id INTEGER REFERENCES requests (id),
      source TEXT NOT NULL DEFAULT 'website',
      status TEXT NOT NULL DEFAULT 'nieuw',
      paid_at TEXT,
      paid_amount REAL,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      vat_number TEXT NOT NULL DEFAULT '',
      delivery INTEGER NOT NULL DEFAULT 0,
      street TEXT NOT NULL DEFAULT '',
      postcode TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      remarks TEXT NOT NULL DEFAULT '',
      page TEXT NOT NULL DEFAULT '',
      total REAL NOT NULL DEFAULT 0,
      ogm TEXT NOT NULL DEFAULT '',
      mail_status TEXT,
      assigned_to TEXT,
      confirmed_at TEXT,
      delivered_at TEXT,
      cancelled_at TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE INDEX orders_status ON orders (status, created_at)`,
    `CREATE INDEX orders_contact ON orders (contact_id)`,
    `CREATE TABLE order_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders (id),
      position INTEGER NOT NULL DEFAULT 0,
      variant_id INTEGER,
      handle TEXT NOT NULL DEFAULT '',
      product TEXT NOT NULL DEFAULT '',
      label TEXT NOT NULL,
      qty REAL NOT NULL,
      unit REAL NOT NULL,
      vat_rate REAL NOT NULL DEFAULT 21,
      reserved INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT ''
    )`,
    `CREATE INDEX order_lines_order ON order_lines (order_id, position)`,
    `CREATE INDEX order_lines_variant ON order_lines (variant_id)`,
    `CREATE TABLE invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'factuur',
      order_id INTEGER NOT NULL REFERENCES orders (id),
      credit_of INTEGER REFERENCES invoices (id),
      year INTEGER NOT NULL,
      seq INTEGER NOT NULL,
      issued_at TEXT NOT NULL,
      total REAL NOT NULL,
      vat REAL NOT NULL,
      data TEXT NOT NULL,
      emailed_at TEXT,
      created_by TEXT,
      UNIQUE (year, seq)
    )`,
    `CREATE INDEX invoices_order ON invoices (order_id)`,
    `CREATE TABLE variant_overrides (
      variant_id INTEGER PRIMARY KEY,
      handle TEXT NOT NULL,
      title TEXT,
      price REAL,
      compare_at REAL,
      available INTEGER,
      stock INTEGER,
      low_stock INTEGER,
      sku TEXT NOT NULL DEFAULT '',
      updated_by TEXT,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE product_overrides (
      handle TEXT PRIMARY KEY,
      title TEXT,
      hidden INTEGER NOT NULL DEFAULT 0,
      updated_by TEXT,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE stock_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      variant_id INTEGER NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      order_id INTEGER REFERENCES orders (id),
      author TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX stock_moves_variant ON stock_moves (variant_id, created_at)`,
    `CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
    `CREATE TABLE catalog_publish (id INTEGER PRIMARY KEY CHECK (id = 1), changed_at TEXT, published_at TEXT)`,
    // Notes and status changes on an order show in its timeline (and the activity feed).
    `ALTER TABLE notes ADD COLUMN order_id INTEGER REFERENCES orders (id)`,
    `CREATE INDEX notes_order ON notes (order_id, created_at)`,
  ],
  // 4: the Worker asks GitHub to rebuild the site when the catalogue changed (worker/shop/publish.ts).
  [
    `ALTER TABLE catalog_publish ADD COLUMN requested_hash TEXT`,
    `ALTER TABLE catalog_publish ADD COLUMN requested_at TEXT`,
    `ALTER TABLE catalog_publish ADD COLUMN error TEXT`,
  ],
  // 5: checkout v2 (/afrekenen/, worker/shop/checkout.ts): pay online through MultiSafepay or by transfer.
  [
    `ALTER TABLE orders ADD COLUMN payment_method TEXT`, // 'online' | 'overschrijving' (null: older orders)
    `ALTER TABLE orders ADD COLUMN checkout_token TEXT`, // secret in the customer's return link
    `ALTER TABLE orders ADD COLUMN psp_mode TEXT`, // 'test' | 'live': which MultiSafepay key
    `ALTER TABLE orders ADD COLUMN psp_order_id TEXT`, // our order_id at MultiSafepay (number-attempt)
    `ALTER TABLE orders ADD COLUMN psp_status TEXT`,
    `ALTER TABLE orders ADD COLUMN psp_transaction TEXT`,
    `ALTER TABLE orders ADD COLUMN psp_method TEXT`, // e.g. MISTERCASH, VISA, IDEAL
    `ALTER TABLE orders ADD COLUMN psp_attempts INTEGER NOT NULL DEFAULT 0`,
    `CREATE INDEX orders_psp ON orders (psp_order_id)`,
  ],
  // 6: delivery prices of November 2026 (worker/shop/delivery-defaults.ts): distance
  // bands, maximum 300 km, free from € 2800, never under € 20, minimum order value per
  // distance and region corrections. Written once; after that the backend (Checkout)
  // is where they change.
  Object.entries({
    delivery_bands: JSON.stringify(DELIVERY_SETTINGS_2026_11.bands),
    delivery_max_km: String(DELIVERY_SETTINGS_2026_11.maxKm),
    delivery_free_above: String(DELIVERY_SETTINGS_2026_11.freeAbove),
    delivery_min_price: String(DELIVERY_SETTINGS_2026_11.minPrice),
    delivery_min_bands: JSON.stringify(DELIVERY_SETTINGS_2026_11.minimums),
    delivery_regions: JSON.stringify(DELIVERY_SETTINGS_2026_11.regions),
  }).map(
    ([key, value]) =>
      `INSERT INTO settings (key, value) VALUES ('${key}', '${value.replaceAll("'", "''")}') ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
  ),
  // 7: stock count of kastanje hekwerk, 20 November 2026 (rolls), as the Voorraad
  // screen saves it: a stock move for the difference, then the counted stock (the
  // site's availability follows it: 0 = op bestelling). Other columns are kept.
  // 80cm was not counted. Written once; after that the backend is where it changes.
  stockCount("kastanje-rasterwerk", "telling 2026-11-20", {
    51176454717771: 3, // 60cm / 4.5/5cm
    51176454947147: 60, // 60cm / 7.5/8cm
    51176454783307: 50, // 90cm / 4.5/5cm
    51176455012683: 35, // 90cm / 7.5/8cm
    51176454816075: 60, // 100cm / 4.5/5cm
    51176455045451: 25, // 100cm / 7.5/8cm
    51176454848843: 60, // 120cm / 4.5/5cm
    51176455078219: 55, // 120cm / 7.5/8cm
    51176454881611: 0, // 150cm / 4.5/5cm
    53687747019083: 18, // 150cm / 7.5/8cm
    51176454914379: 30, // 180cm / 4.5/5cm
    53687747051851: 20, // 180cm / 7.5/8cm
  }),
  // 8: stock count of the kastanje premium poorten (/project/franse-poorten/), 20 November
  // 2026. 90x100 and 100x100 are in stock but were not counted, so they are left alone.
  stockCount("kastanje-poorten", "telling 2026-11-20", {
    51176451998027: 0, // 100cm / 120cm
    51176452030795: 5, // 100cm / 150cm
    51176452063563: 10, // 120cm / 100cm
    51176452096331: 10, // 120cm / 120cm
    51176452129099: 5, // 120cm / 150cm
    51176452161867: 0, // 150cm / 100cm
    51176452194635: 1, // 180cm / 100cm
    51176452227403: 4, // 180cm / 150cm
  }),
  // 9: stock count of plaatsing materiaal, 20 November 2026: snelbeton (website product,
  // negative id), the three grondboren and both slaghamers. The rental choices (negative
  // ids in src/lib/rentals.ts) are not counted.
  stockCount("snelbeton", "telling 2026-11-20", { [-900001]: 20 }), // 25 kg
  stockCount("grondboor", "telling 2026-11-20", {
    57163425251659: 5, // grondboor ø7,5 cm
    57163425284427: 5, // grondboor ø9 cm
    51682089861451: 5, // spiraalboor ø8 cm
  }),
  stockCount("tuin-voorhamer", "telling 2026-11-20", {
    56669742924107: 5, // rubber
    56669742956875: 3, // hout
  }),
  // 10: stock count of kastanje palen, 20 November 2026. 120cm ø10-12 is op aanvraag (0);
  // the lengths Xander did not count get 200 as a ceiling. Orders of more than 300 palen
  // go by mail (src/lib/order-limits.ts).
  stockCount("palen", "telling 2026-11-20", {
    51176453013835: 40, // 100cm / 6-8cm
    51176453243211: 40, // 100cm / 8-10cm
    51176453046603: 30, // 120cm / 6-8cm
    51176453275979: 30, // 120cm / 8-10cm
    51176453472587: 0, // 120cm / 10-12cm (op aanvraag)
    51176453079371: 200, // 150cm / 6-8cm
    51176453308747: 200, // 150cm / 8-10cm
    51176453505355: 300, // 150cm / 10-12cm
    51176453112139: 200, // 180cm / 6-8cm
    51176453341515: 200, // 180cm / 8-10cm
    51176453538123: 10, // 180cm / 10-12cm
    51176453144907: 200, // 200cm / 6-8cm
    51176453374283: 200, // 200cm / 8-10cm
    51176453570891: 200, // 200cm / 10-12cm
    51176453177675: 200, // 250cm / 6-8cm
    51176453407051: 200, // 250cm / 8-10cm
    51176453603659: 200, // 250cm / 10-12cm
    51176453210443: 5, // 300cm / 6-8cm
    51176453439819: 5, // 300cm / 8-10cm
  }),
  // 11: kastanje hekwerk 80cm, counted later the same day (not in migration 7).
  stockCount("kastanje-rasterwerk", "telling 2026-11-20", {
    51176454750539: 20, // 80cm / 4.5/5cm
    51176454979915: 20, // 80cm / 7.5/8cm
  }),
  // 12: robinia poorten, one of each size left.
  stockCount("robinia-poort", "telling 2026-11-20", {
    51808531579211: 1, // 100cm x 100cm
    51808531611979: 1, // 120cm x 100cm
    56930521973067: 1, // 100cm x 150cm
    56930522005835: 1, // 120cm x 150cm
  }),
  // 13: hazelaar hekwerk 90cm, 21 November 2026. 80cm is not in the catalogue.
  stockCount("hazelaar-hekwerk", "telling 2026-11-21", {
    51176449671499: 2, // 90cm / 3/5cm
    51176449704267: 1, // 90cm / 7/9cm
  }),
  // 14: hazelaar hekwerk 80cm / 3/5cm, a website-only choice (src/lib/product-copy.ts): 12 rolls.
  stockCount("hazelaar-hekwerk", "telling 2026-11-21", { [-900301]: 12 }),
];

/** SQL for a one-time stock count (see migrations 7 to 14). Counts are integers from code, never user input. */
function stockCount(handle: string, author: string, counts: Record<number, number>): string[] {
  const at = "2026-11-20T00:00:00.000Z";
  return [
    ...Object.entries(counts).flatMap(([id, stock]) => [
      `INSERT INTO stock_moves (variant_id, delta, reason, author, created_at)
       SELECT ${Number(id)}, ${stock} - COALESCE((SELECT stock FROM variant_overrides WHERE variant_id = ${Number(id)}), 0),
         CASE WHEN (SELECT stock FROM variant_overrides WHERE variant_id = ${Number(id)}) IS NULL THEN 'telling gestart' ELSE 'correctie' END, '${author}', '${at}'
       WHERE ${stock} IS NOT (SELECT stock FROM variant_overrides WHERE variant_id = ${Number(id)})`,
      `INSERT INTO variant_overrides (variant_id, handle, available, stock, updated_by, updated_at)
       VALUES (${Number(id)}, '${handle}', NULL, ${stock}, '${author}', '${at}')
       ON CONFLICT (variant_id) DO UPDATE SET available = NULL, stock = excluded.stock, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    ]),
    `INSERT INTO catalog_publish (id, changed_at) VALUES (1, '${at}') ON CONFLICT (id) DO UPDATE SET changed_at = excluded.changed_at`,
  ];
}

let ready: Promise<void> | undefined;

export function ensureSchema(db: D1Database): Promise<void> {
  ready ??= migrate(db).catch((error) => {
    ready = undefined; // try again on the next request
    throw error;
  });
  return ready;
}

async function migrate(db: D1Database): Promise<void> {
  await db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");
  const row = await db.prepare("SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations").first<{ v: number }>();
  for (let version = (row?.v ?? 0) + 1; version <= MIGRATIONS.length; version++) {
    // One batch per migration: D1 runs a batch as a single transaction, and the
    // INSERT fails on a concurrent run (primary key), rolling that run back.
    await db.batch([
      ...MIGRATIONS[version - 1].map((sql) => db.prepare(sql)),
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").bind(version, now()),
    ]).catch(async (error) => {
      const done = await db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?").bind(version).first();
      if (!done) throw error; // a real failure, not another isolate that won the race
    });
  }
}

export const now = () => new Date().toISOString();
