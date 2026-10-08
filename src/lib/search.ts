import { categories } from "@/lib/categories";
import { formatPrice, getProduct, products } from "@/lib/catalog";
import { CARD_PHOTOS } from "@/lib/extra-photos";
import { isPermanentlyNoindexLegacyPath, legacyPages } from "@/lib/legacy";
import { pageLinks, productMenu, QUOTE_HREF } from "@/lib/navigation";

export type SearchKind = "Productgroep" | "Webshop" | "Pagina" | "Info" | "Realisatie";

export type SearchItem = {
  title: string;
  href: string;
  kind: SearchKind;
  /** Extra words that should find this item (not shown). */
  keywords?: string;
  image?: string;
  price?: string;
};

/*
 * Site search index for the header search box, built at build time from the
 * menu, the webshop catalogue and the WordPress pages. Small enough (titles
 * and a few keywords only) to ship to the browser and search there.
 */

// Old names people still search for.
const SYNONYMS: Record<string, string> = {
  "/project/franse-poorten/": "franse poorten tuinpoort",
  "/project/maatwerk-poorten/": "franse poorten op maat tuinpoort",
  "/project/rasterwerk-kastanjehout/": "rasterwerk afsluiting omheining ganivelle",
  "/project/robinia-rasterwerk/": "rasterwerk afsluiting omheining acacia",
  "/project/hazelaarrasterwerk/": "rasterwerk afsluiting omheining",
  "/project/moestuinbak/": "moestuinbak plantenbak tuinbak",
  "/calculator/": "prijs berekenen richtprijs kosten",
};

const EXTRA_PAGES: SearchItem[] = [
  { title: "Calculator: bereken uw afsluiting", href: "/calculator/", kind: "Pagina" },
  { title: "Offerte aanvragen", href: QUOTE_HREF, kind: "Pagina", keywords: "prijsofferte vrijblijvend" },
  { title: "Alle producten", href: "/producten/", kind: "Pagina", keywords: "assortiment" },
  { title: "Veelgestelde vragen (FAQ)", href: "/producten/#faq", kind: "Pagina", keywords: "levering afhalen betalen montage plaatsing" },
  { title: "Webshop", href: "/shop/", kind: "Pagina", keywords: "kopen bestellen" },
  ...pageLinks.map((link) => ({ title: link.label, href: link.href, kind: "Pagina" as const })),
];

// Not offered any more (Boerenlandhekken is sold out and off the overview).
const HIDDEN = new Set(["/", "/project/boerenlandhekken/"]);

const shortTitle = (title: string) => title.split(" | ")[0].trim();

function build(): SearchItem[] {
  const items: SearchItem[] = [];
  const seen = new Set<string>();
  const add = (item: SearchItem) => {
    if (seen.has(item.href)) return;
    seen.add(item.href);
    items.push({ ...item, keywords: [item.keywords, SYNONYMS[item.href]].filter(Boolean).join(" ") || undefined });
  };

  const tilePhoto = new Map(categories.map((tile) => [tile.href, tile.src]));
  const shopProduct = (href: string) => getProduct(href.match(/^\/shop\/([^/]+)\/$/)?.[1] ?? "");
  const firstPhoto = (pathname: string) =>
    legacyPages.find((page) => page.pathname === pathname)?.blocks.find((block) => block.type === "image")?.src;

  for (const group of productMenu) {
    for (const link of group.links) {
      const product = shopProduct(link.href);
      add({
        title: link.label,
        href: link.href,
        kind: "Productgroep",
        keywords: group.title,
        image: tilePhoto.get(link.href) ?? (product ? CARD_PHOTOS[product.handle] ?? product.images[0]?.src : firstPhoto(link.href)),
        price: product?.priceFrom ? `vanaf ${formatPrice(product.priceFrom)}` : undefined,
      });
    }
  }
  for (const item of EXTRA_PAGES) add(item);
  for (const product of products) {
    add({
      title: product.title,
      href: `/shop/${product.handle}/`,
      kind: "Webshop",
      keywords: product.tags.join(" "),
      image: CARD_PHOTOS[product.handle] ?? product.images[0]?.src,
      price: product.priceFrom ? `vanaf ${formatPrice(product.priceFrom)}` : undefined,
    });
  }
  for (const page of legacyPages) {
    if (page.kind === "archive" || HIDDEN.has(page.pathname) || isPermanentlyNoindexLegacyPath(page.pathname)) continue;
    // Product pages are in the menu (added above); other /project/ pages are
    // customer projects.
    add({
      title: shortTitle(page.title),
      href: page.pathname,
      kind: page.kind === "project" ? "Realisatie" : "Info",
      keywords: page.heading && page.heading !== page.title ? shortTitle(page.heading) : undefined,
      image: firstPhoto(page.pathname),
    });
  }
  return items;
}

export const searchIndex = build();
