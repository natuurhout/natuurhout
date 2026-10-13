import { load } from "cheerio/slim";
import { ARTIKELS, artikelCard, artikelHref, shortDate } from "@/lib/artikels";

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The Tips & Ideeën overview with the new articles (src/lib/artikels.ts) as
 * the first cards of the WordPress blog grid, in the same markup, so they
 * take the same card style as the older posts.
 */
export function withNewArtikels(html: string): string {
  const $ = load(html, null, false);
  const grid = $('.gdlr-isotope[data-type="blog"]').first();
  if (!grid.length) return html;
  const cards = ARTIKELS.map((artikel) => {
    const href = artikelHref(artikel);
    const card = artikelCard(artikel);
    return `<div class="four columns"><div class="gdlr-item gdlr-blog-grid"><div class="gdlr-ux gdlr-blog-grid-ux">
<article class="post">
  <div class="gdlr-standard-style">
    <div class="gdlr-blog-thumbnail"><a href="${href}"><img src="${card.src}" alt="${escape(card.alt)}"></a></div>
    <div class="gdlr-blog-info gdlr-info"><div class="blog-info blog-date"><span>${shortDate(artikel.date)}</span></div><div class="blog-info blog-author"><span>Natuurhout</span></div></div>
    <header class="post-header"><h3 class="gdlr-blog-title"><a href="${href}">${escape(artikel.title)}</a></h3></header>
    <div class="gdlr-blog-content">${escape(artikel.summary)} <a href="${href}" class="excerpt-read-more">Lees meer</a></div>
  </div>
</article></div></div></div>`;
  }).join("");
  // Dutch read-more links on the older posts too (Xander).
  grid.find(".excerpt-read-more").each((_, link) => {
    const icon = $(link).find("i").toArray();
    $(link).text("Lees meer").append(icon);
  });
  const first = grid.children(".clear").first();
  if (first.length) first.after(cards);
  else grid.prepend(cards);
  return $.html();
}
