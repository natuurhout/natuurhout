import legacyPagesJson from "@/data/legacy-pages.json";
import handBuiltJson from "../../migration/handbuilt-routes.json";
import { renameDeep } from "@/lib/renames.mjs";

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

// Approved product renames (src/lib/renames.mjs) are applied on load.
export const legacyPages = renameDeep(legacyPagesJson as LegacyPage[]).map((page) =>
  page.structuredData ? { ...page, structuredData: mainTelephone(page.structuredData) as Record<string, unknown> } : page,
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
