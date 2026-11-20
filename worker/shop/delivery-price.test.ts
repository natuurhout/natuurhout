/*
 * Delivery price tests (npm test): Natuurhout's November 2026 settings and
 * the cases they asked for. Runs with Node's own test runner on the
 * TypeScript source (type stripping), no build step.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { priceDelivery, type DeliveryQuote, type PriceSettings } from "./delivery-price.ts";
import { DELIVERY_SETTINGS_2026_11 } from "./delivery-defaults.ts";

const settings: PriceSettings = { ...DELIVERY_SETTINGS_2026_11, roundUp: false, rules: [] };
const quote = (km: number, postcode: string, subtotal: number, s: PriceSettings = settings): DeliveryQuote =>
  priceDelivery(s, { postcode, place: "Testgemeente", km }, { subtotal, lines: [] });

function price(q: DeliveryQuote): number {
  assert.ok(q.ok, `expected delivery, got: ${q.ok ? "" : q.reason}`);
  return q.ok ? q.price : NaN;
}

test("8 km, 9200, €40: €20, delivery possible", () => {
  assert.equal(price(quote(8, "9200", 40)), 20);
});

test("60 km, 8000, €250: €60 − €5 = €55", () => {
  assert.equal(price(quote(60, "8000", 250)), 55);
});

test("60 km, 8000, €135: blocked, €65 to go", () => {
  const q = quote(60, "8000", 135);
  assert.equal(q.ok, false);
  if (q.ok) return;
  assert.equal(q.minimum, 200);
  assert.equal(q.short, 65);
  assert.equal(q.atMinimum, 55);
  assert.equal(q.reason, "Nog €65 bijbestellen voor levering naar 8000 Testgemeente. Levering op deze afstand kan vanaf €200 en kost dan €55. Afhalen in Zele kan altijd.");
});

test("90 km, 2000, €350: €80 + €5 = €85", () => {
  assert.equal(price(quote(90, "2000", 350)), 85);
});

test("120 km, 3500, €350: blocked, €50 to go", () => {
  const q = quote(120, "3500", 350);
  assert.equal(q.ok, false);
  if (q.ok) return;
  assert.equal(q.minimum, 400);
  assert.equal(q.short, 50);
  assert.match(q.reason, /^Nog €50 bijbestellen voor levering naar 3500 /);
});

test("250 km, 6700, €3000: free delivery", () => {
  assert.equal(price(quote(250, "6700", 3000)), 0);
});

test("320 km, 6700, €5000: out of range, pickup only", () => {
  const q = quote(320, "6700", 5000);
  assert.equal(q.ok, false);
  if (q.ok) return;
  assert.equal(q.minimum, undefined);
  assert.match(q.reason, /tot 300 km/);
});

test("never below €20: West-Vlaanderen within 10 km stays €20", () => {
  assert.equal(price(quote(8, "8000", 40)), 20);
});

test("up to 30 km there is no minimum, from 31 km there is", () => {
  assert.equal(price(quote(30, "9000", 1)), 45);
  const q = quote(31, "9000", 1);
  assert.equal(q.ok, false);
  if (!q.ok) assert.equal(q.minimum, 200);
});

test("a postcode without a region row adds nothing", () => {
  const s = { ...settings, regions: settings.regions.filter((r) => r.from !== 9000) };
  assert.equal(price(quote(20, "9000", 100, s)), 30);
});

test("the minimum counts at the exact amount", () => {
  assert.equal(price(quote(60, "9000", 200)), 60);
});

test("free delivery wins over band and region", () => {
  assert.equal(price(quote(90, "2000", 2800)), 0);
});

test("without a place the messages name only the postcode", () => {
  const q = priceDelivery(settings, { postcode: "8000", place: "", km: 78 }, { subtotal: 100, lines: [] });
  assert.equal(q.ok, false);
  if (!q.ok) assert.match(q.reason, /^Nog €200 bijbestellen voor levering naar 8000\. Levering op deze afstand kan vanaf €300 en kost dan €\d+\. Afhalen in Zele kan altijd\.$/);
});

test("below the minimum: the price once the minimum is reached, free when free delivery applies", () => {
  const q = quote(60, "8000", 135);
  assert.equal(q.ok, false);
  if (!q.ok) assert.equal(q.atMinimum, price(quote(60, "8000", 200)));
  const free = { ...settings, freeAbove: 200 };
  const f = quote(60, "8000", 135, free);
  assert.equal(f.ok, false);
  if (!f.ok) {
    assert.equal(f.atMinimum, 0);
    assert.match(f.reason, /vanaf €200 en is dan gratis\./);
  }
});
