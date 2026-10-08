import { load } from "cheerio/slim";
import { CUSTOM_GATE_HEIGHTS, CUSTOM_GATE_TABLE } from "@/lib/calculator-pricing";
import { getProduct, type Product } from "@/lib/catalog";
import { PAGE_EXTRA_PHOTOS } from "@/lib/extra-photos";
import { getLegacyPageByPath, type LegacyPage } from "@/lib/legacy";
import { classify, escapeHtml, splitSections, type TabId } from "@/lib/product-info";

/*
 * The WordPress product pages (/project/…, the "Producten & Prijzen" menu)
 * rebuilt in the shop's product layout: photo on the side, the webshop's
 * price list straight away, the page's own text in tabs below.
 *
 * Every word, heading, photo and link of the frozen snapshot stays on the
 * page — only its order and grouping change — with one approved exception:
 * where the webshop sells the product, its price tables (and their "*"
 * footnotes) are replaced by the shop's current prices. audit-built-parity.mjs
 * checks this for each route listed in migration/handbuilt-routes.json.
 */

/** Page → the webshop products whose price list it shows (empty: not sold online). */
const SHOP_PRODUCTS: Record<string, string[]> = {
  "/project/rasterwerk-kastanjehout/": ["kastanje-rasterwerk"],
  "/project/robinia-rasterwerk/": ["robinia-hekwerk"],
  "/project/hazelaarrasterwerk/": ["hazelaar-hekwerk"],
  "/project/franse-poorten/": ["kastanje-poorten"],
  "/project/maatwerk-poorten/": [],
  "/project/hazelaar-poorten/": ["hazelaar-poort"],
  "/project/cleft-field-veldpoorten/": ["cleft-field-poorten", "beslag-hang-sluitwerk"],
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

/** Products only listed in a page's price overview (not in its price list). */
const OVERVIEW_EXTRAS: Record<string, string[]> = {
  "/project/cleft-field-veldpoorten/": ["eiken-palen"],
};

/*
 * Franse maatwerkpoorten are not in the webshop: they are made after the
 * order. Their price table (the same one the calculator uses) becomes a
 * price list of its own, where every size is "op bestelling".
 */
const MAATWERK_POORT: Product = {
  handle: "maatwerk-poort",
  title: "Franse maatwerkpoort",
  bodyHtml: "",
  options: ["Breedte", "Hoogte"],
  images: [],
  variants: CUSTOM_GATE_TABLE.flatMap((row, r) =>
    CUSTOM_GATE_HEIGHTS.map((height, h) => ({
      id: -(r * CUSTOM_GATE_HEIGHTS.length + h + 1),
      title: `${row.width}cm / ${height}cm`,
      price: row.prices[h].toFixed(2),
      compare_at: null,
      available: false,
    })),
  ),
  priceFrom: null,
  priceTo: null,
  available: false,
  tags: [],
  shopUrl: "https://natuurhout.shop/",
  publishedAt: null,
};

const REQUEST_ONLY: Record<string, Product[]> = {
  "/project/maatwerk-poorten/": [MAATWERK_POORT],
};

/** Snapshot photos taken off a page (approved, see handbuilt-routes.json). */
const REMOVED_PHOTOS: Record<string, string[]> = {
  "/project/hazelaarvlechtschermen/": ["/wp-content/uploads/2016/01/Promotie-vlechtscherm.jpg"],
};

/** Marks where a replaced WordPress price table stood. */
export const SHOP_PRICES_MARKER = "<!--shop-prices-->";

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
  /** The price list: webshop products, or request-only ones (maatwerk). */
  products: Product[];
  /** The page's price tables were replaced by the shop's prices. */
  pricesFromShop: boolean;
  /** Products in the price overview tab (when pricesFromShop). */
  overview: Product[];
  sections: Record<LegacyTab, string>;
};

// Price sections (and any titled section holding a price table) form their
// own tab; the rest follows the shop tabs' keywords, plus a few phrases the
// WordPress pages use for their specification blocks.
function legacyClassify(title: string, html: string): LegacyTab {
  if (/prijs|prijzen|hang\s*(en|&|&amp;)\s*sluitwerk/i.test(title)) return "prijzen";
  if (/<table/i.test(html) || html.includes(SHOP_PRICES_MARKER)) return "prijzen";
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

  const shopProducts = SHOP_PRODUCTS[page.pathname]
    .map((handle) => getProduct(handle))
    .filter((p): p is Product => Boolean(p));
  const pricesFromShop = shopProducts.length > 0;
  if (pricesFromShop) {
    // The old price tables give way to the shop's prices; their "*PROMOTIE"
    // and "*uitverkocht" footnotes go with them.
    body.find("table").replaceWith(SHOP_PRICES_MARKER);
    body
      .find("p")
      .filter((_, p) => $(p).text().trim().startsWith("*"))
      .remove();
  }

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

  // Approved removals (handbuilt-routes.json: removedContent), e.g. an expired promo banner.
  const dropped = new Set(REMOVED_PHOTOS[page.pathname] ?? []);
  for (let i = photos.length - 1; i >= 0; i--) if (dropped.has(photos[i].src)) photos.splice(i, 1);

  // Natuurhout's own recent photos lead the gallery; the snapshot's follow.
  const extra = (PAGE_EXTRA_PHOTOS[page.pathname] ?? []).map((p) => ({ src: p.src, alt: p.alt, href: p.src, caption: p.caption }));
  photos.unshift(...extra.filter((p) => !seen.has(p.src)));

  const products = pricesFromShop ? shopProducts : (REQUEST_ONLY[page.pathname] ?? []);
  const overview = [
    ...products,
    ...(OVERVIEW_EXTRAS[page.pathname] ?? []).map((handle) => getProduct(handle)).filter((p): p is Product => Boolean(p)),
  ];

  return { heading, nav, lead, photos, products, pricesFromShop, overview, sections };
}
