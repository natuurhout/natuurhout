/*
 * Backend tab "Checkout": everything the checkout (/afrekenen/) charges and
 * how it gets paid. Delivery: price per distance band (road km from Zele per
 * postcode), maximum distance, minimum order value per distance (below it no
 * delivery; pickup always), region corrections per postcode range, free
 * delivery above an amount, a minimum delivery price, rounding, and
 * rules (surcharges, discounts, free, pickup only) run top to bottom.
 * Payment: MultiSafepay test/live. A tester shows the price for a postcode
 * with every step. The engine is worker/shop/delivery.ts.
 */

import {
  COLLECTIONS,
  DISTANCE_INFO,
  RULE_EFFECT,
  RULE_WHEN,
  deliveryQuote,
  getCheckoutSettings,
  lookupPostcode,
  saveCheckoutSettings,
  type Band,
  type MinBand,
  type Region,
  type Rule,
} from "../shop/delivery";
import { mspKey } from "../shop/msp";
import { euro, html, icon, raw, type Safe } from "./html";
import { field, HttpError, respond, seeOther, type Ctx } from "./pages";

const show = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));
function money(v: string, what: string): number {
  const n = Number(v.replace(/[€\s]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100000) throw new HttpError(400, `${what}: ongeldig getal (${v}).`);
  return Math.round(n * 100) / 100;
}
const opt = (value: string, label: string, selected: boolean) => html`<option value="${value}" ${selected ? raw("selected") : ""}>${label}</option>`;

const REFERENCE: [string, string][] = [
  ["9240", "Zele"], ["9200", "Dendermonde"], ["9160", "Lokeren"], ["9100", "Sint-Niklaas"], ["9000", "Gent"],
  ["2000", "Antwerpen"], ["1000", "Brussel"], ["8500", "Kortrijk"], ["8000", "Brugge"], ["3000", "Leuven"],
];

export async function checkoutPage(ctx: Ctx): Promise<Response> {
  const s = await getCheckoutSettings(ctx.db);
  const keys = { test: Boolean(mspKey(ctx.checkout, "test")), live: Boolean(mspKey(ctx.checkout, "live")) };
  const bandRows: (Band | null)[] = [...s.bands, null, null, null];
  const minRows: (MinBand | null)[] = [...s.minimums, null, null];
  const regionRows: (Region | null)[] = [...s.regions, null, null, null];
  const ruleRows: (Rule | null)[] = [...s.rules, null, null];
  const refs = REFERENCE.map(([pc, name]) => ({ pc, name, hit: lookupPostcode(pc) })).filter((r) => r.hit);

  // Tester: ?pc=&stad=&bedrag=&collectie=&aantal=
  const p = ctx.url.searchParams;
  const pc = (p.get("pc") ?? "").trim();
  let tester: Safe | string = "";
  if (pc) {
    const subtotal = Number((p.get("bedrag") ?? "0").replace(",", ".")) || 0;
    const coll = COLLECTIONS.find((c) => c.handle === p.get("collectie"));
    const qty = Math.max(1, Number(p.get("aantal")) || 1);
    const firstHandle = coll ? [...coll.products][0] : "";
    const q = deliveryQuote(s, pc, p.get("stad") ?? "", { subtotal, lines: firstHandle ? [{ handle: firstHandle, qty }] : [{ handle: "", qty }] });
    tester = html`<div class="box" style="margin-top:12px;padding:12px">${
      q.ok ? html`<p style="margin:0 0 6px"><span class="b success done">Levering ${euro(q.price)}</span></p>` : html`<p style="margin:0 0 6px"><span class="b critical plain">Geen levering</span> ${q.reason}</p>`
    }<ul class="small muted" style="margin:0;padding-left:18px">${q.steps.map((st) => html`<li>${st}</li>`)}</ul></div>`;
  }

  return respond(
    ctx,
    "Checkout",
    "checkout",
    html`<div class="ph"><div class="title">${icon("truck")}Checkout</div><a class="btn ghost" href="https://www.natuurhout.be/afrekenen/" target="_blank" rel="noopener">${icon("external")}Afrekenpagina</a></div>
<p class="muted" style="margin:-4px 0 16px">Wat de klant op <a href="https://www.natuurhout.be/afrekenen/" target="_blank" rel="noopener">/afrekenen/</a> betaalt voor levering, en hoe hij betaalt. Wijzigingen gelden meteen. Afhalen in Zele is altijd gratis.</p>
<div class="grid two"><div>

<form class="card" method="post" action="${ctx.base}/checkout"><input type="hidden" name="action" value="bands">
<h2>Prijs per afstand</h2>
<p class="muted small" style="margin-top:-6px">Afstand = rijafstand vanaf ${DISTANCE_INFO.yard} naar de postcode van de klant (${DISTANCE_INFO.count} Belgische postcodes). De eerste schijf waar de afstand in past, telt: vaste prijs + eventueel een bedrag per km. Daarbij komt de regiocorrectie van de postcode. De klant ziet alleen de eindprijs.</p>
<div class="scroll"><table class="editor"><thead><tr><th>Tot en met (km)</th><th>Vaste prijs (€)</th><th>+ per km (€)</th><th></th></tr></thead><tbody>
${bandRows.map(
  (b) => html`<tr><td><input name="b_upto" inputmode="decimal" value="${b ? show(b.upTo) : ""}" placeholder="bv. 15" style="width:100px"></td>
<td><input name="b_price" inputmode="decimal" value="${b ? show(b.price) : ""}" placeholder="bv. 35" style="width:110px"></td>
<td><input name="b_perkm" inputmode="decimal" value="${b && b.perKm ? show(b.perKm) : ""}" placeholder="0" style="width:90px"></td>
<td class="muted small">${b ? `tot ${show(b.upTo)} km: ${euro(b.price)}${b.perKm ? ` + ${euro(b.perKm)}/km` : ""}` : ""}</td></tr>`,
)}</tbody></table></div>
<p class="muted small">Rij leegmaken = schijf weg. Na opslaan komen er nieuwe lege rijen bij.</p>
<div class="fields"><label>Maximale afstand (km, leeg = laatste schijf)<input name="max_km" inputmode="decimal" value="${show(s.maxKm)}" placeholder="bv. 300"></label>
<label>Gratis levering vanaf bestelbedrag (€, leeg = nooit)<input name="free_above" inputmode="decimal" value="${show(s.freeAbove)}" placeholder="bv. 2800"></label>
<label>Leveringsprijs nooit onder (€, leeg = geen ondergrens)<input name="min_price" inputmode="decimal" value="${show(s.minPrice)}" placeholder="bv. 20"></label></div>
<label class="check"><input type="checkbox" name="round" value="1" ${s.roundUp ? raw("checked") : ""}> Afronden naar boven op hele euro's</label>

<h3 style="margin:22px 0 4px">Minimum bestelbedrag voor levering</h3>
<p class="muted small" style="margin-top:0">Bestelbedrag = producten incl. btw, zonder leveringskosten. Daaronder kan de klant levering niet kiezen; winkelmandje en afrekenpagina tonen hoeveel er nog bij moet. Afhalen in Zele kan altijd. De eerste rij waar de afstand in past, telt; minimum leeg of 0 = geen minimum.</p>
<div class="scroll"><table class="editor"><thead><tr><th>Tot en met (km)</th><th>Minimum (€)</th><th></th></tr></thead><tbody>
${minRows.map(
  (m, i) => html`<tr><td><input name="m_upto" inputmode="decimal" value="${m ? show(m.upTo) : ""}" placeholder="bv. 75" style="width:100px"></td>
<td><input name="m_min" inputmode="decimal" value="${m && m.min ? show(m.min) : ""}" placeholder="geen" style="width:110px"></td>
<td class="muted small">${m ? `${i === 0 ? "0" : show(minRows[i - 1]!.upTo)} – ${show(m.upTo)} km: ${m.min ? `levering vanaf ${euro(m.min)}` : "geen minimum"}` : ""}</td></tr>`,
)}</tbody></table></div>

<h3 style="margin:22px 0 4px">Regiocorrectie op postcode</h3>
<p class="muted small" style="margin-top:0">Wordt opgeteld bij de prijs van de afstandsschijf (negatief = korting, bv. -5). De eerste rij waar de postcode in valt, telt; postcode zonder rij = € 0. Gratis levering gaat voor, en de prijs zakt nooit onder de ondergrens hierboven.</p>
<div class="scroll"><table class="editor"><thead><tr><th>Postcode van</th><th>tot en met</th><th>Correctie (€)</th><th>Label</th></tr></thead><tbody>
${regionRows.map(
  (r) => html`<tr><td><input name="g_from" inputmode="numeric" maxlength="4" value="${r ? String(r.from) : ""}" placeholder="bv. 1000" style="width:90px"></td>
<td><input name="g_to" inputmode="numeric" maxlength="4" value="${r ? String(r.to) : ""}" placeholder="bv. 1299" style="width:90px"></td>
<td><input name="g_amount" inputmode="decimal" value="${r ? show(r.amount) : ""}" placeholder="bv. 5 of -5" style="width:100px"></td>
<td><input name="g_label" value="${r?.label ?? ""}" placeholder="bv. Brussel" style="min-width:200px"></td></tr>`,
)}</tbody></table></div>
<div class="actions" style="justify-content:flex-end"><button>Opslaan</button></div></form>
</div>

<div>
<section class="card"><h2>Proberen</h2>
<form method="get" action="${ctx.base}/checkout"><div class="fields">
<label>Postcode<input name="pc" inputmode="numeric" maxlength="4" value="${pc}" placeholder="9000" required></label>
<label>Gemeente (optioneel)<input name="stad" value="${p.get("stad") ?? ""}"></label>
<label>Bestelbedrag (€)<input name="bedrag" inputmode="decimal" value="${p.get("bedrag") ?? ""}" placeholder="250"></label>
<label>Met product uit collectie<select name="collectie">${opt("", "–", !p.get("collectie"))}${COLLECTIONS.map((c) => opt(c.handle, c.title, p.get("collectie") === c.handle))}</select></label>
<label>Aantal stuks<input name="aantal" inputmode="numeric" value="${p.get("aantal") ?? ""}" placeholder="1"></label>
</div><button class="btn ghost">Bereken</button></form>${tester}</section>

<section class="card"><h2>Ter info: afstanden vanaf Zele</h2><dl>${refs.map((r) => html`<dt>${r.pc} ${r.name}</dt><dd>${show(r.hit!.km)} km</dd>`)}</dl></section>

<form class="card" method="post" action="${ctx.base}/checkout"><input type="hidden" name="action" value="msp">
<h2>Online betalen (MultiSafepay)</h2>
<label>Modus<select name="msp_mode">${opt("test", "Test (er wordt niet echt betaald)", s.mspMode === "test")}${opt("live", "Live (echte betalingen)", s.mspMode === "live")}</select></label>
<p class="small" style="margin:0 0 8px">Sleutels: test ${keys.test ? html`<span class="b success done">ingesteld</span>` : html`<span class="b critical todo">ontbreekt</span>`} · live ${
      keys.live ? html`<span class="b success done">ingesteld</span>` : html`<span class="b critical todo">ontbreekt</span>`
    }</p>
${s.mspMode === "live" && !keys.live ? html`<p class="b critical plain" style="white-space:normal">Live staat aan maar de live-sleutel ontbreekt: online betalen werkt niet.</p>` : ""}
<p class="muted small">De sleutels zijn Worker-geheimen (MSP_API_KEY_TEST, MSP_API_KEY_LIVE) in Cloudflare. Webhook (gaat automatisch mee): <code>/api/multisafepay/webhook/</code></p>
<div class="actions" style="justify-content:flex-end"><button>Opslaan</button></div></form>
</div></div>
<form class="card" method="post" action="${ctx.base}/checkout"><input type="hidden" name="action" value="rules">
<h2>Regels</h2>
<p class="muted small" style="margin-top:-6px">Toeslagen, kortingen en uitzonderingen bovenop de prijs per afstand. Ze lopen van boven naar onder (volgorde = Nr). "Gratis levering" stopt de rest; "Niet leveren" toont de omschrijving aan de klant en laat alleen afhalen of een offerte toe.</p>
<div class="scroll"><table class="editor"><thead><tr><th>Nr</th><th>Status</th><th>Omschrijving</th><th>Als</th><th>Waarde</th><th>Collectie</th><th>Dan</th><th>Bedrag</th></tr></thead><tbody>
${ruleRows.map(
  (r, i) => html`<tr><td><input name="r_pos" inputmode="numeric" value="${String(i + 1)}" style="width:52px"></td>
<td><select name="r_status" style="min-width:110px">${r ? html`${opt("aan", "Aan", r.active)}${opt("uit", "Uit", !r.active)}${opt("weg", "Verwijderen", false)}` : html`${opt("aan", "Nieuw", true)}`}</select></td>
<td><input name="r_label" value="${r?.label ?? ""}" placeholder="bv. Toeslag lange palen" style="min-width:170px"></td>
<td><select name="r_when" style="min-width:190px">${Object.entries(RULE_WHEN).map(([k, l]) => opt(k, l, (r?.when ?? "always") === k))}</select></td>
<td><input name="r_value" inputmode="decimal" value="${r && r.value ? show(r.value) : ""}" style="width:80px"></td>
<td><select name="r_coll" style="min-width:160px">${opt("", "–", !r?.collection)}${COLLECTIONS.map((c) => opt(c.handle, c.title, r?.collection === c.handle))}</select></td>
<td><select name="r_effect" style="min-width:200px">${Object.entries(RULE_EFFECT).map(([k, l]) => opt(k, l, (r?.effect ?? "add") === k))}</select></td>
<td><input name="r_amount" inputmode="decimal" value="${r && r.amount ? show(r.amount) : ""}" style="width:80px"></td></tr>`,
)}</tbody></table></div>
<p class="muted small">Een regel telt mee zodra er een omschrijving, waarde of bedrag ingevuld is. Voorbeelden: "Aantal stuks vanaf 40" + collectie Palen → "+ vast bedrag 25"; "Bestelbedrag vanaf 1500" → "Gratis levering"; "Product uit collectie Poorten" → "Niet leveren".</p>
<div class="actions" style="justify-content:flex-end"><button>Regels opslaan</button></div></form>`,
    true,
  );
}

export async function checkoutPost(ctx: Ctx, form: FormData): Promise<Response> {
  const action = field(form, "action");
  if (action === "bands") {
    const col = (k: string) => form.getAll(k).map((v) => String(v).trim());
    const [upto, price, perkm] = ["b_upto", "b_price", "b_perkm"].map(col);
    const bands: Band[] = [];
    upto.forEach((a, i) => {
      const [b, c] = [price[i] ?? "", perkm[i] ?? ""];
      if (!a && !b && !c) return;
      if (!a || !b) throw new HttpError(400, `Schijf ${i + 1}: vul "tot en met km" en de vaste prijs in.`);
      const km = money(a, `Schijf ${i + 1} km`);
      if (km <= 0) throw new HttpError(400, `Schijf ${i + 1}: km moet groter dan 0 zijn.`);
      bands.push({ upTo: km, price: money(b, `Schijf ${i + 1} prijs`), perKm: c ? money(c, `Schijf ${i + 1} per km`) : 0 });
    });
    if (new Set(bands.map((b) => b.upTo)).size !== bands.length) throw new HttpError(400, "Twee schijven met dezelfde km-grens.");

    const [mUpto, mMin] = ["m_upto", "m_min"].map(col);
    const minimums: MinBand[] = [];
    mUpto.forEach((a, i) => {
      const b = mMin[i] ?? "";
      if (!a && !b) return;
      if (!a) throw new HttpError(400, `Minimum ${i + 1}: vul "tot en met km" in.`);
      minimums.push({ upTo: money(a, `Minimum ${i + 1} km`), min: b ? money(b, `Minimum ${i + 1} bedrag`) : 0 });
    });
    if (new Set(minimums.map((m) => m.upTo)).size !== minimums.length) throw new HttpError(400, "Twee minimumrijen met dezelfde km-grens.");

    const [gFrom, gTo, gAmount, gLabel] = ["g_from", "g_to", "g_amount", "g_label"].map(col);
    const regions: Region[] = [];
    gFrom.forEach((a, i) => {
      const [b, c, d] = [gTo[i] ?? "", gAmount[i] ?? "", gLabel[i] ?? ""];
      if (!a && !b && !c && !d) return;
      const from = Number(a), to = Number(b || a);
      if (!/^\d{4}$/.test(a) || !/^\d{4}$/.test(b || a) || from > to) throw new HttpError(400, `Regio ${i + 1}: postcodes van/tot zijn 4 cijfers, "van" niet groter dan "tot".`);
      const amount = Number(c.replace(/[€\s]/g, "").replace(",", ".").replace("−", "-"));
      if (!c || !Number.isFinite(amount) || Math.abs(amount) > 10000) throw new HttpError(400, `Regio ${i + 1}: ongeldige correctie (${c || "leeg"}).`);
      regions.push({ from, to, amount: Math.round(amount * 100) / 100, label: d.slice(0, 80) });
    });

    const max = field(form, "max_km", 10), free = field(form, "free_above", 12), floor = field(form, "min_price", 12);
    await saveCheckoutSettings(ctx.db, {
      bands,
      minimums,
      regions,
      maxKm: max ? money(max, "Maximale afstand") || null : null,
      freeAbove: free ? money(free, "Gratis levering vanaf") || null : null,
      minPrice: floor ? money(floor, "Leveringsprijs nooit onder") || null : null,
      roundUp: field(form, "round") === "1",
    });
    return seeOther(ctx, "/checkout", "saved");
  }
  if (action === "rules") {
    const col = (k: string) => form.getAll(k).map((v) => String(v).trim());
    const [pos, status, label, when, value, coll, effect, amount] = ["r_pos", "r_status", "r_label", "r_when", "r_value", "r_coll", "r_effect", "r_amount"].map(col);
    const rows: (Rule & { pos: number })[] = [];
    status.forEach((st, i) => {
      if (st === "weg") return;
      if (!label[i] && !value[i] && !amount[i]) return; // empty row
      const w = when[i] as Rule["when"], e = effect[i] as Rule["effect"];
      if (!(w in RULE_WHEN) || !(e in RULE_EFFECT)) throw new HttpError(400, `Regel ${i + 1}: onbekende keuze.`);
      if (w === "collection" && !coll[i]) throw new HttpError(400, `Regel ${i + 1}: kies een collectie.`);
      if (!["always", "collection"].includes(w) && !value[i]) throw new HttpError(400, `Regel ${i + 1}: vul de waarde in bij "${RULE_WHEN[w]}".`);
      if (["add", "per_km", "percent", "discount"].includes(e) && !amount[i]) throw new HttpError(400, `Regel ${i + 1}: vul het bedrag in.`);
      rows.push({
        pos: Number(pos[i]) || i + 1,
        label: label[i].slice(0, 120),
        when: w,
        value: value[i] ? money(value[i], `Regel ${i + 1} waarde`) : 0,
        collection: coll[i] && COLLECTIONS.some((c) => c.handle === coll[i]) ? coll[i] : "",
        effect: e,
        amount: amount[i] ? money(amount[i], `Regel ${i + 1} bedrag`) : 0,
        active: st !== "uit",
      });
    });
    rows.sort((a, b) => a.pos - b.pos);
    await saveCheckoutSettings(ctx.db, { rules: rows.map(({ pos: _pos, ...r }) => r) });
    return seeOther(ctx, "/checkout", "saved");
  }
  if (action === "msp") {
    await saveCheckoutSettings(ctx.db, { mspMode: field(form, "msp_mode") === "live" ? "live" : "test" });
    return seeOther(ctx, "/checkout", "saved");
  }
  throw new HttpError(400, "Onbekende actie.");
}
