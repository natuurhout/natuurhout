import type { Metadata } from "next";
import { load } from "cheerio/slim";
import LegacyContent from "@/components/LegacyContent";
import ProductenFaq from "@/components/ProductenFaq";
import ShopCatalogue from "@/components/ShopCatalogue";
import { getLegacyPageByPath } from "@/lib/legacy";

/*
 * Product overview, the WordPress page with approved edits (Xander, recorded
 * in handbuilt-routes.json): the sold-out Boerenlandhekken tile is gone, the
 * shop's Robinia Poort and Gezaagde robinia palen have a tile of
 * their own, the two hazelaar screens carry their webshop names, and their
 * tiles show a current photo instead of the old "Promotie" banner, and the
 * Services/FAQ block below the tiles is rebuilt as tabs (ProductenFaq) with
 * updated answers, and every product follows the tiles by category
 * (ShopCatalogue, as on /shop/). The h1 reads "Natuurhout producten", with the waving
 * mascot beside it. Everything else renders verbatim; the audit checks that.
 */
const page = getLegacyPageByPath("/producten/");

const RENAMES: Record<string, string> = {
  "/project/hazelaar-vlechtscherm-hasseltre/": "Hazelaar Vlechtscherm - Hasseltre",
  "/project/hazelaarvlechtschermen/": "Hazelaar Vlechtscherm - Trepanel",
};
// Sold out (Boerenlandhekken) or a unique Sale item now (the kaderpoort).
const REMOVED = ["/project/boerenlandhekken/", "/project/raamwerkpoort/"];
const PHOTOS: Record<string, string> = {
  "/project/hazelaar-vlechtscherm-hasseltre/": "/fotos/hazelaar-vlechtscherm-halve-latten.jpg",
  "/project/hazelaarvlechtschermen/": "/wp-content/uploads/2016/01/Hazelaar-vlechtscherm-scaled.webp",
  "/project/robinia-rasterwerk/": "/fotos/robinia-hekwerk-hoofdfoto.jpg",
  "/project/franse-poorten/": "/fotos/kastanje-premium-poort.jpg",
  "/project/kastanjepalen/": "/fotos/kastanje-palen.jpg",
  "/project/post-rail-2/": "/fotos/post-rail.jpg",
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
    title: "Gezaagde robinia palen",
    src: "https://cdn.shopify.com/s/files/1/0905/4421/0251/files/gezaagde-robinia-palen-2689446.jpg?v=1760629025&width=800",
  },
];

// Approved new h1 (Xander), recorded as approvedHeading in handbuilt-routes.json:
// Natuurhout sells more woods than chestnut. The title in Google stays the snapshot's.
const HEADING = "Natuurhout producten";

function edit(html: string) {
  const $ = load(html, null, false);
  $("h1").first().text(HEADING).wrap('<div class="producten-heading"></div>');
  $(".producten-heading").append(
    '<img src="/mascotte-zwaai.webp" alt="" width="496" height="640" class="producten-heading__mascotte" loading="eager" decoding="async">',
  );
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
      {/* Every product of the range, by category (as on /shop/). */}
      <section aria-labelledby="alle-producten" className="mx-auto w-full max-w-[1240px] bg-white px-4 pb-12 sm:px-6 lg:px-10">
        <h2 id="alle-producten" className="font-display text-3xl font-semibold text-ink sm:text-4xl">Alle producten</h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink/70">
          Elk product met zijn prijs, per categorie. Klik op een categorie om er meteen naartoe te gaan.
        </p>
        <ShopCatalogue heading="h3" />
      </section>
      <ProductenFaq />
    </div>
  );
}
