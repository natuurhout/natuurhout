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
