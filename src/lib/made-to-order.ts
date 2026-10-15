/*
 * What a sold-out variant means per product. Nothing is a dead end: a variant
 * that is not in stock can still be requested ("op bestelling"); the request
 * reaches Natuurhout's inbox and they mail the customer the delivery term.
 * New stock arrives with a freight about every 4 to 5 weeks (Xander),
 * exceptionally later when it is busy or production runs behind.
 * Gates are made after the order comes in; Cleft & Field gates come with the
 * next freight from the supplier.
 */

export type OrderTerm = { badge: string; note: string };

const MADE_TO_MEASURE: OrderTerm = {
  badge: "Op bestelling",
  note: "Wordt voor u gemaakt zodra uw bestelling binnen is. De levertermijn laten we u per mail weten.",
};

const TERMS: Record<string, OrderTerm> = {
  "kastanje-poort-geschroefd": MADE_TO_MEASURE,
  "kastanje-poorten": MADE_TO_MEASURE,
  "maatwerk-poort": MADE_TO_MEASURE,
  // Price list next to the webshop's eiken palen (src/lib/price-updates.ts).
  "eiken-palen-met-postsaver": {
    badge: "Op aanvraag",
    note: "Wij brengen de postsaver voor u aan. Vraag deze palen aan; we bevestigen prijs en levertermijn per mail.",
  },
  // Not in the webshop (src/lib/website-products.ts).
  snelbeton: {
    badge: "Op aanvraag",
    note: "Snelbeton bestelt u via een aanvraag: we houden het klaar om af te halen in Zele of leveren het mee met uw bestelling. We bevestigen per mail.",
  },
  "cleft-field-poorten": {
    badge: "Op bestelling",
    note: "Levertijd ongeveer 4 à 5 weken, met de volgende vracht; uitzonderlijk langer door drukte of productie. We bevestigen de levertermijn per mail.",
  },
};

const BACK_ORDER: OrderTerm = {
  badge: "Uitverkocht",
  note: "Tijdelijk uitverkocht — u kunt het toch aanvragen. Normaal komt er elke 4 à 5 weken een vracht met nieuwe voorraad; uitzonderlijk duurt het langer door drukte of productie. We bevestigen de levertermijn per mail.",
};

export function orderTerm(handle: string): OrderTerm {
  return TERMS[handle] ?? BACK_ORDER;
}
