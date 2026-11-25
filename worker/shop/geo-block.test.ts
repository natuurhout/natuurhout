// Regions blocked from the site (worker/geo-block.ts): the pure rule.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_GEO_BLOCK, isBlocked, parseCodes } from "../geo-block.ts";

test("defaults block Africa, Asia, South America and Tor", () => {
  assert.equal(isBlocked(DEFAULT_GEO_BLOCK, "NG", "AF"), true);
  assert.equal(isBlocked(DEFAULT_GEO_BLOCK, "IN", "AS"), true);
  assert.equal(isBlocked(DEFAULT_GEO_BLOCK, "CN", "AS"), true);
  assert.equal(isBlocked(DEFAULT_GEO_BLOCK, "BR", "SA"), true);
  assert.equal(isBlocked(DEFAULT_GEO_BLOCK, "T1", ""), true);
});

test("customers' countries and search engine land stay open", () => {
  for (const [c, k] of [["BE", "EU"], ["NL", "EU"], ["DE", "EU"], ["PL", "EU"], ["UA", "EU"], ["US", "NA"], ["FR", "EU"]]) assert.equal(isBlocked(DEFAULT_GEO_BLOCK, c, k), false, c);
  // Cyprus counts as Asia for some databases: Europe is never blocked.
  assert.equal(isBlocked(DEFAULT_GEO_BLOCK, "CY", "AS"), false);
  // Unknown country: let in.
  assert.equal(isBlocked(DEFAULT_GEO_BLOCK, "", "AS"), false);
  assert.equal(isBlocked(DEFAULT_GEO_BLOCK, "XX", ""), false);
});

test("extra countries and exceptions", () => {
  const rules = { continents: ["AS"], countries: ["RU", "BE"], allow: ["IL"] };
  assert.equal(isBlocked(rules, "RU", "EU"), true);
  assert.equal(isBlocked(rules, "IL", "AS"), false);
  assert.equal(isBlocked(rules, "BE", "EU"), false, "Belgium can never be blocked");
  assert.deepEqual(parseCodes("ru, by;t1  xx-1 RU"), ["RU", "BY", "T1", "XX"]);
});
