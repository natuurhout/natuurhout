"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";

export function Chip({
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
      aria-pressed={active}
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

/** Larger selectable card: title plus a price or note line. */
export function OptionCard({
  active,
  disabled,
  onClick,
  title,
  note,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: React.ReactNode;
  note?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-full flex-col rounded-xl border p-3.5 text-left transition-colors ${
        active
          ? "border-accent bg-accent/5 ring-1 ring-accent"
          : disabled
            ? "cursor-not-allowed border-brand/10 bg-white opacity-50"
            : "border-brand/15 bg-white hover:border-accent"
      }`}
    >
      <span className="block text-sm font-semibold text-ink">{title}</span>
      {note && <span className="mt-0.5 text-xs text-ink/60">{note}</span>}
      {children}
    </button>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center rounded-full border border-brand/25 bg-white">
      <button
        type="button"
        className="rounded-l-full px-3 py-2 text-ink/60 transition-colors hover:text-accent disabled:text-ink/25"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`${label} verlagen`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-9 text-center text-sm font-semibold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="rounded-r-full px-3 py-2 text-ink/60 transition-colors hover:text-accent disabled:text-ink/25"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`${label} verhogen`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </span>
  );
}

export function Question({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="mt-0.5 text-sm text-ink/60">{hint}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-2.5 text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15";

export function Field({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-msg`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="text-accent"> *</span> : <span className="font-normal text-ink/50"> (optioneel)</span>}
      </label>
      <div className="mt-1.5">
        {children({ id, "aria-invalid": Boolean(error), "aria-describedby": error || hint ? messageId : undefined })}
      </div>
      {(error || hint) && (
        <p id={messageId} className={`mt-1 text-xs ${error ? "font-medium text-red-700" : "text-ink/55"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

/** Meters input with quick presets. */
export function MetersInput({
  value,
  onChange,
  presets = [5, 10, 15, 20, 25, 50],
  label = "meter",
}: {
  value: number;
  onChange: (v: number) => void;
  presets?: number[];
  label?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((m) => (
        <Chip key={m} active={value === m} onClick={() => onChange(m)}>
          {m} m
        </Chip>
      ))}
      <label htmlFor={id} className="ml-1 inline-flex items-center gap-2 text-sm text-ink/70">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={1}
          step={0.5}
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-24 rounded-lg border border-brand/25 px-3 py-2 text-sm text-ink"
        />
        {label}
      </label>
    </div>
  );
}
