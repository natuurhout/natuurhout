import type { Product } from "@/lib/catalog";

/*
 * Webshop products shown as one product on the website (Xander, Nov 2026):
 * the variants of every part become the choices of one product page, under
 * the handle of `handle`. Variant ids stay the same, so the cart, checkout,
 * backend edits (by variant id) and old orders keep working. The other parts'
 * old /shop/ URLs redirect to the merged page (next.config.ts lists the same
 * redirects, from MERGED_HANDLES).
 */

type Part = {
  handle: string;
  /** The choice's name, from the webshop variant title. */
  variant: (title: string) => string;
};

type Merge = {
  handle: string;
  title: string;
  /** Name of the choice (shown above the price list). */
  option: string;
  bodyHtml: string;
  parts: Part[];
  /**
   * Choices that are not in the webshop (negative ids, like the website
   * products): they are in the catalogue, so cart, order and checkout price them.
   */
  extra?: Product["variants"];
};

/** "7.5cm" → "7,5 cm" */
const cm = (title: string) => title.replace(/\s*cm$/i, "").replace(".", ",") + " cm";

export const MERGED_PRODUCTS: Merge[] = [
  {
    handle: "grondboor",
    title: "Grondboor",
    option: "Boor",
    parts: [
      { handle: "grondboor-kopie", variant: (title) => `Grondboor ø${cm(title)}` },
      { handle: "grondboor", variant: () => "Spiraalboor ø8 cm" },
    ],
    // Renting (Xander, Nov 2026): €10 rent + €50 deposit, paid together; the
    // deposit is paid back when the grondboor comes back.
    extra: [{ id: -900101, title: "Huren: grondboor ø7,5 of ø9 cm (€10 huur + €50 borg)", price: "60.00", compare_at: null, available: true }],
    bodyHtml: [
      "<p>Een stevige grondboor om gaten te maken voor houten palen zoals kastanje en robinia: de palen staan sneller en steviger. Kies hieronder welke boor u wilt.</p>",
      "<h3>Grondboor ø7,5 of ø9 cm</h3>",
      "<ul>",
      "<li><strong>Lengte:</strong> 1250 mm, voor diepe gaten zonder veel inspanning</li>",
      "<li><strong>Diameter boor:</strong> 75 mm of 90 mm</li>",
      "<li><strong>Dikte boorpunt:</strong> 4 mm, scherp en efficiënt in diverse grondsoorten</li>",
      "<li><strong>Breedte handvat:</strong> 350 mm, voor een comfortabele grip</li>",
      "<li><strong>Kleur:</strong> groen gepoedercoat (RAL 6005), beschermd tegen corrosie en slijtage</li>",
      "</ul>",
      "<h3>Spiraalboor ø8 cm</h3>",
      "<ul>",
      "<li><strong>Totale lengte:</strong> 107 cm, ergonomisch werken</li>",
      "<li><strong>Lengte boorkop:</strong> 32 cm, haalt de aarde in één keer uit de grond</li>",
      "<li><strong>Breedte handvat:</strong> 60 cm, brede grip</li>",
      "<li><strong>Dikte buizen:</strong> 2,5 cm, voor een stevige constructie</li>",
      "<li>Stevig staal, geschikt voor harde grond</li>",
      "</ul>",
      "<h3>Huren</h3>",
      "<p>Eenmalig project? Huur de grondboor (ø7,5 of ø9 cm): u betaalt €60, dat is €10 huur en €50 borg. De borg krijgt u terug als u de grondboor terugbrengt.</p>",
    ].join(""),
  },
];

/** Old handle → the merged product's handle. */
export const MERGED_HANDLES: Record<string, string> = Object.fromEntries(
  MERGED_PRODUCTS.flatMap((merge) => merge.parts.filter((part) => part.handle !== merge.handle).map((part) => [part.handle, merge.handle])),
);

export function withMerges<P extends Product>(products: P[]): P[] {
  const byHandle = new Map(products.map((product) => [product.handle, product]));
  const merged = new Map<string, P>();
  for (const merge of MERGED_PRODUCTS) {
    const parts = merge.parts.flatMap((part) => {
      const product = byHandle.get(part.handle);
      return product ? [{ part, product }] : [];
    });
    if (!parts.length) continue;
    const variants = [
      ...parts.flatMap(({ part, product }) => product.variants.map((variant) => ({ ...variant, title: part.variant(variant.title) }))),
      ...(merge.extra ?? []),
    ];
    const prices = variants.map((variant) => parseFloat(variant.price)).filter((n) => Number.isFinite(n));
    const first = parts[0].product;
    const published = parts.map(({ product }) => product.publishedAt).filter((d): d is string => Boolean(d)).sort();
    merged.set(merge.handle, {
      ...first,
      handle: merge.handle,
      title: merge.title,
      bodyHtml: merge.bodyHtml,
      options: [merge.option],
      images: parts.flatMap(({ product }) => product.images.map((image) => ({ ...image, alt: merge.title }))),
      variants,
      priceFrom: prices.length ? Math.min(...prices).toFixed(2) : first.priceFrom,
      priceTo: prices.length ? Math.max(...prices).toFixed(2) : first.priceTo,
      available: parts.some(({ product }) => product.available),
      tags: [...new Set(parts.flatMap(({ product }) => product.tags))],
      publishedAt: published[0] ?? first.publishedAt,
    });
  }
  const out = products.flatMap((product) => {
    const own = merged.get(product.handle);
    if (own) {
      merged.delete(product.handle);
      return [own];
    }
    return product.handle in MERGED_HANDLES ? [] : [product];
  });
  return [...out, ...merged.values()];
}
