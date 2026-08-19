"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/catalog";

/*
 * Afsluitingscalculator — interaction model references
 * kastanjegjerde.no/gjerdekalkulator (steps: rollen → palen → poort &
 * extra → resultaat, with a running total). Every price shown comes
 * verbatim from natuurhout.shop variants; the result is explicitly a
 * "richtprijs" and ordering happens in the webshop.
 */

export type CalcRoll = {
  variantId: number;
  title: string;
  price: number;
  available: boolean;
  height: number;
  spacing: string;
  rollLength: number;
};

export type CalcFence = {
  handle: string;
  title: string;
  shopUrl: string;
  image?: string;
  rolls: CalcRoll[];
};

export type CalcPole = {
  variantId: number;
  title: string;
  price: number;
  available: boolean;
  length: number;
  diameter: string;
};

export type CalcPoleProduct = {
  handle: string;
  title: string;
  shopUrl: string;
  poles: CalcPole[];
};

export type CalcGate = {
  handle: string;
  title: string;
  shopUrl: string;
  image?: string;
  priceFrom: number;
  available: boolean;
};

const METER_PRESETS = [5, 10, 15, 20, 25, 50];
const STEPS = ["Hekwerk", "Palen", "Poort & extra", "Resultaat"];

function Chip({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent text-white"
          : disabled
            ? "cursor-not-allowed border-brand/15 text-ink/30 line-through"
            : "border-brand/25 bg-white text-ink hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand/25 bg-white">
      <button
        type="button"
        className="px-3 py-1.5 text-lg leading-none text-ink/60 hover:text-accent"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="minder"
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold">{value}</span>
      <button
        type="button"
        className="px-3 py-1.5 text-lg leading-none text-ink/60 hover:text-accent"
        onClick={() => onChange(value + 1)}
        aria-label="meer"
      >
        +
      </button>
    </span>
  );
}

export default function FenceCalculator({
  fences,
  poleProducts,
  gates,
  postsavers,
}: {
  fences: CalcFence[];
  poleProducts: CalcPoleProduct[];
  gates: CalcGate[];
  postsavers: { variantId: number; title: string; price: number; available: boolean; shopUrl: string }[];
}) {
  const [step, setStep] = useState(0);
  const [meters, setMeters] = useState(10);
  const [fenceHandle, setFenceHandle] = useState(fences[0]?.handle ?? "");
  const fence = fences.find((f) => f.handle === fenceHandle) ?? fences[0];
  const heights = useMemo(
    () => [...new Set(fence.rolls.map((r) => r.height))].sort((a, b) => a - b),
    [fence]
  );
  const [height, setHeight] = useState<number | null>(null);
  const activeHeight = height !== null && heights.includes(height) ? height : heights[0];
  const spacingOptions = fence.rolls.filter((r) => r.height === activeHeight);
  const [rollVariantId, setRollVariantId] = useState<number | null>(null);
  const roll =
    spacingOptions.find((r) => r.variantId === rollVariantId) ??
    spacingOptions.find((r) => r.available) ??
    spacingOptions[0];
  const recommendedRolls = roll ? Math.max(1, Math.ceil(meters / roll.rollLength)) : 0;
  const [rollCountOverride, setRollCountOverride] = useState<number | null>(null);
  const rollCount = rollCountOverride ?? recommendedRolls;

  // Palen — richtwaarde: 1 paal per 2 meter + 1 (aanpasbaar).
  const [poleHandle, setPoleHandle] = useState(poleProducts[0]?.handle ?? "");
  const poleProduct = poleProducts.find((p) => p.handle === poleHandle) ?? poleProducts[0];
  const [poleVariantId, setPoleVariantId] = useState<number | null>(null);
  const pole =
    poleProduct.poles.find((p) => p.variantId === poleVariantId) ??
    poleProduct.poles.find((p) => p.available && p.length >= (activeHeight ?? 0) + 30) ??
    poleProduct.poles[0];
  const recommendedPoles = Math.max(2, Math.ceil(meters / 2) + 1);
  const [poleCountOverride, setPoleCountOverride] = useState<number | null>(null);
  const poleCount = poleCountOverride ?? recommendedPoles;

  // Poort & extra
  const [gateHandle, setGateHandle] = useState<string | null>(null);
  const gate = gates.find((g) => g.handle === gateHandle) ?? null;
  const [gateCount, setGateCount] = useState(1);
  const [postsaverVariantId, setPostsaverVariantId] = useState<number | null>(null);
  const postsaver = postsavers.find((p) => p.variantId === postsaverVariantId) ?? null;

  const lines = useMemo(() => {
    const out: { label: string; qty: number; unit: number; url: string; note?: string }[] = [];
    if (roll) {
      out.push({
        label: `${fence.title} — ${roll.title}`,
        qty: rollCount,
        unit: roll.price,
        url: `${fence.shopUrl}?variant=${roll.variantId}`,
        note: `${rollCount} × ${roll.rollLength}m = ${rollCount * roll.rollLength}m`,
      });
    }
    if (pole && poleCount > 0) {
      out.push({
        label: `${poleProduct.title} — ${pole.title}`,
        qty: poleCount,
        unit: pole.price,
        url: `${poleProduct.shopUrl}?variant=${pole.variantId}`,
      });
    }
    if (gate) {
      out.push({
        label: `${gate.title} (vanaf)`,
        qty: gateCount,
        unit: gate.priceFrom,
        url: gate.shopUrl,
      });
    }
    if (postsaver && poleCount > 0) {
      out.push({
        label: postsaver.title,
        qty: poleCount,
        unit: postsaver.price,
        url: postsaver.shopUrl,
      });
    }
    return out;
  }, [fence, roll, rollCount, poleProduct, pole, poleCount, gate, gateCount, postsaver]);

  const total = lines.reduce((s, l) => s + l.qty * l.unit, 0);

  return (
    <div className="relative">
      {/* Running total badge */}
      <div className="pointer-events-none sticky top-40 z-10 float-right -mr-2 hidden rounded-card bg-white p-4 shadow-lg ring-1 ring-line lg:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
          Lopend totaal
        </p>
        <p className="text-2xl font-semibold text-ink">{formatPrice(total)}</p>
        <p className="text-xs text-ink/50">richtprijs incl. btw</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium">
            Stap {step + 1} van {STEPS.length}: {STEPS[step]}
          </p>
          <p className="text-ink/50">{Math.round(((step + 1) / STEPS.length) * 100)}%</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-soft">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <ol className="mt-3 hidden gap-6 text-xs text-ink/50 sm:flex">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? "font-semibold text-accent" : ""}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </div>

      <div className="max-w-3xl rounded-card bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
        {step === 0 && (
          <div className="space-y-8">
            <div>
              <p className="font-semibold">Welke houtsoort wenst u?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {fences.map((f) => (
                  <Chip
                    key={f.handle}
                    active={f.handle === fence.handle}
                    onClick={() => {
                      setFenceHandle(f.handle);
                      setHeight(null);
                      setRollVariantId(null);
                      setRollCountOverride(null);
                    }}
                  >
                    {f.title}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold">Hoeveel lopende meter heeft u nodig?</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {METER_PRESETS.map((m) => (
                  <Chip
                    key={m}
                    active={meters === m}
                    onClick={() => {
                      setMeters(m);
                      setRollCountOverride(null);
                      setPoleCountOverride(null);
                    }}
                  >
                    {m}m
                  </Chip>
                ))}
                <label className="ml-1 inline-flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    min={1}
                    value={meters}
                    onChange={(e) => {
                      setMeters(Math.max(1, Number(e.target.value) || 1));
                      setRollCountOverride(null);
                      setPoleCountOverride(null);
                    }}
                    className="w-20 rounded-lg border border-brand/25 px-3 py-2 text-sm"
                  />
                  meter
                </label>
              </div>
            </div>
            <div>
              <p className="font-semibold">Welke hoogte wenst u?</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {heights.map((h) => {
                  const cheapest = fence.rolls
                    .filter((r) => r.height === h)
                    .sort((a, b) => a.price - b.price)[0];
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setHeight(h);
                        setRollVariantId(null);
                        setRollCountOverride(null);
                      }}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        h === activeHeight
                          ? "border-accent bg-brand-soft"
                          : "border-brand/15 bg-white hover:border-accent"
                      }`}
                    >
                      <span className="block font-semibold">{h} cm</span>
                      <span className="text-xs text-ink/60">
                        vanaf {formatPrice(cheapest.price)}/rol
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="font-semibold">Welke latafstand wenst u?</p>
              <p className="text-sm text-ink/60">
                Kleinere afstand tussen de latten geeft meer privacy.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {spacingOptions.map((r) => (
                  <button
                    key={r.variantId}
                    type="button"
                    disabled={!r.available}
                    onClick={() => {
                      setRollVariantId(r.variantId);
                      setRollCountOverride(null);
                    }}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      roll?.variantId === r.variantId
                        ? "border-accent bg-brand-soft"
                        : r.available
                          ? "border-brand/15 bg-white hover:border-accent"
                          : "cursor-not-allowed border-brand/10 bg-white opacity-50"
                    }`}
                  >
                    <span className="block font-semibold">
                      {r.spacing} <span className="font-normal">({r.rollLength}m rol)</span>
                    </span>
                    <span className="text-xs text-ink/60">
                      {formatPrice(r.price)}/rol{r.available ? "" : " — uitverkocht"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold">Aantal rollen</p>
              {roll && (
                <p className="text-sm text-ink/60">
                  Aanbevolen: {recommendedRolls} {recommendedRolls === 1 ? "rol" : "rollen"} ({roll.rollLength}m per rol) voor {meters}m afsluiting.
                </p>
              )}
              <div className="mt-3">
                <Stepper value={rollCount} min={1} onChange={setRollCountOverride} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <div>
              <p className="font-semibold">Welke palen wenst u?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {poleProducts.map((p) => (
                  <Chip
                    key={p.handle}
                    active={p.handle === poleProduct.handle}
                    onClick={() => {
                      setPoleHandle(p.handle);
                      setPoleVariantId(null);
                    }}
                  >
                    {p.title}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold">Lengte &amp; diameter</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {poleProduct.poles.map((p) => (
                  <button
                    key={p.variantId}
                    type="button"
                    disabled={!p.available}
                    onClick={() => setPoleVariantId(p.variantId)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      pole?.variantId === p.variantId
                        ? "border-accent bg-brand-soft"
                        : p.available
                          ? "border-brand/15 bg-white hover:border-accent"
                          : "cursor-not-allowed border-brand/10 bg-white opacity-50"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {p.length}cm / ø{p.diameter}
                    </span>
                    <span className="text-xs text-ink/60">
                      {formatPrice(p.price)}/stuk{p.available ? "" : " — uitverkocht"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold">Aantal palen</p>
              <p className="text-sm text-ink/60">
                Richtwaarde: één paal per 2 meter, plus één eindpaal —
                aanpasbaar naar uw situatie.
              </p>
              <div className="mt-3">
                <Stepper value={poleCount} min={0} onChange={setPoleCountOverride} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div>
              <p className="font-semibold">Wenst u een poort?</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setGateHandle(null)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    gate === null
                      ? "border-accent bg-brand-soft"
                      : "border-brand/15 bg-white hover:border-accent"
                  }`}
                >
                  <span className="font-semibold">Geen poort</span>
                </button>
                {gates.map((g) => (
                  <button
                    key={g.handle}
                    type="button"
                    disabled={!g.available}
                    onClick={() => setGateHandle(g.handle)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      gate?.handle === g.handle
                        ? "border-accent bg-brand-soft"
                        : g.available
                          ? "border-brand/15 bg-white hover:border-accent"
                          : "cursor-not-allowed border-brand/10 bg-white opacity-50"
                    }`}
                  >
                    <span className="block font-semibold">{g.title}</span>
                    <span className="text-xs text-ink/60">
                      vanaf {formatPrice(g.priceFrom)}
                      {g.available ? "" : " — uitverkocht"}
                    </span>
                  </button>
                ))}
              </div>
              {gate && (
                <div className="mt-3 flex items-center gap-3 text-sm">
                  Aantal poorten <Stepper value={gateCount} min={1} onChange={setGateCount} />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold">Postsaver paalbescherming (optioneel)</p>
              <p className="text-sm text-ink/60">
                Wordt gerekend per paal ({poleCount} stuks).
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPostsaverVariantId(null)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    postsaver === null
                      ? "border-accent bg-brand-soft"
                      : "border-brand/15 bg-white hover:border-accent"
                  }`}
                >
                  <span className="font-semibold">Geen postsaver</span>
                </button>
                {postsavers.map((p) => (
                  <button
                    key={p.variantId}
                    type="button"
                    disabled={!p.available}
                    onClick={() => setPostsaverVariantId(p.variantId)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      postsaver?.variantId === p.variantId
                        ? "border-accent bg-brand-soft"
                        : p.available
                          ? "border-brand/15 bg-white hover:border-accent"
                          : "cursor-not-allowed border-brand/10 bg-white opacity-50"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{p.title}</span>
                    <span className="text-xs text-ink/60">{formatPrice(p.price)}/stuk</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="font-semibold">Uw materiaallijst voor {meters}m afsluiting</p>
            <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-line">
              <table className="w-full text-sm">
                <thead className="bg-brand-soft text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Product</th>
                    <th className="px-4 py-2.5 font-semibold">Aantal</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Subtotaal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand/10 bg-white">
                  {lines.map((l) => (
                    <tr key={l.label}>
                      <td className="px-4 py-2.5">
                        <a href={l.url} target="_blank" rel="noopener" className="font-medium text-accent hover:underline">
                          {l.label}
                        </a>
                        {l.note && <span className="block text-xs text-ink/50">{l.note}</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        {l.qty} × {formatPrice(l.unit)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {formatPrice(l.qty * l.unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-brand-dark text-white">
                  <tr>
                    <td className="px-4 py-3 font-semibold" colSpan={2}>
                      Totaal (richtprijs, incl. btw)
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-semibold">
                      {formatPrice(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-3 text-xs text-ink/60">
              Dit is een indicatieve richtprijs op basis van de actuele
              webshopprijzen — geen offerte. Voorraad, levering en maatwerk
              worden bevestigd via de webshop of een offerte op maat.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://natuurhout.shop/"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-deep"
              >
                Bestel in de webshop ↗
              </a>
              <a
                href="/offerte-aanvragen/"
                className="inline-flex items-center gap-2 rounded-full border border-brand/30 px-6 py-3 text-sm font-semibold text-brand transition-colors hover:border-brand hover:bg-brand-soft"
              >
                Offerte aanvragen
              </a>
            </div>
          </div>
        )}

        {/* Wizard nav */}
        <div className="mt-10 flex items-center justify-between border-t border-brand/10 pt-6">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-full border border-brand/25 px-6 py-2.5 text-sm font-semibold text-ink/70 transition-colors enabled:hover:border-brand disabled:opacity-40"
          >
            ‹ Terug
          </button>
          <p className="text-sm text-ink/60 lg:hidden">
            Totaal: <span className="font-semibold text-ink">{formatPrice(total)}</span>
          </p>
          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="rounded-full bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
            >
              Volgende ›
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
