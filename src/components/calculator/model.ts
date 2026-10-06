import { formatPrice } from "@/lib/catalog";
import {
  BLACK_HARDWARE_SURCHARGE,
  GATE_POSTSAVER_SURCHARGE,
  PEELED_SURCHARGE,
  POSTS_PER_GATE,
  customGatePrice,
  fencePostsFor,
  formatMeters,
  postRailFor,
  postsaverKey,
  recommendedPole,
  rollsFor,
  screensFor,
  validateCustomGate,
  type CalculatorData,
  type GateOption,
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
};

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
  postsaver: string | null; // diameter key, gates with posts included
  poleHandle: string | null; // gates without posts
  poleVariantId: number | null;
  polePostsaver: boolean;
  black: boolean;
};

export type State = {
  types: ProductType[];
  fences: FenceLine[];
  screen: { handle: string; variantId: number | null; meters: number; count: number | null };
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
    hinge: "links",
    opens: "binnen",
    postsaver: null,
    poleHandle: null,
    poleVariantId: null,
    polePostsaver: false,
    black: false,
  };
}

export function initialState(data: CalculatorData): State {
  return {
    types: [],
    fences: [newFenceLine(data)],
    screen: { handle: data.screens[0]?.handle ?? "", variantId: null, meters: 6, count: null },
    postRail: { rails: 3, meters: 20, corners: 0, peeled: false },
    poles: [{ id: newId(), handle: data.fencePoles[0]?.handle ?? "", variantId: null, count: null }],
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
  const count = state.screen.count ?? screensFor(state.screen.meters, size.width);
  return { option, size, count };
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
  if (state.types.includes("hekwerk")) for (const line of state.fences) total += fencePostsFor(line.meters);
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

export function gatePoleResolved(data: CalculatorData, gate: Gate) {
  const product = data.gatePoles.find((p) => p.handle === gate.poleHandle) ?? data.gatePoles[0];
  if (!product) return null;
  // A gate hangs on these posts: default to 180 cm or longer and, for round
  // chestnut, the thickest stocked diameter. Square oak is sturdy at any size.
  const thickness = (d: string) => parseFloat(d) || 0;
  const candidates = product.poles
    .filter((p) => p.available && p.length >= 180)
    .sort((a, b) =>
      product.kind === "eiken"
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
  if (gate.handle === CUSTOM_GATE) return "Franse maatwerkpoort (kastanje)";
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
        detail: `${s.count} schermen voor ${state.screen.meters} m`,
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
        label: `${p.product.title} ${p.pole.length} cm, ${p.product.kind === "eiken" ? "" : "ø"}${p.pole.diameter}`,
        qty: p.count,
        unit: p.pole.price,
        url: `${p.product.shopUrl}?variant=${p.pole.variantId}`,
      });
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
        gate.leaves === 1 ? `scharnieren ${gate.hinge}, opent naar ${gate.opens}` : `opent naar ${gate.opens}`;
      lines.push({
        group,
        label: `${gateTitle(data, gate)} — ${size.label}`,
        detail: [kind, swing, size.detail].filter(Boolean).join("; "),
        qty: gate.leaves,
        unit: size.price,
        url: gate.handle === CUSTOM_GATE ? undefined : option?.shopUrl,
      });

      if (postsIncluded(data, gate)) {
        const surcharge = gate.postsaver ? GATE_POSTSAVER_SURCHARGE[gate.postsaver] : undefined;
        if (gate.postsaver && surcharge !== undefined) {
          lines.push({
            group,
            label: `Postsaver op poortpaal ø${gate.postsaver}`,
            detail: "meerkost per poortpaal",
            qty: POSTS_PER_GATE,
            unit: surcharge,
          });
        }
      } else {
        const p = gatePoleResolved(data, gate);
        if (p) {
          lines.push({
            group,
            label: `Poortpaal: ${p.product.title} ${p.pole.length} cm, ${p.product.kind === "eiken" ? "" : "ø"}${p.pole.diameter}`,
            qty: POSTS_PER_GATE,
            unit: p.pole.price,
            url: `${p.product.shopUrl}?variant=${p.pole.variantId}`,
          });
          const key = p.product.kind === "kastanje" ? postsaverKey(p.pole.diameter) : null;
          const surcharge = key ? GATE_POSTSAVER_SURCHARGE[key] : undefined;
          if (gate.polePostsaver && surcharge !== undefined) {
            lines.push({ group, label: `Postsaver op poortpaal ø${key}`, detail: "meerkost per poortpaal", qty: POSTS_PER_GATE, unit: surcharge });
          }
        }
      }

      if (option?.fieldGate && data.fieldGateHardware) {
        const hw = data.fieldGateHardware;
        lines.push({ group, label: `Beslag: ${hw.hinges.title}`, qty: gate.leaves, unit: hw.hinges.price, url: `${hw.shopUrl}?variant=${hw.hinges.variantId}` });
        lines.push({ group, label: `Beslag: ${hw.latch.title}`, qty: gate.leaves, unit: hw.latch.price, url: `${hw.shopUrl}?variant=${hw.latch.variantId}` });
      }
      if (gate.black) {
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
  if (c.delivery) out.push("+ leveringskosten (te berekenen)");
  if (c.remarks.trim()) out.push("", "Opmerkingen:", c.remarks.trim());
  return out.join("\n");
}
