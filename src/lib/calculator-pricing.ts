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

export type PoleKind = "kastanje" | "kastanje-postsaver" | "robinia" | "eiken";
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

/** Surcharge per gate post for a postsaver fitted by Natuurhout, by post diameter. */
export const GATE_POSTSAVER_SURCHARGE: Record<string, number> = {
  "6-8cm": 3.2,
  "8-10cm": 4.0,
  "10-12cm": 4.7,
};

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

/** Fence posts for one straight run: one every 2 m plus the end post. */
export function fencePostsFor(meters: number): number {
  if (!(meters > 0)) return 0;
  return Math.ceil(meters / 2 - 1e-9) + 1;
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
  return key in GATE_POSTSAVER_SURCHARGE ? key : null;
}

/** Recommended post length for a fence height: the first stocked length at least 30 cm longer. */
export function recommendedPole(poles: PoleOpt[], fenceHeightCm: number): PoleOpt | undefined {
  const fit = poles.filter((p) => p.available && p.length >= fenceHeightCm + 30).sort((a, b) => a.length - b.length || a.price - b.price);
  return fit[0] ?? poles.find((p) => p.available) ?? poles[0];
}
