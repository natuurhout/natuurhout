import type { Metadata } from "next";
import LegacyContent from "@/components/LegacyContent";
import { getLegacyPageByPath } from "@/lib/legacy";

const page = getLegacyPageByPath("/aanbiedingen-2/");

export const metadata: Metadata = {
  title: page?.title,
  description: page?.description || undefined,
  alternates: { canonical: page?.canonical },
};

export default function OffersPage() {
  if (!page) throw new Error("The WordPress offers-page snapshot is missing.");
  return <LegacyContent page={page} />;
}
