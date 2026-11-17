/*
 * "Producten": the price list as the website shows it right now, read from
 * the same catalogue code the site is built from (src/lib/catalog.ts), so
 * it never disagrees with the site. Read-only: prices change in the repo
 * (src/data/products.json, src/lib/price-updates.ts, src/lib/promotions.ts).
 */

import { collections, isListed, productPage, products, type Product } from "../../src/lib/catalog";
import { euro, html, raw } from "./html";
import { respond, type Ctx } from "./pages";

const price = (value: string | null) => (value ? euro(parseFloat(value)) : "");

function productCard(ctx: Ctx, p: Product) {
  const flags = [
    !isListed(p) && html`<span class="chip">niet in de lijsten</span>`,
    !p.available && html`<span class="chip warn">uitverkocht</span>`,
    p.sale && html`<span class="chip">Sale</span>`,
    p.variants.some((v) => v.promo) && html`<span class="chip st-offerte">promo</span>`,
  ].filter(Boolean);
  const single = p.variants.length === 1 && p.variants[0].title === "Default Title";
  return html`<section class="card">
<div class="head" style="margin-bottom:6px"><h2 style="margin:0">${p.title}</h2><span>${flags.map((f) => html`${f} `)}<a class="small" href="https://www.natuurhout.be${productPage(p)}" target="_blank" rel="noopener">op de site</a></span></div>
<div class="scroll"><table class="prices"><thead><tr><th>Uitvoering</th><th class="num">Prijs</th><th></th></tr></thead><tbody>
${p.variants.map(
  (v) => html`<tr><td>${single ? "Standaard" : v.title}${v.promo ? html` <span class="chip st-offerte">promo</span>` : ""}</td>
<td class="num">${v.compare_at && parseFloat(v.compare_at) > parseFloat(v.price) ? html`<s class="muted small">${price(v.compare_at)}</s> ` : ""}<b>${price(v.price)}</b></td>
<td class="small ${v.available ? "muted" : "warn"}">${v.available ? "op voorraad" : "niet op voorraad"}</td></tr>`,
)}</tbody></table></div></section>`;
}

export function productList(ctx: Ctx): Response {
  const q = (ctx.url.searchParams.get("q") ?? "").trim().toLocaleLowerCase("nl");
  const col = ctx.url.searchParams.get("groep") ?? "";
  const match = (p: Product) =>
    !q || [p.title, p.handle, ...p.tags, ...p.variants.map((v) => v.title)].join(" ").toLocaleLowerCase("nl").includes(q);
  const groups = collections.filter((c) => c.handle !== "promos");
  const inGroup = new Set(groups.flatMap((c) => c.products));
  const sections = [
    ...groups.map((c) => ({ handle: c.handle, title: c.title, items: c.products.map((h) => products.find((p) => p.handle === h)).filter((p): p is Product => Boolean(p)) })),
    { handle: "overige", title: "Overige", items: products.filter((p) => !inGroup.has(p.handle)) },
  ]
    .filter((s) => !col || s.handle === col)
    .map((s) => ({ ...s, items: s.items.filter(match) }))
    .filter((s) => s.items.length);
  const opt = (value: string, label: string) => html`<option value="${value}" ${value === col ? raw("selected") : ""}>${label}</option>`;
  return respond(
    ctx,
    "Producten",
    "producten",
    html`<h1>Producten</h1>
<p class="muted small">De prijzen zoals ze nu op de website staan (incl. btw). Aanpassen gebeurt in de website-code; laat het weten aan wie de site onderhoudt.</p>
<form class="card inline" method="get" action="${ctx.base}/producten">
<label>Groep<select name="groep">${opt("", "Alle")}${groups.map((c) => opt(c.handle, c.title))}${opt("overige", "Overige")}</select></label>
<label>Zoeken<input name="q" value="${ctx.url.searchParams.get("q") ?? ""}" placeholder="kastanje, 120cm, poort…"></label>
<button>Zoek</button></form>
${sections.length
  ? sections.map((s) => html`<h2 style="margin:22px 0 10px">${s.title}</h2>${s.items.map((p) => productCard(ctx, p))}`)
  : html`<section class="card"><p class="muted">Geen producten gevonden.</p></section>`}`,
  );
}
