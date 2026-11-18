// Builds worker/shop/data/be-postcodes.json: every Belgian postcode with its
// road distance (km) from the Natuurhout yard in Zele. The checkout prices
// delivery on that distance (bands and rules in the backend: Checkout tab).
//
// Run again only when the yard moves or postcodes change:
//   node scripts/build-delivery-distances.mjs
//
// Sources (both open data, attribution in the output file):
// - Postcodes + coordinates: GeoNames postal codes, BE.zip (CC BY 4.0).
//   A postcode with several places gets the average of their coordinates.
// - Road distances: OSRM public demo server on OpenStreetMap data (ODbL),
//   a dozen batched /table requests, 1.2 s apart (its usage policy).
//   A postcode OSRM cannot route gets straight-line distance x 1.3, flagged.

import { writeFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";

// A. Van der Moerenstraat, 9240 Zele (OpenStreetMap; the street, within a few hundred metres).
const YARD = { lat: 51.0790489, lon: 4.0584665, label: "A. Van der Moerenstraat 39, 9240 Zele" };
const OUT = new URL("../worker/shop/data/be-postcodes.json", import.meta.url);
const UA = { "user-agent": "natuurhout-delivery-distances/1.0" };
const BATCH = 80;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One file from a zip, via the central directory (sizes may be missing in local headers). */
function unzipFirst(buf, name) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("not a zip");
  let p = buf.readUInt32LE(eocd + 16);
  const entries = buf.readUInt16LE(eocd + 10);
  for (let k = 0; k < entries; k++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const file = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (file === name) {
      const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const data = buf.subarray(start, start + size);
      return (method === 8 ? inflateRawSync(data) : data).toString("utf8");
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${name} not found in the zip`);
}

const zip = Buffer.from(await (await fetch("https://download.geonames.org/export/zip/BE.zip", { headers: UA })).arrayBuffer());
const rows = unzipFirst(zip, "BE.txt").trim().split("\n").map((l) => l.split("\t"));
// columns (no municipality column, so every place of a postcode is kept): country, postal code, place name, admin1..3 (name, code), latitude, longitude, accuracy
const byPc = new Map();
for (const r of rows) {
  const pc = r[1];
  const lat = Number(r[9]);
  const lon = Number(r[10]);
  if (!/^\d{4}$/.test(pc) || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  const e = byPc.get(pc) ?? { names: [], lat: 0, lon: 0, n: 0 };
  e.names.push(r[2]);
  e.lat += lat;
  e.lon += lon;
  e.n += 1;
  byPc.set(pc, e);
}
const list = [...byPc].map(([pc, e]) => ({ pc, names: [...new Set(e.names)], lat: e.lat / e.n, lon: e.lon / e.n })).sort((a, b) => a.pc.localeCompare(b.pc));
console.log(`${list.length} postcodes`);

function crowKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const out = {};
let estimated = 0;
for (let i = 0; i < list.length; i += BATCH) {
  const batch = list.slice(i, i + BATCH);
  const coords = [YARD, ...batch].map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(";");
  let km = [];
  try {
    const res = await fetch(`https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance`, { headers: UA });
    const json = await res.json();
    if (json.code !== "Ok") throw new Error(json.code);
    km = json.distances[0].slice(1).map((m) => (m == null ? null : m / 1000));
  } catch (error) {
    console.warn(`batch ${i}: ${error.message}, straight-line estimate`);
  }
  batch.forEach((p, j) => {
    const road = km[j];
    const est = road == null;
    if (est) estimated++;
    out[p.pc] = { n: p.names, km: Math.round((est ? crowKm(YARD, p) * 1.3 : road) * 10) / 10, ...(est ? { est: 1 } : {}) };
  });
  process.stdout.write(`\r${Math.min(i + BATCH, list.length)}/${list.length}`);
  await sleep(1200);
}
console.log(`\n${estimated} estimated (no route)`);

await writeFile(
  OUT,
  `${JSON.stringify(
    {
      _about: `Road distance in km from ${YARD.label} per Belgian postcode. Built ${new Date().toISOString().slice(0, 10)} by scripts/build-delivery-distances.mjs. Postcodes: GeoNames (CC BY 4.0, geonames.org). Routes: OSRM on OpenStreetMap data (ODbL, openstreetmap.org/copyright). est = straight-line x 1.3.`,
      yard: YARD,
      postcodes: out,
    },
    null,
    0,
  )}\n`,
);
console.log(`wrote ${OUT.pathname}`);
