/*
 * What a sold-out variant means per product. Nothing is a dead end: a variant
 * that is not in stock can still be requested ("op bestelling"); the request
 * reaches Natuurhout's inbox and they mail the customer the delivery term.
 * New stock arrives with a freight about every 4 to 5 weeks (Xander),
 * exceptionally later when it is busy or production runs behind.
 * Gates are made after the order comes in; Cleft & Field gates come with the
 * next freight from the supplier.
 */

export type OrderTerm = {
  badge: string;
  note: string;
  /** What happens to the part of an order above the counted stock (src/lib/order-limits.ts → backorderNote). */
  later?: string;
  /** A few words under a sold-out row of the price list, instead of "op aanvraag*". */
  short?: string;
};

const MADE_TO_MEASURE: OrderTerm = {
  badge: "Op bestelling",
  note: "Wordt voor u gemaakt zodra uw bestelling binnen is. De levertermijn laten we u per mail weten.",
};

const TERMS: Record<string, OrderTerm> = {
  // Lead times from Xander (Nov 2026); these can be ordered and paid at once.
  "kastanje-poort-geschroefd": {
    badge: "Op bestelling",
    note: "Niet op voorraad: we maken de poort voor u, klaar in ±3 werkdagen.",
    short: "Op aanvraag, gemaakt in ±3 werkdagen",
  },
  "kastanje-poorten": MADE_TO_MEASURE,
  // Website products (src/lib/website-products.ts): made to order.
  "kastanje-kaderpoort-geschroefd": {
    badge: "Op aanvraag",
    note: "We maken de kaderpoort voor u: klaar in ±3 werkdagen.",
    short: "Op aanvraag, gemaakt in ±3 werkdagen",
  },
  "kastanje-kaderpoort-premium": {
    badge: "Op aanvraag",
    note: "We maken de kaderpoort voor u: klaar in ±3 werkdagen.",
    short: "Op aanvraag, gemaakt in ±3 werkdagen",
  },
  "maatwerk-poort": {
    badge: "Op bestelling",
    note: "Wordt op maat voor u gemaakt: levering in ±2 weken.",
  },
  // Price list next to the webshop's eiken palen (src/lib/price-updates.ts).
  "eiken-palen-met-postsaver": {
    badge: "Op bestelling",
    note: "Wij brengen de postsaver voor u aan: klaar in ±3 dagen.",
  },
  // Not in the webshop (src/lib/website-products.ts).
  snelbeton: {
    badge: "Op aanvraag",
    note: "Snelbeton bestelt u via een aanvraag: we houden het klaar om af te halen in Zele of leveren het mee met uw bestelling. We bevestigen per mail.",
  },
  // Not kept in stock (Xander, Nov 2026): ordered from the supplier, here in about 5 days.
  "paalhouder-met-punt-rond": {
    badge: "Op aanvraag",
    note: "Niet op voorraad: we bestellen ze voor u. Normaal zijn ze binnen een vijftal dagen bij ons. We bevestigen de levertermijn per mail.",
  },
  // Hazelaar comes from Ukraine (Xander, Nov 2026): sometimes hard to get and a long
  // delivery, so no number of weeks: on request, we mail when it can be delivered.
  "hazelaar-hekwerk": {
    badge: "Op aanvraag",
    note: "Ons hazelaar hekwerk komt uit Oekraïne. Het is soms moeilijk te verkrijgen en de levering kan lang duren. Vraag het gewoon aan: we laten u per mail weten wanneer we het kunnen leveren.",
    later: "die vragen we voor u aan. Hazelaar komt uit Oekraïne en kan lang op zich laten wachten: we laten u per mail weten wanneer ze binnenkomen.",
  },
  "cleft-field-poorten": {
    badge: "Op bestelling",
    note: "Levertijd ongeveer 4 à 5 weken, met de volgende vracht; uitzonderlijk langer door drukte of productie. We bevestigen de levertermijn per mail.",
  },
};

const BACK_ORDER: OrderTerm = {
  badge: "Op bestelling",
  note: "Niet op voorraad — u kunt het gewoon bestellen. Normaal komt er elke 4 à 5 weken een vracht met nieuwe voorraad; uitzonderlijk duurt het langer door drukte of productie. We bevestigen de levertermijn per mail.",
};

export function orderTerm(handle: string): OrderTerm {
  return TERMS[handle] ?? BACK_ORDER;
}
