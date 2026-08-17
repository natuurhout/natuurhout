import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Shop product images stay on the Shopify CDN (catalog is copied from
      // natuurhout.shop; the shop itself is never modified — rule 8).
      { protocol: "https", hostname: "cdn.shopify.com" },
      // Live .be media until the wp-content/uploads mirror lands (Phase 3).
      { protocol: "https", hostname: "www.natuurhout.be" },
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
      ["/kastanje-palen", "/"],
      ["/kastanje-poort", "/project/franse-poorten/"],
      ["/lariks-schaaldelen-kopen-vlaanderen", "/"],
      ["/moestuinbak-kopen-vlaanderen", "/project/moestuinbak/"],
      ["/plantenbakken-kopen", "/project/moestuinbak/"],
    ];
    return live301s.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;
