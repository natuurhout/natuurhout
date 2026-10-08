/*
 * Natuurhout's own project photos, added to product pages on top of the
 * webshop / WordPress images (which stay untouched). Files live in
 * public/fotos/, resized for the web with their metadata stripped.
 */

export type ExtraPhoto = { src: string; alt: string; caption: string };

const KASTANJE_HEKWERK: ExtraPhoto[] = [
  {
    src: "/fotos/kastanje-hekwerk-weide.jpg",
    alt: "Kastanje hekwerk geplaatst langs een grasveld",
    caption: "Kastanje hekwerk, pas geplaatst",
  },
  {
    src: "/fotos/kastanje-hekwerk-natuurhout.jpg",
    alt: "Kastanje hekwerk van Natuurhout, met het Natuurhout-bordje",
    caption: "Kastanje hekwerk van Natuurhout",
  },
];

const VLECHTSCHERM_HALVE_LATTEN: ExtraPhoto[] = [
  {
    src: "/fotos/hazelaar-vlechtscherm-halve-latten.jpg",
    alt: "Hazelaar vlechtschermen met halve latten, geplaatst tussen ronde palen in een tuin",
    caption: "Hazelaar vlechtschermen met halve latten",
  },
];

const ROBINIA_HEKWERK: ExtraPhoto[] = [
  { src: "/fotos/robinia-hekwerk-1.jpg", alt: "Robinia hekwerk geplaatst langs de straat", caption: "Robinia hekwerk langs de straat" },
  { src: "/fotos/robinia-hekwerk-2.jpg", alt: "Robinia hekwerk van dichtbij, met gepunte latten", caption: "Robinia hekwerk van dichtbij" },
  { src: "/fotos/robinia-hekwerk-3.jpg", alt: "Robinia hekwerk met palen, met zicht op een weide", caption: "Robinia hekwerk met palen" },
  { src: "/fotos/robinia-hekwerk-4.jpg", alt: "Robinia hekwerk in een tuin naast een woning", caption: "Robinia hekwerk in de tuin" },
];

/** By webshop product handle (/shop/…). */
export const SHOP_EXTRA_PHOTOS: Record<string, ExtraPhoto[]> = {
  "kastanje-rasterwerk": KASTANJE_HEKWERK,
  "hazelaar-vlechtscherm-hasseltre": VLECHTSCHERM_HALVE_LATTEN,
  "robinia-hekwerk": ROBINIA_HEKWERK,
};

/** By WordPress product page (/project/…). */
export const PAGE_EXTRA_PHOTOS: Record<string, ExtraPhoto[]> = {
  "/project/rasterwerk-kastanjehout/": KASTANJE_HEKWERK,
  "/project/hazelaar-vlechtscherm-hasseltre/": VLECHTSCHERM_HALVE_LATTEN,
  "/project/robinia-rasterwerk/": ROBINIA_HEKWERK,
};

/** Calculator tiles for "Hekwerk" and "Vlechtschermen". */
export const CALCULATOR_HEKWERK_PHOTO = KASTANJE_HEKWERK[0].src;
export const CALCULATOR_VLECHTSCHERM_PHOTO = VLECHTSCHERM_HALVE_LATTEN[0].src;
