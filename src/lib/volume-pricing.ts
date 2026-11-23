/*
 * Staffelprijzen (Xander, Nov 2026): a lower price per metre once an order
 * holds enough metres of a product, lengths mixed. Lariks schaaldelen: € 4,95
 * per metre, € 4,55 per metre from 100 m in total (2 m € 9,10, 3 m € 13,65,
 * 4 m € 18,20, 5 m € 22,75). Used by the winkelmandje, the price list, the
 * calculator, /afrekenen/ and the Worker (checkout and order requests), so
 * every total agrees. Prices incl. btw.
 */

export type VolumeRule = { handle: string; perMeter: number; fromMeters: number };

export const VOLUME_RULES: VolumeRule[] = [{ handle: "lariks-planken-delen", perMeter: 4.55, fromMeters: 100 }];

export const volumeRule = (handle: string) => VOLUME_RULES.find((r) => r.handle === handle);

/** "2m" / "2 m" / "2,5 m" → 2 / 2 / 2.5 (null when the title is no length). */
export function metersOf(title: string): number | null {
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*m\b/i.exec(title);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * For each line (product handle, variant title, quantity): the staffel unit
 * price when the order reaches the rule's metres for that product, else null.
 */
export function volumeUnits(lines: { handle: string; title: string; qty: number }[]): (number | null)[] {
  const metres = new Map<string, number>();
  for (const l of lines) {
    const m = metersOf(l.title);
    if (volumeRule(l.handle) && m) metres.set(l.handle, (metres.get(l.handle) ?? 0) + m * l.qty);
  }
  return lines.map((l) => {
    const rule = volumeRule(l.handle);
    const m = metersOf(l.title);
    return rule && m && (metres.get(l.handle) ?? 0) >= rule.fromMeters ? round2(m * rule.perMeter) : null;
  });
}

/** Metres of a staffel product in these lines, and how many are still missing for its staffel. */
export function volumeProgress(handle: string, lines: { handle: string; title: string; qty: number }[]) {
  const rule = volumeRule(handle);
  if (!rule) return null;
  const metres = lines.filter((l) => l.handle === handle).reduce((t, l) => t + (metersOf(l.title) ?? 0) * l.qty, 0);
  return { rule, metres, reached: metres >= rule.fromMeters, missing: Math.max(0, rule.fromMeters - metres) };
}

/** Lines with the staffel price applied (unit), and the price they had (was) where it changed. */
export function withVolumePrices<T extends { handle: string; qty: number; unit: number }>(lines: T[], titleOf: (line: T) => string): (T & { was?: number })[] {
  const units = volumeUnits(lines.map((l) => ({ handle: l.handle, title: titleOf(l), qty: l.qty })));
  return lines.map((l, i) => {
    const unit = units[i];
    return unit !== null && unit < l.unit ? { ...l, unit, was: l.unit } : l;
  });
}
