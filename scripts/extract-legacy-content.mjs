import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { parse } from "csv-parse/sync";

const projectRoot = process.cwd();
const migrationDir = path.join(projectRoot, "migration");
const snapshotDir = path.join(migrationDir, "html-snapshot");
const inventoryPath = path.join(migrationDir, "url-inventory.csv");
const outputPath = path.join(projectRoot, "src", "data", "legacy-pages.json");
const productPath = path.join(projectRoot, "src", "data", "products.json");
const productHandles = new Set(
  JSON.parse(fs.readFileSync(productPath, "utf8")).map((product) => product.handle),
);

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

const semanticSelector = "h1,h2,h3,h4,p,ul,ol,blockquote,table,img";

function pathnameFor(url) {
  const pathname = new URL(url).pathname;
  return pathname === "/" ? pathname : `${pathname.replace(/\/+$/, "")}/`;
}

function snapshotName(pathname) {
  if (pathname === "/") return "homepage.html";
  return `${pathname.replace(/^\/+|\/+$/g, "").replaceAll("/", "__")}.html`;
}

function pageKind(pathname) {
  if (pathname.startsWith("/project_category/")) return "archive";
  if (pathname.startsWith("/category/") || pathname.startsWith("/tag/")) return "archive";
  if (pathname === "/project/" || pathname === "/projecten/" || pathname === "/onze-realisaties/") return "archive";
  if (pathname.startsWith("/project/")) return "project";
  return "page";
}

function displayHeading(row) {
  if (row.h1?.trim()) return row.h1.trim();
  return (row.title || "Natuurhout")
    .replace(/\s*[|–-]\s*Natuurhout(?:\s*[|–-].*)?$/i, "")
    .trim();
}

function cleanUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, "https://www.natuurhout.be");
    if (url.hostname === "www.natuurhout.be" || url.hostname === "natuurhout.be") {
      return `${url.pathname}${url.search}`;
    }
    if (url.hostname === "natuurhout.shop" && url.pathname === "/") {
      return "/shop/";
    }
    if (url.hostname === "natuurhout.shop" && url.pathname.startsWith("/products/")) {
      const handle = url.pathname.split("/").filter(Boolean)[1];
      if (handle && productHandles.has(handle)) return `/shop/${handle}/`;
    }
    return url.toString();
  } catch {
    return "";
  }
}

function cleanInline($, element, allowedTags) {
  const fragment = cheerio.load(`<div id="content-root">${$(element).html() ?? ""}</div>`, null, false);
  fragment("script,style,noscript,iframe,form,input,textarea,select,button,svg").remove();

  fragment("#content-root *").each((_, child) => {
    const tag = child.tagName?.toLowerCase();
    if (!tag) return;
    if (!allowedTags.has(tag)) {
      fragment(child).replaceWith(fragment(child).contents());
      return;
    }

    const href = tag === "a" ? cleanUrl(fragment(child).attr("href")) : "";
    const attrs = { ...child.attribs };
    for (const attr of Object.keys(attrs)) fragment(child).removeAttr(attr);
    if (tag === "a" && href) {
      fragment(child).attr("href", href);
      if (/^https?:\/\//.test(href)) fragment(child).attr("rel", "noopener");
    }
  });

  return fragment("#content-root").html()?.trim() ?? "";
}

function selectContentRoot($) {
  const elementorPage = $("[data-elementor-type='wp-page']").first();
  if (elementorPage.length) return elementorPage;
  const portfolio = $(".portfolio.type-portfolio").first();
  if (portfolio.length) return portfolio;
  const blogContent = $(".gdlr-blog-content").first();
  if (blogContent.length && blogContent.find(semanticSelector).length) return blogContent;
  const generalContent = $(".gdlr-content").first();
  if (generalContent.length) return generalContent;
  return null;
}

function cleanLegacyHtml($, root) {
  const clone = root.clone();

  clone
    .find(
      "script,style,noscript,iframe,.gdlr-related-portfolio,.gdlr-sidebar,.comments-area,#comments"
    )
    .remove();

  clone.find("*").each((_, element) => {
    const node = $(element);
    const attributes = { ...element.attribs };

    for (const attribute of Object.keys(attributes)) {
      if (attribute.toLowerCase().startsWith("on")) node.removeAttr(attribute);
    }

    if (element.tagName?.toLowerCase() === "a") {
      const sourceHref = node.attr("href") || "";
      const href = cleanUrl(sourceHref);
      if (href) node.attr("href", href);
      else node.removeAttr("href");
      if (/^https?:\/\//.test(href)) {
        node.attr("rel", "noopener");
      } else if (/^https?:\/\/(www\.)?natuurhout\.shop\//i.test(sourceHref)) {
        node.removeAttr("target");
        node.removeAttr("rel");
      }
    }

    if (element.tagName?.toLowerCase() === "img") {
      const src = node.attr("src") || node.attr("data-lazy-src");
      if (src) node.attr("src", src);
      node.removeAttr("data-lazy-src");
      node.removeAttr("srcset");
      node.removeAttr("data-srcset");
      node.removeAttr("sizes");
      node.removeAttr("loading");
    }

    if (element.tagName?.toLowerCase() === "form") {
      node.removeAttr("action");
      node.removeAttr("method");
    }
  });

  return clone
    .toString()
    .replaceAll("https://www.natuurhout.be/wp-content/uploads/", "/wp-content/uploads/")
    .replaceAll("https://natuurhout.be/wp-content/uploads/", "/wp-content/uploads/")
    .trim();
}

function extractBlocks($, root) {
  const blocks = [];
  const content = root.clone();
  const rootNode = content.get(0);
  if (!rootNode) return blocks;

  content.find("script,style,noscript,iframe,form,.gdlr-related-portfolio,.gdlr-sidebar,.comments-area,#comments").remove();

  content.find(semanticSelector).each((_, element) => {
    const tag = element.tagName?.toLowerCase();
    if (!tag) return;

    const semanticParent = $(element).parentsUntil(rootNode, semanticSelector).first();
    if (semanticParent.length) {
      if (tag !== "img") return;
      if (semanticParent.is("p") && semanticParent.text().trim()) return;
    }

    if (tag === "img") {
      const src = $(element).attr("src") || $(element).attr("data-lazy-src") || "";
      if (!/^https:\/\/(www\.)?natuurhout\.be\/wp-content\/uploads\//i.test(src)) return;
      blocks.push({
        type: "image",
        src,
        alt: $(element).attr("alt")?.trim() || "",
        width: Number.parseInt($(element).attr("width") || "1200", 10) || 1200,
        height: Number.parseInt($(element).attr("height") || "800", 10) || 800,
      });
      return;
    }

    if (/^h[1-4]$/.test(tag)) {
      const text = $(element).text().replace(/\s+/g, " ").trim();
      if (text) blocks.push({ type: "heading", level: Number(tag[1]), text });
      return;
    }

    const allowed = new Set(["a", "strong", "b", "em", "i", "br", "span", "li", "thead", "tbody", "tr", "th", "td"]);
    const html = cleanInline($, element, allowed);
    const text = cheerio.load(html, null, false).text().replace(/\s+/g, " ").trim();
    if (!text && tag !== "table") return;
    blocks.push({ type: tag === "p" ? "paragraph" : tag, html });
  });

  return blocks.filter((block, index) => {
    if (index === 0) return true;
    return JSON.stringify(block) !== JSON.stringify(blocks[index - 1]);
  });
}

const rows = parse(fs.readFileSync(inventoryPath, "utf8"), {
  columns: true,
  skip_empty_lines: true,
  bom: true,
});

const pages = [];
const warnings = [];

for (const row of rows) {
  const pathname = pathnameFor(row.url);
  if (redirects.has(pathname)) continue;

  const sourceFile = snapshotName(pathname);
  const sourcePath = path.join(snapshotDir, sourceFile);
  if (!fs.existsSync(sourcePath)) {
    warnings.push(`${pathname}: missing ${sourceFile}`);
    continue;
  }

  const html = fs.readFileSync(sourcePath, "utf8");
  const $ = cheerio.load(html);
  const root = selectContentRoot($);
  const blocks = root ? extractBlocks($, root) : [];
  const htmlContent = root ? cleanLegacyHtml($, root) : "";
  const lastModified = $("meta[property='article:modified_time']").attr("content") || undefined;

  if (blocks.length === 0) warnings.push(`${pathname}: no content blocks extracted`);

  pages.push({
    pathname,
    kind: pageKind(pathname),
    title: row.title || row.h1 || "Natuurhout",
    description: row.meta_description || "",
    heading: displayHeading(row),
    canonical: row.canonical || row.url,
    schemaTypes: (row.schema_types || "").split(",").filter(Boolean),
    lastModified,
    sourceFile,
    html: htmlContent,
    blocks,
  });
}

pages.sort((a, b) => a.pathname.localeCompare(b.pathname, "nl"));
fs.writeFileSync(outputPath, `${JSON.stringify(pages, null, 2)}\n`);

console.log(`Generated ${pages.length} legacy pages at ${path.relative(projectRoot, outputPath)}`);
if (warnings.length) {
  console.warn(`Warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}
