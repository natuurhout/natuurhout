import type { Product } from "@/lib/catalog";

/*
 * Products Natuurhout sells that are not in the webshop (yet), with a page at
 * /shop/<handle>/ like the shop's own. They have no webshop variant to put in
 * the cart, so they are ordered on request (OrderRequestForm): every variant
 * is "available: false" with a negative id, and src/lib/made-to-order.ts says
 * how the request works.
 */

/** Collection each website product is listed in on /shop/. */
export const WEBSITE_PRODUCT_COLLECTIONS: Record<string, string> = {
  snelbeton: "plaatsing-materiaal",
};

export const WEBSITE_PRODUCTS: Product[] = [
  {
    handle: "snelbeton",
    title: "Snelbeton 25 kg",
    bodyHtml: [
      "<p>Snelbeton om palen en poortpalen stevig vast te zetten: <strong>webercel easy</strong> van Weber, in een zak van 25 kg (grijs).</p>",
      "<h3>Kenmerken</h3>",
      "<ul><li>Hoeft niet vooraf gemengd te worden</li><li>Snelle afbinding, ook bij lage temperaturen</li><li>Gebruikstemperatuur: 5 tot 30 °C</li><li>Zak van 25 kg, grijs</li></ul>",
      "<h3>Toepassing</h3>",
      "<p>Ideaal voor poortpalen, hoekpalen en palen die extra stevig moeten staan. Volg de gebruiksaanwijzing op de zak.</p>",
    ].join(""),
    options: ["Zak"],
    images: [{ src: "/fotos/snelbeton-25kg.jpg", width: 1200, height: 1200, alt: "Zak snelbeton webercel easy van 25 kg" }],
    variants: [{ id: -900001, title: "25 kg", price: "13.00", compare_at: null, available: false }],
    priceFrom: "13.00",
    priceTo: "13.00",
    available: false,
    tags: ["Plaatsing materiaal"],
    shopUrl: "https://natuurhout.shop",
    publishedAt: "2026-10-13T00:00:00Z",
  },
];
