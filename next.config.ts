import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Hosted on Cloudflare Workers as a static export (./out). The Worker in
  // worker/index.ts serves /api/offerte/ and reproduces trailingSlash and the
  // redirects() below (it imports this file), with the same 308s as Next.
  output: "export",
  images: {
    // No image optimisation server on a static host: the loader points at WebP
    // copies that scripts/build-images.mjs writes after the build (SEO batch 2).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Fewer, matching widths (photos in public/fotos/web are at most 1400 px).
    deviceSizes: [640, 828, 1080, 1400, 1920],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      // Shop product images stay on the Shopify CDN (catalog is copied from
      // natuurhout.shop; the shop itself is never modified — rule 8).
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  // WordPress URL parity: every live natuurhout.be URL ends in a trailing
  // slash and the canonical tags point at the slashed variant. Keeping this
  // `true` is what makes the cutover need ZERO redirects for existing URLs.
  // Do not remove — see migration/phase0-report.md.
  trailingSlash: true,
  async redirects() {
    // These 9 redirects EXIST on live WordPress today (confirmed 301s in the
    // Phase 0 crawl) — the sitemap still lists the old slugs. Reproducing
    // them is parity, not a new redirect decision.
    const live301s: Array<[string, string]> = [
      ["/afsluiting-hazelaar-kopen", "/project/hazelaarrasterwerk/"],
      ["/afsluitingen-kopen-vlaanderen", "/landelijke-afsluiting/"],
      ["/eiken-palen-kopen-vlaanderen", "/project/eiken-palen/"],
      ["/houten-moestuinbak", "/project/moestuinbak/"],
      // SEO batch 2 (Nov 2026): to the page that matches, not the homepage (Google reads that as a soft 404).
      ["/kastanje-palen", "/project/kastanjepalen/"],
      ["/kastanje-poort", "/project/franse-poorten/"],
      ["/lariks-schaaldelen-kopen-vlaanderen", "/project/lariks-schaal-delen-2/"],
      ["/moestuinbak-kopen-vlaanderen", "/project/moestuinbak/"],
      ["/plantenbakken-kopen", "/project/moestuinbak/"],
    ];
    const migrationSeoRedirects: Array<[string, string]> = [
      ["/project/robiniarasterwerk", "/project/robinia-rasterwerk/"],
      ["/project/hazelaar-vlechtschermen-halve-latten", "/project/hazelaarvlechtschermen/"],
      ["/project/hardhout-poorten", "/project/cleft-field-veldpoorten/"],
      ["/contact-page", "/contact/"],
      ["/author/sebastiaan", "/category/blog/"],
      ["/author/syto", "/category/blog/"],
      ["/author/aziz", "/category/blog/"],
      ["/2013/12/03", "/category/blog/"],
      ["/2014/03/21", "/category/blog/"],
      ["/2016/01/15", "/category/blog/"],
      ["/2016/01/19", "/category/blog/"],
      ["/2019/09/14", "/category/blog/"],
      ["/2019/09/24", "/category/blog/"],
      ["/2019/10/03", "/category/blog/"],
      ["/2020/10/07", "/category/blog/"],
      ["/2020/10/09", "/category/blog/"],
      ["/2023/01/19", "/category/blog/"],
      ["/2025/06/23", "/category/blog/"],
      ["/2026/02/17", "/category/blog/"],
      ["/category/blog/page/2", "/category/blog/"],
      ["/project_category/all/page/2", "/project_category/all/"],
      ["/project_category/all/page/3", "/project_category/all/"],
      ["/project_category/producten/page/2", "/project_category/producten/"],
      ["/project_category/projecten-poorten/page/2", "/project_category/projecten-poorten/"],
      ["/homepage-natuurhout-kastanje-afsluiting-kastanjehouten-hekwerk-2", "/project/rasterwerk-kastanjehout/"],
      ["/homepage-natuurhout-kastanje-afsluiting-kastanjehouten-hekwerk", "/project/rasterwerk-kastanjehout/"],
    ];
    // Products taken off the website (src/lib/promotions.ts REMOVED_PRODUCTS).
    const removedProducts: Array<[string, string]> = [
      ["/shop/kastanje-hekwerk-1-00m-4-5cm-4-20m-lengte", "/project/hazelaarrasterwerk/"],
      // Shown as one product with a choice (src/lib/merged-products.ts).
      ["/shop/grondboor-kopie", "/shop/grondboor/"],
      // The old WooCommerce account pages (no accounts any more, Nov 2026).
      ["/view-order", "/contact/"],
      ["/change-password", "/"],
      ["/lost-password", "/"],
      ["/logout", "/"],
    ];
    return [...live301s, ...migrationSeoRedirects, ...removedProducts].map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    })).concat([
      {
        source: "/producten/:handle",
        destination: "/shop/:handle/",
        permanent: true,
      },
    ]);
  },
};

export default nextConfig;
