/*
 * Webshop backend, catalogue side: Producten (edit names, prices, strike-
 * through prices, availability, stock per variant; hide a product), Voorraad
 * (counted stock, low stock, corrections, movements) and Rapporten.
 *
 * Edits are stored as overrides on top of the site's catalogue
 * (worker/shop/catalog.ts). Checkout uses them at once; the static site picks
 * them up on the next automatic rebuild (.github/workflows/deploy.yml, every
 * 15 minutes when something changed).
 */

import { collections } from "../../src/lib/catalog";
import { now } from "../crm/schema";
import { loadCatalog, productGroups, touchCatalog, variantLabel, type LiveProduct } from "../shop/catalog";
import { round2, todayBE } from "../shop/orders";
import { ago, euro, html, icon, raw, when, type Safe } from "./html";
import { field, HttpError, notFound, respond, seeOther, who, type Ctx } from "./pages";

const priceText = (n: number | string | null | undefined) => (n === null || n === undefined || n === "" ? "" : euro(typeof n === "string" ? parseFloat(n) : n));
const money = (s: string): number | null => {
  const t = s.replace(/[€\s]/g, "");
  if (!t) return null;
  const n = Number(t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t);
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new HttpError(400, `Ongeldige prijs: ${s}`);
  return round2(n);
};
const int = (s: string): number | null => {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isInteger(n) || Math.abs(n) > 1_000_000) throw new HttpError(400, `Ongeldig aantal: ${s}`);
  return n;
};

function stockChip(p: LiveProduct["variants"][number]): Safe | string {
  if (p.stock === null) return p.available ? html`<span class="muted small">niet geteld</span>` : html`<span class="chip">op bestelling</span>`;
  if (p.stock <= 0) return html`<span class="chip warn">0 · op bestelling</span>`;
  if (p.lowStock !== null && p.stock <= p.lowStock) return html`<span class="chip warn">${p.stock} · laag</span>`;
  return html`<span class="chip os-betaald">${p.stock}</span>`;
}

// ---------------------------------------------------------------- Producten

export async function productList(ctx: Ctx): Promise<Response> {
  const q = (ctx.url.searchParams.get("q") ?? "").trim().toLowerCase();
  const { products } = await loadCatalog(ctx.db);
  const changed = await ctx.db.prepare("SELECT changed_at FROM catalog_publish WHERE id = 1").first<{ changed_at: string | null }>();
  const shown = q ? products.filter((p) => `${p.title} ${p.handle} ${p.variants.map((v) => `${v.title} ${v.sku}`).join(" ")}`.toLowerCase().includes(q)) : products;
  const byHandle = new Map(shown.map((p) => [p.handle, p]));
  const seen = new Set<string>();
  const groups: [string, LiveProduct[]][] = collections.map((c) => {
    const list = c.products.map((h) => byHandle.get(h)).filter((p): p is LiveProduct => Boolean(p) && !seen.has(p!.handle));
    list.forEach((p) => seen.add(p.handle));
    return [c.title, list];
  });
  groups.push(["Overige producten", shown.filter((p) => !seen.has(p.handle))]);
  const edited = (p: LiveProduct) =>
    p.title !== p.base.title || p.hidden || p.variants.some((v, i) => v.price !== p.base.variants[i]?.price || v.available !== p.base.variants[i]?.available || v.stock !== null);
  return respond(
    ctx,
    "Producten",
    "producten",
    html`<div class="head"><div><h1>Producten</h1><p class="sub">${products.length} producten. Klik een product om prijzen, voorraad en zichtbaarheid aan te passen.${
      changed?.changed_at ? html` Laatste wijziging ${ago(changed.changed_at)} geleden.` : ""
    }</p></div></div>
<form class="toolbar" method="get" action="${ctx.base}/producten"><label class="search">${icon("search")}<input name="q" type="search" value="${q}" placeholder="Zoek product, uitvoering of SKU…" aria-label="Zoeken"></label><button class="btn ghost">Zoek</button></form>
<p class="muted small">Prijzen gelden meteen voor nieuwe bestellingen. De website zelf wordt automatisch bijgewerkt binnen ongeveer 20 minuten na een wijziging.</p>
${groups
  .filter(([, list]) => list.length)
  .map(
    ([title, list]) => html`<section class="card"><h2>${title}</h2><div class="scroll"><table><thead><tr><th>Product</th><th>Uitvoeringen</th><th class="num">Prijs</th><th>Voorraad</th><th></th></tr></thead><tbody>
${list.map((p) => {
  const counted = p.variants.filter((v) => v.stock !== null);
  const low = counted.filter((v) => v.stock! <= 0 || (v.lowStock !== null && v.stock! <= v.lowStock));
  return html`<tr><td><a href="${ctx.base}/producten/${p.handle}">${p.title}</a>${p.hidden ? html` <span class="chip">verborgen</span>` : ""}${edited(p) ? html` <span class="chip st-offerte">aangepast</span>` : ""}</td>
<td class="small">${p.variants.length}</td><td class="num">${p.priceFrom === p.priceTo ? priceText(p.priceFrom) : html`${priceText(p.priceFrom)} – ${priceText(p.priceTo)}`}</td>
<td class="small">${counted.length ? html`${counted.length} geteld${low.length ? html` · <span class="warn">${low.length} laag/op</span>` : ""}` : p.available ? html`<span class="muted">niet geteld</span>` : "op bestelling"}</td>
<td class="num"><a class="small" href="https://www.natuurhout.be/shop/${p.handle}/" target="_blank" rel="noopener">op de site</a></td></tr>`;
})}</tbody></table></div></section>`,
  )}`,
  );
}

export async function productEdit(ctx: Ctx, handle: string): Promise<Response> {
  const { products } = await loadCatalog(ctx.db);
  const p = products.find((x) => x.handle === handle);
  if (!p) throw notFound();
  const avail = (v: LiveProduct["variants"][number]) => {
    const base = v.base.available;
    const row = v.available === base ? "" : v.available ? "1" : "0";
    return html`<select name="available" aria-label="Beschikbaarheid"${v.stock !== null ? raw(" disabled title=\"Volgt de getelde voorraad\"") : ""}>
<option value="" ${row === "" ? raw("selected") : ""}>Standaard (${base ? "op voorraad" : "op bestelling"})</option><option value="1" ${row === "1" ? raw("selected") : ""}>Op voorraad</option><option value="0" ${row === "0" ? raw("selected") : ""}>Op bestelling</option></select>`;
  };
  return respond(
    ctx,
    p.title,
    "producten",
    html`<div class="head"><div><h1>${p.title}</h1><p class="sub"><a href="https://www.natuurhout.be/shop/${p.handle}/" target="_blank" rel="noopener">Bekijk op de website</a> · ${p.variants.length} uitvoeringen</p></div></div>
<form method="post" action="${ctx.base}/producten/${p.handle}">
<section class="card"><h2>Product</h2><div class="fields"><label>Naam<input name="title" value="${p.title !== p.base.title ? p.title : ""}" placeholder="${p.base.title}"></label>
<label class="check" style="align-self:end;margin-bottom:22px"><input type="checkbox" name="hidden" value="1" ${p.hidden ? raw("checked") : ""}> Verbergen uit de productlijsten (de productpagina blijft bestaan)</label></div>
<p class="muted small">Leeg laten = de standaardwaarde (grijs). Een veld leegmaken zet het terug naar de standaard.</p></section>
<section class="card"><h2>Uitvoeringen</h2><div class="scroll"><table class="editor"><thead><tr><th>Uitvoering</th><th class="num">Prijs incl. btw</th><th class="num">Was-prijs</th><th>Beschikbaar</th><th class="num">Voorraad</th><th class="num">Melding bij</th><th>SKU</th></tr></thead><tbody>
${p.variants.map(
  (v) => html`<tr><td><input type="hidden" name="id" value="${v.id}"><input name="vtitle" value="${v.title !== v.base.title ? v.title : ""}" placeholder="${variantLabel(p.base, v.base)}" style="min-width:200px"></td>
<td class="num"><input name="price" inputmode="decimal" value="${v.price !== v.base.price ? v.price.replace(".", ",") : ""}" placeholder="${v.base.price.replace(".", ",")}" style="width:100px"></td>
<td class="num"><input name="compare" inputmode="decimal" value="${v.compare_at !== v.base.compare_at ? (v.compare_at ?? "0").replace(".", ",") : ""}" placeholder="${(v.base.compare_at ?? "").replace(".", ",")}" style="width:100px" title="0 = geen doorstreepte prijs"></td>
<td>${avail(v)}</td>
<td class="num"><input name="stock" inputmode="numeric" value="${v.stock ?? ""}" placeholder="niet geteld" style="width:90px"></td>
<td class="num"><input name="low" inputmode="numeric" value="${v.lowStock ?? ""}" style="width:70px"></td>
<td><input name="sku" value="${v.sku}" style="width:110px"></td></tr>`,
)}</tbody></table></div>
<p class="muted small">Voorraad leeg = niet geteld (dan geldt "Beschikbaar"). Vul je een aantal in, dan telt de webshop af bij elke bestelling en zet hij de uitvoering op "op bestelling" bij 0. Was-prijs 0 = geen doorstreepte prijs.</p></section>
<div class="actions"><button>Opslaan</button><a class="btn ghost" href="${ctx.base}/producten">Terug</a></div></form>`,
  );
}

export async function productSave(ctx: Ctx, handle: string, form: FormData): Promise<Response> {
  const { products } = await loadCatalog(ctx.db);
  const p = products.find((x) => x.handle === handle);
  if (!p) throw notFound();
  const at = now();
  const all = (k: string) => form.getAll(k).map((v) => String(v).trim());
  const [ids, titles, prices, compares, avails, stocks, lows, skus] = ["id", "vtitle", "price", "compare", "available", "stock", "low", "sku"].map(all);
  // Disabled selects are not sent: line availability up by variant via a parallel index.
  const stmts: D1PreparedStatement[] = [];
  const title = field(form, "title", 200);
  const hidden = field(form, "hidden") === "1";
  stmts.push(
    title || hidden
      ? ctx.db
          .prepare("INSERT INTO product_overrides (handle, title, hidden, updated_by, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (handle) DO UPDATE SET title = excluded.title, hidden = excluded.hidden, updated_by = excluded.updated_by, updated_at = excluded.updated_at")
          .bind(handle, title || null, hidden ? 1 : 0, ctx.user.email, at)
      : ctx.db.prepare("DELETE FROM product_overrides WHERE handle = ?").bind(handle),
  );
  let availIndex = 0;
  for (let i = 0; i < ids.length; i++) {
    const v = p.variants.find((x) => x.id === Number(ids[i]));
    if (!v) continue;
    const stock = int(stocks[i] ?? "");
    const available = v.stock !== null ? null : (avails[availIndex++] ?? "");
    const vtitle = (titles[i] ?? "").slice(0, 200) || null;
    const price = money(prices[i] ?? "");
    const compareRaw = (compares[i] ?? "").trim();
    const compare = compareRaw === "" ? null : (money(compareRaw) ?? 0);
    const low = int(lows[i] ?? "");
    const sku = (skus[i] ?? "").slice(0, 60);
    const availValue = available === "1" ? 1 : available === "0" ? 0 : null;
    const keep = vtitle || price !== null || compare !== null || availValue !== null || stock !== null || low !== null || sku;
    if (stock !== null && stock !== v.stock) {
      stmts.push(
        ctx.db
          .prepare("INSERT INTO stock_moves (variant_id, delta, reason, author, created_at) VALUES (?, ?, ?, ?, ?)")
          .bind(v.id, stock - (v.stock ?? 0), v.stock === null ? "telling gestart" : "correctie", ctx.user.email, at),
      );
    }
    stmts.push(
      keep
        ? ctx.db
            .prepare(
              `INSERT INTO variant_overrides (variant_id, handle, title, price, compare_at, available, stock, low_stock, sku, updated_by, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (variant_id) DO UPDATE SET handle = excluded.handle, title = excluded.title,
               price = excluded.price, compare_at = excluded.compare_at, available = excluded.available, stock = excluded.stock,
               low_stock = excluded.low_stock, sku = excluded.sku, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
            )
            .bind(v.id, handle, vtitle, price, compare, availValue, stock, low, sku, ctx.user.email, at)
        : ctx.db.prepare("DELETE FROM variant_overrides WHERE variant_id = ?").bind(v.id),
    );
  }
  await ctx.db.batch(stmts);
  await touchCatalog(ctx.db, at);
  return seeOther(ctx, `/producten/${handle}`, "saved");
}

// ---------------------------------------------------------------- Voorraad

export async function stockPage(ctx: Ctx): Promise<Response> {
  const { products } = await loadCatalog(ctx.db);
  const counted = products.flatMap((p) => p.variants.filter((v) => v.stock !== null).map((v) => ({ p, v })));
  counted.sort((a, b) => {
    const lowA = a.v.stock! <= (a.v.lowStock ?? 0) ? 0 : 1;
    const lowB = b.v.stock! <= (b.v.lowStock ?? 0) ? 0 : 1;
    return lowA - lowB || a.p.title.localeCompare(b.p.title);
  });
  const { results: moves } = await ctx.db
    .prepare("SELECT m.*, o.number FROM stock_moves m LEFT JOIN orders o ON o.id = m.order_id ORDER BY m.id DESC LIMIT 40")
    .all<{ variant_id: number; delta: number; reason: string; order_id: number | null; number: string | null; author: string | null; created_at: string }>();
  const { byId } = await loadCatalog(ctx.db);
  const lowCount = counted.filter(({ v }) => v.stock! <= 0 || (v.lowStock !== null && v.stock! <= v.lowStock)).length;
  return respond(
    ctx,
    "Voorraad",
    "voorraad",
    html`<div class="head"><div><h1>Voorraad</h1><p class="sub">${counted.length} uitvoeringen worden geteld${lowCount ? html`, <b class="warn">${lowCount} laag of op</b>` : ""}. Een telling start je bij het product (Producten → product → Voorraad).</p></div></div>
<div class="grid two"><section class="card"><h2>Getelde voorraad</h2>${
      counted.length
        ? html`<div class="scroll"><table><thead><tr><th>Product</th><th>Voorraad</th><th>Bijboeken / afboeken</th></tr></thead><tbody>
${counted.map(
  ({ p, v }) => html`<tr><td><a href="${ctx.base}/producten/${p.handle}">${p.title}</a><div class="muted small">${variantLabel(p, v)}${v.sku ? ` · ${v.sku}` : ""}</div></td><td>${stockChip(v)}</td>
<td><form method="post" action="${ctx.base}/voorraad" class="inline"><input type="hidden" name="id" value="${v.id}"><input name="delta" inputmode="numeric" placeholder="+10 / -2" aria-label="Aantal" style="width:90px;min-width:0">
<select name="reason" aria-label="Reden" style="min-width:0"><option>levering</option><option>correctie</option><option>breuk</option><option>verkocht buiten webshop</option></select><button class="btn ghost sm">OK</button></form></td></tr>`,
)}</tbody></table></div>`
        : html`<p class="muted">Nog geen voorraad geteld. Open een product bij Producten en vul bij "Voorraad" een aantal in.</p>`
    }</section>
<section class="card"><h2>Laatste bewegingen</h2>${
      moves.length
        ? html`<ul class="timeline">${moves.map((m) => {
            const hit = byId.get(m.variant_id);
            return html`<li><div class="meta">${when(m.created_at)}${m.author ? html` · ${who(ctx, m.author)}` : ""}</div><b class="${m.delta < 0 ? "warn" : ""}">${m.delta > 0 ? "+" : ""}${m.delta}</b> ${
              hit ? `${hit.product.title} – ${variantLabel(hit.product, hit.variant)}` : `#${m.variant_id}`
            } <span class="muted small">· ${m.reason}${m.order_id ? html` <a href="${ctx.base}/bestellingen/${m.order_id}">${m.number}</a>` : ""}</span></li>`;
          })}</ul>`
        : html`<p class="muted small">Nog geen bewegingen.</p>`
    }</section></div>`,
  );
}

export async function stockPost(ctx: Ctx, form: FormData): Promise<Response> {
  const id = Number(field(form, "id"));
  const delta = int(field(form, "delta", 20).replace(/^\+/, ""));
  if (!delta) return seeOther(ctx, "/voorraad");
  const reason = field(form, "reason", 60) || "correctie";
  const row = await ctx.db.prepare("SELECT stock FROM variant_overrides WHERE variant_id = ? AND stock IS NOT NULL").bind(id).first<{ stock: number }>();
  if (!row) throw new HttpError(400, "Deze uitvoering wordt niet geteld.");
  const at = now();
  await ctx.db.batch([
    ctx.db.prepare("UPDATE variant_overrides SET stock = stock + ?, updated_by = ?, updated_at = ? WHERE variant_id = ?").bind(delta, ctx.user.email, at, id),
    ctx.db.prepare("INSERT INTO stock_moves (variant_id, delta, reason, author, created_at) VALUES (?, ?, ?, ?, ?)").bind(id, delta, reason, ctx.user.email, at),
  ]);
  await touchCatalog(ctx.db, at);
  return seeOther(ctx, "/voorraad", "saved");
}

/** Counted variants at or below their alert level (sidebar badge). */
export async function lowStockCount(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM variant_overrides WHERE stock IS NOT NULL AND (stock <= 0 OR (low_stock IS NOT NULL AND stock <= low_stock))").first<{ n: number }>();
  return row?.n ?? 0;
}

// ---------------------------------------------------------------- Rapporten

const MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const SOLD = "('betaald','klaar','geleverd')";

export async function reports(ctx: Ctx): Promise<Response> {
  const year = Number(ctx.url.searchParams.get("jaar")) || Number(todayBE().slice(0, 4));
  const from = `${year}-01-01`;
  const to = `${year + 1}-01-01`;
  const [monthly, ordersAgg, best, groupsRaw, open, quotes, years] = await ctx.db.batch([
    ctx.db.prepare(
      "SELECT CAST(substr(json_extract(data, '$.date'), 6, 2) AS INTEGER) AS m, SUM(total) AS total, SUM(vat) AS vat FROM invoices WHERE year = ? GROUP BY m",
    ).bind(year),
    ctx.db.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS total, COUNT(DISTINCT COALESCE(contact_id, email)) AS customers FROM orders WHERE status IN ${SOLD} AND created_at >= ? AND created_at < ?`).bind(from, to),
    ctx.db.prepare(
      `SELECT l.product, l.label, l.handle, SUM(l.qty) AS qty, SUM(l.qty * l.unit) AS revenue FROM order_lines l JOIN orders o ON o.id = l.order_id
       WHERE o.status IN ${SOLD} AND o.created_at >= ? AND o.created_at < ? AND l.handle <> '' GROUP BY l.variant_id ORDER BY revenue DESC LIMIT 15`,
    ).bind(from, to),
    ctx.db.prepare(
      `SELECT l.handle, SUM(l.qty * l.unit) AS revenue FROM order_lines l JOIN orders o ON o.id = l.order_id
       WHERE o.status IN ${SOLD} AND o.created_at >= ? AND o.created_at < ? GROUP BY l.handle`,
    ).bind(from, to),
    ctx.db.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS total FROM orders WHERE status = 'bevestigd'"),
    ctx.db.prepare("SELECT status, COUNT(*) AS n FROM requests WHERE created_at >= ? AND created_at < ? GROUP BY status").bind(from, to),
    ctx.db.prepare("SELECT DISTINCT year FROM invoices UNION SELECT CAST(substr(created_at, 1, 4) AS INTEGER) FROM orders ORDER BY 1 DESC"),
  ]);
  const byMonth = new Map((monthly.results as { m: number; total: number; vat: number }[]).map((r) => [r.m, r]));
  const months = MONTHS.map((label, i) => ({ label, total: byMonth.get(i + 1)?.total ?? 0 }));
  const max = Math.max(1, ...months.map((m) => m.total));
  const revenue = round2(months.reduce((t, m) => t + m.total, 0));
  const vat = round2([...byMonth.values()].reduce((t, r) => t + r.vat, 0));
  const agg = ordersAgg.results[0] as { n: number; total: number; customers: number };
  const openAgg = open.results[0] as { n: number; total: number };
  const groupOf = productGroups();
  const groupTotals = new Map<string, number>();
  for (const g of groupsRaw.results as { handle: string; revenue: number }[]) {
    const name = g.handle ? (groupOf.get(g.handle) ?? "Overige") : "Vrije regels (levering e.d.)";
    groupTotals.set(name, round2((groupTotals.get(name) ?? 0) + g.revenue));
  }
  const groupList = [...groupTotals].sort((a, b) => b[1] - a[1]);
  const groupMax = Math.max(1, ...groupList.map(([, v]) => v));
  const q = new Map((quotes.results as { status: string; n: number }[]).map((r) => [r.status, r.n]));
  const qTotal = [...q.values()].reduce((t, n) => t + n, 0);
  const won = q.get("gewonnen") ?? 0;
  const decided = won + (q.get("verloren") ?? 0);
  const yearList = [...new Set([year, ...(years.results as Record<string, number>[]).map((r) => Object.values(r)[0])])].filter(Boolean).sort((a, b) => b - a);
  return respond(
    ctx,
    "Rapporten",
    "rapporten",
    html`<div class="head"><div><h1>Rapporten</h1><p class="sub">Omzet volgens facturen (min creditnota's); verkopen volgens betaalde bestellingen.</p></div>
<form class="toolbar" method="get" action="${ctx.base}/rapporten" style="margin:0"><select name="jaar" aria-label="Jaar">${yearList.map((y) => html`<option ${y === year ? raw("selected") : ""}>${y}</option>`)}</select></form></div>
<div class="stats">
<div class="stat"><span>Omzet ${year} incl. btw</span><b>${euro(revenue)}</b></div>
<div class="stat"><span>Excl. btw</span><b>${euro(round2(revenue - vat))}</b></div>
<div class="stat"><span>Betaalde bestellingen</span><b>${agg.n}</b></div>
<div class="stat"><span>Gemiddelde bestelling</span><b>${euro(agg.n ? round2(agg.total / agg.n) : 0)}</b></div>
<a class="stat" href="${ctx.base}/bestellingen?status=bevestigd"><span>Wacht op betaling (${openAgg.n})</span><b class="${openAgg.total ? "warn" : ""}">${euro(openAgg.total)}</b></a>
<div class="stat"><span>Offertes gewonnen</span><b>${decided ? `${Math.round((won / decided) * 100)}%` : "–"}</b></div>
</div>
<section class="card"><h2>Omzet per maand (${year})</h2><div class="bars">${months.map(
      (m) => html`<div class="bar" title="${m.label}: ${euro(m.total)}"><b>${m.total ? euro(Math.round(m.total)).replace(",00", "") : ""}</b><i style="height:${((m.total / max) * 130).toFixed(1)}px"></i><span>${m.label}</span></div>`,
    )}</div></section>
<div class="grid two">
<section class="card"><h2>Bestsellers</h2>${
      best.results.length
        ? html`<div class="scroll"><table><thead><tr><th>Product</th><th class="num">Aantal</th><th class="num">Omzet</th></tr></thead><tbody>${(best.results as { product: string; label: string; handle: string; qty: number; revenue: number }[]).map(
            (b) => html`<tr><td><a href="${ctx.base}/producten/${b.handle}">${b.product}</a><div class="muted small">${b.label}</div></td><td class="num">${b.qty}</td><td class="num">${euro(b.revenue)}</td></tr>`,
          )}</tbody></table></div>`
        : html`<p class="muted small">Nog geen betaalde bestellingen in ${year}.</p>`
    }</section>
<div><section class="card"><h2>Omzet per productgroep</h2>${
      groupList.length
        ? html`<table><tbody>${groupList.map(
            ([name, v]) => html`<tr><td style="width:45%">${name}</td><td><div class="meter"><i style="width:${((v / groupMax) * 100).toFixed(1)}%"></i></div></td><td class="num">${euro(v)}</td></tr>`,
          )}</tbody></table>`
        : html`<p class="muted small">Nog geen verkopen.</p>`
    }</section>
<section class="card"><h2>Aanvragen ${year}</h2><dl><dt>Ontvangen</dt><dd>${qTotal}</dd><dt>Gewonnen</dt><dd>${won}</dd><dt>Verloren</dt><dd>${q.get("verloren") ?? 0}</dd><dt>Nog open</dt><dd>${
      (q.get("nieuw") ?? 0) + (q.get("in_behandeling") ?? 0) + (q.get("offerte_verstuurd") ?? 0)
    }</dd></dl></section></div></div>`,
  );
}
