import type { Metadata } from "next";
import LegacyContent from "@/components/LegacyContent";
import { getLegacyPageByPath } from "@/lib/legacy";

const page = getLegacyPageByPath("/");

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description || undefined,
  alternates: { canonical: page?.canonical || "https://www.natuurhout.be/" },
  openGraph: {
    title: page?.title,
    description: page?.description || undefined,
    url: page?.canonical || "https://www.natuurhout.be/",
    locale: "nl_BE",
    type: "website",
  },
};

export default function HomePage() {
  if (!page) throw new Error("The WordPress homepage snapshot is missing.");
  return <LegacyContent page={page} />;
}
