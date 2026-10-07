import { load, type CheerioAPI } from "cheerio/slim";
import type { AnyNode, Element } from "domhandler";
import { formatPrice, getProduct, relatedProducts, type Product } from "@/lib/catalog";

/*
 * Product page content below the buy panel. The shop descriptions are long
 * single blocks; here they are cut at their own headings and sorted into the
 * tabs a storefront shows (Omschrijving, Kenmerken, Pluspunten, Tips), so the
 * text stays verbatim shop copy — only its order and grouping change.
 * Runs at build time (the product pages are statically generated).
 */

export type TabId = "omschrijving" | "kenmerken" | "pluspunten" | "tips";

export type ProductSections = Record<TabId, string>;

type Section = { title: string; level: number; html: string };

const HEADING = /^h([1-6])$/;

// Keyword → tab for a section heading. Checked in this order, so "Waarom
// kiezen voor robinia?" lands in Pluspunten even though it names the wood.
const CLASSIFIERS: [TabId, RegExp][] = [
  ["pluspunten", /waarom|voorde(e)?l|pluspunt|troef|onderhoudsvrij|onderhoudsarm/i],
  ["kenmerken", /kenmerk|specificatie|technisch|eigenschap|details|staat van het product|constructie|afmeting/i],
  ["tips", /toepassing|tip|montage|plaats|onderhoud|combineer|combinatie|gebruiksgemak|gebruik/i],
];

function classify(title: string): TabId {
  for (const [tab, pattern] of CLASSIFIERS) if (pattern.test(title)) return tab;
  return "omschrijving";
}

/** A paragraph that is bold from start to end, short and single-line, acts as a heading. */
function isBoldHeading($: CheerioAPI, el: Element): boolean {
  if (el.tagName !== "p" || $(el).find("br").length) return false;
  const text = $(el).text().replace(/\s+/g, " ").trim();
  if (!text || text.length > 110) return false;
  const bold = $(el).find("strong, b").text().replace(/\s+/g, " ").trim();
  return bold === text;
}

function headingLevel($: CheerioAPI, node: AnyNode): number | null {
  if (node.type !== "tag") return null;
  const match = HEADING.exec(node.tagName);
  if (match) return Number(match[1]);
  return isBoldHeading($, node) ? 7 : null;
}

function containsHeading($: CheerioAPI, el: Element): boolean {
  return $(el)
    .find("*")
    .toArray()
    .some((child) => headingLevel($, child) !== null);
}

/** Splits shop HTML into top-level sections at its headings. */
function splitSections(bodyHtml: string): Section[] {
  const $ = load(bodyHtml, null, false);
  $("meta, hr, script, style, img").remove();
  $("*").removeAttr("data-start").removeAttr("data-end").removeAttr("class").removeAttr("style");

  // Shopify copy often arrives wrapped (ul > li > div > div > h2 …): unwrap
  // any wrapper that hides headings until every heading is top level.
  const root = $.root();
  for (let guard = 0; guard < 20; guard++) {
    const wrapper = root
      .contents()
      .toArray()
      .find((node): node is Element => node.type === "tag" && headingLevel($, node) === null && containsHeading($, node));
    if (!wrapper) break;
    $(wrapper).replaceWith($(wrapper).contents());
  }

  const sections: Section[] = [{ title: "", level: 0, html: "" }];
  for (const node of root.contents().toArray()) {
    const level = headingLevel($, node);
    if (level !== null) {
      const title = $(node).text().replace(/\s+/g, " ").trim().replace(/:$/, "");
      if (title) sections.push({ title, level, html: "" });
      continue;
    }
    const html = $.html(node).trim();
    if (!html) continue;
    if (node.type === "tag" && !$(node).text().trim() && !$(node).find("table, img").length) continue;
    sections[sections.length - 1].html += html;
  }
  return sections.filter((s) => s.title || s.html);
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * The description cut into tabs. A sub-heading under a classified heading
 * (the 🏡 points under "Waarom kiezen voor …") stays with its parent.
 * A heading that opens the text, before any paragraph, is the product's
 * headline: it stays in Omschrijving whatever words it uses ("… onderhoudsvrij").
 */
export function productSections(product: Product): ProductSections {
  const out: ProductSections = { omschrijving: "", kenmerken: "", pluspunten: "", tips: "" };
  const parents: { level: number; tab: TabId }[] = [];
  let hasContent = false;
  let hasHeading = false;

  for (const section of splitSections(product.bodyHtml)) {
    let tab: TabId = "omschrijving";
    const headline = Boolean(section.title) && !hasContent && !hasHeading;
    if (section.title) {
      while (parents.length && parents[parents.length - 1].level >= section.level) parents.pop();
      const parent = parents[parents.length - 1];
      tab = headline ? "omschrijving" : parent && parent.tab !== "omschrijving" ? parent.tab : classify(section.title);
      parents.push({ level: section.level, tab });
    }
    if (section.html) hasContent = true;
    if (section.title) hasHeading = true;
    out[tab] += `${section.title ? `<h3>${escapeHtml(section.title)}</h3>` : ""}${section.html}`;
  }
  return out;
}

const WOODS: [RegExp, string][] = [
  [/kastanje/i, "Kastanje (onbehandeld)"],
  [/robinia/i, "Robinia (onbehandeld)"],
  [/hazelaar/i, "Hazelaar"],
  [/eiken/i, "Eik"],
  [/lariks/i, "Lariks"],
  [/cortenstaal/i, "Cortenstaal"],
  [/gaas/i, "Verzinkt staaldraad"],
];

function splitTitle(title: string) {
  return title.split(" / ").map((s) => s.trim());
}

/** Spec rows derived from the shop data itself: material, options, prices, stock. */
export function productFacts(product: Product): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];
  const material = WOODS.find(([pattern]) => pattern.test(product.title));
  if (material) facts.push({ label: /gaas|corten/i.test(product.title) ? "Materiaal" : "Houtsoort", value: material[1] });

  const variants = product.variants.filter((v) => v.title !== "Default Title");
  if (variants.length) {
    const axes = product.options.length;
    const split = variants.map((v) => (axes > 1 ? splitTitle(v.title) : [v.title]));
    const consistent = split.every((parts) => parts.length === Math.max(axes, 1));
    if (consistent) {
      product.options.forEach((name, i) => {
        const values = [...new Set(split.map((parts) => parts[i]))];
        facts.push({ label: name, value: values.join(", ") });
      });
    } else {
      facts.push({ label: "Uitvoeringen", value: variants.map((v) => v.title).join(", ") });
    }
  }

  const prices = product.variants.map((v) => parseFloat(v.price));
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  facts.push({
    label: "Prijs",
    value: low === high ? `${formatPrice(low)} incl. btw` : `${formatPrice(low)} – ${formatPrice(high)} incl. btw`,
  });
  if (product.variants.length > 1) {
    const inStock = product.variants.filter((v) => v.available).length;
    facts.push({ label: "Op voorraad", value: `${inStock} van ${product.variants.length} uitvoeringen` });
  }
  facts.push({ label: "Afhalen", value: "Adolf Van Der Moerenstraat 39, 9240 Zele" });
  return facts;
}

/*
 * "Vaak samen gekocht": what a fence, gate or post is installed with. A
 * curated map (there is no order history on this site), by product kind and
 * wood, falling back to products from the same collection.
 */
function kind(product: Product): string {
  const h = product.handle;
  const t = product.title.toLowerCase();
  if (/postsaver/.test(t) && !/palen-copy/.test(h)) return "postsaver";
  if (/scherm/.test(h)) return "scherm";
  if (/tuinbak|plantenbak/.test(h)) return "bak";
  if (/veldpoort|cleft-field/.test(h)) return "veldpoort";
  if (/poort/.test(h)) return "poort";
  if (/gaas|nexum/.test(h)) return "gaas";
  if (/hekwerk|rasterwerk/.test(h)) return "hekwerk";
  if (/palen|paal/.test(h) && !/paalhouder/.test(h)) return "palen";
  if (/post-rail/.test(h)) return "postrail";
  if (/lariks/.test(h)) return "lariks";
  return "materiaal";
}

function wood(product: Product): "kastanje" | "robinia" | "hazelaar" | null {
  const t = product.title.toLowerCase();
  if (t.includes("robinia")) return "robinia";
  if (t.includes("hazelaar")) return "hazelaar";
  if (t.includes("kastanje")) return "kastanje";
  return null;
}

const FENCE = { kastanje: "kastanje-rasterwerk", robinia: "robinia-hekwerk", hazelaar: "hazelaar-hekwerk" };
const GATE = { kastanje: "kastanje-poorten", robinia: "robinia-poort", hazelaar: "hazelaar-poort" };
const POSTS = { kastanje: "palen", robinia: "robinia-palen", hazelaar: "palen" };

function companions(product: Product): string[] {
  const w = wood(product) ?? "kastanje";
  switch (kind(product)) {
    case "hekwerk":
      return [POSTS[w], "kastanje-paal-met-postsaver", "hekwerk-draadverbinders", GATE[w], "grondboor"];
    case "poort":
      return [FENCE[w], POSTS[w], "kastanje-paal-met-postsaver", "beslag-hang-sluitwerk", "grondboor"];
    case "veldpoort":
      return ["beslag-hang-sluitwerk", "eiken-palen", "vierkant-gezaagde-robinia-palen", "post-rail-omheining"];
    case "palen":
      return ["kastanje-paal-met-postsaver", "grondboor", "tuin-voorhamer", w === "robinia" ? FENCE.robinia : FENCE.kastanje, "hekwerk-draadverbinders"];
    case "postsaver":
      return ["palen", "robinia-palen", "grondboor", "tuin-voorhamer"];
    case "gaas":
      return ["robinia-palen", "palen", "hekwerk-draadverbinders", "tuin-voorhamer", "grondboor"];
    case "scherm":
      return ["eiken-palen", "vierkant-gezaagde-robinia-palen", "houtschroeven", "hazelaar-poort", "paalhouder-met-punt-rond"];
    case "bak":
      return ["tuinbakken-hazelaar", "plantenbak-cortenstaal", "hazelaar-vlechtscherm-hasseltre", "hazelaar-hekwerk"];
    case "postrail":
      return ["grondboor", "tuin-voorhamer", "houtschroeven", "cleft-field-poorten", "kastanje-paal-met-postsaver"];
    case "lariks":
      return ["houtschroeven", "eiken-palen", "palen", "tuin-voorhamer"];
    default:
      return ["palen", "kastanje-rasterwerk", "kastanje-poorten", "kastanje-paal-met-postsaver", "grondboor"];
  }
}

export function boughtTogether(product: Product, limit = 4): Product[] {
  const picked = companions(product)
    .filter((handle) => handle !== product.handle)
    .map((handle) => getProduct(handle))
    .filter((p): p is Product => Boolean(p))
    .sort((a, b) => Number(b.available) - Number(a.available));
  const seen = new Set(picked.map((p) => p.handle).concat(product.handle));
  const fill = relatedProducts(product, limit * 2).filter((p) => !seen.has(p.handle));
  return [...picked, ...fill].slice(0, limit);
}
