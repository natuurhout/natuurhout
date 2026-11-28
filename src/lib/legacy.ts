import legacyPagesJson from "@/data/legacy-pages.json";
import handBuiltJson from "../../migration/handbuilt-routes.json";
import { renameDeep } from "@/lib/renames.mjs";
import imageLoader from "@/lib/image-loader";

export type LegacyBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph" | "ul" | "ol" | "blockquote" | "table"; html: string }
  | { type: "image"; src: string; alt: string; width: number; height: number };

export type LegacyPage = {
  pathname: string;
  kind: "page" | "project" | "archive";
  title: string;
  description: string;
  heading: string;
  canonical: string;
  schemaTypes: string[];
  structuredData?: Record<string, unknown>;
  lastModified?: string;
  sourceFile: string;
  html: string;
  blocks: LegacyBlock[];
};

/*
 * The WordPress SEO plugin gave the mobile number as the business telephone
 * in every page's structured data. Natuurhout's Google Business Profile uses
 * the landline, so the structured data does too (Xander, Oct 2026): the
 * same main number on the site, in the markup and on Google.
 */
const SNAPSHOT_TELEPHONE = "+32473740926";
const MAIN_TELEPHONE = "+3252558858";

function mainTelephone(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(mainTelephone);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      key === "telephone" && child === SNAPSHOT_TELEPHONE ? MAIN_TELEPHONE : mainTelephone(child),
    ]),
  );
}

/*
 * SEO batch 2 (Nov 2026): the old plugin's structured data, tidied on load.
 * Relative "url" values (the logo) become absolute, as schema.org requires; the
 * WordPress author ("Person", with a gravatar) goes from pages that are no
 * article (a product page has no author); and the WebPage name/description
 * follow an approved new title/description (handbuilt-routes.json).
 */
const SITE = "https://www.natuurhout.be";
// A WordPress upload in the schema points at its WebP copy (src/lib/image-loader.ts),
// never at /wp-content/ itself: no absolute WordPress media URLs on the site.
// Photos taken off a page (REMOVED_PHOTOS in src/lib/legacy-product.ts) are not its schema image either.
const SCHEMA_IMAGE_SWAP: Record<string, string> = {
  "/wp-content/uploads/2016/01/Promotie-vlechtscherm.jpg": "/wp-content/uploads/2016/01/Hazelaar-vlechtscherm-scaled.webp",
};
const schemaPath = (original: string, path = SCHEMA_IMAGE_SWAP[original] ?? original) => (/^\/wp-content\/uploads\/.+\.(jpe?g|png|webp)$/i.test(path) ? imageLoader({ src: path, width: 1080 }) : path);

function absoluteUrls(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(absoluteUrls);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, key === "url" && typeof child === "string" && child.startsWith("/") ? `${SITE}${schemaPath(child)}` : absoluteUrls(child)]),
  );
}
function tidySchema(pathname: string, data: Record<string, unknown>): Record<string, unknown> {
  const fixed = absoluteUrls(mainTelephone(data)) as Record<string, unknown>;
  const graph = Array.isArray(fixed["@graph"]) ? (fixed["@graph"] as Record<string, unknown>[]) : null;
  if (!graph) return fixed;
  const isArticle = graph.some((node) => ["Article", "BlogPosting", "NewsArticle"].includes(String(node["@type"])));
  const approved = (handBuiltJson.routes as { pathname: string; approvedTitle?: string; approvedDescription?: string }[]).find((r) => r.pathname === pathname);
  return {
    ...fixed,
    "@graph": graph
      // No people as authors (Xander, 25 Nov 2026): a blog post is by Natuurhout.
      .filter((node) => node["@type"] !== "Person")
      .map((node) => {
        let out = node;
        if ("author" in out || "creator" in out) {
          const { author: _a, creator: _c, ...rest } = out;
          void _a;
          void _c;
          out = isArticle && "author" in node ? { ...rest, author: { "@type": "Organization", name: "Natuurhout", url: `${SITE}/` } } : rest;
        }
        if (out["@type"] === "WebPage" && approved) {
          out = { ...out, ...(approved.approvedTitle ? { name: approved.approvedTitle } : {}), ...(approved.approvedDescription ? { description: approved.approvedDescription } : {}) };
        }
        return out;
      }),
  };
}

// Approved product renames (src/lib/renames.mjs) are applied on load.
export const legacyPages = renameDeep(legacyPagesJson as LegacyPage[]).map((page) =>
  page.structuredData ? { ...page, structuredData: tidySchema(page.pathname, page.structuredData) } : page,
);

const permanentNoindexPaths = new Set([
  "/change-password/",
  "/logout/",
  "/lost-password/",
  "/project/",
  "/verzoek-toegang-tot-data/",
  "/view-order/",
]);

export function isPermanentlyNoindexLegacyPath(pathname: string) {
  if (permanentNoindexPaths.has(pathname)) return true;
  if (pathname.startsWith("/tag/") || pathname.startsWith("/project_category/")) return true;
  return /^\/category\/(?:fit-row|life-style|post-slider|uncategorized|video)\/$/.test(pathname);
}

/**
 * An approved new title, description or h1 for a rebuilt page (Xander), as
 * recorded in migration/handbuilt-routes.json, the same file the built
 * parity audit checks them against.
 */
type ApprovedSeo = { approvedTitle?: string; approvedDescription?: string; approvedHeading?: string };
const APPROVED = new Map((handBuiltJson.routes as ({ pathname: string } & ApprovedSeo)[]).map((route) => [route.pathname, route]));
export function approvedSeo(pathname: string): ApprovedSeo {
  return APPROVED.get(pathname) ?? {};
}

export function legacyMetadataTitle(page: LegacyPage) {
  if (page.pathname === "/project/project-overmere-2/") {
    return "Project Overmere – Schutting in lariks schaaldelen | Natuurhout";
  }
  return approvedSeo(page.pathname).approvedTitle ?? page.title;
}

/** The page's description for search engines (an approved one first). */
export function legacyMetadataDescription(page: LegacyPage) {
  return approvedSeo(page.pathname).approvedDescription ?? page.description;
}

export function legacyPathname(slug: string[]) {
  return `/${slug.join("/")}/`;
}

export function getLegacyPage(slug: string[]) {
  const pathname = legacyPathname(slug);
  return legacyPages.find((page) => page.pathname === pathname);
}

export function getLegacyPageByPath(pathname: string) {
  const normalized = pathname === "/" ? pathname : `${pathname.replace(/\/+$/, "")}/`;
  return legacyPages.find((page) => page.pathname === normalized);
}
