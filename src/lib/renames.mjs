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
    "Nov 2026: geen emoji's op de pagina's in EMOJI_FREE (hazelaar hekwerk).",
};

/*
 * Pages (WordPress pathname) and webshop products (handle) shown without
 * emoji (Xander, Nov 2026: "haal de emoji weg"). Only the emoji go, with the
 * space after them; every word stays.
 */
export const EMOJI_FREE = new Set(["/project/hazelaarrasterwerk/", "hazelaar-hekwerk"]);
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\u{FE0F}?[ \u00A0]?/gu;

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
export function applyRenames(value) {
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
export function renameDeep(value, noEmoji = false) {
  if (typeof value === "string") {
    const renamed = applyRenames(value);
    return /** @type {T} */ (noEmoji ? stripEmoji(renamed) : renamed);
  }
  if (Array.isArray(value)) return /** @type {T} */ (value.map((child) => renameDeep(child, noEmoji)));
  if (value && typeof value === "object") {
    // A page or product listed in EMOJI_FREE: everything inside it loses its emoji.
    const record = /** @type {Record<string, unknown>} */ (value);
    const strip = noEmoji || EMOJI_FREE.has(String(record.pathname ?? "")) || EMOJI_FREE.has(String(record.handle ?? ""));
    return /** @type {T} */ (
      Object.fromEntries(Object.entries(record).map(([key, child]) => [key, renameDeep(child, strip)]))
    );
  }
  return value;
}
