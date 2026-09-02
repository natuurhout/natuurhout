import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const root = process.cwd();
const pages = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "legacy-pages.json"), "utf8"));

function normalizeText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function builtFile(pathname) {
  if (pathname === "/") return path.join(root, ".next", "server", "app", "index.html");
  return path.join(root, ".next", "server", "app", `${pathname.replace(/^\/+|\/+$/g, "")}.html`);
}

function sequence($, rootNode, selector, map) {
  return rootNode.find(selector).map((_, element) => map($(element))).get();
}

const failures = [];
let checked = 0;
let hotlinkedImages = 0;

for (const page of pages) {
  const output = builtFile(page.pathname);
  if (!fs.existsSync(output)) {
    failures.push(`${page.pathname}: missing built HTML (${path.relative(root, output)})`);
    continue;
  }

  const source$ = cheerio.load(page.html, null, false);
  const built$ = cheerio.load(fs.readFileSync(output, "utf8"));
  const rendered = built$(`.legacy-page[data-source-path="${page.pathname}"]`).first();
  if (!rendered.length) {
    failures.push(`${page.pathname}: missing rendered legacy root`);
    continue;
  }

  const sourceHeadings = sequence(source$, source$.root(), "h1,h2,h3,h4", (node) => `${node.get(0).tagName}:${normalizeText(node.text())}`);
  const builtHeadings = sequence(built$, rendered, "h1,h2,h3,h4", (node) => `${node.get(0).tagName}:${normalizeText(node.text())}`);
  if (JSON.stringify(sourceHeadings) !== JSON.stringify(builtHeadings)) failures.push(`${page.pathname}: heading sequence changed`);

  const sourceText = normalizeText(source$.root().text());
  const builtText = normalizeText(rendered.text());
  if (sourceText !== builtText) failures.push(`${page.pathname}: visible text changed`);

  const sourceLinks = sequence(source$, source$.root(), "a[href]", (node) => node.attr("href"));
  const builtLinks = sequence(built$, rendered, "a[href]", (node) => node.attr("href"));
  if (JSON.stringify(sourceLinks) !== JSON.stringify(builtLinks)) failures.push(`${page.pathname}: link order or targets changed`);

  const sourceImages = sequence(source$, source$.root(), "img[src]", (node) => node.attr("src"));
  const builtImages = sequence(built$, rendered, "img[src]", (node) => node.attr("src"));
  if (JSON.stringify(sourceImages) !== JSON.stringify(builtImages)) failures.push(`${page.pathname}: image order or sources changed`);
  hotlinkedImages += builtImages.filter((src) => /^https:\/\/(www\.)?natuurhout\.be\/wp-content\/uploads\//i.test(src)).length;

  checked += 1;
}

console.log(`Built legacy pages checked: ${checked}`);
console.log(`WordPress image references still hotlinked: ${hotlinkedImages}`);

if (failures.length) {
  console.error(`Built parity failures (${failures.length}):\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Built heading/text/link/image parity gate passed.");
