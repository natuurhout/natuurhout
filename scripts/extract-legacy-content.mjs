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
const publicUploadsDir = path.resolve(projectRoot, "public", "wp-content", "uploads");
const uploadsPrefix = "/wp-content/uploads/";
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
  "/homepage-natuurhout-kastanje-afsluiting-kastanjehouten-hekwerk-2/",
  "/homepage-natuurhout-kastanje-afsluiting-kastanjehouten-hekwerk/",
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

function localizeStructuredData(value) {
  if (Array.isArray(value)) return value.map(localizeStructuredData);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, localizeStructuredData(child)]),
    );
  }
  if (typeof value !== "string") return value;
  return value
    .replaceAll("https://www.natuurhout.be/wp-content/uploads/", "/wp-content/uploads/")
    .replaceAll("https://natuurhout.be/wp-content/uploads/", "/wp-content/uploads/");
}

function localUploadPath(value) {
  const cleaned = cleanUrl(value);
  if (!cleaned.startsWith(uploadsPrefix)) return "";

  const pathname = cleaned.split(/[?#]/, 1)[0];
  if (!/\.(?:avif|gif|jpe?g|png|webp)$/i.test(pathname)) return "";
  return pathname;
}

function publicUploadExists(pathname) {
  try {
    const decoded = decodeURIComponent(pathname);
    const target = path.resolve(projectRoot, "public", `.${decoded}`);
    if (!target.startsWith(`${publicUploadsDir}${path.sep}`)) return false;
    return fs.existsSync(target) && fs.statSync(target).size > 0;
  } catch {
    return false;
  }
}

function unsizedUploadPath(pathname) {
  return pathname.replace(/-\d+x\d+(?=\.[^./]+$)/i, "");
}

function preferredImageSource(node) {
  const currentSource = node.attr("src") || node.attr("data-lazy-src") || "";
  const candidates = [];
  const addCandidate = (value) => {
    const pathname = localUploadPath(value);
    if (pathname && !candidates.includes(pathname)) candidates.push(pathname);
  };

  addCandidate(node.attr("data-orig-file"));
  addCandidate(node.attr("data-large-file"));
  addCandidate(node.closest("a[href]").first().attr("href"));

  const currentPath = localUploadPath(currentSource);
  if (currentPath) addCandidate(unsizedUploadPath(currentPath));
  addCandidate(currentSource);

  return candidates.find(publicUploadExists) || currentPath || currentSource;
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

function normalizePrimaryHeading($, root, heading) {
  root.find("h1").each((_, element) => {
    if (!$(element).text().replace(/\s+/g, " ").trim()) $(element).remove();
  });

  const expected = heading.replace(/\s+/g, " ").trim().toLocaleLowerCase("nl");
  const primaryHeadings = root.find("h1").toArray();
  if (primaryHeadings.length) {
    const exact = primaryHeadings.find(
      (element) => $(element).text().replace(/\s+/g, " ").trim().toLocaleLowerCase("nl") === expected,
    );
    const primary = exact || primaryHeadings[0];
    for (const element of primaryHeadings) {
      if (element === primary) continue;
      element.tagName = "h2";
      element.name = "h2";
      $(element).attr("data-seo-demoted-heading", "true");
    }
    return;
  }

  const headings = root.find("h2,h3,h4");
  const exact = headings
    .toArray()
    .find((element) => $(element).text().replace(/\s+/g, " ").trim().toLocaleLowerCase("nl") === expected);
  if (!exact) {
    root.prepend($("<h1>").attr("data-seo-promoted-heading", "true").text(heading));
    return;
  }
  exact.tagName = "h1";
  exact.name = "h1";
  $(exact).attr("data-seo-promoted-heading", "true");
}

function truncateDescription(value, maxLength = 155) {
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, lastSpace > 110 ? lastSpace : clipped.length).trimEnd()}…`;
}

function fallbackDescription(pathname, heading, html) {
  if (pathname.startsWith("/tag/")) {
    return truncateDescription(`Artikelen met het onderwerp ${heading} bij Natuurhout.`);
  }
  if (pathname.startsWith("/category/")) {
    return truncateDescription(`Bekijk artikelen in de categorie ${heading} bij Natuurhout.`);
  }
  if (pathname.startsWith("/project_category/")) {
    return truncateDescription(`Bekijk projecten en voorbeelden in de categorie ${heading} bij Natuurhout.`);
  }
  if (pathname === "/project/" || pathname === "/projecten/") {
    return "Bekijk realisaties, geplaatste afsluitingen, poorten en andere projecten van Natuurhout.";
  }

  const text = cheerio.load(html, null, false).text().replace(/\s+/g, " ").trim();
  const withoutRepeatedHeading = text.toLocaleLowerCase("nl").startsWith(heading.toLocaleLowerCase("nl"))
    ? text.slice(heading.length).replace(/^\s*[.:-]?\s*/, "")
    : text;
  return truncateDescription(
    withoutRepeatedHeading
      ? `${heading}. ${withoutRepeatedHeading}`
      : `${heading}. Informatie van Natuurhout in Zele.`,
  );
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
      const currentSource = node.attr("src") || node.attr("data-lazy-src") || "";
      const src = preferredImageSource(node);
      if (src) node.attr("src", src);
      if (localUploadPath(currentSource) !== src) {
        node.removeAttr("width");
        node.removeAttr("height");
      }
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
      const node = $(element);
      const src = preferredImageSource(node);
      if (!localUploadPath(src)) return;
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
  const structuredDataSource = $('script.aioseo-schema[type="application/ld+json"]').first().html()?.trim();
  let structuredData;
  if (structuredDataSource) {
    try {
      structuredData = localizeStructuredData(JSON.parse(structuredDataSource));
    } catch {
      warnings.push(`${pathname}: invalid AIOSEO JSON-LD`);
    }
  }
  const root = selectContentRoot($);
  const heading = displayHeading(row);
  if (root) normalizePrimaryHeading($, root, heading);
  const blocks = root ? extractBlocks($, root) : [{ type: "heading", level: 1, text: heading }];
  const htmlContent = root
    ? cleanLegacyHtml($, root)
    : `<h1 data-seo-promoted-heading="true">${heading.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</h1>`;
  const lastModified = $("meta[property='article:modified_time']").attr("content") || undefined;

  if (blocks.length === 0) warnings.push(`${pathname}: no content blocks extracted`);

  pages.push({
    pathname,
    kind: pageKind(pathname),
    title: row.title || row.h1 || "Natuurhout",
    description: row.meta_description || fallbackDescription(pathname, heading, htmlContent),
    heading,
    canonical: row.canonical || row.url,
    schemaTypes: (row.schema_types || "").split(",").filter(Boolean),
    structuredData,
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
