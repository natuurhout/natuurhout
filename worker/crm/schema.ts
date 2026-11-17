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
];

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
