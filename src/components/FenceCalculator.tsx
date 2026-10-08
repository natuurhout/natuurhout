"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/catalog";
import type { CalculatorData } from "@/lib/calculator-pricing";
import { STEP_LABEL, buildLines, initialState, steps, total, type State, type StepId } from "@/components/calculator/model";
import {
  HekwerkStep,
  KeuzeStep,
  PalenStep,
  PlantenbakkenStep,
  PoortStep,
  PostRailStep,
  SchermenStep,
  gateStepProblem,
  plantersProblem,
} from "@/components/calculator/Steps";
import { OverviewStep } from "@/components/calculator/Overview";

/*
 * Afsluitingscalculator. Step 1 picks what to price; only the steps those
 * products need follow (hekwerk → palen → poort …), ending in the material
 * list and a quote request. Every price is a natuurhout.shop variant price or
 * a rule Natuurhout set (calculator-pricing.ts); the total is a richtprijs.
 */
export default function FenceCalculator({ data }: { data: CalculatorData }) {
  const [state, setState] = useState<State>(() => initialState(data));
  const [index, setIndex] = useState(0);
  const [tried, setTried] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  const flow = steps(state.types);
  const current: StepId = flow[Math.min(index, flow.length - 1)];
  const lines = useMemo(() => buildLines(data, state), [data, state]);
  const sum = total(lines);

  const update = (fn: (s: State) => State) => setState(fn);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [current]);

  const problem =
    current === "keuze" && state.types.length === 0
      ? "Kies minstens één product."
      : current === "poort"
        ? gateStepProblem(data, state)
        : current === "plantenbakken"
          ? plantersProblem(state)
          : null;

  function next() {
    if (problem) {
      setTried(true);
      return;
    }
    setTried(false);
    setIndex((i) => Math.min(flow.length - 1, i + 1));
  }

  function back() {
    setTried(false);
    setIndex((i) => Math.max(0, i - 1));
  }

  const position = flow.indexOf(current);
  const groups = [...new Set(lines.map((l) => l.group))].map((group) => ({
    group,
    amount: lines.filter((l) => l.group === group).reduce((s, l) => s + (l.unit === null ? 0 : l.qty * l.unit), 0),
    onRequest: lines.some((l) => l.group === group && l.unit === null),
  }));

  return (
    <div ref={topRef} className="scroll-mt-28">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium text-ink">
            Stap {position + 1} van {flow.length}: {STEP_LABEL[current]}
          </p>
          <p className="text-ink/50">{Math.round(((position + 1) / flow.length) * 100)}%</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-soft">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((position + 1) / flow.length) * 100}%` }} />
        </div>
        <ol className="mt-3 hidden flex-wrap gap-x-5 gap-y-1 text-xs text-ink/50 sm:flex">
          {flow.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                disabled={i > position}
                onClick={() => setIndex(i)}
                className={`${i === position ? "font-semibold text-accent" : i < position ? "text-ink/70 hover:text-accent" : ""}`}
              >
                {i + 1}. {STEP_LABEL[s]}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0 rounded-card bg-white p-5 shadow-sm ring-1 ring-line sm:p-8">
          <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">{STEP_LABEL[current]}</h2>

          {current === "keuze" && <KeuzeStep data={data} state={state} update={update} />}
          {current === "hekwerk" && <HekwerkStep data={data} state={state} update={update} />}
          {current === "vlechtschermen" && <SchermenStep data={data} state={state} update={update} />}
          {current === "postrail" && <PostRailStep data={data} state={state} update={update} />}
          {current === "palen" && <PalenStep data={data} state={state} update={update} />}
          {current === "poort" && <PoortStep data={data} state={state} update={update} />}
          {current === "plantenbakken" && <PlantenbakkenStep data={data} state={state} update={update} />}
          {current === "overzicht" && <OverviewStep data={data} state={state} update={update} lines={lines} />}

          {/* Wizard nav */}
          <div className="mt-10 border-t border-line pt-6">
            {tried && problem && <p className="mb-3 text-sm font-medium text-red-700">{problem}</p>}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={back}
                disabled={position === 0}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 px-5 py-2.5 text-sm font-semibold text-ink/70 transition-colors enabled:hover:border-brand disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Terug
              </button>
              <p className="text-sm text-ink/60 lg:hidden">
                Totaal: <span className="font-semibold text-ink">{formatPrice(sum)}</span>
              </p>
              {current !== "overzicht" && (
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-dark px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
                >
                  {flow[position + 1] === "overzicht" ? "Naar overzicht" : "Volgende"} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Running total */}
        <aside className="hidden rounded-card bg-white p-5 shadow-sm ring-1 ring-line lg:sticky lg:top-24 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Uw richtprijs</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">{formatPrice(sum)}</p>
          <p className="text-xs text-ink/50">incl. btw, excl. levering</p>
          {groups.length > 0 ? (
            <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
              {groups.map((g) => (
                <li key={g.group} className="flex justify-between gap-3">
                  <span className="text-ink/70">{g.group}</span>
                  <span className="font-medium text-ink">
                    {formatPrice(g.amount)}
                    {g.onRequest ? " +" : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border-t border-line pt-4 text-sm text-ink/55">Kies uw producten om de prijs op te bouwen.</p>
          )}
          {lines.some((l) => l.unit === null) && <p className="mt-3 text-xs text-accent-deep">+ maatwerk op aanvraag</p>}
        </aside>
      </div>
    </div>
  );
}
