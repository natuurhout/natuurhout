"use client";

import Image from "next/image";
import { CALCULATOR_HEKWERK_PHOTO, CALCULATOR_POSTRAIL_PHOTO, CALCULATOR_VLECHTSCHERM_PHOTO } from "@/lib/extra-photos";
import { Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import {
  BLACK_HARDWARE_SURCHARGE,
  CUSTOM_GATE_MAX_HEIGHT,
  CUSTOM_GATE_MAX_WIDTH,
  CUSTOM_GATE_MIN,
  CUSTOM_GATE_TABLE,
  PEELED_SURCHARGE,
  POSTSAVER_KEYS,
  POSTS_PER_GATE,
  SCREEN_POST_CM,
  fencePostsFor,
  formatMeters,
  isSquarePost,
  postRailFor,
  rollsFor,
  validateCustomGate,
  type CalculatorData,
} from "@/lib/calculator-pricing";
import {
  CUSTOM_GATE,
  fieldGateLatch,
  hasSaverOptions,
  includedPostSaver,
  poleSize,
  postSaverFor,
  fenceRoll,
  fenceRollCount,
  gateOption,
  gatePoleResolved,
  gateSize,
  newFenceLine,
  newGate,
  newId,
  poleOptionsFor,
  poleResolved,
  postsIncluded,
  recommendedPoleCount,
  screenResolved,
  toggleType,
  type Gate,
  type PostSaver,
  type ProductType,
  type SaverMode,
  type State,
} from "@/components/calculator/model";
import GateSwing from "@/components/calculator/GateSwing";
import { Chip, MetersInput, OptionCard, Question, Stepper } from "@/components/calculator/ui";

export type StepProps = {
  data: CalculatorData;
  state: State;
  update: (fn: (s: State) => State) => void;
};

/* 1. Keuze ---------------------------------------------------------- */

const TYPES: { id: ProductType; title: string; text: string; image: string }[] = [
  { id: "hekwerk", title: "Hekwerk", text: "Kastanje, robinia of hazelaar rasterwerk op rol", image: CALCULATOR_HEKWERK_PHOTO },
  { id: "poorten", title: "Poorten", text: "Tuin- en veldpoorten, ook enkel een poort", image: "/wp-content/uploads/2016/01/Dubbele-maatwerkpoort-scaled.jpg" },
  { id: "vlechtschermen", title: "Vlechtschermen", text: "Hazelaar, gevlochten of met halve latten", image: CALCULATOR_VLECHTSCHERM_PHOTO },
  { id: "postrail", title: "Post & Rail", text: "Kastanje palen met 2 of 3 liggers", image: CALCULATOR_POSTRAIL_PHOTO },
  { id: "cleftfield", title: "Cleft & Field poorten", text: "Robuuste veldpoorten in kastanje", image: "/wp-content/uploads/2016/01/Untitled-design-3.png" },
  { id: "plantenbakken", title: "Plantenbakken", text: "Moestuinbakken in hazelaar of cortenstaal", image: "/wp-content/uploads/2016/01/IMG_7994-scaled.jpg" },
];

export function KeuzeStep({ state, update }: StepProps) {
  function toggle(id: ProductType) {
    update((s) => toggleType(s, id));
  }
  return (
    <Question title="Wat wilt u berekenen?" hint="Kies één of meer producten. U kunt ook enkel een poort of plantenbakken kiezen.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TYPES.map((t) => {
          const active = state.types.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(t.id)}
              className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-colors ${
                active ? "border-accent ring-2 ring-accent" : "border-brand/15 hover:border-accent"
              }`}
            >
              <span className="relative block aspect-[16/9] w-full bg-brand-soft">
                <Image src={t.image} alt="" fill sizes="(max-width: 640px) 100vw, 280px" className="object-cover" />
                <span
                  className={`absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    active ? "border-accent bg-accent text-white" : "border-white bg-white/80 text-transparent"
                  }`}
                  aria-hidden
                >
                  ✓
                </span>
              </span>
              <span className="block p-3.5">
                <span className="block font-semibold text-ink">{t.title}</span>
                <span className="mt-0.5 block text-xs text-ink/60">{t.text}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Question>
  );
}

/* 2. Hekwerk -------------------------------------------------------- */

export function HekwerkStep({ data, state, update }: StepProps) {
  const setLine = (id: number, patch: Partial<State["fences"][number]>) =>
    update((s) => ({ ...s, fences: s.fences.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));

  return (
    <div className="space-y-6">
      {state.fences.map((line, index) => {
        const resolved = fenceRoll(data, line);
        const fence = resolved?.fence ?? data.fences[0];
        const heights = [...new Set(fence.rolls.map((r) => r.height))].sort((a, b) => a - b);
        const recommended = resolved ? rollsFor(line.meters, resolved.roll.rollLength) : 0;
        return (
          <section key={line.id} className={index > 0 ? "rounded-xl border border-line p-4 sm:p-5" : ""}>
            {index > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Extra hekwerk {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => update((s) => ({ ...s, fences: s.fences.filter((l) => l.id !== line.id) }))}
                  className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" /> Verwijderen
                </button>
              </div>
            )}
            <div className="space-y-7">
              <Question title="Welke houtsoort?">
                <div className="flex flex-wrap gap-2">
                  {data.fences.map((f) => (
                    <Chip
                      key={f.handle}
                      active={f.handle === fence.handle}
                      onClick={() => {
                        const fresh = newFenceLine(data, f.handle);
                        const keep = f.rolls.some((r) => r.height === line.height) ? line.height : fresh.height;
                        setLine(line.id, { handle: f.handle, height: keep, variantId: null, rolls: null });
                      }}
                    >
                      {f.title}
                    </Chip>
                  ))}
                </div>
              </Question>

              <Question title="Welke hoogte?">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {heights.map((h) => {
                    const cheapest = fence.rolls.filter((r) => r.height === h).sort((a, b) => a.price - b.price)[0];
                    return (
                      <OptionCard
                        key={h}
                        active={h === line.height}
                        onClick={() => setLine(line.id, { height: h, variantId: null, rolls: null })}
                        title={`${h} cm`}
                        note={`vanaf ${formatPrice(cheapest.price)}/rol`}
                      />
                    );
                  })}
                </div>
              </Question>

              {resolved && (
                <Question title="Welke latafstand?" hint="Met een kleinere latafstand oogt het hekwerk dichter en houdt het kleine dieren beter tegen.">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {resolved.options.map((r) => (
                      <OptionCard
                        key={r.variantId}
                        active={r.variantId === resolved.roll.variantId}
                        disabled={!r.available}
                        onClick={() => setLine(line.id, { variantId: r.variantId, rolls: null })}
                        title={`${r.spacing} — rol van ${r.rollLength} m`}
                        note={`${formatPrice(r.price)}/rol${r.available ? "" : " · uitverkocht"}`}
                      />
                    ))}
                  </div>
                </Question>
              )}

              <Question title="Hoeveel lopende meter?">
                <MetersInput value={line.meters} onChange={(m) => setLine(line.id, { meters: m, rolls: null })} />
              </Question>

              {resolved && (
                <Question
                  title="Aantal rollen"
                  hint={`Aanbevolen: ${recommended} ${recommended === 1 ? "rol" : "rollen"} van ${resolved.roll.rollLength} m voor ${line.meters} m.`}
                >
                  <Stepper
                    label="Aantal rollen"
                    value={fenceRollCount(data, line)}
                    min={1}
                    onChange={(v) => setLine(line.id, { rolls: v })}
                  />
                </Question>
              )}
            </div>
          </section>
        );
      })}

      <button
        type="button"
        onClick={() =>
          update((s) => {
            const last = s.fences[s.fences.length - 1];
            return { ...s, fences: [...s.fences, newFenceLine(data, last?.handle, last?.height)] };
          })
        }
        className="inline-flex items-center gap-2 rounded-full border border-dashed border-accent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/5"
      >
        <Plus className="h-4 w-4" /> Extra hekwerk van een andere hoogte
      </button>
    </div>
  );
}

/* 3. Vlechtschermen ------------------------------------------------- */

export function SchermenStep({ data, state, update }: StepProps) {
  const s = screenResolved(data, state);
  if (!s) return <p className="text-ink/60">Er zijn momenteel geen vlechtschermen beschikbaar.</p>;
  const set = (patch: Partial<State["screen"]>) => update((st) => ({ ...st, screen: { ...st.screen, ...patch } }));
  return (
    <div className="space-y-7">
      <Question title="Welk vlechtscherm?">
        <div className="grid gap-2 sm:grid-cols-2">
          {data.screens.map((o) => (
            <OptionCard
              key={o.handle}
              active={o.handle === s.option.handle}
              onClick={() => set({ handle: o.handle, variantId: null })}
              title={o.label}
              note={`vanaf ${formatPrice(Math.min(...o.sizes.map((z) => z.price)))}/scherm`}
            />
          ))}
        </div>
      </Question>
      <Question title="Welke maat?" hint="Hoogte × breedte van één scherm.">
        <div className="grid gap-2 sm:grid-cols-3">
          {s.option.sizes.map((z) => (
            <OptionCard
              key={z.variantId}
              active={z.variantId === s.size.variantId}
              disabled={!z.available}
              onClick={() => set({ variantId: z.variantId })}
              title={`${z.height} × ${z.width} cm`}
              note={`${formatPrice(z.price)}/scherm${z.available ? "" : " · uitverkocht"}`}
            />
          ))}
        </div>
      </Question>
      <Question title="Hoeveel schermen?" hint={`Tussen de schermen en aan beide uiteinden komt een paal van ±${SCREEN_POST_CM} cm. De palen kiest u in de volgende stap.`}>
        <Stepper label="Aantal schermen" value={s.count} min={1} onChange={(v) => set({ count: v })} />
      </Question>
      <div className="rounded-xl bg-brand-soft/60 p-4 text-sm text-ink/80">
        <p className="font-semibold text-ink">Uw vlechtschermen</p>
        <p className="mt-1">
          {s.count} {s.count === 1 ? "scherm" : "schermen"} van {s.size.width} cm + {s.count + 1} palen van ±{SCREEN_POST_CM} cm →{" "}
          <strong>samen ca. {formatMeters(s.lengthCm)} lang</strong>.
        </p>
        <p className="mt-1 text-ink/65">U heeft altijd één paal meer dan schermen: een begin- en eindpaal en één tussen elke twee schermen.</p>
      </div>
    </div>
  );
}

/* 4. Post & Rail ---------------------------------------------------- */

export function PostRailStep({ data, state, update }: StepProps) {
  const pr = data.postRail;
  if (!pr) return <p className="text-ink/60">Post &amp; Rail is momenteel niet beschikbaar.</p>;
  const set = (patch: Partial<State["postRail"]>) => update((s) => ({ ...s, postRail: { ...s.postRail, ...patch } }));
  const q = postRailFor(state.postRail.meters, state.postRail.corners, state.postRail.rails);
  return (
    <div className="space-y-7">
      <Question title="Hoeveel liggers?" hint="Drie liggers is steviger en houdt ook kleinere dieren beter tegen.">
        <div className="grid gap-2 sm:grid-cols-2">
          <OptionCard active={state.postRail.rails === 2} onClick={() => set({ rails: 2 })} title="2 liggers" note={`paal met 2 gaten · ${formatPrice(pr.post2.price)}/paal`} />
          <OptionCard active={state.postRail.rails === 3} onClick={() => set({ rails: 3 })} title="3 liggers" note={`paal met 3 gaten · ${formatPrice(pr.post3.price)}/paal`} />
        </div>
      </Question>
      <Question title="Hoeveel lopende meter?">
        <MetersInput value={state.postRail.meters} presets={[10, 20, 30, 50, 100]} onChange={(m) => set({ meters: m })} />
      </Question>
      <Question title="Hoeveel hoeken?" hint="Elke hoek begint een nieuwe rechte lijn.">
        <Stepper label="Aantal hoeken" value={state.postRail.corners} onChange={(v) => set({ corners: v })} />
      </Question>
      <Question title="Afwerking">
        <div className="flex flex-wrap gap-2">
          <Chip active={!state.postRail.peeled} onClick={() => set({ peeled: false })}>Met schors</Chip>
          <Chip active={state.postRail.peeled} onClick={() => set({ peeled: true })}>
            Ontschorst (+{formatPrice(PEELED_SURCHARGE)} per paal en ligger)
          </Chip>
        </div>
      </Question>
      <div className="rounded-xl bg-brand-soft/60 p-4 text-sm text-ink/80">
        <p className="font-semibold text-ink">Uw Post &amp; Rail</p>
        <p className="mt-1">
          {q.sections} vakken van max. 2,90 m → <strong>{q.posts} palen</strong> en <strong>{q.rails} liggers</strong> van 2,90 m.
        </p>
      </div>
    </div>
  );
}

/* 5. Palen ---------------------------------------------------------- */

export function PalenStep({ data, state, update }: StepProps) {
  const options = poleOptionsFor(data, state);
  const recommended = recommendedPoleCount(data, state);
  const chosen = state.poles.reduce((sum, line, i) => sum + (poleResolved(data, state, line, i)?.count ?? 0), 0);
  const setLine = (id: number, patch: Partial<State["poles"][number]>) =>
    update((s) => ({ ...s, poles: s.poles.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));

  const breakdown: string[] = [];
  if (state.types.includes("hekwerk")) state.fences.forEach((f) =>
      breakdown.push(`${fencePostsFor(f.meters, f.height)} voor ${f.meters} m hekwerk${f.height ? ` van ${f.height} cm` : ""}`),
    );
  if (state.types.includes("vlechtschermen")) {
    const s = screenResolved(data, state);
    if (s) breakdown.push(`${s.count + 1} voor ${s.count} vlechtschermen`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-brand-soft/60 p-4 text-sm text-ink/80">
        <p>
          <span className="font-semibold text-ink">Aanbevolen: {recommended} palen</span>
          {breakdown.length > 0 && <> ({breakdown.join(", ")})</>}.
        </p>
        {state.types.includes("hekwerk") && (
          <p className="mt-1">
            Hekwerk: een paal om de ±1,80 m, bij hekwerk vanaf 1,50 m hoog om de ±1,50 m, plus een eindpaal. Op zachte grond zet u
            de palen dichter bij elkaar; nooit meer dan 2 m tussen twee palen. Wij raden ronde palen van ø 8-10 cm aan, met een
            postsaver; ø 6-8 cm is goed als schoorpaal.
          </p>
        )}
        {chosen !== recommended && (
          <p className="mt-1 font-medium text-accent-deep">U heeft nu {chosen} palen gekozen.</p>
        )}
      </div>

      {state.poles.map((line, index) => {
        const p = poleResolved(data, state, line, index);
        const product = p?.product ?? options[0];
        if (!product) return null;
        const saver = p ? postSaverFor(data, product.kind, p.pole) : null;
        return (
          <section key={line.id} className={index > 0 ? "rounded-xl border border-line p-4 sm:p-5" : ""}>
            {index > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Andere palen</h3>
                <button
                  type="button"
                  onClick={() => update((s) => ({ ...s, poles: s.poles.filter((l) => l.id !== line.id) }))}
                  className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" /> Verwijderen
                </button>
              </div>
            )}
            <div className="space-y-7">
              <Question title="Welke palen?">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {options.map((o) => (
                    <OptionCard
                      key={o.handle}
                      active={o.handle === product.handle}
                      onClick={() => setLine(line.id, { handle: o.handle, variantId: null, saver: "none" })}
                      title={o.kind === "kastanje-postsaver" ? "Kastanje paal met postsaver" : o.title}
                      note={`vanaf ${formatPrice(Math.min(...o.poles.map((x) => x.price)))}/stuk`}
                    />
                  ))}
                </div>
              </Question>
              <Question title={isSquarePost(product.kind) ? "Lengte & dikte" : "Lengte & diameter"}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {product.poles.map((x) => (
                    <OptionCard
                      key={x.variantId}
                      active={x.variantId === p?.pole.variantId}
                      disabled={!x.available}
                      onClick={() => setLine(line.id, { variantId: x.variantId })}
                      title={`${x.length} cm · ${poleSize(product.kind, x.diameter)}`}
                      note={`${formatPrice(x.price)}/stuk${x.available ? "" : " · uitverkocht"}`}
                    />
                  ))}
                </div>
              </Question>
              <Question title="Aantal">
                <Stepper label="Aantal palen" value={p?.count ?? 0} onChange={(v) => setLine(line.id, { count: v })} />
              </Question>
              {saver && hasSaverOptions(saver) && (
                <Question title="Postsaver?" hint="Een postsaver beschermt de paal tegen rot in de grond, waar een paal het snelst slijt.">
                  <SaverChoice mode={line.saver} onMode={(mode) => setLine(line.id, { saver: mode })} saver={saver} />
                </Question>
              )}
            </div>
          </section>
        );
      })}

      <button
        type="button"
        onClick={() =>
          update((s) => ({
            ...s,
            poles: [...s.poles, { id: newId(), handle: options[0]?.handle ?? "", variantId: null, count: 1, saver: "none" }],
          }))
        }
        className="inline-flex items-center gap-2 rounded-full border border-dashed border-accent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/5"
      >
        <Plus className="h-4 w-4" /> Andere palen (andere soort of hoogte)
      </button>
    </div>
  );
}

/* 6. Poort ---------------------------------------------------------- */

function gateFrom(data: CalculatorData, handle: string): number | null {
  if (handle === CUSTOM_GATE) return Math.min(...CUSTOM_GATE_TABLE.map((r) => r.prices[0]));
  const g = data.gates.find((x) => x.handle === handle);
  const prices = g?.sizes.filter((s) => s.available).map((s) => s.price) ?? [];
  return prices.length ? Math.min(...prices) : null;
}

/** Postsaver on posts: none, fitted by Natuurhout (surcharge per post), or loose to fit yourself. */
function SaverChoice({
  mode,
  onMode,
  saver,
  diameter,
}: {
  mode: SaverMode;
  onMode: (m: SaverMode) => void;
  saver: PostSaver;
  /** Posts that come with a gate: their diameter is the customer's pick. */
  diameter?: { value: string; onChange: (key: string) => void; saverFor: (key: string) => PostSaver };
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Chip active={mode === "none"} onClick={() => onMode("none")}>Zonder postsaver</Chip>
        {saver.mounted !== null && (
          <Chip active={mode === "mounted"} onClick={() => onMode("mounted")}>
            Aangebracht door ons{diameter ? "" : ` (+${formatPrice(saver.mounted)}/paal)`}
          </Chip>
        )}
        {saver.loose && (
          <Chip active={mode === "loose"} onClick={() => onMode("loose")}>
            Los, zelf aanbrengen{diameter ? "" : ` (${formatPrice(saver.loose.opt.price)}/paal)`}
          </Chip>
        )}
      </div>
      {mode !== "none" && diameter && (
        <div>
          <p className="text-sm font-medium text-ink/80">Diameter van de poortpalen</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {POSTSAVER_KEYS.map((key) => {
              const option = diameter.saverFor(key);
              const price = mode === "loose" ? option.loose?.opt.price : option.mounted;
              return price === undefined || price === null ? null : (
                <Chip key={key} active={diameter.value === key} onClick={() => diameter.onChange(key)}>
                  ø{key} ({mode === "loose" ? "" : "+"}{formatPrice(price)}/paal)
                </Chip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function GateEditor({ data, gate, index, total, set, remove }: {
  data: CalculatorData;
  gate: Gate;
  index: number;
  total: number;
  set: (patch: Partial<Gate>) => void;
  remove: () => void;
}) {
  const option = gateOption(data, gate);
  const isCustom = gate.handle === CUSTOM_GATE;
  const size = gateSize(data, gate);
  const heights = option ? [...new Set(option.sizes.map((s) => s.height).filter((h): h is number => h !== null))] : [];
  const activeHeight = heights.includes(gate.height ?? -1) ? gate.height : null;
  const widthOptions = option ? option.sizes.filter((s) => (heights.length ? s.height === activeHeight : true)) : [];
  const customError =
    isCustom && (gate.customWidth || gate.customHeight)
      ? validateCustomGate(parseFloat(gate.customWidth.replace(",", ".")), parseFloat(gate.customHeight.replace(",", ".")))
      : null;
  const pole = !postsIncluded(data, gate) ? gatePoleResolved(data, gate) : null;
  const poleSaver = pole ? postSaverFor(data, pole.product.kind, pole.pole) : null;
  const hw = option?.fieldGate ? data.fieldGateHardware : null;
  const latch = fieldGateLatch(data, gate);

  const pickType = (handle: string) =>
    set({ handle, height: null, variantId: null, customWidth: "", customHeight: "", saver: "none", poleHandle: null, poleVariantId: null, hinges: true, latch: null, groundPins: 0, black: false });

  const typeCards = [
    ...data.gates.map((g) => ({
      handle: g.handle,
      title: g.title,
      image: g.image,
      note: g.postsIncluded ? "incl. 2 poortpalen en beslag" : g.fieldGate ? "palen en beslag apart" : "incl. beslag, palen apart",
    })),
    { handle: CUSTOM_GATE, title: "Kastanje premium maatwerkpoort", image: "/wp-content/uploads/2016/01/Dubbele-maatwerkpoort-scaled.jpg", note: "uw eigen maten · incl. palen en beslag" },
  ];

  return (
    <section className={total > 1 || index > 0 ? "rounded-xl border border-line p-4 sm:p-5" : ""}>
      {(total > 1 || index > 0) && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Poort {index + 1}</h3>
          <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-red-700">
            <Trash2 className="h-4 w-4" /> Verwijderen
          </button>
        </div>
      )}
      <div className="space-y-7">
        <Question title="Welke poort?">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {typeCards.map((t) => {
              const from = gateFrom(data, t.handle);
              return (
                <button
                  key={t.handle}
                  type="button"
                  aria-pressed={gate.handle === t.handle}
                  onClick={() => pickType(t.handle)}
                  className={`flex flex-col overflow-hidden rounded-xl border text-left transition-colors ${
                    gate.handle === t.handle ? "border-accent ring-2 ring-accent" : "border-brand/15 hover:border-accent"
                  }`}
                >
                  <span className="relative block aspect-[4/3] w-full bg-brand-soft">
                    {t.image && <Image src={t.image} alt="" fill sizes="(max-width: 1024px) 50vw, 200px" className="object-cover" />}
                  </span>
                  <span className="block p-3">
                    <span className="block text-sm font-semibold leading-snug text-ink">{t.title}</span>
                    {from !== null && <span className="block text-xs text-ink/60">vanaf {formatPrice(from)}</span>}
                    <span className="mt-0.5 block text-[11px] leading-snug text-ink/50">{t.note}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Question>

        {gate.handle && (
          <>
            {isCustom ? (
              <Question
                title="Uw maten"
                hint={`Breedte tot ${formatMeters(CUSTOM_GATE_MAX_WIDTH)}, hoogte tot ${formatMeters(CUSTOM_GATE_MAX_HEIGHT)}.${
                  gate.leaves === 2 ? " Bij een dubbele poort: de breedte van één vleugel." : ""
                }`}
              >
                <div className="grid max-w-md grid-cols-2 gap-3">
                  {(["customWidth", "customHeight"] as const).map((key) => (
                    <label key={key} className="text-sm font-medium text-ink">
                      {key === "customWidth" ? "Breedte (cm)" : "Hoogte (cm)"}
                      <input
                        type="number"
                        inputMode="numeric"
                        min={CUSTOM_GATE_MIN}
                        max={key === "customWidth" ? CUSTOM_GATE_MAX_WIDTH : CUSTOM_GATE_MAX_HEIGHT}
                        placeholder={key === "customWidth" ? "bv. 150" : "bv. 120"}
                        value={gate[key]}
                        onChange={(e) => set({ [key]: e.target.value })}
                        aria-invalid={Boolean(customError)}
                        className="mt-1.5 w-full rounded-xl border border-line px-4 py-2.5 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                      />
                    </label>
                  ))}
                </div>
                {customError && <p className="mt-2 text-sm font-medium text-red-700">{customError}</p>}
                {size && !customError && (
                  <p className="mt-2 text-sm text-ink/70">
                    {size.price !== null ? <>Richtprijs: <strong>{formatPrice(size.price)}</strong> per vleugel — {size.detail}.</> : <>Deze maat valt buiten onze prijslijst: <strong>prijs op aanvraag</strong>.</>}
                  </p>
                )}
              </Question>
            ) : (
              option && option.sizes.length > 1 && (
                <>
                  {heights.length > 0 && (
                    <Question title="Welke hoogte?">
                      <div className="flex flex-wrap gap-2">
                        {heights.map((h) => (
                          <Chip
                            key={h}
                            active={h === activeHeight}
                            disabled={!option.sizes.some((s) => s.height === h && s.available)}
                            onClick={() => set({ height: h, variantId: null })}
                          >
                            {h} cm
                          </Chip>
                        ))}
                      </div>
                    </Question>
                  )}
                  {(heights.length === 0 || activeHeight !== null) && (
                    <Question title="Welke breedte?">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {widthOptions.map((s) => (
                          <OptionCard
                            key={s.variantId}
                            active={s.variantId === gate.variantId}
                            disabled={!s.available}
                            onClick={() => set({ variantId: s.variantId })}
                            title={`${s.width} cm breed`}
                            note={`${formatPrice(s.price)}${s.available ? "" : " · uitverkocht"}`}
                          />
                        ))}
                      </div>
                    </Question>
                  )}
                </>
              )
            )}
            {option && option.sizes.length === 1 && (
              <p className="text-sm text-ink/70">Standaardmaat — {formatPrice(option.sizes[0].price)}.</p>
            )}

            <Question title="Enkele of dubbele poort?" hint={gate.leaves === 2 ? "Een dubbele poort bestaat uit 2 vleugels van de gekozen maat." : undefined}>
              <div className="flex flex-wrap gap-2">
                <Chip active={gate.leaves === 1} onClick={() => set({ leaves: 1 })}>Enkele poort</Chip>
                <Chip active={gate.leaves === 2} onClick={() => set({ leaves: 2 })}>Dubbele poort</Chip>
              </div>
            </Question>

            <Question
              title={gate.leaves === 1 ? "Draairichting enkele poort" : "Draairichting dubbele poort"}
              hint={gate.leaves === 1 ? "Bovenaanzicht, gezien vanaf de straat. Kies aan welke kant de scharnieren komen." : "Bovenaanzicht, gezien vanaf de straat."}
            >
              {gate.leaves === 1 ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {(["rechts", "links"] as const).map((side, i) => (
                    <button
                      key={side}
                      type="button"
                      aria-pressed={gate.hinge === side}
                      onClick={() => set({ hinge: side })}
                      className={`overflow-hidden rounded-xl border text-left transition-colors ${
                        gate.hinge === side ? "border-accent ring-2 ring-accent" : "border-brand/15 hover:border-accent"
                      }`}
                    >
                      <GateSwing type={side} />
                      <span className="flex items-start gap-2.5 p-2.5 sm:items-center sm:gap-3 sm:p-3">
                        <span
                          aria-hidden
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${gate.hinge === side ? "border-accent" : "border-ink/30"}`}
                        >
                          {gate.hinge === side && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-ink">Type {i + 1} – {side} enkel</span>
                          <span className="block text-xs text-ink/60">Scharnieren {side}, gezien vanaf de straat</span>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="max-w-sm overflow-hidden rounded-xl border border-brand/15">
                  <GateSwing type="dubbel" />
                  <p className="p-3 text-sm text-ink/70">Beide vleugels draaien naar binnen open, de sluiting zit in het midden.</p>
                </div>
              )}
              <div className="mt-4 rounded-xl bg-brand-soft/60 p-4 text-sm text-ink/75">
                <p>
                  <strong className="text-ink">Standaard draait de poort naar binnen open</strong>, weg van de straat: zo zitten de scharnieren en
                  de sluiting.
                </p>
                <label className="mt-2.5 flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={gate.opens === "buiten"}
                    onChange={(e) => set({ opens: e.target.checked ? "buiten" : "binnen" })}
                    className="mt-0.5 h-4 w-4 accent-[#B05E10]"
                  />
                  <span>
                    De poort moet naar buiten opendraaien.{" "}
                    <span className="text-ink/60">We bespreken dan per mail of telefoon hoe we dat het best doen.</span>
                  </span>
                </label>
              </div>
            </Question>

            {postsIncluded(data, gate) ? (
              <Question
                title="Poortpalen voorzien van een postsaver?"
                hint={`De ${POSTS_PER_GATE} kastanje poortpalen zijn inbegrepen. Een postsaver beschermt de paal tegen rot in de grond.`}
              >
                <SaverChoice
                  mode={gate.saver}
                  onMode={(saver) => set({ saver })}
                  saver={includedPostSaver(data, gate.saverKey)}
                  diameter={{ value: gate.saverKey, onChange: (saverKey) => set({ saverKey }), saverFor: (key) => includedPostSaver(data, key) }}
                />
              </Question>
            ) : (
              pole && (
                <Question title="Poortpalen" hint={`${POSTS_PER_GATE} palen per poort, ook bij een dubbele poort.${option?.fieldGate ? " Voor veldpoorten raden we vierkante eiken palen aan." : gate.handle === "robinia-poort" ? " Voor de robinia poort raden we gezaagde robinia palen aan." : ""}`}>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {data.gatePoles.map((o) => (
                        <Chip key={o.handle} active={o.handle === pole.product.handle} onClick={() => set({ poleHandle: o.handle, poleVariantId: null, saver: "none" })}>
                          {o.title}
                        </Chip>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {pole.product.poles.map((x) => (
                        <OptionCard
                          key={x.variantId}
                          active={x.variantId === pole.pole.variantId}
                          disabled={!x.available}
                          onClick={() => set({ poleVariantId: x.variantId })}
                          title={`${x.length} cm · ${poleSize(pole.product.kind, x.diameter)}`}
                          note={`${formatPrice(x.price)}/stuk${x.available ? "" : " · uitverkocht"}`}
                        />
                      ))}
                    </div>
                    {poleSaver && hasSaverOptions(poleSaver) && (
                      <div>
                        <p className="text-sm font-medium text-ink/80">Poortpalen voorzien van een postsaver?</p>
                        <div className="mt-2">
                          <SaverChoice mode={gate.saver} onMode={(saver) => set({ saver })} saver={poleSaver} />
                        </div>
                      </div>
                    )}
                  </div>
                </Question>
              )
            )}

            {hw ? (
              <Question title="Beslag" hint="Veldpoorten worden zonder hang- en sluitwerk verkocht. Kies wat u nodig heeft.">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-ink/80">Scharnieren</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Chip active={gate.hinges} onClick={() => set({ hinges: true })}>
                        {hw.hinges.title} ({formatPrice(hw.hinges.price)} per vleugel)
                      </Chip>
                      <Chip active={!gate.hinges} onClick={() => set({ hinges: false, black: false })}>Geen scharnieren</Chip>
                    </div>
                  </div>
                  {hw.latches.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-ink/80">Sluiting</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {hw.latches.map((l) => (
                          <Chip key={l.variantId} active={latch?.variantId === l.variantId} disabled={!l.available} onClick={() => set({ latch: l.variantId })}>
                            {l.title} ({formatPrice(l.price)})
                          </Chip>
                        ))}
                        <Chip active={gate.latch === "none"} onClick={() => set({ latch: "none" })}>Geen sluiting</Chip>
                      </div>
                    </div>
                  )}
                  {hw.groundPin && (
                    <div>
                      <p className="text-sm font-medium text-ink/80">
                        {hw.groundPin.title} <span className="font-normal text-ink/55">({formatPrice(hw.groundPin.price)}/stuk — zet de poort vast in open of gesloten stand)</span>
                      </p>
                      <div className="mt-2">
                        <Stepper label="Aantal grondpennen" value={gate.groundPins} max={4} onChange={(v) => set({ groundPins: v })} />
                      </div>
                    </div>
                  )}
                  {gate.hinges && (
                    <div>
                      <p className="text-sm font-medium text-ink/80">Kleur</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Chip active={!gate.black} onClick={() => set({ black: false })}>Verzinkt</Chip>
                        <Chip active={gate.black} onClick={() => set({ black: true })}>
                          Zwart (+{formatPrice(BLACK_HARDWARE_SURCHARGE)} per vleugel)
                        </Chip>
                      </div>
                    </div>
                  )}
                </div>
              </Question>
            ) : (
              <Question title="Beslag" hint="Verzinkt hang- en sluitwerk is inbegrepen.">
                <div className="flex flex-wrap gap-2">
                  <Chip active={!gate.black} onClick={() => set({ black: false })}>Standaard verzinkt</Chip>
                  <Chip active={gate.black} onClick={() => set({ black: true })}>
                    Zwart beslag (+{formatPrice(BLACK_HARDWARE_SURCHARGE)} per vleugel)
                  </Chip>
                </div>
              </Question>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function PoortStep({ data, state, update }: StepProps) {
  const setGate = (id: number, patch: Partial<Gate>) =>
    update((s) => ({ ...s, gates: s.gates.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  const onlyFence = !state.types.includes("poorten") && !state.types.includes("cleftfield");
  return (
    <div className="space-y-6">
      {state.gates.length === 0 && (
        <div className="rounded-xl bg-brand-soft/60 p-4 text-sm text-ink/80">
          {onlyFence ? "Wilt u een poort in uw afsluiting? Voeg er een toe, of ga verder zonder poort." : "Voeg een poort toe."}
        </div>
      )}
      {state.gates.map((gate, i) => (
        <GateEditor
          key={gate.id}
          data={data}
          gate={gate}
          index={i}
          total={state.gates.length}
          set={(patch) => setGate(gate.id, patch)}
          remove={() => update((s) => ({ ...s, gates: s.gates.filter((g) => g.id !== gate.id) }))}
        />
      ))}
      <button
        type="button"
        onClick={() => update((s) => ({ ...s, gates: [...s.gates, newGate()] }))}
        className="inline-flex items-center gap-2 rounded-full border border-dashed border-accent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/5"
      >
        <Plus className="h-4 w-4" /> {state.gates.length ? "Nog een poort" : "Poort toevoegen"}
      </button>
    </div>
  );
}

/** Why the gate step cannot be left yet, or null. */
export function gateStepProblem(data: CalculatorData, state: State): string | null {
  for (const [i, gate] of state.gates.entries()) {
    const n = state.gates.length > 1 ? ` ${i + 1}` : "";
    if (!gate.handle) return `Kies welke poort${n} u wilt, of verwijder ze.`;
    if (gate.handle === CUSTOM_GATE) {
      const err = validateCustomGate(parseFloat(gate.customWidth.replace(",", ".")), parseFloat(gate.customHeight.replace(",", ".")));
      if (err) return `Maatwerkpoort${n}: ${err}`;
    } else if (!gateSize(data, gate)) {
      return `Kies de maat van poort${n}.`;
    }
  }
  return null;
}

/* 7. Plantenbakken -------------------------------------------------- */

export function PlantenbakkenStep({ data, state, update }: StepProps) {
  return (
    <div className="space-y-7">
      {data.planters.map((p) => (
        <Question key={p.handle} title={p.title}>
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {p.sizes.map((z) => (
              <div key={z.variantId} className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{z.title}</p>
                  <p className="text-xs text-ink/60">{formatPrice(z.price)}/stuk{z.available ? "" : " · uitverkocht"}</p>
                </div>
                {z.available ? (
                  <Stepper
                    label={`${p.title} ${z.title}`}
                    value={state.planters[z.variantId] ?? 0}
                    onChange={(v) => update((s) => ({ ...s, planters: { ...s.planters, [z.variantId]: v } }))}
                  />
                ) : (
                  <span className="text-xs text-ink/50">niet leverbaar</span>
                )}
              </div>
            ))}
          </div>
        </Question>
      ))}
    </div>
  );
}

export function plantersProblem(state: State): string | null {
  return Object.values(state.planters).some((q) => q > 0) ? null : "Kies minstens één plantenbak.";
}
