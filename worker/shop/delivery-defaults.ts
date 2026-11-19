/*
 * The delivery prices Natuurhout set in November 2026, written into the
 * settings once by migration 6 (worker/crm/schema.ts) and checked by
 * delivery-price.test.ts. After that the backend (Checkout → Prijs per
 * afstand) is where they live: change them there, not here. This snapshot
 * stays as it is, like a shipped migration.
 */

import type { Band, MinBand, Region } from "./delivery-price.ts";

export const DELIVERY_SETTINGS_2026_11: { bands: Band[]; maxKm: number; freeAbove: number; minPrice: number; minimums: MinBand[]; regions: Region[] } = {
  bands: [
    { upTo: 10, price: 20, perKm: 0 },
    { upTo: 25, price: 30, perKm: 0 },
    { upTo: 50, price: 45, perKm: 0 },
    { upTo: 75, price: 60, perKm: 0 },
    { upTo: 100, price: 80, perKm: 0 },
    { upTo: 150, price: 110, perKm: 0 },
    { upTo: 200, price: 130, perKm: 0 },
    { upTo: 300, price: 160, perKm: 0 },
  ],
  maxKm: 300,
  freeAbove: 2800,
  minPrice: 20,
  minimums: [
    { upTo: 30, min: 0 },
    { upTo: 75, min: 200 },
    { upTo: 100, min: 300 },
    { upTo: 150, min: 400 },
    { upTo: 300, min: 750 },
  ],
  regions: [
    { from: 1000, to: 1299, amount: 5, label: "Brussel" },
    { from: 1300, to: 1499, amount: 5, label: "Waals-Brabant" },
    { from: 1500, to: 1999, amount: 5, label: "Vlaams-Brabant (Halle-Vilvoorde)" },
    { from: 2000, to: 2999, amount: 5, label: "Antwerpen" },
    { from: 3000, to: 3499, amount: 5, label: "Vlaams-Brabant (Leuven)" },
    { from: 3500, to: 3999, amount: 5, label: "Limburg" },
    { from: 4000, to: 4999, amount: 5, label: "Luik" },
    { from: 5000, to: 5999, amount: 5, label: "Namen" },
    { from: 6000, to: 6599, amount: 5, label: "Henegouwen (Charleroi)" },
    { from: 6600, to: 6999, amount: 5, label: "Luxemburg" },
    { from: 7000, to: 7999, amount: 0, label: "Henegouwen (Bergen, Doornik)" },
    { from: 8000, to: 8999, amount: -5, label: "West-Vlaanderen" },
    { from: 9000, to: 9999, amount: 0, label: "Oost-Vlaanderen" },
  ],
};
