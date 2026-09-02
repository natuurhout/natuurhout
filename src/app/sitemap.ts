import type { MetadataRoute } from "next";
import { isPermanentlyNoindexLegacyPath, legacyPages } from "@/lib/legacy";
import { products } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const core: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/shop/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/shop/kastanje/`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/calculator/`, changeFrequency: "monthly", priority: 0.8 },
  ];
  const legacy: MetadataRoute.Sitemap = legacyPages
    .filter((page) => !isPermanentlyNoindexLegacyPath(page.pathname))
    .map((page) => ({
      url: `${siteUrl}${page.pathname}`,
      lastModified: page.lastModified ? new Date(page.lastModified) : undefined,
      changeFrequency: page.kind === "archive" ? "weekly" : "monthly",
      priority: page.kind === "project" ? 0.7 : 0.6,
    }));
  const catalogue: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/shop/${product.handle}/`,
    lastModified: product.publishedAt ? new Date(product.publishedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...core, ...legacy, ...catalogue];
}
