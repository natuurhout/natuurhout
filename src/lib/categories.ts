import { CALCULATOR_HEKWERK_PHOTO, CALCULATOR_VLECHTSCHERM_PHOTO } from "@/lib/extra-photos";

export type CategoryTile = { label: string; href: string; src: string };

// Every product group, in menu order: fencing, gates, screens, posts, the
// rest. The snapshot's own tile links are all still here, two of them changed
// with approval (migration/handbuilt-routes.json): "Hazelaar Rasterwerk" now
// opens the hazelaar page (WordPress sent it to robinia) and the vlechtscherm
// tile opens the Trepanel page instead of a URL that redirects there. Photos
// match the /producten/ tiles and the newer photos Natuurhout supplied.
export const categories: CategoryTile[] = [
  { label: "Kastanje Hekwerk", href: "/project/rasterwerk-kastanjehout/", src: CALCULATOR_HEKWERK_PHOTO },
  { label: "Robinia Hekwerk", href: "/project/robinia-rasterwerk/", src: "/fotos/robinia-hekwerk-hoofdfoto.jpg" },
  { label: "Hazelaar Hekwerk", href: "/project/hazelaarrasterwerk/", src: "/fotos/web/hazelaar-afsluiting.jpg" },
  { label: "Kastanje Premium Poorten", href: "/project/franse-poorten/", src: "/fotos/kastanje-premium-poort.jpg" },
  { label: "Kastanje Premium Maatwerk Poorten", href: "/project/maatwerk-poorten/", src: "/fotos/web/dubbele-maatwerkpoort.jpg" },
  { label: "Kastanje Poorten Geschroefd", href: "/project/kastanje-poorten-geschroefd/", src: "/fotos/web/1-1.jpg" },
  { label: "Kaderpoort", href: "/project/raamwerkpoort/", src: "/fotos/web/kaderpoort-1-scaled.jpg" },
  { label: "Robinia Poort", href: "/shop/robinia-poort/", src: "/fotos/robinia-poort.jpg" },
  { label: "Hazelaar Poort", href: "/project/hazelaar-poorten/", src: "/fotos/web/hazelaar-poort.jpg" },
  { label: "Cleft & Field Veldpoorten", href: "/project/cleft-field-veldpoorten/", src: "/fotos/web/untitled-design-3.jpg" },
  { label: "Hazelaar Vlechtscherm - Hasseltre", href: "/project/hazelaar-vlechtscherm-hasseltre/", src: CALCULATOR_VLECHTSCHERM_PHOTO },
  { label: "Hazelaar Vlechtscherm - Trepanel", href: "/project/hazelaarvlechtschermen/", src: "/fotos/web/hazelaar-vlechtscherm-scaled.jpg" },
  { label: "Kastanje Palen", href: "/project/kastanjepalen/", src: "/fotos/kastanje-palen.jpg" },
  { label: "Robinia Palen", href: "/project/robinia-palen/", src: "/fotos/web/robinia-hekwerk-120cm-4cm.jpg" },
  { label: "Gezaagde robinia palen", href: "/shop/vierkant-gezaagde-robinia-palen/", src: "https://cdn.shopify.com/s/files/1/0905/4421/0251/files/gezaagde-robinia-palen-2689446.jpg?v=1760629025" },
  { label: "Eiken Palen", href: "/project/eiken-palen/", src: "/fotos/web/ffa351a0-0fc0-4adc-8cf9-392cf0a0c642.jpg" },
  { label: "Postsaver voor Palen", href: "/project/postsaver-voor-palen/", src: "/fotos/web/img-0585-scaled.jpg" },
  { label: "Post & Rail", href: "/project/post-rail-2/", src: "/fotos/post-rail.jpg" },
  { label: "Plantenbakken", href: "/project/moestuinbak/", src: "/fotos/web/moestuinbak-hazelaar.jpg" },
  { label: "Lariks Schaal delen", href: "/project/lariks-schaal-delen-2/", src: "/fotos/web/lariks5-project-overemere-scaled.jpg" },
];
