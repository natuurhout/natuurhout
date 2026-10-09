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
  { label: "Hazelaar Hekwerk", href: "/project/hazelaarrasterwerk/", src: "/wp-content/uploads/2016/01/Hazelaar-afsluiting4-scaled.webp" },
  { label: "Kastanje Premium Poorten", href: "/project/franse-poorten/", src: "/fotos/kastanje-premium-poort.jpg" },
  { label: "Kastanje Premium Maatwerk Poorten", href: "/project/maatwerk-poorten/", src: "/wp-content/uploads/2016/01/Dubbele-maatwerkpoort-scaled.jpg" },
  { label: "Kastanje Poorten Geschroefd", href: "/project/kastanje-poorten-geschroefd/", src: "/wp-content/uploads/2026/04/1-1.webp" },
  { label: "Kaderpoort", href: "/project/raamwerkpoort/", src: "/wp-content/uploads/2016/01/kaderpoort-1-scaled.jpg" },
  { label: "Robinia Poort", href: "/shop/robinia-poort/", src: "/fotos/robinia-poort.jpg" },
  { label: "Hazelaar Poort", href: "/project/hazelaar-poorten/", src: "/wp-content/uploads/2016/01/Hazelaar-poort.webp" },
  { label: "Cleft & Field Veldpoorten", href: "/project/cleft-field-veldpoorten/", src: "/wp-content/uploads/2016/01/Untitled-design-3.png" },
  { label: "Hazelaar Vlechtscherm - Hasseltre", href: "/project/hazelaar-vlechtscherm-hasseltre/", src: CALCULATOR_VLECHTSCHERM_PHOTO },
  { label: "Hazelaar Vlechtscherm - Trepanel", href: "/project/hazelaarvlechtschermen/", src: "/wp-content/uploads/2016/01/Hazelaar-vlechtscherm-scaled.webp" },
  { label: "Kastanje Palen", href: "/project/kastanjepalen/", src: "/fotos/kastanje-palen.jpg" },
  { label: "Robinia Palen", href: "/project/robinia-palen/", src: "/wp-content/uploads/2026/04/Copy-of-Copy-of-Robinia-Hekwerk-1.20m-4cm.png" },
  { label: "Gezaagde robinia palen", href: "/shop/vierkant-gezaagde-robinia-palen/", src: "https://cdn.shopify.com/s/files/1/0905/4421/0251/files/gezaagde-robinia-palen-2689446.jpg?v=1760629025" },
  { label: "Eiken Palen", href: "/project/eiken-palen/", src: "/wp-content/uploads/2020/09/ffa351a0-0fc0-4adc-8cf9-392cf0a0c642.jpg" },
  { label: "Postsaver voor Palen", href: "/project/postsaver-voor-palen/", src: "/wp-content/uploads/2016/01/IMG_0585-scaled.jpeg" },
  { label: "Post & Rail", href: "/project/post-rail-2/", src: "/fotos/post-rail.jpg" },
  { label: "Plantenbakken", href: "/project/moestuinbak/", src: "/wp-content/uploads/2016/01/IMG_7994-scaled.jpg" },
  { label: "Lariks Schaal delen", href: "/project/lariks-schaal-delen-2/", src: "/wp-content/uploads/2019/10/Lariks5-Project-Overemere-scaled.jpg" },
];
