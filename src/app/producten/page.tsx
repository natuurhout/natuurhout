import type { Metadata } from "next";
import { load } from "cheerio/slim";
import LegacyContent from "@/components/LegacyContent";
import { getLegacyPageByPath } from "@/lib/legacy";

/*
 * Product overview, the WordPress page with three approved edits (Xander,
 * recorded in handbuilt-routes.json): the sold-out Boerenlandhekken tile is
 * gone and the two hazelaar screens carry their webshop names. Everything
 * else renders verbatim; the audit checks that.
 */
const page = getLegacyPageByPath("/producten/");

const RENAMES: Record<string, string> = {
  "/project/hazelaar-vlechtscherm-hasseltre/": "Hazelaar Vlechtscherm - Hasseltre",
  "/project/hazelaarvlechtschermen/": "Hazelaar Vlechtscherm - Trepanel",
};
const REMOVED = ["/project/boerenlandhekken/"];

function edit(html: string) {
  const $ = load(html, null, false);
  for (const href of REMOVED) $(`.portfolio-title a[href="${href}"]`).closest(".columns").remove();
  for (const [href, title] of Object.entries(RENAMES)) $(`.portfolio-title a[href="${href}"]`).text(title);
  return $.html();
}

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description || undefined,
  alternates: { canonical: page?.canonical },
};

export default function ProductenPage() {
  if (!page) throw new Error("The WordPress /producten/ snapshot is missing.");
  return <LegacyContent page={{ ...page, html: edit(page.html) }} />;
}
