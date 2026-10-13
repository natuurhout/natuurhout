import { HEKWERK_PLAATSEN } from "@/lib/artikels/kastanje-hekwerk-plaatsen";

/*
 * Articles written since the WordPress site (Tips & Ideeën): how-to's and
 * background on chestnut, posts and fencing. Each has a page at
 * /tipsenideeen/<slug>/ and a card at the top of the Tips & Ideeën overview,
 * newest first. The body is Natuurhout's own HTML (trusted, in the repo).
 */

export type Artikel = {
  slug: string;
  title: string;
  /** One or two sentences: the card text and meta description. */
  summary: string;
  /** ISO date of publication. */
  date: string;
  image: { src: string; alt: string };
  /** Card image on the overview and in search, when it differs from the lead photo. */
  thumbnail?: { src: string; alt: string };
  /** Approximate reading time in minutes. */
  minutes: number;
  html: string;
};

// Newest first.
export const ARTIKELS: Artikel[] = [
  {
    slug: "kastanje-hekwerk-en-poort-plaatsen",
    title: "Kastanje hekwerk en poort plaatsen: stap voor stap",
    summary:
      "Zelf je kastanje hekwerk en poort plaatsen? Van materiaal en palen tot rasterwerk, poort en afwerking: zo pak je het aan, met schetsen bij elke stap.",
    date: "2026-10-13",
    image: { src: "/fotos/kastanje-hekwerk-weide.jpg", alt: "Kastanje hekwerk geplaatst langs een grasveld" },
    thumbnail: { src: "/fotos/tips/hekwerk-plaatsen-schets.jpg", alt: "Schets: hoekpaal en eindpaal, spantouw ertussen en tussenpalen langs het touw" },
    minutes: 6,
    html: HEKWERK_PLAATSEN,
  },
];

export const artikelCard = (artikel: Artikel) => artikel.thumbnail ?? artikel.image;

export const artikelHref = (artikel: Artikel) => `/tipsenideeen/${artikel.slug}/`;
export const getArtikel = (slug: string) => ARTIKELS.find((artikel) => artikel.slug === slug);

/** "13 okt 2026", as the WordPress blog cards write dates. */
export function shortDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("nl-BE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).replace(".", "");
}

/** "13 oktober 2026" */
export function longDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
