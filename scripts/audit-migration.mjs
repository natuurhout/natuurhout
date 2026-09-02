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
const intentionallyEmpty = new Set(["/logout/"]);
const generated = new Set(legacyPages.map((page) => page.pathname));

function normalize(url) {
  const pathname = new URL(url).pathname;
  return pathname === "/" ? pathname : `${pathname.replace(/\/+$/, "")}/`;
}

const baseline = rows.map((row) => normalize(row.url));
const missing = baseline.filter((pathname) => !redirects.has(pathname) && !generated.has(pathname));
const empty = legacyPages
  .filter((page) => !page.html && !intentionallyEmpty.has(page.pathname))
  .map((page) => page.pathname);
const duplicatePaths = legacyPages
  .map((page) => page.pathname)
  .filter((pathname, index, all) => all.indexOf(pathname) !== index);
const lowResolutionImageSources = legacyPages.flatMap((page) => {
  const matches = page.html.matchAll(
    /<img\b[^>]*\bsrc=(["'])([^"']*-150x150\.(?:jpe?g|png|webp|gif)(?:\?[^"']*)?)\1/gi,
  );

  return Array.from(matches, (match) => `${page.pathname}: ${match[2]}`);
});

console.log(`WordPress baseline: ${baseline.length} URLs`);
console.log(`Preserved live redirects: ${redirects.size}`);
console.log(`Generated legacy routes: ${generated.size}`);
console.log(`Missing baseline routes: ${missing.length}`);
console.log(`Generated routes without content: ${empty.length}`);
console.log(`Low-resolution 150x150 image sources: ${lowResolutionImageSources.length}`);

if (missing.length) console.error(`Missing:\n${missing.join("\n")}`);
if (empty.length) console.error(`Empty:\n${empty.join("\n")}`);
if (duplicatePaths.length) console.error(`Duplicates:\n${duplicatePaths.join("\n")}`);
if (lowResolutionImageSources.length) {
  console.error(`Low-resolution image sources:\n${lowResolutionImageSources.join("\n")}`);
}

if (
  missing.length ||
  empty.length ||
  duplicatePaths.length ||
  lowResolutionImageSources.length ||
  baseline.length !== 128
) {
  process.exit(1);
}
console.log("Migration route/content gate passed.");
