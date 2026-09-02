import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

const projectRoot = process.cwd();
const rows = parse(fs.readFileSync(path.join(projectRoot, "migration", "url-inventory.csv"), "utf8"), {
  columns: true,
  skip_empty_lines: true,
  bom: true,
});
const legacyPages = JSON.parse(fs.readFileSync(path.join(projectRoot, "src", "data", "legacy-pages.json"), "utf8"));

const redirects = new Set([
  "/afsluiting-hazelaar-kopen/",
  "/afsluitingen-kopen-vlaanderen/",
  "/eiken-palen-kopen-vlaanderen/",
  "/houten-moestuinbak/",
  "/kastanje-palen/",
  "/kastanje-poort/",
  "/lariks-schaaldelen-kopen-vlaanderen/",
  "/moestuinbak-kopen-vlaanderen/",
  "/plantenbakken-kopen/",
]);
const handBuilt = new Set([
  "/",
  "/producten/",
  "/aanbiedingen-2/",
  "/contact/",
  "/offerte-aanvragen/",
]);
const intentionallyEmpty = new Set(["/logout/"]);
const generated = new Set(legacyPages.map((page) => page.pathname));

function normalize(url) {
  const pathname = new URL(url).pathname;
  return pathname === "/" ? pathname : `${pathname.replace(/\/+$/, "")}/`;
}

const baseline = rows.map((row) => normalize(row.url));
const missing = baseline.filter((pathname) => !handBuilt.has(pathname) && !redirects.has(pathname) && !generated.has(pathname));
const empty = legacyPages
  .filter((page) => page.blocks.length === 0 && !intentionallyEmpty.has(page.pathname))
  .map((page) => page.pathname);
const duplicatePaths = legacyPages
  .map((page) => page.pathname)
  .filter((pathname, index, all) => all.indexOf(pathname) !== index);

console.log(`WordPress baseline: ${baseline.length} URLs`);
console.log(`Hand-built routes: ${handBuilt.size}`);
console.log(`Preserved live redirects: ${redirects.size}`);
console.log(`Generated legacy routes: ${generated.size}`);
console.log(`Missing baseline routes: ${missing.length}`);
console.log(`Generated routes without content: ${empty.length}`);

if (missing.length) console.error(`Missing:\n${missing.join("\n")}`);
if (empty.length) console.error(`Empty:\n${empty.join("\n")}`);
if (duplicatePaths.length) console.error(`Duplicates:\n${duplicatePaths.join("\n")}`);

if (missing.length || empty.length || duplicatePaths.length || baseline.length !== 128) process.exit(1);
console.log("Migration route/content gate passed.");
