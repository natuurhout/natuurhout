import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegacyContent from "@/components/LegacyContent";
import { withNewArtikels } from "@/lib/artikel-cards";
import LegacyProductPage from "@/components/LegacyProductPage";
import LegacyProjectPage from "@/components/LegacyProjectPage";
import Realisaties from "@/components/Realisaties";
import {
  getLegacyPage,
  isPermanentlyNoindexLegacyPath,
  legacyMetadataDescription,
  legacyMetadataTitle,
  legacyPages,
} from "@/lib/legacy";
import { legacyProduct } from "@/lib/legacy-product";
import { isLegacyProject, newRealisaties } from "@/lib/realisaties";
import { siteIndexingEnabled } from "@/lib/site";

type Props = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  const explicit = new Set(["/", "/producten/", "/aanbiedingen-2/", "/contact/", "/offerte-aanvragen/", "/over-ons/", "/houten-tuinpoorten/", "/landelijke-afsluiting/",
    // Legal pages, rewritten Nov 2026 (src/components/LegalPage.tsx).
    "/algemene-voorwaarden-van-beho-comm-v/", "/gebruiksvoorwaarden/", "/privacyverklaring/", "/cookiebeleid-eu/", "/verzoek-toegang-tot-data/"]);
  return legacyPages
    .filter((page) => !explicit.has(page.pathname))
    .map((page) => ({ slug: page.pathname.split("/").filter(Boolean) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getLegacyPage(slug);
  if (!page) return {};
  const title = legacyMetadataTitle(page);
  const description = legacyMetadataDescription(page) || undefined;

  return {
    title,
    description,
    alternates: { canonical: page.canonical },
    robots: !siteIndexingEnabled || isPermanentlyNoindexLegacyPath(page.pathname)
      ? { index: false, follow: false }
      : undefined,
    openGraph: {
      title,
      description,
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
  // Customer projects use the shared project layout.
  if (isLegacyProject(page.pathname)) return <LegacyProjectPage page={page} />;
  // The realisations overview starts with the projects added since WordPress
  // (outside the snapshot's own content, which renders unchanged below).
  if (page.pathname === "/onze-realisaties/") {
    return (
      <>
        <div className="mx-auto w-full max-w-[1240px] bg-white px-4 pt-9 sm:px-6 lg:px-10 lg:pt-14">
          <Realisaties
            items={newRealisaties()}
            title="Nieuwste realisaties"
            intro="Recente projecten van Natuurhout, met foto's van op de werf."
            allLink={false}
            className=""
            heading="p"
          />
        </div>
        <LegacyContent page={page} />
      </>
    );
  }
  // Tips & Ideeën: the articles written since WordPress come first in the
  // snapshot's own blog grid (approved, handbuilt-routes.json).
  if (page.pathname === "/tipsenideeen/") return <LegacyContent page={{ ...page, html: withNewArtikels(page.html) }} />;
  return <LegacyContent page={page} />;
}
