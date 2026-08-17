import type { MetadataRoute } from "next";

// STAGING PROTECTION: full disallow until cutover. At cutover this becomes
// the live-parity version (allow all, disallow /wp-admin/ equivalent not
// needed on Next.js) + sitemap reference. See migration/phase0-report.md.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
