import type { LegacyPage } from "@/lib/legacy";

export default function LegacyContent({ page }: { page: LegacyPage }) {
  return (
    <article
      className={`legacy-page legacy-page--${page.kind}`}
      data-source-path={page.pathname}
      dangerouslySetInnerHTML={{ __html: page.html }}
    />
  );
}
