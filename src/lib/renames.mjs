/*
 * Approved product renames, applied to the frozen WordPress content when it is
 * rendered (the snapshot and legacy-pages.json stay untouched). The built
 * parity audit applies the same rules to the snapshot before comparing, so
 * these are the only text changes it lets through.
 *
 * Plain JavaScript so both the Next.js app and scripts/audit-built-parity.mjs
 * can import it.
 */

export const RENAMES_APPROVAL = {
  approvedBy: "Xander",
  reason:
    "'Kastanje premium poorten' wordt in Vlaanderen meer gezocht dan 'Franse poorten'; de URL's blijven ongewijzigd. " +
    "Oct 2026: deze website vervangt natuurhout.shop, dus de link 'www.natuurhout.shop – voor rechtstreekse bestelling' " +
    "wijst naar de shop op deze site (natuurhout.be/shop). " +
    "Nov 2026: geen emoji's op de website (Google Ads weigert ze, ze helpen SEO niet en ogen onprofessioneel); " +
    "het vinkje ✓ is een gewoon tekstteken en blijft. " +
    "Nov 2026 (SEO batch 1): hazelaar gaat overal 'ongeveer 10 jaar' mee, zoals op de rest van de site; de oude teksten zeiden 8 tot 15 jaar. " +
    "25 Nov 2026: bij de blogberichten staat 'Natuurhout' als schrijver, niet meer aziz, syto of Sebastiaan Dijkstra; " +
    "het uittreksel van 'Kastanjes bewaren' volgt de herschreven blog.",
};

/*
 * Facts corrected in the frozen text (Xander, Nov 2026), so every page says the
 * same: hazelaar lasts about 10 years.
 */
const FACT_RULES = [
  ["levensduur ± 8 tot 15 jaar", "levensduur ± 10 jaar"],
  ["gemiddeld 8 tot 15 jaar", "gemiddeld 10 jaar"],
];

/*
 * No emoji anywhere on the website (Xander, Nov 2026: "haal ze overal weg"),
 * in the snapshot and in the webshop copy alike. Only the emoji go, with the
 * space after them; every word stays. The check mark ✓ (U+2713) is a plain
 * text symbol (the "✓ FSC®- en PEFC-gecertificeerd hout" lists) and stays.
 */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{2712}\u{2714}-\u{27BF}]\u{FE0F}?[ \u00A0]?/gu;

/** @param {string} value */
export function stripEmoji(value) {
  return value.replace(EMOJI, "");
}

// Longest phrases first: each rule only sees what earlier rules left over.
// Only the gate names change; "franse uitvoering" (the French-style fencing)
// and URL slugs (franse-poorten, with a hyphen) never match.
const RULES = [
  ["Franse premium kastanje poorten", "Kastanje premium poorten"],
  ["Franse Maatwerk Poorten", "Kastanje Premium Maatwerk Poorten"],
  ["Franse Maatwerk poorten", "Kastanje premium maatwerk poorten"],
  ["Franse Poorten Maatwerk", "Kastanje Premium Maatwerk Poorten"],
  ["Franse Poorten Premium", "Kastanje Premium Poorten"],
  ["premium Franse poorten", "kastanje premium poorten"],
  ["Franse Kastanje Poorten", "Kastanje Premium Poorten"],
  ["Franse kastanje houten poorten", "kastanje premium poorten"],
  ["Franse kastanje poorten", "kastanje premium poorten"],
  ["kastanje Franse poorten", "kastanje premium poorten"],
  ["Franse tuinpoorten", "kastanje premium poorten"],
  ["Franse Poorten", "Kastanje Premium Poorten"],
  ["Franse poorten", "kastanje premium poorten"],
];

// This site replaces natuurhout.shop: the blog's link to it opens the shop here.
const SHOP_RULES = [
  ['href="https://www.natuurhout.shop/"', 'href="/shop/"'],
  [">www.natuurhout.shop</a>", ">natuurhout.be/shop</a>"],
];

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** @param {string} value */
/*
 * Blog authors (Xander, 25 Nov 2026: "verander het gewoon allemaal naar
 * Natuurhout"): the WordPress author links (aziz, syto, Sebastiaan Dijkstra)
 * become plain "Natuurhout".
 */
const AUTHOR_LINK = /<a href="\/author\/[a-z-]+\/" rel="author">[^<]*<\/a>/g;

/* Excerpts of rewritten blog posts on the listing pages. */
const EXCERPT_RULES = [
  [
    "Kastanjes zijn vrij kwetsbaar en hebben wat aandacht nodig om goed bewaard te worden. Het is zonde als ze beschimmeld of uitgedroogd raken. Ongepelde kastanjes kunnen op een droge plaats...",
    "Kastanjes bewaren in de koelkast, diepvries of gedroogd: zo blijven ze lekker. Plus tips om ze te bereiden en het verschil met de paardenkastanje.",
  ],
];

export function applyRenames(value) {
  if (value && value.includes('rel="author"')) value = value.replace(AUTHOR_LINK, "Natuurhout");
  if (value && value.includes("Ongepelde kastanjes kunnen op een droge plaats...")) {
    for (const [from, to] of EXCERPT_RULES) value = value.split(from).join(to);
  }
  if (value && value.includes("8 tot 15 jaar")) {
    for (const [from, to] of FACT_RULES) value = value.split(from).join(to);
  }
  if (value && value.includes("natuurhout.shop")) {
    for (const [from, to] of SHOP_RULES) value = value.split(from).join(to);
  }
  if (!value || !value.includes("Franse")) return value;
  let out = value;
  for (const [from, to] of RULES) {
    // Capitalise at the start of the text or of a sentence.
    out = out.replace(new RegExp(`([.!?]\\s+)?${escape(from)}`, "g"), (_, start, offset) =>
      start || offset === 0 ? `${start ?? ""}${to[0].toUpperCase()}${to.slice(1)}` : to,
    );
  }
  return out;
}

/**
 * Applies the renames to every string in a JSON-like value.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function renameDeep(value) {
  if (typeof value === "string") return /** @type {T} */ (stripEmoji(applyRenames(value)));
  if (Array.isArray(value)) return /** @type {T} */ (value.map(renameDeep));
  if (value && typeof value === "object") {
    return /** @type {T} */ (
      Object.fromEntries(Object.entries(value).map(([key, child]) => [key, renameDeep(child)]))
    );
  }
  return value;
}
