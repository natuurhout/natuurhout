import JsonLd from "@/components/JsonLd";
import ProjectLayout from "@/components/ProjectLayout";
import type { LegacyPage } from "@/lib/legacy";
import { legacyProjectView, projectProducts } from "@/lib/realisaties";

const TAGS = { paragraph: "p", ul: "ul", ol: "ol", blockquote: "blockquote", table: "div" } as const;

/*
 * A WordPress customer project (/project/…) in the shared project layout.
 * Its h1, text, photos (each linked full size) and previous/next links are
 * the snapshot's own; the audit checks they are all still on the page
 * (migration/handbuilt-routes.json, preserveContent).
 */
export default function LegacyProjectPage({ page }: { page: LegacyPage }) {
  const view = legacyProjectView(page);
  return (
    <>
      {page.structuredData && <JsonLd data={page.structuredData} />}
      <ProjectLayout
        title={view.title}
        label={view.label}
        description={view.description.map((block, index) => {
          const Tag = TAGS[block.type];
          return <Tag key={index} dangerouslySetInnerHTML={{ __html: block.html }} />;
        })}
        products={projectProducts(page.pathname)}
        photos={view.photos}
        nav={view.nav}
        rootProps={{ "data-legacy-product": page.pathname }}
      />
    </>
  );
}
