/*
 * Keeps the public site in step with the backend catalogue.
 *
 * The site is static, so price/name/availability edits only show after a
 * rebuild. The rebuild is .github/workflows/deploy.yml: it copies
 * /api/catalogus/ into src/data/catalog-overrides.json, builds and deploys.
 *
 * That file is bundled into this Worker too, so the Worker always knows what
 * the live site shows. Whenever the backend's catalogue differs from it, the
 * Worker starts the workflow (GitHub "workflow_dispatch", token in the secret
 * GITHUB_DEPLOY_TOKEN), once per catalogue state. The Cloudflare cron
 * (every 5 minutes, wrangler.jsonc) retries when a started rebuild did not
 * bring the site up to date within RETRY_MINUTES (failed or dropped run).
 * Checkout never waits for any of this: it prices from D1 directly.
 */

import overridesData from "../../src/data/catalog-overrides.json";
import type { CatalogOverrides } from "../../src/lib/catalog-overrides";
import { now } from "../crm/schema";
import { loadCatalog } from "./catalog";

export interface PublishEnv {
  DB?: D1Database;
  /** Fine-grained GitHub token, repo natuurhout/natuurhout, permission "Actions: read and write". */
  GITHUB_DEPLOY_TOKEN?: string;
}

const REPO = "natuurhout/natuurhout";
const WORKFLOW = "deploy.yml";
/** A started rebuild normally finishes in about 2 minutes (GitHub run ~1.5 min). */
export const RETRY_MINUTES = 10;

/** Same normal form as scripts/sync-catalog.mjs: sorted keys. */
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(o).sort((a, b) => a.localeCompare(b, "en", { numeric: true })).map((k) => [k, stable(o[k])]));
  }
  return value;
}
const canon = (o: CatalogOverrides) => JSON.stringify(stable({ products: o.products, variants: o.variants }));
const LIVE = canon(overridesData as CatalogOverrides);

async function sha(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

type Row = { changed_at: string | null; requested_hash: string | null; requested_at: string | null; error: string | null };

export type SiteStatus =
  | { state: "live" }
  /** Rebuild started at `since`, not live yet. `slow`: longer than RETRY_MINUTES. */
  | { state: "building"; since: string; slow: boolean }
  /** Differs and no rebuild could be started (no token, or GitHub refused: `error`). */
  | { state: "waiting"; changedAt: string | null; error: string | null; token: boolean };

export async function siteStatus(db: D1Database, env: PublishEnv): Promise<SiteStatus & { hash: string }> {
  const { overrides } = await loadCatalog(db);
  const current = canon(overrides);
  const hash = await sha(current);
  if (current === LIVE) return { state: "live", hash };
  const row = await db.prepare("SELECT changed_at, requested_hash, requested_at, error FROM catalog_publish WHERE id = 1").first<Row>();
  if (row?.requested_at && !row.error) {
    const slow = Date.now() - Date.parse(row.requested_at) > RETRY_MINUTES * 60_000;
    return { state: "building", since: row.requested_at, slow, hash };
  }
  return { state: "waiting", changedAt: row?.changed_at ?? null, error: row?.error ?? null, token: Boolean(env.GITHUB_DEPLOY_TOKEN), hash };
}

/**
 * Starts a rebuild when the catalogue differs from the live site and no
 * rebuild was started for this exact state yet. `retry` (cron, button) also
 * restarts one that has not landed after RETRY_MINUTES; `force` always starts.
 */
export async function publishSite(env: PublishEnv, opts: { retry?: boolean; force?: boolean } = {}): Promise<SiteStatus["state"] | "started"> {
  if (!env.DB) return "live";
  const db = env.DB;
  const status = await siteStatus(db, env);
  if (status.state === "live") {
    // Clear a stale request so the next change starts fresh.
    await db.prepare("UPDATE catalog_publish SET requested_hash = NULL, requested_at = NULL, error = NULL WHERE id = 1 AND requested_at IS NOT NULL").run();
    return "live";
  }
  if (!env.GITHUB_DEPLOY_TOKEN) return status.state;
  const row = await db.prepare("SELECT requested_hash, requested_at, error FROM catalog_publish WHERE id = 1").first<Row>();
  const sameState = row?.requested_hash === status.hash && !row?.error;
  const stale = row?.requested_at ? Date.now() - Date.parse(row.requested_at) > RETRY_MINUTES * 60_000 : true;
  if (!opts.force && sameState && !(opts.retry && stale)) return status.state;
  if (!opts.force && row?.error && !opts.retry && row.requested_hash === status.hash) return status.state; // failed: the cron retries

  let error: string | null = null;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_DEPLOY_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "natuurhout-beheer",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    });
    if (res.status !== 204) error = `GitHub ${res.status}: ${(await res.text()).slice(0, 200)}`;
  } catch (e) {
    error = `GitHub niet bereikbaar: ${(e as Error).message}`;
  }
  if (error) console.error("Site rebuild not started", error);
  await db
    .prepare(
      `INSERT INTO catalog_publish (id, requested_hash, requested_at, error) VALUES (1, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET requested_hash = excluded.requested_hash, requested_at = excluded.requested_at, error = excluded.error`,
    )
    .bind(status.hash, now(), error)
    .run();
  return error ? "waiting" : "started";
}
