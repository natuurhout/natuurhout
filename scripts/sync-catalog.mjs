// Copies the catalogue edits made in the backend (beheer.natuurhout.be →
// Producten / Voorraad) into src/data/catalog-overrides.json, so the next
// build shows them. Run by .github/workflows/deploy.yml before every build
// and every 15 minutes; prints changed=true|false (and writes it to
// $GITHUB_OUTPUT). If the live site cannot be reached, the file stays as it is.

import { readFile, writeFile, appendFile } from "node:fs/promises";

const URL_ = process.env.CATALOG_URL || "https://www.natuurhout.be/api/catalogus/";
const FILE = new URL("../src/data/catalog-overrides.json", import.meta.url);

/** Stable JSON: sorted keys, so an unchanged catalogue gives an identical file. */
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort((a, b) => a.localeCompare(b, "en", { numeric: true })).map((k) => [k, stable(value[k])]));
  return value;
}

function valid(o) {
  if (!o || typeof o !== "object" || typeof o.products !== "object" || typeof o.variants !== "object") return false;
  for (const v of Object.values(o.variants)) {
    if (!v || typeof v !== "object") return false;
    if ("price" in v && !(typeof v.price === "number" && v.price >= 0)) return false;
    if ("available" in v && typeof v.available !== "boolean") return false;
  }
  return true;
}

async function output(changed) {
  console.log(`changed=${changed}`);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
}

let live;
try {
  const res = await fetch(URL_, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  live = await res.json();
  if (!valid(live)) throw new Error("unexpected shape");
} catch (error) {
  console.warn(`Catalogue edits not fetched (${error.message}); keeping the current file.`);
  await output(false);
  process.exit(0);
}

const next = `${JSON.stringify(stable({ products: live.products, variants: live.variants }), null, 2)}\n`;
const current = await readFile(FILE, "utf8").catch(() => "");
if (current === next) {
  await output(false);
} else {
  await writeFile(FILE, next);
  await output(true);
}
