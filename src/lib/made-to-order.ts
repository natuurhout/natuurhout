/*
 * What a sold-out variant means per product. Nothing is a dead end: a variant
 * that is not in stock can still be requested ("op bestelling"); the request
 * reaches Natuurhout's inbox and they mail the customer the delivery term.
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
  "cleft-field-poorten": {
    badge: "Op bestelling",
    note: "Levertijd ongeveer 4 à 5 weken, afhankelijk van de volgende vracht. We bevestigen de levertermijn per mail.",
  },
};

const BACK_ORDER: OrderTerm = {
  badge: "Uitverkocht",
  note: "Tijdelijk uitverkocht — u kunt het toch aanvragen, dan laten we u per mail weten wanneer het leverbaar is.",
};

export function orderTerm(handle: string): OrderTerm {
  return TERMS[handle] ?? BACK_ORDER;
}
