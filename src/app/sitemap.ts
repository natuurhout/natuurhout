import type { MetadataRoute } from "next";
import { legacyPages } from "@/lib/legacy";
import { products } from "@/lib/catalog";

const siteUrl = "https://www.natuurhout.be";

export default function sitemap(): MetadataRoute.Sitemap {
  const core: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/producten/`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/calculator/`, changeFrequency: "monthly", priority: 0.8 },
  ];
  const legacy: MetadataRoute.Sitemap = legacyPages.map((page) => ({
    url: `${siteUrl}${page.pathname}`,
    lastModified: page.lastModified ? new Date(page.lastModified) : undefined,
    changeFrequency: page.kind === "archive" ? "weekly" : "monthly",
    priority: page.kind === "project" ? 0.7 : 0.6,
  }));
  const catalogue: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/producten/${product.handle}/`,
    lastModified: product.publishedAt ? new Date(product.publishedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...core, ...legacy, ...catalogue];
}
