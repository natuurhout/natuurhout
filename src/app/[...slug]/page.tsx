import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegacyContent from "@/components/LegacyContent";
import LegacyProductPage from "@/components/LegacyProductPage";
import {
  getLegacyPage,
  isPermanentlyNoindexLegacyPath,
  legacyMetadataTitle,
  legacyPages,
} from "@/lib/legacy";
import { legacyProduct } from "@/lib/legacy-product";
import { siteIndexingEnabled } from "@/lib/site";

type Props = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  const explicit = new Set(["/", "/producten/", "/aanbiedingen-2/", "/contact/", "/offerte-aanvragen/", "/over-ons/"]);
  return legacyPages
    .filter((page) => !explicit.has(page.pathname))
    .map((page) => ({ slug: page.pathname.split("/").filter(Boolean) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getLegacyPage(slug);
  if (!page) return {};
  const title = legacyMetadataTitle(page);

  return {
    title,
    description: page.description || undefined,
    alternates: { canonical: page.canonical },
    robots: !siteIndexingEnabled || isPermanentlyNoindexLegacyPath(page.pathname)
      ? { index: false, follow: false }
      : undefined,
    openGraph: {
      title,
      description: page.description || undefined,
      url: page.canonical,
      locale: "nl_BE",
      type: page.kind === "page" ? "website" : "article",
    },
  };
}

export default async function LegacyRoute({ params }: Props) {
  const { slug } = await params;
  const page = getLegacyPage(slug);
  if (!page) notFound();
  // The "Producten & Prijzen" pages use the shop's product layout.
  const product = legacyProduct(page);
  if (product) return <LegacyProductPage page={page} info={product} />;
  return <LegacyContent page={page} />;
}
