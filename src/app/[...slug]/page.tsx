import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegacyContent from "@/components/LegacyContent";
import { getLegacyPage, legacyPages } from "@/lib/legacy";

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

  return {
    title: page.title,
    description: page.description || undefined,
    alternates: { canonical: page.canonical },
    openGraph: {
      title: page.title,
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
