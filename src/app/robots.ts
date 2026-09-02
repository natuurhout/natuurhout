import type { MetadataRoute } from "next";
import { siteIndexingEnabled, siteUrl } from "@/lib/site";

// STAGING PROTECTION: full disallow until cutover. At cutover this becomes
// the live-parity version (allow all, disallow /wp-admin/ equivalent not
// needed on Next.js) + sitemap reference. See migration/phase0-report.md.
export default function robots(): MetadataRoute.Robots {
  if (siteIndexingEnabled) {
    return {
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
