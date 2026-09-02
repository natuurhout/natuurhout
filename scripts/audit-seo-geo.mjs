import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const baseUrl = new URL(process.env.SEO_AUDIT_BASE_URL || "http://127.0.0.1:3777");
const canonicalOrigin = "https://www.natuurhout.be";
const outputPath = process.env.SEO_AUDIT_OUTPUT
  ? path.resolve(process.env.SEO_AUDIT_OUTPUT)
  : null;

const priorityQueries = [
  { query: "kastanje afsluiting", pathname: "/project/rasterwerk-kastanjehout/", schema: "WebPage" },
  { query: "kastanje hekwerk", pathname: "/project/rasterwerk-kastanjehout/", schema: "WebPage" },
  { query: "kastanjehout afsluiting", pathname: "/project/rasterwerk-kastanjehout/", schema: "WebPage" },
  { query: "kastanje afsluiting 120 cm", pathname: "/shop/kastanje-rasterwerk/", schema: "Product" },
  { query: "schapenhek", pathname: "/shop/kastanje-rasterwerk/", schema: "Product" },
  { query: "schapenhek kastanje", pathname: "/shop/kastanje-rasterwerk/", schema: "Product" },
  { query: "kastanje palen", pathname: "/shop/palen/", schema: "Product" },
  { query: "kastanje palen kopen", pathname: "/shop/palen/", schema: "Product" },
  { query: "kastanjehout", pathname: "/wat-is-kastanjehout/", schema: "Article" },
  { query: "kastanje afsluiting plaatsen", pathname: "/diyplaatsing/", schema: "Article" },
];

const socialHosts = new Set([
  "facebook.com",
  "www.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "pinterest.com",
  "www.pinterest.com",
  "youtube.com",
  "www.youtube.com",
]);

function normalizePathname(value) {
  const url = new URL(value, canonicalOrigin);
  if (url.pathname === "/") return "/";
  if (/\.[a-z0-9]{2,8}$/i.test(url.pathname)) return url.pathname;
  return `${url.pathname.replace(/\/+$/, "")}/`;
}

function collectSchemaTypes(value, types = new Set()) {
  if (!value || typeof value !== "object") return types;
  if (Array.isArray(value)) {
    value.forEach((item) => collectSchemaTypes(item, types));
    return types;
  }
  const type = value["@type"];
  if (Array.isArray(type)) type.forEach((item) => types.add(String(item)));
  else if (type) types.add(String(type));
  Object.values(value).forEach((item) => collectSchemaTypes(item, types));
  return types;
}

function words(value) {
  return value.trim().split(/\s+/).filter(Boolean);
}

async function fetchPage(pathname, redirect = "follow") {
  const url = new URL(pathname, baseUrl);
  const response = await fetch(url, {
    redirect,
    headers: { "user-agent": "Natuurhout migration SEO audit" },
  });
  return { response, html: await response.text() };
}

async function mapConcurrent(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await mapper(items[index], index);
      }
    }),
  );
  return results;
}

const sitemapResponse = await fetch(new URL("/sitemap.xml", baseUrl));
if (!sitemapResponse.ok) throw new Error(`Could not fetch sitemap: ${sitemapResponse.status}`);
const sitemapXml = await sitemapResponse.text();
const sitemapPaths = Array.from(
  sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g),
  (match) => normalizePathname(match[1]),
);
const uniquePaths = [...new Set(sitemapPaths)];

const pages = await mapConcurrent(uniquePaths, 12, async (pathname) => {
  const { response, html } = await fetchPage(pathname);
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim() || "";
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || "";
  const robots = $('meta[name="robots"]').attr("content")?.trim() || "";
  const h1s = $("h1").map((_, element) => $(element).text().replace(/\s+/g, " ").trim()).get();
  const text = $("main").text().replace(/\s+/g, " ").trim();
  const firstParagraph = $("main p")
    .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
    .get()
    .find((value) => words(value).length >= 8) || "";
  const schemaTypes = new Set();
  let invalidJsonLd = 0;
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      collectSchemaTypes(JSON.parse($(element).text()), schemaTypes);
    } catch {
      invalidJsonLd += 1;
    }
  });

  const internalLinks = new Set();
  const citations = new Set();
  $("main a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || href.startsWith("#") || /^(?:mailto|tel):/i.test(href)) return;
    try {
      const url = new URL(href, new URL(pathname, canonicalOrigin));
      if (url.hostname === "natuurhout.be" || url.hostname === "www.natuurhout.be") {
        internalLinks.add(normalizePathname(url.pathname));
      } else if (
        url.hostname !== "natuurhout.shop" &&
        url.hostname !== "www.natuurhout.shop" &&
        !socialHosts.has(url.hostname)
      ) {
        citations.add(url.toString());
      }
    } catch {
      // Invalid links are covered by the migration parity audit.
    }
  });

  return {
    pathname,
    status: response.status,
    title,
    description,
    canonical,
    robots,
    h1s,
    wordCount: words(text).length,
    text,
    firstParagraph,
    schemaTypes: [...schemaTypes].sort(),
    invalidJsonLd,
    internalLinks: [...internalLinks],
    citations: [...citations],
  };
});

const pageByPath = new Map(pages.map((page) => [page.pathname, page]));
const inlinks = new Map(uniquePaths.map((pathname) => [pathname, 0]));
const unknownInternalLinks = new Set();
for (const page of pages) {
  for (const linkedPath of page.internalLinks) {
    if (inlinks.has(linkedPath)) inlinks.set(linkedPath, inlinks.get(linkedPath) + 1);
    else if (!linkedPath.startsWith("/wp-content/") && !linkedPath.startsWith("/_next/")) {
      unknownInternalLinks.add(linkedPath);
    }
  }
}

const linkedChecks = await mapConcurrent([...unknownInternalLinks], 12, async (pathname) => {
  try {
    const { response } = await fetchPage(pathname, "manual");
    return { pathname, status: response.status };
  } catch (error) {
    return { pathname, status: 0, error: error instanceof Error ? error.message : String(error) };
  }
});
const brokenInternalLinks = linkedChecks.filter(({ status }) => status !== 200 && status < 300 || status >= 400);

function duplicateGroups(field) {
  const groups = new Map();
  for (const page of pages) {
    const value = page[field];
    if (!value) continue;
    const paths = groups.get(value) || [];
    paths.push(page.pathname);
    groups.set(value, paths);
  }
  return [...groups.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([value, paths]) => ({ value, paths }));
}

const queryBenchmark = priorityQueries.map((item) => {
  const page = pageByPath.get(item.pathname);
  const queryTerms = item.query.toLocaleLowerCase("nl").split(/\s+/).filter((term) => !["cm", "kopen"].includes(term));
  const searchable = page ? `${page.title} ${page.h1s.join(" ")} ${page.text}`.toLocaleLowerCase("nl") : "";
  const answerText = page?.firstParagraph.toLocaleLowerCase("nl") || "";
  const coveredTerms = queryTerms.filter((term) => searchable.includes(term));
  const answerTerms = queryTerms.filter((term) => answerText.includes(term));
  return {
    ...item,
    pageExists: Boolean(page && page.status === 200),
    queryCoverage: queryTerms.length ? coveredTerms.length / queryTerms.length : 1,
    answerFirst: answerTerms.length > 0,
    h1Count: page?.h1s.length || 0,
    hasDescription: Boolean(page?.description),
    expectedSchemaPresent: Boolean(page?.schemaTypes.includes(item.schema)),
    inlinks: inlinks.get(item.pathname) || 0,
  };
});

const criticalIssues = [];
const highImpactIssues = [];
for (const page of pages) {
  if (page.status !== 200) criticalIssues.push(`${page.pathname}: HTTP ${page.status}`);
  if (!page.canonical) criticalIssues.push(`${page.pathname}: missing canonical`);
  else if (page.canonical !== `${canonicalOrigin}${page.pathname}`) {
    criticalIssues.push(`${page.pathname}: canonical ${page.canonical}`);
  }
  if (page.invalidJsonLd) highImpactIssues.push(`${page.pathname}: invalid JSON-LD`);
}
for (const link of brokenInternalLinks) {
  criticalIssues.push(`${link.pathname}: internal link returned ${link.status}`);
}
for (const item of queryBenchmark) {
  if (!item.pageExists || item.h1Count !== 1 || item.queryCoverage < 0.66 || !item.answerFirst) {
    criticalIssues.push(`${item.query}: answer-ready mapping failed at ${item.pathname}`);
  }
  if (!item.hasDescription || !item.expectedSchemaPresent || item.inlinks < 1) {
    highImpactIssues.push(`${item.query}: metadata/schema/internal-link gap at ${item.pathname}`);
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: baseUrl.toString(),
  canonicalOrigin,
  summary: {
    sitemapUrls: uniquePaths.length,
    successfulPages: pages.filter((page) => page.status === 200).length,
    noindexPages: pages.filter((page) => /\bnoindex\b/i.test(page.robots)).length,
    missingTitles: pages.filter((page) => !page.title).length,
    missingDescriptions: pages.filter((page) => !page.description).length,
    missingH1: pages.filter((page) => page.h1s.length === 0).length,
    multipleH1: pages.filter((page) => page.h1s.length > 1).length,
    duplicateTitleGroups: duplicateGroups("title").length,
    duplicateDescriptionGroups: duplicateGroups("description").length,
    pagesWithJsonLd: pages.filter((page) => page.schemaTypes.length > 0).length,
    invalidJsonLdPages: pages.filter((page) => page.invalidJsonLd > 0).length,
    orphanPages: pages.filter((page) => page.pathname !== "/" && (inlinks.get(page.pathname) || 0) === 0).length,
    pagesWithSourceCitations: pages.filter((page) => page.citations.length > 0).length,
    brokenInternalLinks: brokenInternalLinks.length,
    criticalIssues: criticalIssues.length,
    highImpactIssues: highImpactIssues.length,
  },
  criticalIssues,
  highImpactIssues,
  queryBenchmark,
  duplicateTitles: duplicateGroups("title"),
  duplicateDescriptions: duplicateGroups("description"),
  orphanPaths: pages
    .filter((page) => page.pathname !== "/" && (inlinks.get(page.pathname) || 0) === 0)
    .map((page) => page.pathname),
  pages: pages.map(({ text, firstParagraph, internalLinks, ...page }) => ({
    ...page,
    inlinks: inlinks.get(page.pathname) || 0,
  })),
};

if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

console.log(JSON.stringify(report.summary, null, 2));
for (const item of queryBenchmark) {
  console.log(
    `${item.query} -> ${item.pathname}: ${item.pageExists && item.h1Count === 1 && item.queryCoverage >= 0.66 && item.answerFirst ? "answer-ready" : "gap"}; schema=${item.expectedSchemaPresent}; inlinks=${item.inlinks}`,
  );
}
if (criticalIssues.length) console.error(`Critical issues:\n${criticalIssues.join("\n")}`);
if (highImpactIssues.length) console.error(`High-impact issues:\n${highImpactIssues.join("\n")}`);

if (criticalIssues.length) process.exitCode = 1;
