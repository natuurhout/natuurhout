import {
  getProduct,
  type Product,
  type ProductVariant,
} from "@/lib/catalog";

/*
 * Afsluitingscalculator data — built ONLY from real natuurhout.shop variants
 * (prices verbatim). Variant titles encode the specs, e.g.
 *   "100cm / 4.5/5cm (5m rol)"  → height 100, spacing "4.5/5cm", roll 5m
 *   "180cm / 6-8cm"             → paal length 180, diameter "6-8cm"
 * The calculator produces an indicative total ("richtprijs"); ordering and
 * stock always happen in the webshop.
 */

export type RollVariant = {
  variant: ProductVariant;
  height: number; // cm
  spacing: string; // e.g. "4.5/5cm"
  rollLength: number; // meters per roll
};

export type FenceProduct = {
  product: Product;
  rolls: RollVariant[];
};

export type PoleVariant = {
  variant: ProductVariant;
  length: number; // cm
  diameter: string; // e.g. "8-10cm"
};

export type PoleProduct = {
  product: Product;
  poles: PoleVariant[];
};

const FENCE_HANDLES = [
  "kastanje-rasterwerk", // Kastanje Hekwerk
  "hazelaar-hekwerk", // Hazelaar Hekwerk
  "robinia-hekwerk", // Robinia Hekwerk
];

const POLE_HANDLES = [
  "palen", // Kastanje Palen
  "kastanje-palen-copy", // Kastanje paal met postsaver
  "vierkant-gezaagde-robinia-palen", // Gezaagde robinia palen
  "eiken-palen", // Eiken palen
];

const GATE_HANDLES = [
  "kastanje-poort-geschroefd",
  "kastanje-poorten",
  "hazelaar-poort",
  "robinia-poort",
  "cleft-field-poorten",
  "kastanje-kaderpoort",
];

function parseRoll(v: ProductVariant): Omit<RollVariant, "variant"> | null {
  // "100cm / 4.5/5cm (5m rol)"
  const m = v.title.match(/^(\d+)cm\s*\/\s*(.+?)\s*\((\d+)m rol\)/);
  if (!m) return null;
  return { height: parseInt(m[1], 10), spacing: m[2], rollLength: parseInt(m[3], 10) };
}

function parsePole(v: ProductVariant, optionsOrder: string[]): Omit<PoleVariant, "variant"> | null {
  // "180cm / 6-8cm" (Lengte/Diameter) or "6-8cm / 180cm" (Diameter/Lengte)
  const parts = v.title.split("/").map((s) => s.trim());
  if (parts.length < 2) return null;
  const diameterFirst = optionsOrder[0]?.toLowerCase().startsWith("diameter");
  const lenPart = diameterFirst ? parts[1] : parts[0];
  const diaPart = diameterFirst ? `${parts[0]}` : parts.slice(1).join(" / ");
  const lm = lenPart.match(/(\d+)\s*cm/);
  if (!lm) return null;
  return { length: parseInt(lm[1], 10), diameter: diaPart };
}

export function fenceProducts(): FenceProduct[] {
  return FENCE_HANDLES.flatMap((h) => {
    const product = getProduct(h);
    if (!product) return [];
    const rolls = product.variants
      .map((variant) => {
        const parsed = parseRoll(variant);
        return parsed ? { variant, ...parsed } : null;
      })
      .filter((r): r is RollVariant => r !== null);
    return rolls.length ? [{ product, rolls }] : [];
  });
}

export function poleProducts(): PoleProduct[] {
  return POLE_HANDLES.flatMap((h) => {
    const product = getProduct(h);
    if (!product) return [];
    const poles = product.variants
      .map((variant) => {
        const parsed = parsePole(variant, product.options);
        return parsed ? { variant, ...parsed } : null;
      })
      .filter((r): r is PoleVariant => r !== null);
    return poles.length ? [{ product, poles }] : [];
  });
}

export function gateProducts(): Product[] {
  return GATE_HANDLES.map((h) => getProduct(h)).filter(
    (p): p is Product => Boolean(p)
  );
}

export function postsaverProduct(): Product | undefined {
  return getProduct("kastanje-paal-met-postsaver");
}
