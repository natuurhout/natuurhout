/*
 * Main menu. "Producten & Prijzen" is grouped by what the customer wants to
 * build rather than by wood; every link is an existing product page.
 */

export type MenuLink = { href: string; label: string };
export type MenuGroup = { title: string; links: MenuLink[] };

export const productMenu: MenuGroup[] = [
  {
    title: "Afsluitingen & omheiningen",
    links: [
      { href: "/project/rasterwerk-kastanjehout/", label: "Kastanje rasterwerk" },
      { href: "/project/robinia-rasterwerk/", label: "Robinia rasterwerk" },
      { href: "/project/hazelaarrasterwerk/", label: "Hazelaar hekwerk" },
      { href: "/project/post-rail-2/", label: "Post & Rail" },
    ],
  },
  {
    title: "Vlechtschermen",
    links: [
      { href: "/project/hazelaarvlechtschermen/", label: "Hazelaar vlechtschermen" },
      { href: "/project/hazelaar-vlechtscherm-hasseltre/", label: "Hazelaar vlechtschermen – halve latten" },
    ],
  },
  {
    title: "Palen",
    links: [
      { href: "/project/kastanjepalen/", label: "Kastanje palen" },
      { href: "/project/robinia-palen/", label: "Robinia palen" },
      { href: "/project/eiken-palen/", label: "Eiken palen" },
      { href: "/project/postsaver-voor-palen/", label: "Postsaver voor palen" },
    ],
  },
  {
    title: "Poorten",
    links: [
      { href: "/project/franse-poorten/", label: "Franse poorten standaard" },
      { href: "/project/maatwerk-poorten/", label: "Franse poorten maatwerk" },
      { href: "/project/kastanje-poorten-geschroefd/", label: "Kastanje poorten geschroefd" },
      { href: "/project/raamwerkpoort/", label: "Kaderpoort" },
      { href: "/project/hazelaar-poorten/", label: "Hazelaar poorten" },
      { href: "/project/cleft-field-veldpoorten/", label: "Cleft & Field veldpoorten" },
    ],
  },
  {
    title: "Tuinproducten",
    links: [
      { href: "/project/moestuinbak/", label: "Plantenbakken" },
      { href: "/project/lariks-schaal-delen-2/", label: "Lariks schaaldelen" },
    ],
  },
];

export const pageLinks: MenuLink[] = [
  { href: "/aanbiedingen-2/", label: "Aanbiedingen" },
  { href: "/onze-realisaties/", label: "Realisaties" },
  { href: "/over-ons/", label: "Over ons" },
  { href: "/contact/", label: "Contact" },
];

export const QUOTE_HREF = "/offerte-aanvragen/";
