import { legacyPages } from "@/lib/legacy";

/*
 * Customer projects (the WordPress /project/ realisation pages) by the
 * product they show, so a product page can end with real examples. Mapped
 * by hand from each project's title and description.
 */

type Kind = "hekwerk" | "vlechtschermen" | "maatwerk-poort" | "premium-poort" | "cleft-field" | "post-rail" | "lariks";

// Most telling project first within each kind.
const PROJECTS: Record<Kind, string[]> = {
  hekwerk: [
    "/project/project-zele/",
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
    "/project/project-sint-niklaas-maatwerk-poort-rasterwerk-1-80m/",
    "/project/project-lebbeke/",
    "/project/project-berlare-vlechtschermen-maatwerk-poort/",
    "/project/project-hamme3/",
  ],
  "premium-poort": ["/project/project-lochristi-rasterwerk-poort-1-20m/", "/project/rasterwerk120cm-moerkerke/"],
  "cleft-field": [
    "/project/project-waasmunster-cleft-field-poorten-1-50m-2x-2-40m/",
    "/project/project-keerbergen-cleftfield-poort-3-60m/",
    "/project/project-lebbeke-cleft-field-poort/",
    "/project/project-huivelde-rasterwerk-cleftfield-poort/",
    "/project/project-destelbergen/",
  ],
  "post-rail": ["/project/project-sintgilleswaas-postrail/", "/project/project-hamme5/"],
  lariks: ["/project/project-overmere/", "/project/project-overmere-2/"],
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
};

// Card titles where the WordPress title is generic or used twice.
const TITLES: Record<string, string> = {
  "/project/project-brugge/": "Project Brugge – Vlechtschermen",
  "/project/project-huivelde-rasterwerk-cleftfield-poort/": "Project Huivelde – Rasterwerk & Cleft & Field Poort",
  "/project/project-overmere-2/": "Project Overmere – Lariks schutting",
};

export type Realisatie = { href: string; title: string; image: string; alt: string };

function realisatie(pathname: string): Realisatie | null {
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
