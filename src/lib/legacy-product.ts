import { load } from "cheerio/slim";
import { getProduct, type Product } from "@/lib/catalog";
import { getLegacyPageByPath, type LegacyPage } from "@/lib/legacy";
import { classify, escapeHtml, splitSections, type TabId } from "@/lib/product-info";

/*
 * The WordPress product pages (/project/…, the "Producten & Prijzen" menu)
 * rebuilt in the shop's product layout: photo on the side, the webshop's
 * price list straight away, the page's own text in tabs below.
 *
 * Every word, heading, photo and link of the frozen snapshot stays on the
 * page — only its order and grouping change. audit-built-parity.mjs checks
 * that for each route listed in migration/handbuilt-routes.json.
 */

/** Page → the webshop products whose price list it shows (empty: not sold online). */
const SHOP_PRODUCTS: Record<string, string[]> = {
  "/project/rasterwerk-kastanjehout/": ["kastanje-rasterwerk"],
  "/project/robinia-rasterwerk/": ["robinia-hekwerk"],
  "/project/hazelaarrasterwerk/": ["hazelaar-hekwerk"],
  "/project/franse-poorten/": ["kastanje-poorten"],
  "/project/maatwerk-poorten/": [],
  "/project/hazelaar-poorten/": ["hazelaar-poort"],
  "/project/cleft-field-veldpoorten/": ["cleft-field-poorten"],
  "/project/hazelaarvlechtschermen/": ["hazelaar-scherm-trepanel"],
  "/project/hazelaar-vlechtscherm-hasseltre/": ["hazelaar-vlechtscherm-hasseltre"],
  "/project/moestuinbak/": ["tuinbakken-hazelaar"],
  "/project/eiken-palen/": ["eiken-palen"],
  "/project/kastanjepalen/": ["palen"],
  "/project/postsaver-voor-palen/": ["kastanje-paal-met-postsaver", "kastanje-palen-copy"],
  "/project/post-rail-2/": ["post-rail-omheining"],
  "/project/lariks-schaal-delen-2/": ["lariks-planken-delen"],
  "/project/raamwerkpoort/": ["kastanje-kaderpoort"],
  "/project/kastanje-poorten-geschroefd/": ["kastanje-poort-geschroefd"],
  "/project/robinia-palen/": ["robinia-palen"],
  "/project/boerenlandhekken/": [],
};

export const legacyProductPaths = Object.keys(SHOP_PRODUCTS);

export function isLegacyProductPage(pathname: string) {
  return pathname in SHOP_PRODUCTS;
}

export type LegacyTab = TabId | "prijzen";

export type LegacyPhoto = { src: string; alt: string; href: string; caption: string };

export type LegacyNavLink = { href: string; rel: "prev" | "next"; title: string };

export type LegacyProduct = {
  heading: string;
  /** WordPress's previous/next project links, kept as internal links. */
  nav: LegacyNavLink[];
  lead: string;
  photos: LegacyPhoto[];
  products: Product[];
  sections: Record<LegacyTab, string>;
};

// Price sections (and any titled section holding a price table) form their
// own tab; the rest follows the shop tabs' keywords, plus a few phrases the
// WordPress pages use for their specification blocks.
function legacyClassify(title: string, html: string): LegacyTab {
  if (/prijs|prijzen|hang\s*(en|&|&amp;)\s*sluitwerk/i.test(title)) return "prijzen";
  if (/<table/i.test(html)) return "prijzen";
  if (/bijzonderhed|materia|afwerking|formaten/i.test(title)) return "kenmerken";
  return classify(title);
}

/** The opening sentences, up to ~260 characters, for the lead under the h1. */
function clip(text: string) {
  if (text.length <= 260) return text;
  const head = text.slice(0, 260);
  const end = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  return end > 90 ? head.slice(0, end + 1) : `${head.slice(0, head.lastIndexOf(" "))}…`;
}

export function legacyProduct(page: LegacyPage): LegacyProduct | null {
  if (!isLegacyProductPage(page.pathname)) return null;
  const $ = load(page.html, null, false);

  const heading = $("h1").first().text().replace(/\s+/g, " ").trim() || page.heading;

  // Photos: the header image and the gallery, each with the link WordPress
  // wrapped it in (the full-size file) and its gallery caption.
  const photos: LegacyPhoto[] = [];
  const seen = new Set<string>();
  $("img[src]").each((_, img) => {
    const src = $(img).attr("src") ?? "";
    if (!src.startsWith("/") || seen.has(src)) return;
    seen.add(src);
    const link = $(img).closest("a[href]").attr("href");
    const caption = $(img).closest(".gallery-item").find(".gallery-caption").text().replace(/\s+/g, " ").trim();
    photos.push({ src, alt: $(img).attr("alt") || caption || heading, href: link || src, caption });
  });

  const nav: LegacyNavLink[] = $(".gdlr-single-nav a[href]")
    .toArray()
    .map((a) => {
      const href = $(a).attr("href") ?? "";
      const target = getLegacyPageByPath(href);
      return {
        href,
        rel: $(a).attr("rel") === "next" ? ("next" as const) : ("prev" as const),
        title: target?.heading || $(a).text().trim(),
      };
    })
    .filter((link) => link.href.startsWith("/"));

  const content = $(".gdlr-portfolio-description .content").first();
  const body = content.length ? content : $("<div></div>").append($.root().contents());
  // The h1 moves to the top, photos to the gallery; spacers and the hidden,
  // long-dead WordPress quote form (moestuinbak) go.
  body
    .find("h1, .gdlr-shortcode-wrapper, .gallery-caption, a:has(img), img, .clear, .gdlr-space, form, .forminator-ui")
    .remove();

  const sections: Record<LegacyTab, string> = { omschrijving: "", prijzen: "", kenmerken: "", pluspunten: "", tips: "" };
  let started = false;
  for (const section of splitSections(body.html() ?? "", { keepColon: true })) {
    // The page's opening heading, before any text, stays with the description.
    const tab = section.title && started ? legacyClassify(section.title, section.html) : "omschrijving";
    started = true;
    sections[tab] += `${section.title ? `<h3>${escapeHtml(section.title)}</h3>` : ""}${section.html}`;
  }

  const $text = load(sections.omschrijving, null, false);
  const opening = $text("p")
    .toArray()
    .map((p) => $text(p).text().replace(/\s+/g, " ").trim())
    .find((text) => text.length > 60);
  const lead = opening ? clip(opening) : "";

  const products = SHOP_PRODUCTS[page.pathname]
    .map((handle) => getProduct(handle))
    .filter((p): p is Product => Boolean(p));

  return { heading, nav, lead, photos, products, sections };
}
