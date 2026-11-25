/*
 * Main menu. "Producten & Prijzen" is grouped by what the customer wants to
 * build rather than by wood; every link is an existing product page.
 */

export type MenuLink = { href: string; label: string };
export type MenuGroup = {
  title: string;
  /** Overview page of the group: /assortiment/<slug>/ (group title is a link). */
  slug: string;
  intro: string;
  /** The heading in the mega menu, where it differs (a soft hyphen for a narrow column). */
  menuTitle?: string;
  /** Webshop products (handles) listed on the overview page, in this order. */
  products: string[];
  links: MenuLink[];
};

// Order of the menu, left to right (Xander, 25 Nov 2026).
export const productMenu: MenuGroup[] = [
  {
    title: "Afsluitingen & omheiningen",
    slug: "afsluitingen",
    intro: "Hekwerk en rasterwerk in kastanje, robinia en hazelaar, en Post & Rail: van een voortuin tot een volledige weide.",
    products: [
      "kastanje-rasterwerk",
      "robinia-hekwerk",
      "hazelaar-hekwerk",
      "post-rail-omheining",
    ],
    links: [
      { href: "/project/rasterwerk-kastanjehout/", label: "Kastanje hekwerk" },
      { href: "/project/robinia-rasterwerk/", label: "Robinia hekwerk" },
      { href: "/project/hazelaarrasterwerk/", label: "Hazelaar hekwerk" },
      { href: "/project/post-rail-2/", label: "Post & Rail" },
    ],
  },
  {
    title: "Poorten",
    slug: "poorten",
    intro: "Tuinpoorten en veldpoorten in kastanje, robinia en hazelaar: standaard uit voorraad of op maat gemaakt.",
    products: [
      "kastanje-poorten",
      "kastanje-poort-geschroefd",
      "robinia-poort",
      "hazelaar-poort",
      "cleft-field-poorten",
      "hardhouten-veldpoort",
      "beslag-hang-sluitwerk",
    ],
    links: [
      { href: "/project/franse-poorten/", label: "Kastanje premium poorten" },
      { href: "/project/maatwerk-poorten/", label: "Kastanje premium maatwerk poorten" },
      { href: "/project/kastanje-poorten-geschroefd/", label: "Kastanje poorten geschroefd" },
      { href: "/project/raamwerkpoort/", label: "Kaderpoort" },
      { href: "/project/hazelaar-poorten/", label: "Hazelaar poorten" },
      { href: "/shop/robinia-poort/", label: "Robinia poort" },
      { href: "/project/cleft-field-veldpoorten/", label: "Cleft & Field veldpoorten" },
      { href: "/shop/beslag-hang-sluitwerk/", label: "Hang- en sluitwerk" },
    ],
  },
  {
    title: "Palen",
    slug: "palen",
    intro: "Palen in kastanje, robinia en eik, rond of gezaagd, en Postsavers voor een langere levensduur in de grond.",
    products: [
      "palen",
      "kastanje-palen-copy",
      "robinia-palen",
      "vierkant-gezaagde-robinia-palen",
      "halfronde-palen",
      "eiken-palen",
      "kastanje-paal-met-postsaver",
      "paalhouder-met-punt-rond",
    ],
    links: [
      { href: "/project/kastanjepalen/", label: "Kastanje palen" },
      { href: "/shop/halfronde-palen/", label: "Halfronde kastanje palen" },
      { href: "/project/robinia-palen/", label: "Robinia palen" },
      { href: "/shop/vierkant-gezaagde-robinia-palen/", label: "Gezaagde robinia palen" },
      { href: "/project/eiken-palen/", label: "Eiken palen" },
      { href: "/project/postsaver-voor-palen/", label: "Postsaver voor palen" },
    ],
  },
  {
    title: "Vlechtschermen",
    slug: "vlechtschermen",
    intro: "Gevlochten hazelaar schermen en schermen met halve latten, voor privacy en beschutting met een natuurlijke uitstraling.",
    products: ["hazelaar-vlechtscherm-hasseltre", "hazelaar-scherm-trepanel"],
    links: [
      { href: "/project/hazelaarvlechtschermen/", label: "Hazelaar vlechtschermen" },
      { href: "/project/hazelaar-vlechtscherm-hasseltre/", label: "Hazelaar vlechtschermen – halve latten" },
    ],
  },
  {
    title: "Tuinproducten",
    slug: "tuinproducten",
    intro: "Plantenbakken en lariks schaaldelen om uw tuin verder af te werken.",
    products: ["tuinbakken-hazelaar", "plantenbak-cortenstaal", "lariks-planken-delen"],
    links: [
      { href: "/project/moestuinbak/", label: "Plantenbakken" },
      { href: "/project/lariks-schaal-delen-2/", label: "Lariks schaaldelen" },
    ],
  },
  {
    title: "Plaatsingsmateriaal",
    menuTitle: "Plaatsings\u00admateriaal",
    slug: "plaatsingsmateriaal",
    intro: "Alles om uw afsluiting zelf te plaatsen: houtschroeven, paalhouders, draadverbinders, hang- en sluitwerk en snelbeton, en gereedschap zoals slaghamers en grondboren.",
    products: ["houtschroeven", "paalhouder-met-punt-rond", "hekwerk-draadverbinders", "beslag-hang-sluitwerk", "tuin-voorhamer", "grondboor", "snelbeton"],
    links: [
      { href: "/shop/houtschroeven/", label: "Houtschroeven" },
      { href: "/shop/paalhouder-met-punt-rond/", label: "Paalhouders" },
      { href: "/shop/hekwerk-draadverbinders/", label: "Draadverbinders" },
      { href: "/shop/beslag-hang-sluitwerk/", label: "Hang- en sluitwerk" },
      { href: "/shop/tuin-voorhamer/", label: "Slaghamers" },
      { href: "/shop/grondboor/", label: "Grondboren" },
      { href: "/shop/snelbeton/", label: "Snelbeton" },
    ],
  }
];

/** The promotions page; keeps its WordPress URL and title ("Aanbiedingen"). */
export const PROMO_HREF = "/aanbiedingen-2/";

// Realisaties moved to the footer (and to the product pages it belongs to).
export const pageLinks: MenuLink[] = [
  { href: PROMO_HREF, label: "Promo's" },
  { href: "/calculator/", label: "Calculator" },
  { href: "/over-ons/", label: "Over ons" },
  { href: "/contact/", label: "Contact" },
];

export const QUOTE_HREF = "/offerte-aanvragen/";

export const groupHref = (group: MenuGroup) => `/assortiment/${group.slug}/`;
