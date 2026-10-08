import legacyPagesJson from "@/data/legacy-pages.json";
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

// Approved product renames (src/lib/renames.mjs) are applied on load.
export const legacyPages = renameDeep(legacyPagesJson as LegacyPage[]);

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

export function legacyMetadataTitle(page: LegacyPage) {
  if (page.pathname === "/project/project-overmere-2/") {
    return "Project Overmere – Schutting in lariks schaaldelen | Natuurhout";
  }
  return page.title;
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
