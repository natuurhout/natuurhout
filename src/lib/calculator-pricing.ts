/*
 * Afsluitingscalculator — pricing rules and shared types.
 *
 * Client-safe: no catalogue import here, so the wizard can bundle it. The
 * server page turns natuurhout.shop variants into the option types below
 * (prices verbatim); everything Xander set by hand lives in the constants.
 * Every total is a "richtprijs" — the quote and the webshop are binding.
 */

export type Opt = {
  variantId: number;
  title: string;
  price: number;
  available: boolean;
};

export type RollOpt = Opt & { height: number; spacing: string; rollLength: number };
export type FenceOption = { handle: string; title: string; shopUrl: string; rolls: RollOpt[] };

export type PoleKind = "kastanje" | "kastanje-postsaver" | "robinia" | "robinia-gezaagd" | "eiken";

/** Square posts (sawn robinia, oak): sizes read "7x7cm", not "ø6-8cm". */
export function isSquarePost(kind: PoleKind): boolean {
  return kind === "eiken" || kind === "robinia-gezaagd";
}
export type PoleOpt = Opt & { length: number; diameter: string };
export type PoleOption = { handle: string; title: string; shopUrl: string; kind: PoleKind; poles: PoleOpt[] };

export type GateSizeOpt = Opt & { height: number | null; width: number | null };
export type GateOption = {
  handle: string;
  title: string;
  shopUrl: string;
  image?: string;
  /** Posts come with the gate (shop text: "inclusief 2 poortpalen"). */
  postsIncluded: boolean;
  /** Field gates are sold without hinges and latch; the calculator adds the shop's veldpoort set. */
  fieldGate: boolean;
  sizes: GateSizeOpt[];
};

export type ScreenOpt = Opt & { height: number; width: number };
export type ScreenOption = { handle: string; title: string; label: string; shopUrl: string; sizes: ScreenOpt[] };

export type PlanterOption = { handle: string; title: string; shopUrl: string; sizes: Opt[] };

export type PostRailPrices = { post2: Opt; post3: Opt; rail: Opt; shopUrl: string };
/** Field gates ship bare: the customer picks hinges, a latch and ground pins from the shop's beslag. */
export type FieldGateHardware = { hinges: Opt; latches: Opt[]; groundPin: Opt | null; shopUrl: string };
/** Loose postsavers to fit yourself, by round-post diameter key ("8-10cm"). */
export type LoosePostsavers = { byKey: Record<string, Opt>; shopUrl: string };

export type CalculatorData = {
  fences: FenceOption[];
  fencePoles: PoleOption[];
  screenPoles: PoleOption[];
  gatePoles: PoleOption[];
  gates: GateOption[];
  screens: ScreenOption[];
  postRail: PostRailPrices | null;
  planters: PlanterOption[];
  fieldGateHardware: FieldGateHardware | null;
  loosePostsavers: LoosePostsavers | null;
};

/* ------------------------------------------------------------------ */
/* Rules set by Natuurhout (not shop data)                             */
/* ------------------------------------------------------------------ */

export { OAK_WITH_POSTSAVER, POSTSAVER_FITTING } from "@/lib/price-updates";

/** Robinia paal met postsaver: the chestnut price with a postsaver plus this. */
export const ROBINIA_POSTSAVER_EXTRA = 1;

/** Postsaver fitted on a sawn robinia post (7x7 or 8x8 cm), any length. */
export const SAWN_ROBINIA_POSTSAVER = 9.95;

/**
 * Postsaver sleeve sizes, by round-post diameter (the webshop's loose
 * postsavers). Fitted by Natuurhout it costs the sleeve plus POSTSAVER_FITTING.
 */
export const POSTSAVER_KEYS = ["6-8cm", "8-10cm", "10-12cm"];

/** Sawn robinia posts (7x7, 8x8 cm) take the 120 mm sleeve. */
export const SQUARE_POSTSAVER_KEY = "10-12cm";

/** Vlechtschermen: a post of about 10 cm between the screens and at both ends. */
export const SCREEN_POST_CM = 10;

/** Black instead of galvanised hardware, per gate leaf. */
export const BLACK_HARDWARE_SURCHARGE = 15.5;

/** A single or a double gate hangs between two posts either way. */
export const POSTS_PER_GATE = 2;

/** Made-to-measure gate limits (cm). */
export const CUSTOM_GATE_MAX_WIDTH = 210;
export const CUSTOM_GATE_MAX_HEIGHT = 180;
export const CUSTOM_GATE_MIN = 50;

/**
 * Franse maatwerkpoorten price list, verbatim from /project/maatwerk-poorten/
 * (incl. kastanje plantpalen and hang- en sluitwerk). Rows are widths, columns
 * heights, both in cm. Note: 180 wide × 100 high is listed at €233, below the
 * 150-wide price — kept as published.
 */
export const CUSTOM_GATE_HEIGHTS = [100, 120, 150, 180];
export const CUSTOM_GATE_TABLE: { width: number; prices: number[] }[] = [
  { width: 100, prices: [205, 219, 235, 255] },
  { width: 120, prices: [219, 235, 255, 275] },
  { width: 150, prices: [235, 255, 275, 295] },
  { width: 180, prices: [233, 275, 295, 315] },
  { width: 200, prices: [265, 285, 305, 325] },
  { width: 210, prices: [279, 299, 319, 339] },
];

/** Post & Rail, from /project/post-rail-2/: a rail is 2.90 m; peeled costs €1.50 extra per post and per rail. */
export const RAIL_LENGTH_M = 2.9;
export const PEELED_SURCHARGE = 1.5;

/* ------------------------------------------------------------------ */
/* Calculations                                                        */
/* ------------------------------------------------------------------ */

/** Rolls needed for a run: whole rolls, at least one. */
export function rollsFor(meters: number, rollLength: number): number {
  if (!(meters > 0) || !(rollLength > 0)) return 0;
  return Math.max(1, Math.ceil(meters / rollLength - 1e-9));
}

/**
 * Post spacing Natuurhout recommends (Xander): about 1.80 m, about 1.50 m
 * for fencing from 1.50 m high, never more than 2 m. Soft ground needs the
 * posts closer together.
 */
export const POST_SPACING_M = 1.8;
export const HIGH_FENCE_POST_SPACING_M = 1.5;
export const HIGH_FENCE_FROM_CM = 150;
export const MAX_POST_SPACING_M = 2;

export function postSpacingFor(heightCm: number | null | undefined): number {
  return heightCm && heightCm >= HIGH_FENCE_FROM_CM ? HIGH_FENCE_POST_SPACING_M : POST_SPACING_M;
}

/** Fence posts for one straight run: one every postSpacingFor(height) plus the end post. */
export function fencePostsFor(meters: number, heightCm?: number | null): number {
  if (!(meters > 0)) return 0;
  return Math.ceil(meters / postSpacingFor(heightCm) - 1e-9) + 1;
}

/** Length of a row of screens with a post between them and at both ends (cm). */
export function screenRunCm(count: number, screenWidthCm: number): number {
  if (!(count > 0)) return 0;
  return count * screenWidthCm + (count + 1) * SCREEN_POST_CM;
}

/** Screens in a run, and the posts between and around them. */
export function screensFor(meters: number, screenWidthCm: number): number {
  if (!(meters > 0) || !(screenWidthCm > 0)) return 0;
  return Math.max(1, Math.ceil((meters * 100) / screenWidthCm - 1e-9));
}

/**
 * Post & Rail quantities. Every corner starts a new straight stretch whose
 * last section is rounded up on its own, so it costs one extra section.
 */
export function postRailFor(meters: number, corners: number, rails: 2 | 3) {
  if (!(meters > 0)) return { sections: 0, posts: 0, rails: 0 };
  const turns = Math.max(0, Math.floor(corners));
  const sections = Math.ceil(meters / RAIL_LENGTH_M - 1e-9) + turns;
  return { sections, posts: sections + 1, rails: sections * rails };
}

/**
 * Price of a made-to-measure gate leaf: the smallest listed size that fits.
 * Returns null when it is larger than the price list covers (quote on request).
 */
export function customGatePrice(widthCm: number, heightCm: number): { price: number; width: number; height: number } | null {
  if (!(widthCm > 0) || !(heightCm > 0)) return null;
  const heightIndex = CUSTOM_GATE_HEIGHTS.findIndex((h) => h >= heightCm);
  const row = CUSTOM_GATE_TABLE.find((r) => r.width >= widthCm);
  if (heightIndex < 0 || !row) return null;
  return { price: row.prices[heightIndex], width: row.width, height: CUSTOM_GATE_HEIGHTS[heightIndex] };
}

export function validateCustomGate(widthCm: number, heightCm: number): string | null {
  if (!Number.isFinite(widthCm) || !Number.isFinite(heightCm) || widthCm <= 0 || heightCm <= 0) {
    return "Vul een breedte en hoogte in.";
  }
  if (widthCm < CUSTOM_GATE_MIN || heightCm < CUSTOM_GATE_MIN) return `Minimaal ${CUSTOM_GATE_MIN} cm.`;
  if (widthCm > CUSTOM_GATE_MAX_WIDTH) return `De breedte kan maximaal ${formatMeters(CUSTOM_GATE_MAX_WIDTH)} zijn.`;
  if (heightCm > CUSTOM_GATE_MAX_HEIGHT) return `De hoogte kan maximaal ${formatMeters(CUSTOM_GATE_MAX_HEIGHT)} zijn.`;
  return null;
}

/** 220 → "2,20 m" */
export function formatMeters(cm: number): string {
  return `${(cm / 100).toFixed(2).replace(".", ",")} m`;
}

/** "8-10cm" style diameter key of a post title, if it is one we price postsavers for. */
export function postsaverKey(diameter: string): string | null {
  const m = diameter.replace(/\s+/g, "").match(/(\d+)-(\d+)cm/);
  if (!m) return null;
  const key = `${m[1]}-${m[2]}cm`;
  return POSTSAVER_KEYS.includes(key) ? key : null;
}

/** Round fence posts: Natuurhout always advises ø 8-10 cm (ø 6-8 cm serves as a strut). */
const ADVISED_ROUND_DIAMETER = /^8-10/;

/**
 * Post length Natuurhout advises per fence height, in cm (Xander): a third
 * or so in the ground. For 150 cm fencing 200 cm will do, 250 cm is sturdier.
 */
export const ADVISED_POST_LENGTH: [fenceCm: number, postCm: number][] = [
  [60, 100],
  [80, 120],
  [90, 150],
  [100, 150],
  [120, 180],
  [150, 200],
  [180, 250],
];

/** The advised post length for a fence (or screen) height; between the listed heights, the next one up. */
export function advisedPostLength(heightCm: number): number {
  return ADVISED_POST_LENGTH.find(([fence]) => fence >= heightCm)?.[1] ?? heightCm + 70;
}

/** Recommended post: the advised length (or the next stocked one up), ø 8-10 cm where round. */
export function recommendedPole(poles: PoleOpt[], fenceHeightCm: number): PoleOpt | undefined {
  const target = advisedPostLength(fenceHeightCm);
  const fit = poles.filter((p) => p.available && p.length >= target).sort((a, b) => a.length - b.length || a.price - b.price);
  // None long enough in stock (e.g. sawn robinia, 160–180 cm): the longest there is.
  const longest = poles.filter((p) => p.available).sort((a, b) => b.length - a.length);
  return (
    fit.find((p) => ADVISED_ROUND_DIAMETER.test(p.diameter)) ??
    fit[0] ??
    longest[0] ??
    poles[0]
  );
}
