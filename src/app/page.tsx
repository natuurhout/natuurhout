import LegacyContent from "@/components/LegacyContent";
import { getLegacyPageByPath } from "@/lib/legacy";

export default function HomePage() {
  const page = getLegacyPageByPath("/");
  if (!page) throw new Error("The WordPress homepage snapshot is missing.");
  return <LegacyContent page={page} />;
}
