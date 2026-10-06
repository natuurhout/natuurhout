import { getProduct, type Product, type ProductVariant } from "@/lib/catalog";
import type {
  CalculatorData,
  FenceOption,
  GateOption,
  GateSizeOpt,
  Opt,
  PlanterOption,
  PoleKind,
  PoleOption,
  PoleOpt,
  RollOpt,
  ScreenOption,
} from "@/lib/calculator-pricing";

/*
 * Afsluitingscalculator data — built ONLY from real natuurhout.shop variants
 * (prices verbatim). Variant titles encode the specs, e.g.
 *   "100cm / 4.5/5cm (5m rol)"  → height 100, spacing "4.5/5cm", roll 5m
 *   "180cm / 6-8cm"             → post length 180, diameter "6-8cm"
 *   "120cm / 150cm"             → gate height 120, width 150
 * What each gate includes comes from its own shop description.
 */

function opt(v: ProductVariant): Opt {
  return { variantId: v.id, title: v.title, price: parseFloat(v.price), available: v.available };
}

/* Fencing ---------------------------------------------------------- */

const FENCE_HANDLES = ["kastanje-rasterwerk", "robinia-hekwerk", "hazelaar-hekwerk"];

function parseRoll(v: ProductVariant): RollOpt | null {
  const m = v.title.match(/^(\d+)cm\s*\/\s*(.+?)\s*\((\d+)m rol\)/);
  if (!m) return null;
  return { ...opt(v), height: parseInt(m[1], 10), spacing: m[2], rollLength: parseInt(m[3], 10) };
}

function fenceOptions(): FenceOption[] {
  return FENCE_HANDLES.flatMap((handle) => {
    const product = getProduct(handle);
    if (!product) return [];
    const rolls = product.variants.map(parseRoll).filter((r): r is RollOpt => r !== null);
    return rolls.length ? [{ handle, title: product.title, shopUrl: product.shopUrl, rolls }] : [];
  });
}

/* Posts ------------------------------------------------------------ */

const POLE_SOURCES: { handle: string; kind: PoleKind }[] = [
  { handle: "palen", kind: "kastanje" },
  { handle: "kastanje-palen-copy", kind: "kastanje-postsaver" },
  { handle: "robinia-palen", kind: "robinia" },
  { handle: "eiken-palen", kind: "eiken" },
];

function parsePole(v: ProductVariant, options: string[]): PoleOpt | null {
  // "180cm / 6-8cm" (Lengte/Diameter), "6-8cm / 180cm" (Diameter/Lengte), "200cm / 10x10" (Lengte/Dikte)
  const parts = v.title.split("/").map((s) => s.trim());
  if (parts.length < 2) return null;
  const diameterFirst = /^(diameter|dikte)/i.test(options[0] ?? "");
  const lengthPart = diameterFirst ? parts[1] : parts[0];
  const diameterPart = diameterFirst ? parts[0] : parts.slice(1).join(" / ");
  const lm = lengthPart.match(/(\d+)\s*cm/);
  if (!lm) return null;
  const diameter = /^\d+(\.\d+)?x\d+(\.\d+)?$/.test(diameterPart) ? `${diameterPart}cm` : diameterPart;
  return { ...opt(v), length: parseInt(lm[1], 10), diameter };
}

function poleOptions(kinds: PoleKind[]): PoleOption[] {
  return POLE_SOURCES.filter((s) => kinds.includes(s.kind)).flatMap(({ handle, kind }) => {
    const product = getProduct(handle);
    if (!product) return [];
    const poles = product.variants
      .map((v) => parsePole(v, product.options))
      .filter((p): p is PoleOpt => p !== null)
      .sort((a, b) => a.length - b.length || a.price - b.price);
    return poles.length ? [{ handle, title: product.title, shopUrl: product.shopUrl, kind, poles }] : [];
  });
}

/* Gates ------------------------------------------------------------ */

const GATE_SOURCES: { handle: string; postsIncluded: boolean; fieldGate: boolean }[] = [
  // "inclusief 2 poortpalen en het hang- en sluitwerk"
  { handle: "kastanje-poorten", postsIncluded: true, fieldGate: false },
  { handle: "kastanje-poort-geschroefd", postsIncluded: true, fieldGate: false },
  // "Komt met hang- en sluitwerk en poortpalen."
  { handle: "kastanje-kaderpoort", postsIncluded: true, fieldGate: false },
  // "geleverd met stevige kastanje poortpalen en ... hang- en sluitwerk"
  { handle: "hazelaar-poort", postsIncluded: true, fieldGate: false },
  // "Inclusief: hang- en sluitwerk. Exclusief: steunpalen"
  { handle: "robinia-poort", postsIncluded: false, fieldGate: false },
  // Field gates: posts and hardware sold separately
  { handle: "cleft-field-poorten", postsIncluded: false, fieldGate: true },
  { handle: "hardhouten-veldpoort", postsIncluded: false, fieldGate: true },
];

function cm(value: string): number | null {
  const m = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*(cm|m)$/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  return Math.round(m[2].toLowerCase() === "m" ? n * 100 : n);
}

function parseGateSize(v: ProductVariant, product: Product): GateSizeOpt {
  const t = v.title;
  let height: number | null = null;
  let width: number | null = null;
  const pair = t.split(/\s*[\/x]\s*/i);
  if (pair.length === 2 && cm(pair[0]) !== null && cm(pair[1]) !== null) {
    // Options are "Hoogte","Breedte" or "Hoogte x breedte": height first.
    height = cm(pair[0]);
    width = cm(pair[1]);
  } else if (/breedte/i.test(product.options[0] ?? "")) {
    width = cm(t);
  }
  return { ...opt(v), height, width };
}

function gateOptions(): GateOption[] {
  return GATE_SOURCES.flatMap(({ handle, postsIncluded, fieldGate }) => {
    const product = getProduct(handle);
    if (!product) return [];
    const sizes = product.variants
      .map((v) => parseGateSize(v, product))
      .sort((a, b) => (a.height ?? 0) - (b.height ?? 0) || (a.width ?? 0) - (b.width ?? 0));
    return [{
      handle,
      title: product.title,
      shopUrl: product.shopUrl,
      image: product.images[0]?.src,
      postsIncluded,
      fieldGate,
      sizes,
    }];
  });
}

/* Screens, post & rail, planters, hardware -------------------------- */

const SCREEN_SOURCES = [
  { handle: "hazelaar-vlechtscherm-hasseltre", label: "Hazelaar vlechtscherm met halve latten" },
  { handle: "hazelaar-scherm-trepanel", label: "Hazelaar vlechtscherm (gevlochten)" },
];

function screenOptions(): ScreenOption[] {
  return SCREEN_SOURCES.flatMap(({ handle, label }) => {
    const product = getProduct(handle);
    if (!product) return [];
    const sizes = product.variants.flatMap((v) => {
      const m = v.title.match(/^(\d+)cm\s*x\s*(\d+)cm$/i);
      return m ? [{ ...opt(v), height: parseInt(m[1], 10), width: parseInt(m[2], 10) }] : [];
    });
    return sizes.length ? [{ handle, title: product.title, label, shopUrl: product.shopUrl, sizes }] : [];
  });
}

function postRailPrices(): CalculatorData["postRail"] {
  const product = getProduct("post-rail-omheining");
  if (!product) return null;
  const find = (re: RegExp) => product.variants.find((v) => re.test(v.title));
  const post2 = find(/post 2/i);
  const post3 = find(/post 3/i);
  const rail = find(/rail/i);
  if (!post2 || !post3 || !rail) return null;
  return { post2: opt(post2), post3: opt(post3), rail: opt(rail), shopUrl: product.shopUrl };
}

const PLANTER_HANDLES = ["tuinbakken-hazelaar", "plantenbak-cortenstaal"];

function planterOptions(): PlanterOption[] {
  return PLANTER_HANDLES.flatMap((handle) => {
    const product = getProduct(handle);
    if (!product) return [];
    return [{ handle, title: product.title, shopUrl: product.shopUrl, sizes: product.variants.map(opt) }];
  });
}

function fieldGateHardware(): CalculatorData["fieldGateHardware"] {
  const product = getProduct("beslag-hang-sluitwerk");
  if (!product) return null;
  const hinges = product.variants.find((v) => /scharnieren set - veldpoort/i.test(v.title));
  const latch = product.variants.find((v) => /sluiting veldpoort met pen/i.test(v.title));
  if (!hinges || !latch) return null;
  return { hinges: opt(hinges), latch: opt(latch), shopUrl: product.shopUrl };
}

export function calculatorData(): CalculatorData {
  return {
    fences: fenceOptions(),
    // Fencing: chestnut, chestnut with postsaver, robinia. Oak only for screens.
    fencePoles: poleOptions(["kastanje", "kastanje-postsaver", "robinia"]),
    screenPoles: poleOptions(["kastanje", "kastanje-postsaver", "robinia", "eiken"]),
    // Gates without posts: round chestnut (postsaver optional) or square oak.
    gatePoles: poleOptions(["kastanje", "eiken"]),
    gates: gateOptions(),
    screens: screenOptions(),
    postRail: postRailPrices(),
    planters: planterOptions(),
    fieldGateHardware: fieldGateHardware(),
  };
}
