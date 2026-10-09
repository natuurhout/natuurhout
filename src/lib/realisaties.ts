import { load } from "cheerio/slim";
import { categories } from "@/lib/categories";
import { getLegacyPageByPath, legacyPages, type LegacyPage } from "@/lib/legacy";

/*
 * Customer projects (the WordPress /project/ realisation pages) by the
 * product they show, so a product page can end with real examples. Mapped
 * by hand from each project's title and description.
 */

type Kind = "hekwerk" | "robinia" | "hazelaar" | "vlechtschermen" | "maatwerk-poort" | "premium-poort" | "cleft-field" | "post-rail" | "lariks" | "eiken";

export type ProjectPhoto = { src: string; alt: string; width: number; height: number };

/**
 * Projects added after the WordPress site, with Natuurhout's own photos
 * (public/fotos/realisaties/). Each has a page at /realisaties/<slug>/.
 */
export type NewProject = {
  slug: string;
  title: string;
  /** One-line summary (cards, meta description). */
  summary: string;
  description: string[];
  /** The product pages the project shows. */
  products: { href: string; label: string }[];
  photos: ProjectPhoto[];
};

const lievegem = (n: number, alt: string, portrait = false): ProjectPhoto => ({
  src: `/fotos/realisaties/lievegem-robinia-${n}.jpg`,
  alt,
  width: portrait ? 1125 : 1500,
  height: portrait ? 1500 : 1125,
});

const zele = (n: number, alt: string, square = false): ProjectPhoto => ({
  src: `/fotos/realisaties/zele-hazelaar-${n}.jpg`,
  alt,
  width: square ? 1500 : 1600,
  height: square ? 1500 : 1200,
});

const overmere = (n: number, alt: string, width: number, height: number): ProjectPhoto => ({
  src: `/fotos/realisaties/overmere-poorten-${n}.jpg`,
  alt,
  width,
  height,
});

// Newest first.
export const NEW_PROJECTS: NewProject[] = [
  {
    slug: "overmere-maatwerk-poorten-hekwerk",
    title: "Project Overmere – Maatwerk poorten & kastanje hekwerk",
    summary: "Dubbele kastanje premium maatwerk poort op eiken palen en kastanje hekwerk van 120 cm hoog langs de sloot in Overmere.",
    description: [
      "Plaatsing van een dubbele kastanje premium maatwerk poort in Overmere: twee vleugels van 120 cm hoog en 190 cm breed. De poorten hangen aan eiken palen, ook uit ons eigen assortiment.",
      "De oprit moet nog worden aangelegd. Daarom hangt de poort voorlopig wat hoger: zo past ze straks perfect boven de afgewerkte oprit.",
      "Langs de sloot kwam kastanje hekwerk van 120 cm hoog met een latafstand van 7/8 cm, tot tegen de woning. Zo houdt het hekwerk de kleine kinderen tegen en kunnen ze niet in de sloot vallen.",
    ],
    products: [
      { href: "/project/maatwerk-poorten/", label: "Kastanje premium maatwerk poorten" },
      { href: "/project/rasterwerk-kastanjehout/", label: "Kastanje hekwerk" },
      { href: "/project/eiken-palen/", label: "Eiken palen" },
    ],
    photos: [
      overmere(1, "Dubbele kastanje premium maatwerk poort op eiken palen in Overmere, met het hekwerk erachter", 1500, 1125),
      overmere(2, "Bovenkant van de maatwerk poort, met het kastanje hekwerk langs de sloot", 1600, 1200),
      overmere(3, "Kastanje hekwerk van 120 cm hoog langs de sloot", 1125, 1500),
      overmere(4, "Kastanje hekwerk langs de sloot, met zicht op de weide", 1125, 1500),
      overmere(5, "Kastanje hekwerk tot tegen de woning", 1125, 1500),
    ],
  },
  {
    slug: "zele-hazelaar-hekwerk",
    title: "Project Zele – Hazelaar hekwerk & poortje",
    summary: "Hazelaar hekwerk van 120 cm hoog rond een tuin in Zele, met een kastanje premium poortje.",
    description: [
      "Plaatsing van hazelaar hekwerk van 120 cm hoog met een latafstand van 3/5 cm rond een tuin in Zele. Het hekwerk loopt rond het gazon, langs de border en onder de treurwilg door.",
      "Aan het terras kwam een kastanje premium poortje van 100 x 100 cm, zodat de tuin vlot bereikbaar blijft.",
    ],
    products: [
      { href: "/project/hazelaarrasterwerk/", label: "Hazelaar hekwerk" },
      { href: "/project/franse-poorten/", label: "Kastanje premium poorten" },
    ],
    photos: [
      zele(1, "Hazelaar hekwerk van 120 cm onder een treurwilg, met het gazon erachter", true),
      zele(2, "Kastanje premium poortje van 100 x 100 cm aan het terras, naast het hazelaar hekwerk"),
      zele(3, "Hazelaar hekwerk achter een boom en een bloembak op het terras"),
      zele(4, "Het poortje open, met zicht op het hazelaar hekwerk rond de tuin"),
      zele(5, "Lange rij hazelaar hekwerk rond het gazon"),
      zele(6, "Hazelaar hekwerk in de hoek van de tuin, langs de border"),
      zele(7, "Close-up van de hazelaar latten met verzinkte draad"),
      zele(8, "Recht stuk hazelaar hekwerk langs het gazon"),
    ],
  },
  {
    slug: "lievegem-robinia-hekwerk",
    title: "Project Lievegem – Robinia hekwerk",
    summary: "Robinia hekwerk langs de straat en rond de tuin in Lievegem.",
    description: [
      "Plaatsing van robinia hekwerk langs de straat en rond de tuin van een woning in Lievegem. Het hekwerk volgt de bocht van de weg en sluit in de tuin aan op de bestaande draadafsluiting.",
      "Robinia is een van de duurzaamste Europese houtsoorten: onbehandeld gaat het jarenlang mee in de grond en het kleurt na verloop van tijd mooi zilvergrijs.",
    ],
    products: [{ href: "/project/robinia-rasterwerk/", label: "Robinia hekwerk" }],
    photos: [
      lievegem(1, "Robinia hekwerk langs de straat in Lievegem, onder hoge bomen"),
      lievegem(2, "Robinia hekwerk met het Natuurhout-bordje, langs de weg in Lievegem", true),
      lievegem(3, "Lange rij robinia hekwerk langs de rijweg"),
      lievegem(4, "Robinia hekwerk in de tuin, aangesloten op de bestaande draadafsluiting"),
      lievegem(5, "Robinia hekwerk gezien vanuit de tuin, met zicht op de weide aan de overkant"),
      lievegem(6, "Close-up van de gekloven robinia latten met verzinkte draad"),
      lievegem(7, "Robinia hekwerk langs de gevel en de struiken in de tuin"),
    ],
  },
];

export const newProjectHref = (project: NewProject) => `/realisaties/${project.slug}/`;
export const getNewProject = (slug: string) => NEW_PROJECTS.find((project) => project.slug === slug);

// Most telling project first within each kind.
const PROJECTS: Record<Kind, string[]> = {
  hekwerk: [
    "/project/project-zele/",
    "/realisaties/overmere-maatwerk-poorten-hekwerk/",
    "/project/rasterwerk120cm-moerkerke/",
    "/project/project-ronse-hondenweide/",
    "/project/project-grembergen-rasterwerk-90cm/",
    "/project/project-zele-rasterwerk-1-00m-75-8cm/",
    "/project/project-lochristi-rasterwerk-poort-1-20m/",
    "/project/project-huivelde-rasterwerk-cleftfield-poort/",
    "/project/project-zulte/",
    "/project/international-airport/",
    "/project/project-dendermonde-padouk-poort/",
  ],
  vlechtschermen: [
    "/project/project-merelbeke-hazelaarschermen/",
    "/project/project-berlare-vlechtschermen-maatwerk-poort/",
    "/project/project-brugge/",
    "/project/project-hamme3/",
    "/project/project-destelbergen/",
  ],
  "maatwerk-poort": [
    "/realisaties/overmere-maatwerk-poorten-hekwerk/",
    "/project/project-sint-niklaas-maatwerk-poort-rasterwerk-1-80m/",
    "/project/project-lebbeke/",
    "/project/project-berlare-vlechtschermen-maatwerk-poort/",
    "/project/project-hamme3/",
  ],
  "premium-poort": [
    "/realisaties/zele-hazelaar-hekwerk/",
    "/project/project-lochristi-rasterwerk-poort-1-20m/",
    "/project/rasterwerk120cm-moerkerke/",
  ],
  "cleft-field": [
    "/project/project-waasmunster-cleft-field-poorten-1-50m-2x-2-40m/",
    "/project/project-keerbergen-cleftfield-poort-3-60m/",
    "/project/project-lebbeke-cleft-field-poort/",
    "/project/project-huivelde-rasterwerk-cleftfield-poort/",
    "/project/project-destelbergen/",
  ],
  "post-rail": ["/project/project-sintgilleswaas-postrail/", "/project/project-hamme5/"],
  robinia: ["/realisaties/lievegem-robinia-hekwerk/"],
  hazelaar: ["/realisaties/zele-hazelaar-hekwerk/"],
  lariks: ["/project/project-overmere/", "/project/project-overmere-2/"],
  eiken: ["/realisaties/overmere-maatwerk-poorten-hekwerk/"],
};

// Product pages (WordPress /project/ pages and webshop /shop/ handles).
const BY_PAGE: Record<string, Kind> = {
  "/project/rasterwerk-kastanjehout/": "hekwerk",
  "/project/kastanjepalen/": "hekwerk",
  "/project/hazelaarvlechtschermen/": "vlechtschermen",
  "/project/hazelaar-vlechtscherm-hasseltre/": "vlechtschermen",
  "/project/maatwerk-poorten/": "maatwerk-poort",
  "/project/franse-poorten/": "premium-poort",
  "/project/cleft-field-veldpoorten/": "cleft-field",
  "/project/post-rail-2/": "post-rail",
  "/project/lariks-schaal-delen-2/": "lariks",
  "/project/robinia-rasterwerk/": "robinia",
  "/project/robinia-palen/": "robinia",
  "/project/hazelaarrasterwerk/": "hazelaar",
  "/project/eiken-palen/": "eiken",
};

const BY_HANDLE: Record<string, Kind> = {
  "kastanje-rasterwerk": "hekwerk",
  "kastanje-hekwerk-1-50m": "hekwerk",
  "kastanje-hekwerk-100cm-4-5cm": "hekwerk",
  "kastanje-hekwerk-100cm-7-9cm": "hekwerk",
  palen: "hekwerk",
  "hazelaar-vlechtscherm-hasseltre": "vlechtschermen",
  "hazelaar-scherm-trepanel": "vlechtschermen",
  "hazelaar-vlechtscherm-80cm-hoog-x-150cm-breed": "vlechtschermen",
  "kastanje-poorten": "premium-poort",
  "cleft-field-poorten": "cleft-field",
  "post-rail-omheining": "post-rail",
  "lariks-planken-delen": "lariks",
  "robinia-hekwerk": "robinia",
  "robinia-palen": "robinia",
  "vierkant-gezaagde-robinia-palen": "robinia",
  "robinia-poort": "robinia",
  "eiken-palen": "eiken",
  "hazelaar-hekwerk": "hazelaar",
  "kastanje-hekwerk-1-00m-4-5cm-4-20m-lengte": "hazelaar", // "Hazelaar hekwerk 90cm" despite its handle
};

// Card titles where the WordPress title is generic or used twice.
const TITLES: Record<string, string> = {
  "/project/project-brugge/": "Project Brugge – Vlechtschermen",
  "/project/project-huivelde-rasterwerk-cleftfield-poort/": "Project Huivelde – Rasterwerk & Cleft & Field Poort",
  "/project/project-overmere-2/": "Project Overmere – Lariks schutting",
};

export type Realisatie = { href: string; title: string; image: string; alt: string };

function realisatie(pathname: string): Realisatie | null {
  const added = NEW_PROJECTS.find((project) => newProjectHref(project) === pathname);
  if (added) return { href: pathname, title: added.title, image: added.photos[0].src, alt: added.photos[0].alt };
  const page = legacyPages.find((candidate) => candidate.pathname === pathname);
  const image = page?.blocks.find((block) => block.type === "image");
  if (!page || !image || image.type !== "image") return null;
  const title = TITLES[pathname] ?? page.title.split(" | ")[0].trim();
  return { href: page.pathname, title, image: image.src, alt: image.alt || title };
}

/** Customer projects for a product page or webshop product, best first. */
export function realisatiesFor({ pathname, handle }: { pathname?: string; handle?: string }, limit = 4): Realisatie[] {
  const kind = (pathname && BY_PAGE[pathname]) || (handle && BY_HANDLE[handle]);
  if (!kind) return [];
  return PROJECTS[kind].map(realisatie).filter((item): item is Realisatie => item !== null).slice(0, limit);
}

/** The projects added after the WordPress site, newest first, as cards. */
export function newRealisaties(): Realisatie[] {
  return NEW_PROJECTS.map((project) => realisatie(newProjectHref(project))).filter((item): item is Realisatie => item !== null);
}

/* Project pages -------------------------------------------------------- */

// The product page each kind of project links to.
const KIND_PRODUCT: Record<Kind, { href: string; label: string }> = {
  hekwerk: { href: "/project/rasterwerk-kastanjehout/", label: "Kastanje hekwerk" },
  robinia: { href: "/project/robinia-rasterwerk/", label: "Robinia hekwerk" },
  hazelaar: { href: "/project/hazelaarrasterwerk/", label: "Hazelaar hekwerk" },
  vlechtschermen: { href: "/project/hazelaarvlechtschermen/", label: "Vlechtschermen" },
  "maatwerk-poort": { href: "/project/maatwerk-poorten/", label: "Kastanje premium maatwerk poorten" },
  "premium-poort": { href: "/project/franse-poorten/", label: "Kastanje premium poorten" },
  "cleft-field": { href: "/project/cleft-field-veldpoorten/", label: "Cleft & Field veldpoorten" },
  "post-rail": { href: "/project/post-rail-2/", label: "Post & Rail" },
  lariks: { href: "/project/lariks-schaal-delen-2/", label: "Lariks schaaldelen" },
  eiken: { href: "/project/eiken-palen/", label: "Eiken palen" },
};

export type ProjectProduct = { href: string; label: string; image?: string };

const tilePhoto = new Map(categories.map((tile) => [tile.href, tile.src]));

/** The products a project shows, as links to their product pages. */
export function projectProducts(pathname: string): ProjectProduct[] {
  return (Object.keys(PROJECTS) as Kind[])
    .filter((kind) => PROJECTS[kind].includes(pathname))
    .map((kind) => ({ ...KIND_PRODUCT[kind], image: tilePhoto.get(KIND_PRODUCT[kind].href) }));
}

/** Is this WordPress page one of the customer projects? */
export function isLegacyProject(pathname: string): boolean {
  return Object.values(PROJECTS).some((paths) => paths.includes(pathname)) && pathname.startsWith("/project/");
}

export type ProjectView = {
  title: string;
  /** The description, as the snapshot's own HTML blocks. */
  description: { type: "paragraph" | "ul" | "ol" | "blockquote" | "table"; html: string }[];
  /** Headings in the description besides the title (WordPress: "Omschrijving"). */
  label: string;
  photos: { src: string; alt: string }[];
  nav: { href: string; rel: "prev" | "next"; title: string }[];
};

/** A WordPress project page's content, for the shared project layout. */
export function legacyProjectView(page: LegacyPage): ProjectView {
  const headings = page.blocks.filter((block) => block.type === "heading");
  const title = headings[0]?.type === "heading" ? headings[0].text : page.heading;
  const label = headings[1]?.type === "heading" ? headings[1].text : "Omschrijving";
  const description = page.blocks.flatMap((block) =>
    block.type === "heading" || block.type === "image" ? [] : [{ type: block.type, html: block.html }],
  );
  const seen = new Set<string>();
  const photos = page.blocks
    .filter((block) => block.type === "image")
    .flatMap((block) => {
      if (block.type !== "image" || seen.has(block.src)) return [];
      seen.add(block.src);
      return [{ src: block.src, alt: block.alt || `${title}, foto ${seen.size}` }];
    });
  const $ = load(page.html, null, false);
  const nav = $("a[href^='/project/']")
    .toArray()
    .map((a) => {
      const href = $(a).attr("href") ?? "";
      return {
        href,
        rel: $(a).attr("rel") === "next" ? ("next" as const) : ("prev" as const),
        title: TITLES[href] ?? getLegacyPageByPath(href)?.heading ?? href,
      };
    })
    .filter((link, index, all) => all.findIndex((other) => other.href === link.href) === index);
  return { title, description, label, photos, nav };
}

/** The products a new project shows, with their tile photo. */
export function newProjectProducts(project: NewProject): ProjectProduct[] {
  return project.products.map((product) => ({ ...product, image: tilePhoto.get(product.href) }));
}
