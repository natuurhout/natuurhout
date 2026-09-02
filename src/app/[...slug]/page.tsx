import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegacyContent from "@/components/LegacyContent";
import {
  getLegacyPage,
  isPermanentlyNoindexLegacyPath,
  legacyMetadataTitle,
  legacyPages,
} from "@/lib/legacy";
import { siteIndexingEnabled } from "@/lib/site";

type Props = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  const explicit = new Set(["/", "/producten/", "/aanbiedingen-2/", "/contact/", "/offerte-aanvragen/"]);
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
  return <LegacyContent page={page} />;
}
