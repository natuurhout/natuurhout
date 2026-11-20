import type { ProductImage, ProductVariant } from "@/lib/catalog";

/*
 * Website copy and photos that replace a webshop product's own (Xander, Nov
 * 2026): a clearer title, a description per part, Natuurhout's own photos
 * (cleaned up: even light background, cropped, sharpened; public/fotos/web/…)
 * and a photo per choice, shown in the price list. Handles, variant ids and
 * variant titles stay as in the webshop, so the cart, orders and the
 * calculator (which reads the variant titles) keep working.
 */

type Copy = {
  title?: string;
  bodyHtml?: string;
  /** Corrections in the webshop description: [exact text, replacement], applied in order. */
  bodyFixes?: [string, string][];
  /** Replaces the webshop photos, in this order (the first is the card photo). */
  images?: ProductImage[];
  /** Photo per variant id (a src from `images`), shown in the price list. */
  variantPhotos?: Record<number, string>;
  /** Price list column name, and names for webshop variants (by id), e.g. instead of "Default Title". */
  options?: string[];
  variantTitles?: Record<number, string>;
  /**
   * Extra choices sold on the website only (negative ids, like the website
   * products): in the catalogue, so cart, orders and checkout price them.
   * They do not count for the "vanaf" price on the product card.
   */
  extraVariants?: ProductVariant[];
};

const HS = "/fotos/web/hang-sluitwerk";
const photo = (file: string, alt: string, big = false): ProductImage => ({ src: `${HS}/${file}`, alt, width: big ? 1200 : 800, height: big ? 900 : 600 });

const HANG_SLUITWERK = {
  scharniersetVeldpoort: photo("scharnierset-veldpoort.jpg", "Scharnierset veldpoort: dubbele hengselband, twee plaatduimen, oogbout, beugel en schroeven"),
  scharniersetTuinpoort: photo("scharnierset-tuinpoort.jpg", "Scharnierset tuinpoort: hengselband met scharnierpunt en bout"),
  sluitingMetPen: photo("sluiting-veldpoort-met-pen.jpg", "Sluiting veldpoort met pen: vanger en pen met rood dopje"),
  veersluiting: photo("veersluiting-veldpoort.jpg", "Veersluiting veldpoort: schuifgrendel met veer", true),
  overslagGrendel: photo("overslag-grendel-veldpoort.jpg", "Overslag grendel veldpoort: grendelstang met kogel, beugel, haak en schroeven"),
  grondpen: photo("grondpen.jpg", "Grondpen: L-vormige pen met twee geleiders"),
  tuinheksluitingPen: photo("tuinheksluiting-met-pen.jpg", "Tuinheksluiting met pen op een kastanje poort: vanger op de paal, pen met kogel op de poort"),
  tuinheksluitingNeus: photo("tuinheksluiting-met-neus.jpg", "Tuinheksluiting met neus: schuifgrendel met knop en vanger"),
};

export const PRODUCT_COPY: Record<string, Copy> = {
  // The robinia poort is screwed and dowelled, not mortise and tenon (Xander, Nov 2026).
  "robinia-poort": {
    bodyFixes: [
      [
        'zorgvuldig in elkaar gezet met een <strong data-start="475" data-end="509">klassieke pen-en-gatverbinding</strong> – een constructietechniek die garant staat voor stabiliteit en duurzaamheid.',
        "zorgvuldig in elkaar gezet: <strong>vastgeschroefd en met deuvels verbonden</strong>. Zo is de poort zeer stevig en duurzaam.",
      ],
      ["klassieke houtverbindingen, pen-en-gatverbiding.", "vastgeschroefd en met deuvels verbonden, zeer stevig."],
    ],
  },
  // A loose inbussleutel for the draadverbinders (Xander, Nov 2026).
  "hekwerk-draadverbinders": {
    options: ["Artikel"],
    variantTitles: { 51315420463435: "Draadverbinder" },
    extraVariants: [{ id: -900201, title: "Inbussleutel", price: "0.10", compare_at: null, available: true }],
  },
  "beslag-hang-sluitwerk": {
    title: "Hang- en sluitwerk voor poorten",
    bodyHtml: [
      "<p>Verzinkt hang- en sluitwerk (beslag) voor tuinpoorten en veldpoorten: scharnieren, sluitingen, een grendel en een grondpen. Bij onze kastanje-, hazelaar- en robiniapoorten is het hang- en sluitwerk inbegrepen. Hier bestelt u de onderdelen los: voor een Cleft &amp; Field of hardhouten veldpoort (palen en beslag apart), voor een eigen poort of als vervanging.</p>",
      "<h3>Scharnieren</h3>",
      "<ul>",
      "<li><strong>Scharnierset veldpoort:</strong> compleet, met een dubbele hengselband, twee plaatduimen, een oogbout met moeren, een beugel en de schroeven.</li>",
      "<li><strong>Scharnierset tuinpoort:</strong> een stevige hengselband met scharnierpunt en bout.</li>",
      "</ul>",
      "<h3>Sluitingen en grendels</h3>",
      "<ul>",
      "<li><strong>Sluiting veldpoort met pen:</strong> de pen op de poort valt bij het dichtgaan vanzelf in de vanger.</li>",
      "<li><strong>Veersluiting veldpoort:</strong> een schuifgrendel met veer: trek de hendel terug, laat los en de pen schiet in het slot.</li>",
      "<li><strong>Overslag grendel veldpoort:</strong> grendelstang met kogel, beugel en haak, met de schroeven.</li>",
      "<li><strong>Tuinheksluiting met pen:</strong> de vanger komt op de paal, de pen met kogel op de poort: de poort valt vanzelf in het slot.</li>",
      "<li><strong>Tuinheksluiting met neus:</strong> een schuifgrendel met knop die in de vanger (neus) op de paal schuift.</li>",
      "</ul>",
      "<h3>Grondpen</h3>",
      "<p>Een L-vormige pen met twee geleiders: laat hem in de grond zakken en de poort blijft open of dicht staan, ook bij wind.</p>",
      "<p>Twijfelt u wat u nodig hebt voor uw poort? Bel of WhatsApp ons, we helpen u graag.</p>",
    ].join(""),
    images: [
      // On a kastanje poort: the card photo.
      HANG_SLUITWERK.tuinheksluitingPen,
      HANG_SLUITWERK.scharniersetVeldpoort,
      HANG_SLUITWERK.scharniersetTuinpoort,
      HANG_SLUITWERK.tuinheksluitingNeus,
      HANG_SLUITWERK.sluitingMetPen,
      HANG_SLUITWERK.veersluiting,
      HANG_SLUITWERK.overslagGrendel,
      HANG_SLUITWERK.grondpen,
    ],
    variantPhotos: {
      51355019477323: HANG_SLUITWERK.scharniersetVeldpoort.src, // Scharnieren set - Veldpoort
      51355019510091: HANG_SLUITWERK.scharniersetTuinpoort.src, // Scharnieren set - Tuinpoort
      51355019542859: HANG_SLUITWERK.tuinheksluitingPen.src, // Tuinheksluiting met pen
      51355019575627: HANG_SLUITWERK.tuinheksluitingNeus.src, // Tuinheksluiting met neus
      51355019608395: HANG_SLUITWERK.sluitingMetPen.src, // Sluiting veldpoort met pen
      51355019641163: HANG_SLUITWERK.veersluiting.src, // Veersluiting veldpoort
      51355019673931: HANG_SLUITWERK.overslagGrendel.src, // Overslag grendel veldpoort
      51355019706699: HANG_SLUITWERK.grondpen.src, // Grondpen
    },
  },
};

/** The photo of one choice in a price list, if there is one. */
export function variantPhoto(handle: string, variantId: number): { src: string; alt: string } | null {
  const copy = PRODUCT_COPY[handle];
  const src = copy?.variantPhotos?.[variantId];
  if (!src) return null;
  return { src, alt: copy?.images?.find((image) => image.src === src)?.alt ?? "" };
}
