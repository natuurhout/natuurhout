/*
 * SEO, option A (Xander, Nov 2026): one page per product. Where a webshop
 * product also has its WordPress product page (/project/…), that page is the
 * main one: it has the old ranking, the richest copy and the same orderable
 * price list. The /shop/ page stays (old links and the winkelmandje keep
 * working) but its canonical points here, it leaves the sitemap, internal
 * links go to the main page and the Product schema lives there.
 */
export const SHOP_CANONICAL: Record<string, string> = {
  "kastanje-rasterwerk": "/project/rasterwerk-kastanjehout/",
  "robinia-hekwerk": "/project/robinia-rasterwerk/",
  "hazelaar-hekwerk": "/project/hazelaarrasterwerk/",
  "kastanje-poorten": "/project/franse-poorten/",
  "kastanje-poort-geschroefd": "/project/kastanje-poorten-geschroefd/",
  "kastanje-kaderpoort-geschroefd": "/project/raamwerkpoort/",
  "kastanje-kaderpoort-premium": "/project/raamwerkpoort/",
  "hazelaar-poort": "/project/hazelaar-poorten/",
  "cleft-field-poorten": "/project/cleft-field-veldpoorten/",
  palen: "/project/kastanjepalen/",
  "robinia-palen": "/project/robinia-palen/",
  "eiken-palen": "/project/eiken-palen/",
  "kastanje-paal-met-postsaver": "/project/postsaver-voor-palen/",
  "kastanje-palen-copy": "/project/postsaver-voor-palen/",
  "post-rail-omheining": "/project/post-rail-2/",
  "hazelaar-scherm-trepanel": "/project/hazelaarvlechtschermen/",
  "hazelaar-vlechtscherm-hasseltre": "/project/hazelaar-vlechtscherm-hasseltre/",
  "tuinbakken-hazelaar": "/project/moestuinbak/",
  "lariks-planken-delen": "/project/lariks-schaal-delen-2/",
};

/** The main page of a product: its /project/ page when it has one, else /shop/<handle>/. */
export const mainPage = (handle: string) => SHOP_CANONICAL[handle] ?? `/shop/${handle}/`;
