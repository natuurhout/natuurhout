import type { Metadata } from "next";
import { load } from "cheerio/slim";
import LegacyContent from "@/components/LegacyContent";
import ProductenFaq from "@/components/ProductenFaq";
import { getLegacyPageByPath } from "@/lib/legacy";

/*
 * Product overview, the WordPress page with approved edits (Xander, recorded
 * in handbuilt-routes.json): the sold-out Boerenlandhekken tile is gone, the
 * shop's Robinia Poort and vierkant gezaagde robinia palen have a tile of
 * their own, the two hazelaar screens carry their webshop names, and their
 * tiles show a current photo instead of the old "Promotie" banner, and the
 * Services/FAQ block below the tiles is rebuilt as tabs (ProductenFaq) with
 * updated answers. Everything else renders verbatim; the audit checks that.
 */
const page = getLegacyPageByPath("/producten/");

const RENAMES: Record<string, string> = {
  "/project/hazelaar-vlechtscherm-hasseltre/": "Hazelaar Vlechtscherm - Hasseltre",
  "/project/hazelaarvlechtschermen/": "Hazelaar Vlechtscherm - Trepanel",
};
const REMOVED = ["/project/boerenlandhekken/"];
const PHOTOS: Record<string, string> = {
  "/project/hazelaar-vlechtscherm-hasseltre/": "/fotos/hazelaar-vlechtscherm-halve-latten.jpg",
  "/project/hazelaarvlechtschermen/": "/wp-content/uploads/2016/01/Hazelaar-vlechtscherm-scaled.webp",
  "/project/robinia-rasterwerk/": "/fotos/robinia-hekwerk-hoofdfoto.jpg",
};

// Shop products without a WordPress page, added as a tile after another.
const ADDED = [
  {
    after: "/project/hazelaar-poorten/",
    href: "/shop/robinia-poort/",
    title: "Robinia Poort",
    src: "/fotos/robinia-poort.jpg",
  },
  {
    after: "/project/robinia-palen/",
    href: "/shop/vierkant-gezaagde-robinia-palen/",
    title: "Vierkant gezaagde robinia palen",
    src: "https://cdn.shopify.com/s/files/1/0905/4421/0251/files/gezaagde-robinia-palen-2689446.jpg?v=1760629025&width=800",
  },
];

function edit(html: string) {
  const $ = load(html, null, false);
  $("#content-section-2").remove(); // rebuilt as <ProductenFaq />
  for (const href of REMOVED) $(`.portfolio-title a[href="${href}"]`).closest(".columns").remove();
  for (const tile of ADDED) {
    const after = $(`.portfolio-title a[href="${tile.after}"]`).closest(".columns");
    const added = after.clone();
    added.find("a").attr("href", tile.href);
    added.find(".portfolio-title a").text(tile.title);
    added.find(".portfolio-thumbnail img").attr({ src: tile.src, alt: tile.title });
    after.after(added);
  }
  // The WordPress row breaks assumed four fixed tiles per row; the grid wraps
  // by itself, so they would only leave gaps after a tile is added or removed.
  $(".gdlr-isotope > .clear").remove();
  for (const [href, title] of Object.entries(RENAMES)) $(`.portfolio-title a[href="${href}"]`).text(title);
  for (const [href, src] of Object.entries(PHOTOS)) {
    $(`.portfolio-title a[href="${href}"]`).closest(".gdlr-portfolio-item").find(".portfolio-thumbnail img").attr("src", src).removeAttr("width").removeAttr("height");
  }
  return $.html();
}

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description || undefined,
  alternates: { canonical: page?.canonical },
};

export default function ProductenPage() {
  if (!page) throw new Error("The WordPress /producten/ snapshot is missing.");
  return (
    // One root for the audit: the snapshot content now spans both parts.
    <div data-legacy-product={page.pathname}>
      <LegacyContent page={{ ...page, html: edit(page.html) }} />
      <ProductenFaq />
    </div>
  );
}
