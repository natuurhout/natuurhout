// Time-limited deals (src/lib/deals.ts): Black Friday hazelaar, 27-29 Nov 2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { BLACK_FRIDAY_HAZELAAR as BF, dealPercent, dealRunning, withDealPrices } from "../../src/lib/deals.ts";

const during = Date.parse("2026-11-28T12:00:00+01:00");
const hek = (qty: number, unit = 49) => ({ handle: "hazelaar-hekwerk", qty, unit });

test("runs from Friday 00:00 until Sunday 23:59 (Belgian time)", () => {
  assert.equal(dealRunning(BF, Date.parse("2026-11-26T23:59:59+01:00")), false);
  assert.equal(dealRunning(BF, Date.parse("2026-11-27T00:00:00+01:00")), true);
  assert.equal(dealRunning(BF, Date.parse("2026-11-29T23:59:59+01:00")), true);
  assert.equal(dealRunning(BF, Date.parse("2026-11-30T00:00:00+01:00")), false);
});

test("5%, 7% from € 350 of hazelaar, only on hazelaar lines", () => {
  const palen = { handle: "palen", qty: 50, unit: 10 };
  assert.equal(dealPercent(BF, [hek(2), palen], during), 5, "€ 500 palen do not count for the threshold");
  assert.equal(dealPercent(BF, [hek(7)], during), 5); // € 343
  assert.equal(dealPercent(BF, [hek(7), { handle: "hazelaar-poort", qty: 1, unit: 79 }], during), 7); // € 422
  const lines = withDealPrices([hek(2), palen], during);
  assert.equal(lines[0].unit, 46.55);
  assert.equal(lines[0].dealWas, 49);
  assert.equal(lines[1].unit, 10);
  assert.equal(lines[1].deal, undefined);
});

test("nothing before or after", () => {
  const after = withDealPrices([hek(10)], Date.parse("2026-11-30T00:00:01+01:00"));
  assert.equal(after[0].unit, 49);
  assert.equal(after[0].deal, undefined);
});
