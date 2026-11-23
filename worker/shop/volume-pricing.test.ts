/* Staffelprijzen (npm test): lariks schaaldelen € 4,55/m from 100 m, lengths mixed. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { metersOf, volumeUnits, withVolumePrices } from "../../src/lib/volume-pricing.ts";

const L = "lariks-planken-delen";

test("lengths read from the variant title", () => {
  assert.equal(metersOf("2m"), 2);
  assert.equal(metersOf("5 m"), 5);
  assert.equal(metersOf("2,5m"), 2.5);
  assert.equal(metersOf("Inbussleutel"), null);
});

test("below 100 m: the normal price", () => {
  assert.deepEqual(volumeUnits([{ handle: L, title: "4m", qty: 24 }]), [null]); // 96 m
});

test("from 100 m, lengths mixed: € 4,55 per metre on every length", () => {
  const units = volumeUnits([
    { handle: L, title: "2m", qty: 10 }, // 20 m
    { handle: L, title: "3m", qty: 10 }, // 30 m
    { handle: L, title: "5m", qty: 10 }, // 50 m
    { handle: "palen", title: "2m", qty: 50 }, // another product: not counted, not changed
  ]);
  assert.deepEqual(units, [9.1, 13.65, 22.75, null]);
});

test("exactly 100 m counts; 4 m costs € 18,20", () => {
  assert.deepEqual(volumeUnits([{ handle: L, title: "4m", qty: 25 }]), [18.2]);
});

test("withVolumePrices keeps the old price as 'was'", () => {
  const out = withVolumePrices([{ handle: L, label: "5m", qty: 20, unit: 24.75 }], (l) => l.label);
  assert.equal(out[0].unit, 22.75);
  assert.equal(out[0].was, 24.75);
});
