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
    "'Kastanje premium poorten' wordt in Vlaanderen meer gezocht dan 'Franse poorten'; de URL's blijven ongewijzigd.",
};

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

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** @param {string} value */
export function applyRenames(value) {
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
  if (typeof value === "string") return /** @type {T} */ (applyRenames(value));
  if (Array.isArray(value)) return /** @type {T} */ (value.map(renameDeep));
  if (value && typeof value === "object") {
    return /** @type {T} */ (
      Object.fromEntries(Object.entries(value).map(([key, child]) => [key, renameDeep(child)]))
    );
  }
  return value;
}
