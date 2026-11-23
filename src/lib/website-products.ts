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
  "kastanje-kaderpoort-geschroefd": "poorten",
  "kastanje-kaderpoort-premium": "poorten",
};

/*
 * Kastanje kaderpoorten (Xander, Nov 2026): the frame of the geschroefde and
 * the premium poort without its latten, made to order in about 3 working
 * days, with 2 poortpalen and hang- en sluitwerk. Prices worked out from those
 * gates: their price minus the latten (±8 per 100 cm of width, valued at the
 * kastanje hekwerk 7,5/8 cm price per metre × 1,5 for sawing and screwing),
 * wider sizes following the old kaderpoort table's steps; never cheaper than
 * a smaller size. Rows: height (cm), columns: width (cm).
 */
const KADER_HEIGHTS = [80, 90, 100, 120, 150, 180];
const KADER_WIDTHS = [100, 120, 150, 180, 200, 210];
const KADER_GESCHROEFD: Record<number, number[]> = {
  80: [125, 135, 145, 169, 189, 195],
  90: [135, 139, 155, 179, 195, 199],
  100: [139, 145, 159, 185, 199, 209],
  120: [149, 155, 169, 189, 209, 215],
  150: [155, 159, 179, 199, 215, 225],
  180: [159, 169, 189, 209, 229, 239],
};
const KADER_PREMIUM: Record<number, number[]> = {
  80: [155, 165, 175, 199, 219, 225],
  90: [165, 169, 185, 209, 225, 229],
  100: [169, 175, 189, 215, 229, 239],
  120: [179, 185, 199, 219, 239, 245],
  150: [199, 209, 229, 249, 265, 275],
  180: [215, 225, 245, 265, 285, 295],
};

function kaderpoort(handle: string, title: string, firstId: number, prices: Record<number, number[]>, bodyHtml: string): Product {
  const variants = KADER_HEIGHTS.flatMap((height, h) =>
    KADER_WIDTHS.map((width, w) => ({
      id: firstId - (h * KADER_WIDTHS.length + w),
      title: `${height}cm / ${width}cm`,
      price: prices[height][w].toFixed(2),
      compare_at: null,
      available: false,
    })),
  );
  const all = variants.map((v) => parseFloat(v.price));
  return {
    handle,
    title,
    bodyHtml,
    options: ["Hoogte", "Breedte"],
    images: [{ src: "/fotos/web/kaderpoort-1-scaled.jpg", width: 1400, height: 908, alt: title }],
    variants,
    priceFrom: Math.min(...all).toFixed(2),
    priceTo: Math.max(...all).toFixed(2),
    available: false,
    tags: ["Poorten"],
    shopUrl: `/shop/${handle}/`,
    publishedAt: "2026-11-23T00:00:00Z",
  };
}

const KADER_COMMON = [
  "<h3>Wat zit erbij?</h3>",
  "<ul><li>2 kastanje poortpalen</li><li>Hang- en sluitwerk (verzinkt)</li></ul>",
  "<h3>Levertermijn</h3>",
  "<p>Op aanvraag: we maken uw kaderpoort in ±3 werkdagen. Een andere maat nodig? Vraag het ons gerust.</p>",
].join("");

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
    shopUrl: "/shop/snelbeton/",
    publishedAt: "2026-10-13T00:00:00Z",
  },
  kaderpoort(
    "kastanje-kaderpoort-geschroefd",
    "Kastanje kaderpoort geschroefd",
    -900401,
    KADER_GESCHROEFD,
    "<p>Het kader van onze geschroefde kastanje poort, zonder latten: in dezelfde landelijke stijl als kastanje rasterwerk. U vult het zelf met latten, een stuk hekwerk of gaas, of laat het open. De kastanje delen zijn stevig vastgeschroefd met houtschroeven.</p>" +
      KADER_COMMON,
  ),
  kaderpoort(
    "kastanje-kaderpoort-premium",
    "Kastanje kaderpoort premium",
    -900501,
    KADER_PREMIUM,
    "<p>Het kader van onze kastanje premium poort, zonder latten: ambachtelijk gemaakt met pen-en-gatverbindingen en daardoor extra stevig. U vult het zelf met latten, een stuk hekwerk of gaas, of laat het open.</p>" +
      KADER_COMMON,
  ),
];
