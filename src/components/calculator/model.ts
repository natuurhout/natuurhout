import { formatPrice } from "@/lib/catalog";
import { orderTerm } from "@/lib/made-to-order";
import { MAATWERK_POORT, customGateVariantId } from "@/lib/order-only-products";
import {
  BLACK_HARDWARE_SURCHARGE,
  OAK_WITH_POSTSAVER,
  PEELED_SURCHARGE,
  POSTSAVER_FITTING,
  POSTS_PER_GATE,
  ROBINIA_POSTSAVER_EXTRA,
  SAWN_ROBINIA_POSTSAVER,
  SCREEN_POST_CM,
  SQUARE_POSTSAVER_KEY,
  customGatePrice,
  fencePostsFor,
  formatMeters,
  isSquarePost,
  postRailFor,
  postsaverKey,
  recommendedPole,
  rollsFor,
  screenRunCm,
  validateCustomGate,
  type CalculatorData,
  type GateOption,
  type Opt,
  type PoleOpt,
  type PickType,
  type PoleKind,
  type PoleOption,
} from "@/lib/calculator-pricing";

/*
 * Wizard state and the priced material list it produces. Pure functions,
 * no React: the component renders this, the quote e-mail serialises it.
 */

export type ProductType = "hekwerk" | "vlechtschermen" | "postrail" | "poorten" | "cleftfield" | "plantenbakken" | PickType;
export type StepId =
  | "keuze"
  | "hekwerk"
  | "vlechtschermen"
  | "postrail"
  | "palen"
  | "poort"
  | "plantenbakken"
  | "pick-palen"
  | "pick-lariks"
  | "pick-hangsluitwerk"
  | "pick-materiaal"
  | "overzicht";

/** The products picked by the piece, in the order of their steps (Xander, Nov 2026). */
export const PICK_TYPES: PickType[] = ["palen", "lariks", "hangsluitwerk", "materiaal"];
export const PICK_LABEL: Record<PickType, string> = {
  palen: "Losse palen",
  lariks: "Lariks schaaldelen",
  hangsluitwerk: "Hang- en sluitwerk",
  materiaal: "Plaatsingsmateriaal",
};
export const pickStep = (type: PickType) => `pick-${type}` as StepId;
export const isPickType = (t: string): t is PickType => (PICK_TYPES as string[]).includes(t);

export const CUSTOM_GATE = "maatwerk";
export const CLEFT_FIELD = "cleft-field-poorten";

export type FenceLine = {
  id: number;
  handle: string;
  height: number | null;
  variantId: number | null;
  meters: number;
  rolls: number | null; // null = recommended
};

export type PoleLine = {
  id: number;
  handle: string;
  variantId: number | null; // null = recommended for the fence height
  count: number | null; // null = recommended (first line only)
  saver: SaverMode;
};

/** Postsaver on posts: none, fitted by Natuurhout, or loose to fit yourself. */
export type SaverMode = "none" | "mounted" | "loose";

export type Gate = {
  id: number;
  handle: string | null;
  height: number | null;
  variantId: number | null;
  customWidth: string;
  customHeight: string;
  leaves: 1 | 2;
  hinge: "links" | "rechts";
  opens: "binnen" | "buiten";
  saver: SaverMode;
  saverKey: string; // post diameter for gates whose posts are included
  poleHandle: string | null; // gates without posts
  poleVariantId: number | null;
  hinges: boolean; // field gates: add the hinge set
  latch: number | "none" | null; // field gates: null = the shop's first veldpoort latch
  groundPins: number; // field gates
  black: boolean;
};

export type State = {
  types: ProductType[];
  fences: FenceLine[];
  screen: { handle: string; variantId: number | null; count: number };
  postRail: { rails: 2 | 3; meters: number; corners: number; peeled: boolean };
  poles: PoleLine[];
  gates: Gate[];
  planters: Record<number, number>; // variantId → quantity
  picks: Record<number, number>; // variantId → quantity (losse palen, lariks, hang- en sluitwerk, materiaal)
  contact: {
    name: string;
    email: string;
    phone: string;
    delivery: boolean;
    street: string;
    postcode: string;
    city: string;
    remarks: string;
  };
};

let nextId = 1;
export const newId = () => nextId++;

export function newFenceLine(data: CalculatorData, handle?: string, avoidHeight?: number | null): FenceLine {
  const fence = data.fences.find((f) => f.handle === handle) ?? data.fences[0];
  const heights = fence ? [...new Set(fence.rolls.map((r) => r.height))].sort((a, b) => a - b) : [];
  const height = heights.find((h) => h !== avoidHeight && h >= 100) ?? heights.find((h) => h !== avoidHeight) ?? heights[0] ?? null;
  return { id: newId(), handle: fence?.handle ?? "", height, variantId: null, meters: 10, rolls: null };
}

export function newGate(handle: string | null = null): Gate {
  return {
    id: newId(),
    handle,
    height: null,
    variantId: null,
    customWidth: "",
    customHeight: "",
    leaves: 1,
    hinge: "rechts",
    opens: "binnen",
    saver: "none",
    saverKey: "8-10cm",
    poleHandle: null,
    poleVariantId: null,
    hinges: true,
    latch: null,
    groundPins: 0,
    black: false,
  };
}

// "cleftfield" stays for old ?keuze= links; the Cleft & Field gate is a choice under Poorten.
export const PRODUCT_TYPES: ProductType[] = ["hekwerk", "vlechtschermen", "postrail", "poorten", "cleftfield", "plantenbakken", ...PICK_TYPES];

/** Switches one product type on or off, with the gates that type implies. */
export function toggleType(s: State, id: ProductType): State {
  const on = !s.types.includes(id);
  const types = on ? [...s.types, id] : s.types.filter((t) => t !== id);
  let gates = s.gates;
  if (id === "cleftfield") {
    gates = on
      ? gates.some((g) => g.handle === CLEFT_FIELD) ? gates : [...gates.filter((g) => g.handle), newGate(CLEFT_FIELD)]
      : gates.filter((g) => g.handle !== CLEFT_FIELD);
  }
  if (id === "poorten" && on && gates.length === 0) gates = [newGate()];
  return { ...s, types, gates };
}

export function initialState(data: CalculatorData): State {
  return {
    types: [],
    fences: [newFenceLine(data)],
    screen: { handle: data.screens[0]?.handle ?? "", variantId: null, count: 4 },
    postRail: { rails: 3, meters: 20, corners: 0, peeled: false },
    poles: [{ id: newId(), handle: data.fencePoles[0]?.handle ?? "", variantId: null, count: null, saver: "none" }],
    gates: [],
    planters: {},
    picks: {},
    contact: { name: "", email: "", phone: "", delivery: false, street: "", postcode: "", city: "", remarks: "" },
  };
}

export function steps(types: ProductType[]): StepId[] {
  const has = (t: ProductType) => types.includes(t);
  const out: StepId[] = ["keuze"];
  if (has("hekwerk")) out.push("hekwerk");
  if (has("vlechtschermen")) out.push("vlechtschermen");
  if (has("postrail")) out.push("postrail");
  if (has("hekwerk") || has("vlechtschermen")) out.push("palen");
  if (has("hekwerk") || has("poorten") || has("cleftfield")) out.push("poort");
  if (has("plantenbakken")) out.push("plantenbakken");
  for (const t of PICK_TYPES) if (has(t)) out.push(pickStep(t));
  out.push("overzicht");
  return out;
}

export const STEP_LABEL: Record<StepId, string> = {
  keuze: "Uw keuze",
  hekwerk: "Hekwerk",
  vlechtschermen: "Vlechtschermen",
  postrail: "Post & Rail",
  palen: "Palen",
  poort: "Poort",
  plantenbakken: "Plantenbakken",
  "pick-palen": PICK_LABEL.palen,
  "pick-lariks": PICK_LABEL.lariks,
  "pick-hangsluitwerk": PICK_LABEL.hangsluitwerk,
  "pick-materiaal": PICK_LABEL.materiaal,
  overzicht: "Overzicht & offerte",
};

/* Resolvers ---------------------------------------------------------- */

export function fenceRoll(data: CalculatorData, line: FenceLine) {
  const fence = data.fences.find((f) => f.handle === line.handle) ?? data.fences[0];
  if (!fence) return null;
  const options = fence.rolls.filter((r) => r.height === line.height);
  const roll =
    options.find((r) => r.variantId === line.variantId) ?? options.find((r) => r.available) ?? options[0] ?? null;
  return roll ? { fence, roll, options } : null;
}

export function fenceRollCount(data: CalculatorData, line: FenceLine): number {
  const resolved = fenceRoll(data, line);
  if (!resolved) return 0;
  return line.rolls ?? rollsFor(line.meters, resolved.roll.rollLength);
}

export function screenResolved(data: CalculatorData, state: State) {
  const option = data.screens.find((s) => s.handle === state.screen.handle) ?? data.screens[0];
  if (!option) return null;
  const size =
    option.sizes.find((s) => s.variantId === state.screen.variantId) ??
    option.sizes.find((s) => s.available) ??
    option.sizes[0];
  if (!size) return null;
  const count = Math.max(0, Math.floor(state.screen.count));
  return { option, size, count, lengthCm: screenRunCm(count, size.width) };
}

export function poleOptionsFor(data: CalculatorData, state: State): PoleOption[] {
  return state.types.includes("vlechtschermen") ? data.screenPoles : data.fencePoles;
}

/** The tallest thing the posts have to carry: fence rolls or screens. */
export function tallestHeight(data: CalculatorData, state: State): number {
  const heights: number[] = [];
  if (state.types.includes("hekwerk")) for (const line of state.fences) if (line.height) heights.push(line.height);
  if (state.types.includes("vlechtschermen")) {
    const s = screenResolved(data, state);
    if (s) heights.push(s.size.height);
  }
  return heights.length ? Math.max(...heights) : 100;
}

export function recommendedPoleCount(data: CalculatorData, state: State): number {
  let total = 0;
  if (state.types.includes("hekwerk")) for (const line of state.fences) total += fencePostsFor(line.meters, line.height);
  if (state.types.includes("vlechtschermen")) {
    const s = screenResolved(data, state);
    if (s && s.count > 0) total += s.count + 1;
  }
  return total;
}

export function poleResolved(data: CalculatorData, state: State, line: PoleLine, index: number) {
  const options = poleOptionsFor(data, state);
  const product = options.find((p) => p.handle === line.handle) ?? options[0];
  if (!product) return null;
  const pole =
    product.poles.find((p) => p.variantId === line.variantId) ?? recommendedPole(product.poles, tallestHeight(data, state));
  if (!pole) return null;
  const count = line.count ?? (index === 0 ? recommendedPoleCount(data, state) : 1);
  return { product, pole, count };
}

export function gateOption(data: CalculatorData, gate: Gate): GateOption | null {
  return data.gates.find((g) => g.handle === gate.handle) ?? null;
}

export type GateSize = { label: string; price: number | null; available: boolean; detail?: string; opt?: Opt };

export function gateSize(data: CalculatorData, gate: Gate): GateSize | null {
  if (gate.handle === CUSTOM_GATE) {
    const w = parseFloat(gate.customWidth.replace(",", "."));
    const h = parseFloat(gate.customHeight.replace(",", "."));
    if (validateCustomGate(w, h)) return null;
    const listed = customGatePrice(w, h);
    const id = listed ? customGateVariantId(listed.width, listed.height) : null;
    return {
      label: `op maat ${Math.round(w)} × ${Math.round(h)} cm (b × h)`,
      price: listed?.price ?? null,
      // Made to measure: "op bestelling", about 2 weeks (src/lib/made-to-order.ts).
      available: false,
      ...(listed && id !== null ? { opt: { variantId: id, title: `${listed.width}cm / ${listed.height}cm`, price: listed.price, available: false } } : {}),
      detail: listed
        ? `prijs volgens maat ${formatMeters(listed.width)} × ${formatMeters(listed.height)}`
        : "breder dan de prijslijst — prijs op aanvraag",
    };
  }
  const option = gateOption(data, gate);
  if (!option) return null;
  const size = option.sizes.find((s) => s.variantId === gate.variantId) ?? (option.sizes.length === 1 ? option.sizes[0] : null);
  if (!size) return null;
  const dims =
    size.height && size.width ? `${size.height} × ${size.width} cm (h × b)` : size.width ? `${size.width} cm breed` : "standaardmaat";
  return { label: dims, price: size.price, available: size.available, opt: size };
}

/** Gates sold without posts that look best on a particular post (Xander: the robinia poort on sawn robinia). */
const GATE_POLE_KIND: Record<string, PoleKind> = { "robinia-poort": "robinia-gezaagd" };

export function gatePoleResolved(data: CalculatorData, gate: Gate) {
  const preferred = gate.handle ? GATE_POLE_KIND[gate.handle] : undefined;
  const product =
    data.gatePoles.find((p) => p.handle === gate.poleHandle) ??
    data.gatePoles.find((p) => p.kind === preferred) ??
    data.gatePoles[0];
  if (!product) return null;
  // A gate hangs on these posts: default to 180 cm or longer and, for round
  // posts, the thickest stocked diameter. Square posts are sturdy at any size.
  const thickness = (d: string) => parseFloat(d) || 0;
  const candidates = product.poles
    .filter((p) => p.available && p.length >= 180)
    .sort((a, b) =>
      isSquarePost(product.kind)
        ? a.length - b.length || a.price - b.price
        : thickness(b.diameter) - thickness(a.diameter) || a.length - b.length,
    );
  const pole =
    product.poles.find((p) => p.variantId === gate.poleVariantId) ??
    candidates[0] ??
    product.poles.find((p) => p.available) ??
    product.poles[0];
  return pole ? { product, pole } : null;
}

export function postsIncluded(data: CalculatorData, gate: Gate): boolean {
  return gate.handle === CUSTOM_GATE || Boolean(gateOption(data, gate)?.postsIncluded);
}

export function gateTitle(data: CalculatorData, gate: Gate): string {
  if (gate.handle === CUSTOM_GATE) return "Kastanje premium maatwerkpoort";
  return gateOption(data, gate)?.title ?? "Poort";
}

/* Material list ------------------------------------------------------ */

/** The webshop variant a line is, at its webshop price: such lines can be ordered at once. */
export type LineVariant = { id: number; handle: string; product: string; title: string; available: boolean };

export type Line = {
  group: string;
  label: string;
  detail?: string;
  qty: number;
  unit: number | null; // null = price on request
  url?: string;
  /** Not in stock: still requested, "Op bestelling"/"Op aanvraag" with the delivery term (src/lib/made-to-order.ts). */
  order?: { badge: string; note: string };
  /** Missing: not a webshop variant as such (a surcharge, a price on request): quote only. */
  variant?: LineVariant;
  /** For the order: what the variant alone does not say (a gate's size and hinges). */
  note?: string;
};

const variantOf = (handle: string, product: string, o: Opt): Pick<Line, "variant"> => ({
  variant: { id: o.variantId, handle, product, title: o.title === "Default Title" ? "" : o.title.replace(/ \/ /g, " · "), available: o.available },
});

/** Sold-out choices stay in the list as "op bestelling": the quote confirms price and delivery term. */
function onOrder(handle: string, available: boolean): Pick<Line, "order"> {
  return available ? {} : { order: orderTerm(handle) };
}

/** Line detail including the order term, for the mails and the plain-text request. */
export function lineDetail(line: Line): string {
  return [line.detail, line.order && `${line.order.badge}: ${line.order.note}`].filter(Boolean).join(" — ");
}

/** "ø6-8cm" for round posts, "7x7cm" for square ones. */
export function poleSize(kind: PoleOption["kind"], diameter: string): string {
  return `${isSquarePost(kind) ? "" : "ø"}${diameter}`;
}

export function looseSaver(data: CalculatorData, diameter: string) {
  const key = postsaverKey(diameter);
  const opt = key ? data.loosePostsavers?.byKey[key] : undefined;
  const own = data.loosePostsavers;
  return key && opt && own ? { key, opt, url: own.shopUrl, handle: own.handle, title: own.title } : null;
}

/** A sleeve fitted by Natuurhout: the loose sleeve plus the fitting. */
export function mountedSaverPrice(data: CalculatorData, key: string): number | null {
  const loose = looseSaver(data, key);
  return loose ? loose.opt.price + POSTSAVER_FITTING : null;
}

export type PostSaver = {
  /** Extra per post when Natuurhout fits it; null = not offered. */
  mounted: number | null;
  /** The fitting as a variant of the order-only product FITTED_SAVER (src/lib/order-only-products.ts). */
  mountedId?: number;
  /** Loose sleeve to fit yourself; null = not offered. */
  loose: ReturnType<typeof looseSaver>;
};

/** The postsaver options for one post, with their prices. */
/*
 * Fitting a postsaver can be ordered and paid at once (Xander, Nov 2026: ready
 * in about 3 days). Each fitting is a variant of an order-only product, with
 * an id derived from the post's (or, for gate posts, the loose sleeve's)
 * webshop variant id, so the site and the Worker agree without a table.
 */
export const FITTED_SAVER = { handle: "postsaver-aanbrengen", title: "Postsaver aangebracht door Natuurhout" };
export const fittedSaverId = (poleVariantId: number) => -(poleVariantId * 10 + 7);
export const gatePostSaverId = (sleeveVariantId: number) => -(sleeveVariantId * 10 + 8);

export function postSaverFor(data: CalculatorData, kind: PoleOption["kind"], pole: PoleOpt): PostSaver {
  const saver = postSaverPrices(data, kind, pole);
  return saver.mounted === null ? saver : { ...saver, mountedId: fittedSaverId(pole.variantId) };
}

function postSaverPrices(data: CalculatorData, kind: PoleOption["kind"], pole: PoleOpt): PostSaver {
  if (kind === "kastanje-postsaver") return { mounted: null, loose: null };
  if (kind === "eiken") {
    // Natuurhout's price list for oak with a postsaver; no loose sleeve fits.
    const withSaver = OAK_WITH_POSTSAVER[`${pole.length}cm / ${pole.diameter.replace(/cm$/, "")}`];
    return { mounted: withSaver === undefined ? null : withSaver - pole.price, loose: null };
  }
  const key = kind === "robinia-gezaagd" ? SQUARE_POSTSAVER_KEY : pole.diameter;
  const loose = looseSaver(data, key);
  // Sawn robinia (7x7, 8x8): one fixed price, whatever the length (Xander).
  if (kind === "robinia-gezaagd") return { mounted: SAWN_ROBINIA_POSTSAVER, loose };
  if (kind === "kastanje" || kind === "robinia") {
    // Chestnut with a fitted postsaver is a webshop product of its own; round
    // robinia costs the same plus ROBINIA_POSTSAVER_EXTRA (Xander). Posts of
    // 150 and 160 cm are the same post, by supplier; any other length the
    // chestnut list lacks takes the next longer one.
    const sameLength = (length: number) => length === pole.length || (Math.min(length, pole.length) === 150 && Math.max(length, pole.length) === 160);
    const fitted = [...data.fencePoles, ...data.screenPoles]
      .find((o) => o.kind === "kastanje-postsaver")
      ?.poles.filter((p) => p.diameter === pole.diameter && (sameLength(p.length) || p.length >= pole.length))
      .sort((a, b) => Number(sameLength(b.length)) - Number(sameLength(a.length)) || a.length - b.length)[0];
    const extra = kind === "robinia" ? ROBINIA_POSTSAVER_EXTRA : 0;
    if (fitted && (kind === "robinia" || sameLength(fitted.length))) {
      return { mounted: Math.max(0, fitted.price + extra - pole.price), loose };
    }
  }
  return { mounted: loose ? mountedSaverPrice(data, loose.key) : null, loose };
}

export function hasSaverOptions(saver: PostSaver): boolean {
  return saver.mounted !== null || saver.loose !== null;
}

export function fieldGateLatch(data: CalculatorData, gate: Gate) {
  const latches = data.fieldGateHardware?.latches ?? [];
  if (gate.latch === "none") return null;
  return latches.find((l) => l.variantId === gate.latch) ?? latches[0] ?? null;
}

/** Postsaver lines for `qty` posts. */
function saverLines(group: string, mode: SaverMode, saver: PostSaver, qty: number, what: string): Line[] {
  if (mode === "mounted" && saver.mounted !== null) {
    const label = `Postsaver aangebracht door Natuurhout op ${what}`;
    return [
      {
        group,
        label,
        detail: "meerkost per paal (incl. aanbrengen), klaar in ±3 dagen",
        qty,
        unit: saver.mounted,
        ...(saver.mountedId !== undefined
          ? { variant: { id: saver.mountedId, handle: FITTED_SAVER.handle, product: FITTED_SAVER.title, title: `op ${what}`, available: true } }
          : {}),
      },
    ];
  }
  if (mode === "loose" && saver.loose) {
    const loose = saver.loose;
    return [{ group, label: `Losse postsaver ø${loose.key} (zelf aanbrengen)`, qty, unit: loose.opt.price, url: loose.url, ...variantOf(loose.handle, loose.title, loose.opt) }];
  }
  return [];
}

/** Postsaver for the posts that come with a gate, by their diameter. */
export function includedPostSaver(data: CalculatorData, key: string): PostSaver {
  const loose = looseSaver(data, key);
  const mounted = mountedSaverPrice(data, key);
  return { mounted, loose, ...(mounted !== null && loose ? { mountedId: gatePostSaverId(loose.opt.variantId) } : {}) };
}

export function buildLines(data: CalculatorData, state: State): Line[] {
  const lines: Line[] = [];
  const has = (t: ProductType) => state.types.includes(t);

  if (has("hekwerk")) {
    for (const line of state.fences) {
      const r = fenceRoll(data, line);
      if (!r) continue;
      const qty = fenceRollCount(data, line);
      if (qty <= 0) continue;
      lines.push({
        group: "Hekwerk",
        label: `${r.fence.title} ${r.roll.height} cm, latafstand ${r.roll.spacing}`,
        detail: `${qty} × rol van ${r.roll.rollLength} m = ${qty * r.roll.rollLength} m (nodig: ${line.meters} m)`,
        qty,
        unit: r.roll.price,
        url: r.fence.shopUrl,
        ...onOrder(r.fence.handle, r.roll.available),
        ...variantOf(r.fence.handle, r.fence.title, r.roll),
      });
    }
  }

  if (has("vlechtschermen")) {
    const s = screenResolved(data, state);
    if (s && s.count > 0) {
      lines.push({
        group: "Vlechtschermen",
        label: `${s.option.label}, ${s.size.height} × ${s.size.width} cm (h × b)`,
        detail: `${s.count} schermen: samen ca. ${formatMeters(s.lengthCm)} lang, met een paal van ±${SCREEN_POST_CM} cm tussen de schermen en aan beide uiteinden`,
        qty: s.count,
        unit: s.size.price,
        url: s.option.shopUrl,
        ...onOrder(s.option.handle, s.size.available),
        ...variantOf(s.option.handle, s.option.title, s.size),
      });
    }
  }

  if (has("hekwerk") || has("vlechtschermen")) {
    state.poles.forEach((line, i) => {
      const p = poleResolved(data, state, line, i);
      if (!p || p.count <= 0) return;
      lines.push({
        group: "Palen",
        label: `${p.product.title} ${p.pole.length} cm, ${poleSize(p.product.kind, p.pole.diameter)}`,
        qty: p.count,
        unit: p.pole.price,
        url: p.product.shopUrl,
        ...onOrder(p.product.handle, p.pole.available),
        ...variantOf(p.product.handle, p.product.title, p.pole),
      });
      lines.push(...saverLines("Palen", line.saver, postSaverFor(data, p.product.kind, p.pole), p.count, p.product.title.toLowerCase()));
    });
  }

  if (has("postrail") && data.postRail) {
    const pr = data.postRail;
    const q = postRailFor(state.postRail.meters, state.postRail.corners, state.postRail.rails);
    const post = state.postRail.rails === 2 ? pr.post2 : pr.post3;
    const extra = state.postRail.peeled ? PEELED_SURCHARGE : 0;
    const peeled = state.postRail.peeled ? ", ontschorst" : "";
    if (q.posts > 0) {
      lines.push({
        group: "Post & Rail",
        label: `${post.title} (2 m, 15 cm)${peeled}`,
        detail: `${state.postRail.meters} m met ${state.postRail.corners} ${state.postRail.corners === 1 ? "hoek" : "hoeken"}: ${q.sections} vakken`,
        qty: q.posts,
        unit: post.price + extra,
        url: pr.shopUrl,
        ...(extra ? {} : variantOf(pr.handle, pr.title, post)),
      });
      lines.push({
        group: "Post & Rail",
        label: `${pr.rail.title} 2,90 m${peeled}`,
        detail: `${state.postRail.rails} liggers per vak`,
        qty: q.rails,
        unit: pr.rail.price + extra,
        url: pr.shopUrl,
        ...(extra ? {} : variantOf(pr.handle, pr.title, pr.rail)),
      });
    }
  }

  if (has("hekwerk") || has("poorten") || has("cleftfield")) {
    state.gates.forEach((gate, i) => {
      if (!gate.handle) return;
      const size = gateSize(data, gate);
      if (!size) return;
      const option = gateOption(data, gate);
      const group = state.gates.length > 1 ? `Poort ${i + 1}` : "Poort";
      const kind = gate.leaves === 2 ? "dubbele poort (2 vleugels)" : "enkele poort";
      const swing =
        (gate.leaves === 1 ? `${gate.hinge === "rechts" ? "type 1" : "type 2"}: scharnieren ${gate.hinge} gezien vanaf de straat, ` : "") +
        (gate.opens === "buiten" ? "opent naar buiten (te bespreken per mail of telefoon)" : "opent naar binnen");
      lines.push({
        group,
        label: `${gateTitle(data, gate)} — ${size.label}`,
        detail: [kind, swing, size.detail].filter(Boolean).join("; "),
        qty: gate.leaves,
        unit: size.price,
        url: gate.handle === CUSTOM_GATE ? undefined : option?.shopUrl,
        ...onOrder(gate.handle === CUSTOM_GATE ? MAATWERK_POORT.handle : gate.handle, size.available),
        ...(size.opt && gate.handle === CUSTOM_GATE
          ? variantOf(MAATWERK_POORT.handle, MAATWERK_POORT.title, size.opt)
          : size.opt && option
            ? variantOf(option.handle, option.title, size.opt)
            : {}),
        note: [gate.handle === CUSTOM_GATE ? size.label : "", kind, swing].filter(Boolean).join("; "),
      });

      if (postsIncluded(data, gate)) {
        lines.push(...saverLines(group, gate.saver, includedPostSaver(data, gate.saverKey), POSTS_PER_GATE, `poortpaal ø${gate.saverKey}`));
      } else {
        const p = gatePoleResolved(data, gate);
        if (p) {
          lines.push({
            group,
            label: `Poortpaal: ${p.product.title} ${p.pole.length} cm, ${poleSize(p.product.kind, p.pole.diameter)}`,
            qty: POSTS_PER_GATE,
            unit: p.pole.price,
            url: p.product.shopUrl,
            ...onOrder(p.product.handle, p.pole.available),
            ...variantOf(p.product.handle, p.product.title, p.pole),
          });
          lines.push(...saverLines(group, gate.saver, postSaverFor(data, p.product.kind, p.pole), POSTS_PER_GATE, "poortpaal"));
        }
      }

      let hardware = !option?.fieldGate; // every other gate ships with galvanised hardware
      if (option?.fieldGate && data.fieldGateHardware) {
        const hw = data.fieldGateHardware;
        if (gate.hinges) {
          hardware = true;
          lines.push({ group, label: `Beslag: ${hw.hinges.title}`, detail: "per vleugel", qty: gate.leaves, unit: hw.hinges.price, url: hw.shopUrl, ...variantOf(hw.handle, hw.title, hw.hinges) });
        }
        const latch = fieldGateLatch(data, gate);
        if (latch) lines.push({ group, label: `Beslag: ${latch.title}`, qty: 1, unit: latch.price, url: hw.shopUrl, ...onOrder(hw.handle, latch.available), ...variantOf(hw.handle, hw.title, latch) });
        if (hw.groundPin && gate.groundPins > 0) {
          lines.push({ group, label: `Beslag: ${hw.groundPin.title}`, qty: gate.groundPins, unit: hw.groundPin.price, url: hw.shopUrl, ...variantOf(hw.handle, hw.title, hw.groundPin) });
        }
      }
      if (gate.black && hardware) {
        lines.push({ group, label: "Zwart beslag in plaats van verzinkt", detail: "meerkost per poortvleugel", qty: gate.leaves, unit: BLACK_HARDWARE_SURCHARGE });
      }
    });
  }

  if (has("plantenbakken")) {
    for (const planter of data.planters) {
      for (const size of planter.sizes) {
        const qty = state.planters[size.variantId] ?? 0;
        if (qty > 0) {
          lines.push({
            group: "Plantenbakken",
            label: `${planter.title} ${size.title}`,
            qty,
            unit: size.price,
            url: planter.shopUrl,
            ...onOrder(planter.handle, size.available),
            ...variantOf(planter.handle, planter.title, size),
          });
        }
      }
    }
  }

  for (const t of PICK_TYPES) {
    if (!has(t)) continue;
    for (const product of data.picks[t]) {
      for (const size of product.sizes) {
        const qty = state.picks[size.variantId] ?? 0;
        if (qty <= 0) continue;
        const single = product.sizes.length === 1 && size.title === "Default Title";
        lines.push({
          group: PICK_LABEL[t],
          label: single ? product.title : `${product.title}: ${size.title}`,
          qty,
          unit: size.price,
          url: product.shopUrl,
          ...onOrder(product.handle, size.available),
          ...variantOf(product.handle, product.title, size),
        });
      }
    }
  }

  return lines;
}

/** A pick step needs at least one piece. */
export function pickProblem(data: CalculatorData, state: State, type: PickType): string | null {
  const any = data.picks[type].some((p) => p.sizes.some((z) => (state.picks[z.variantId] ?? 0) > 0));
  return any ? null : `Kies minstens één ${type === "palen" ? "paal" : "product"}.`;
}

/*
 * "Meteen bestellen": the list as winkelmandje lines (one per variant). Lines
 * that are no webshop variant as such (maatwerk, a fitted postsaver, black
 * hardware, ...) are `blocked`: with any of those, the list goes as a quote.
 */
export function orderLines(lines: Line[]) {
  const cart = new Map<number, { id: number; handle: string; product: string; label: string; unit: number; qty: number; available: boolean; note?: string }>();
  const blocked: { line: Line; why: "maat" | "voorraad" }[] = [];
  for (const l of lines) {
    if (!l.variant || l.unit === null) {
      blocked.push({ line: l, why: "maat" });
      continue;
    }
    const v = l.variant;
    // Not in stock: only what is made for the customer anyway can be ordered at once.
    if (!v.available && !ORDER_WHEN_SOLD_OUT.has(v.handle)) {
      blocked.push({ line: l, why: "voorraad" });
      continue;
    }
    const had = cart.get(v.id);
    const note = [had?.note, l.note].filter(Boolean).join(" | ");
    cart.set(v.id, { id: v.id, handle: v.handle, product: v.product, label: v.title, unit: l.unit, qty: (had?.qty ?? 0) + l.qty, available: v.available, ...(note ? { note } : {}) });
  }
  return { cart: [...cart.values()], blocked };
}

/**
 * For the delivery price: every webshop variant in the list (in stock or not),
 * and the value of the rest, which the Worker cannot price (DeliveryCheck's withExtra).
 */
export function deliveryBasket(lines: Line[]) {
  const ids = new Map<number, number>();
  let extra = 0;
  for (const l of lines) {
    if (l.variant && l.unit !== null) ids.set(l.variant.id, (ids.get(l.variant.id) ?? 0) + l.qty);
    else extra += l.unit === null ? 0 : l.qty * l.unit;
  }
  return { lines: [...ids].map(([id, qty]) => ({ id, qty })), extra };
}

/*
 * Out of stock and still to order and pay at once (Xander, Nov 2026): the
 * maatwerkpoort (about 2 weeks), the geschroefde poort (about 3 working days)
 * and fitted postsavers (about 3 days). Anything else not in stock goes as an
 * offerteaanvraag.
 */
const ORDER_WHEN_SOLD_OUT = new Set([MAATWERK_POORT.handle, "kastanje-poort-geschroefd", FITTED_SAVER.handle]);

export function total(lines: Line[]): number {
  return lines.reduce((sum, l) => sum + (l.unit === null ? 0 : l.qty * l.unit), 0);
}

/* Quote request ------------------------------------------------------ */

export function contactErrors(state: State): Record<string, string> {
  const c = state.contact;
  const errors: Record<string, string> = {};
  // A quote only needs an e-mail address; a delivery also a name and a phone number to arrange it.
  if (c.delivery && !c.name.trim()) errors.name = "Vul uw naam in voor de levering.";
  if (!c.email.trim()) errors.email = "Een e-mailadres is verplicht.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) errors.email = "Dit e-mailadres lijkt niet te kloppen.";
  if (c.phone.trim() && !/^[+()\d\s./-]{6,}$/.test(c.phone.trim())) errors.phone = "Dit telefoonnummer lijkt niet te kloppen.";
  else if (c.delivery && !c.phone.trim()) errors.phone = "Vul uw telefoonnummer in, dan spreken we de levering met u af.";
  if (c.delivery) {
    if (!c.street.trim()) errors.street = "Vul het leveringsadres in.";
    if (!/^\d{4}$/.test(c.postcode.trim())) errors.postcode = "Een Belgische postcode heeft 4 cijfers.";
    if (!c.city.trim()) errors.city = "Vul de gemeente in.";
  }
  return errors;
}

export function quoteText(state: State, lines: Line[]): string {
  const c = state.contact;
  const out: string[] = [];
  out.push("Offerteaanvraag via de afsluitingscalculator op natuurhout.be", "");
  if (c.name.trim()) out.push(`Naam: ${c.name.trim()}`);
  out.push(`E-mail: ${c.email.trim()}`);
  if (c.phone.trim()) out.push(`Telefoon: ${c.phone.trim()}`);
  out.push(
    c.delivery
      ? `Levering: ja — ${c.street.trim()}, ${c.postcode.trim()} ${c.city.trim()}`
      : "Levering: nee, wordt afgehaald in Zele",
    "",
    "Materiaallijst (richtprijzen incl. btw):",
  );
  let group = "";
  for (const l of lines) {
    if (l.group !== group) {
      group = l.group;
      out.push("", `${group}:`);
    }
    const price = l.unit === null ? "prijs op aanvraag" : `${l.qty} × ${formatPrice(l.unit)} = ${formatPrice(l.qty * l.unit)}`;
    out.push(`- ${l.label}: ${price}`);
    const detail = lineDetail(l);
    if (detail) out.push(`  (${detail})`);
  }
  out.push("", `Richtprijs materiaal: ${formatPrice(total(lines))}`);
  if (lines.some((l) => l.unit === null)) out.push("+ posten op aanvraag");
  if (c.delivery) out.push("+ leveringskosten: Natuurhout bekijkt ze op basis van de postcode en laat ze per mail weten");
  if (c.remarks.trim()) out.push("", "Opmerkingen:", c.remarks.trim());
  return out.join("\n");
}
