import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const root = process.cwd();
const pages = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "legacy-pages.json"), "utf8"));
const handBuilt = JSON.parse(fs.readFileSync(path.join(root, "migration", "handbuilt-routes.json"), "utf8"));
const handBuiltByPath = new Map(handBuilt.routes.map((route) => [route.pathname, route]));

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
let waived = 0;
let hotlinkedImages = 0;

function attr($, selector, name) {
  const node = $(selector).first();
  return node.length ? (node.attr(name) ?? "") : null;
}

/*
 * A hand-built route no longer reproduces its snapshot, so verbatim parity
 * says nothing useful about it. What still has to hold is the SEO surface the
 * inventory froze: the same title, description and canonical, the snapshot's
 * h1, and every internal link the snapshot fed. Those are checked here so the
 * route stays covered rather than merely skipped.
 */
function auditHandBuilt(page, route, built$) {
  const where = `${page.pathname} (hand-built)`;

  const builtTitle = normalizeText(built$("title").first().text());
  if (builtTitle !== normalizeText(page.title)) {
    failures.push(`${where}: title changed (${builtTitle} != ${page.title})`);
  }

  const builtDescription = attr(built$, 'meta[name="description"]', "content");
  if (page.description && normalizeText(builtDescription ?? "") !== normalizeText(page.description)) {
    failures.push(`${where}: meta description changed`);
  }

  const builtCanonical = attr(built$, 'link[rel="canonical"]', "href");
  if (page.canonical && builtCanonical !== page.canonical) {
    failures.push(`${where}: canonical changed (${builtCanonical} != ${page.canonical})`);
  }

  const source$ = cheerio.load(page.html, null, false);
  const sourceHeading = normalizeText(source$("h1").first().text());
  const builtHeading = normalizeText(built$("h1").first().text());
  if (sourceHeading && sourceHeading !== builtHeading) {
    failures.push(`${where}: h1 changed (${builtHeading} != ${sourceHeading})`);
  }

  // Compare by path: WordPress appends cache-buster query strings
  // (/producten/?v=d3dcf429c679) that address the same page the clean link
  // does, so they are not a second link target to preserve.
  const linkPath = (href) => href.split(/[?#]/)[0];
  const builtPaths = new Set(
    built$("a[href]").map((_, a) => linkPath(built$(a).attr("href"))).get(),
  );
  const sourceHrefs = [...new Set(source$("a[href]").map((_, a) => source$(a).attr("href")).get())]
    .filter((href) => href.startsWith("/"));
  const dropped = sourceHrefs.filter((href) => !builtPaths.has(linkPath(href)));
  if (dropped.length) {
    failures.push(`${where}: internal links dropped -> ${dropped.join(", ")}`);
  }

  hotlinkedImages += built$("img[src]")
    .map((_, img) => built$(img).attr("src"))
    .get()
    .filter((src) => /^https:\/\/(www\.)?natuurhout\.be\/wp-content\/uploads\//i.test(src)).length;

  if (!route.reason || !route.approvedBy) {
    failures.push(`${where}: handbuilt-routes.json entry needs both approvedBy and reason`);
  }
}

for (const page of pages) {
  const output = builtFile(page.pathname);
  if (!fs.existsSync(output)) {
    failures.push(`${page.pathname}: missing built HTML (${path.relative(root, output)})`);
    continue;
  }

  const built$ = cheerio.load(fs.readFileSync(output, "utf8"));

  const handBuiltRoute = handBuiltByPath.get(page.pathname);
  if (handBuiltRoute) {
    auditHandBuilt(page, handBuiltRoute, built$);
    waived += 1;
    continue;
  }

  const source$ = cheerio.load(page.html, null, false);
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
console.log(`Hand-built routes (snapshot parity waived, SEO invariants checked): ${waived}`);
console.log(`WordPress image references still hotlinked: ${hotlinkedImages}`);

if (failures.length) {
  console.error(`Built parity failures (${failures.length}):\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Built heading/text/link/image parity gate passed.");
