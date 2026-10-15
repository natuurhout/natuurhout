import { formatPrice } from "@/lib/catalog";
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
  type PoleOpt,
  type PoleKind,
  type PoleOption,
} from "@/lib/calculator-pricing";

/*
 * Wizard state and the priced material list it produces. Pure functions,
 * no React: the component renders this, the quote e-mail serialises it.
 */

export type ProductType = "hekwerk" | "vlechtschermen" | "postrail" | "poorten" | "cleftfield" | "plantenbakken";
export type StepId = "keuze" | "hekwerk" | "vlechtschermen" | "postrail" | "palen" | "poort" | "plantenbakken" | "overzicht";

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

export const PRODUCT_TYPES: ProductType[] = ["hekwerk", "vlechtschermen", "postrail", "poorten", "cleftfield", "plantenbakken"];

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

export type GateSize = { label: string; price: number | null; available: boolean; detail?: string };

export function gateSize(data: CalculatorData, gate: Gate): GateSize | null {
  if (gate.handle === CUSTOM_GATE) {
    const w = parseFloat(gate.customWidth.replace(",", "."));
    const h = parseFloat(gate.customHeight.replace(",", "."));
    if (validateCustomGate(w, h)) return null;
    const listed = customGatePrice(w, h);
    return {
      label: `op maat ${Math.round(w)} × ${Math.round(h)} cm (b × h)`,
      price: listed?.price ?? null,
      available: true,
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
  return { label: dims, price: size.price, available: size.available };
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

export type Line = {
  group: string;
  label: string;
  detail?: string;
  qty: number;
  unit: number | null; // null = price on request
  url?: string;
};

/** "ø6-8cm" for round posts, "7x7cm" for square ones. */
export function poleSize(kind: PoleOption["kind"], diameter: string): string {
  return `${isSquarePost(kind) ? "" : "ø"}${diameter}`;
}

export function looseSaver(data: CalculatorData, diameter: string) {
  const key = postsaverKey(diameter);
  const opt = key ? data.loosePostsavers?.byKey[key] : undefined;
  return key && opt ? { key, opt, url: `${data.loosePostsavers!.shopUrl}?variant=${opt.variantId}` } : null;
}

/** A sleeve fitted by Natuurhout: the loose sleeve plus the fitting. */
export function mountedSaverPrice(data: CalculatorData, key: string): number | null {
  const loose = looseSaver(data, key);
  return loose ? loose.opt.price + POSTSAVER_FITTING : null;
}

export type PostSaver = {
  /** Extra per post when Natuurhout fits it; null = not offered. */
  mounted: number | null;
  /** Loose sleeve to fit yourself; null = not offered. */
  loose: ReturnType<typeof looseSaver>;
};

/** The postsaver options for one post, with their prices. */
export function postSaverFor(data: CalculatorData, kind: PoleOption["kind"], pole: PoleOpt): PostSaver {
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
    return [{ group, label: `Postsaver aangebracht door Natuurhout op ${what}`, detail: `meerkost per paal (incl. aanbrengen)`, qty, unit: saver.mounted }];
  }
  if (mode === "loose" && saver.loose) {
    return [{ group, label: `Losse postsaver ø${saver.loose.key} (zelf aanbrengen)`, qty, unit: saver.loose.opt.price, url: saver.loose.url }];
  }
  return [];
}

/** Postsaver for the posts that come with a gate, by their diameter. */
export function includedPostSaver(data: CalculatorData, key: string): PostSaver {
  return { mounted: mountedSaverPrice(data, key), loose: looseSaver(data, key) };
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
        url: `${r.fence.shopUrl}?variant=${r.roll.variantId}`,
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
        url: `${s.option.shopUrl}?variant=${s.size.variantId}`,
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
        url: `${p.product.shopUrl}?variant=${p.pole.variantId}`,
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
        url: `${pr.shopUrl}?variant=${post.variantId}`,
      });
      lines.push({
        group: "Post & Rail",
        label: `${pr.rail.title} 2,90 m${peeled}`,
        detail: `${state.postRail.rails} liggers per vak`,
        qty: q.rails,
        unit: pr.rail.price + extra,
        url: `${pr.shopUrl}?variant=${pr.rail.variantId}`,
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
            url: `${p.product.shopUrl}?variant=${p.pole.variantId}`,
          });
          lines.push(...saverLines(group, gate.saver, postSaverFor(data, p.product.kind, p.pole), POSTS_PER_GATE, "poortpaal"));
        }
      }

      let hardware = !option?.fieldGate; // every other gate ships with galvanised hardware
      if (option?.fieldGate && data.fieldGateHardware) {
        const hw = data.fieldGateHardware;
        if (gate.hinges) {
          hardware = true;
          lines.push({ group, label: `Beslag: ${hw.hinges.title}`, detail: "per vleugel", qty: gate.leaves, unit: hw.hinges.price, url: `${hw.shopUrl}?variant=${hw.hinges.variantId}` });
        }
        const latch = fieldGateLatch(data, gate);
        if (latch) lines.push({ group, label: `Beslag: ${latch.title}`, qty: 1, unit: latch.price, url: `${hw.shopUrl}?variant=${latch.variantId}` });
        if (hw.groundPin && gate.groundPins > 0) {
          lines.push({ group, label: `Beslag: ${hw.groundPin.title}`, qty: gate.groundPins, unit: hw.groundPin.price, url: `${hw.shopUrl}?variant=${hw.groundPin.variantId}` });
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
            url: `${planter.shopUrl}?variant=${size.variantId}`,
          });
        }
      }
    }
  }

  return lines;
}

export function total(lines: Line[]): number {
  return lines.reduce((sum, l) => sum + (l.unit === null ? 0 : l.qty * l.unit), 0);
}

/* Quote request ------------------------------------------------------ */

export function contactErrors(state: State): Record<string, string> {
  const c = state.contact;
  const errors: Record<string, string> = {};
  if (!c.name.trim()) errors.name = "Vul uw naam in.";
  if (!c.email.trim()) errors.email = "Een e-mailadres is verplicht.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) errors.email = "Dit e-mailadres lijkt niet te kloppen.";
  if (c.phone.trim() && !/^[+()\d\s./-]{6,}$/.test(c.phone.trim())) errors.phone = "Dit telefoonnummer lijkt niet te kloppen.";
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
  out.push(`Naam: ${c.name.trim()}`, `E-mail: ${c.email.trim()}`);
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
    if (l.detail) out.push(`  (${l.detail})`);
  }
  out.push("", `Richtprijs materiaal: ${formatPrice(total(lines))}`);
  if (lines.some((l) => l.unit === null)) out.push("+ posten op aanvraag");
  if (c.delivery) out.push("+ leveringskosten: Natuurhout bekijkt ze op basis van de postcode en laat ze per mail weten");
  if (c.remarks.trim()) out.push("", "Opmerkingen:", c.remarks.trim());
  return out.join("\n");
}
