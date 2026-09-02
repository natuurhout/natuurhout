import type { LegacyPage } from "@/lib/legacy";
import JsonLd from "@/components/JsonLd";

type EditorialSource = { title: string; url: string };

const sourcesByPath: Record<string, EditorialSource[]> = {
  "/wat-is-kastanjehout/": [
    {
      title: "EUFORGEN — Castanea sativa",
      url: "https://www.euforgen.org/species/castanea-sativa/",
    },
    {
      title: "Forest Research — Sweet chestnut",
      url: "https://www.forestresearch.gov.uk/tools-and-resources/tree-species-database/131550-sweet-chestnut-sc-2/",
    },
    {
      title: "Forest Research — Forest Fencing (technische gids)",
      url: "https://cdn.forestresearch.gov.uk/2006/03/fctg002.pdf",
    },
  ],
  "/diyplaatsing/": [
    {
      title: "Dobbit TV — Mijn afsluiting zelf plaatsen",
      url: "https://www.youtube.com/watch?v=f4tVxVer4J4",
    },
  ],
};

function addCitations(value: unknown, sources: EditorialSource[]): unknown {
  if (Array.isArray(value)) return value.map((child) => addCitations(child, sources));
  if (!value || typeof value !== "object") return value;

  const record = Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, addCitations(child, sources)]),
  );
  const types = Array.isArray(record["@type"]) ? record["@type"] : [record["@type"]];
  if (types.includes("Article")) record.citation = sources.map((source) => source.url);
  return record;
}

export default function LegacyContent({ page }: { page: LegacyPage }) {
  const sources = sourcesByPath[page.pathname] || [];
  const structuredData = page.structuredData
    ? (addCitations(page.structuredData, sources) as Record<string, unknown>)
    : undefined;

  return (
    <>
      {structuredData && <JsonLd data={structuredData} />}
      <article
        className={`legacy-page legacy-page--${page.kind}`}
        data-source-path={page.pathname}
        dangerouslySetInnerHTML={{ __html: page.html }}
      />
      {sources.length > 0 && (
        <section
          aria-labelledby="editorial-sources"
          className="mx-auto mb-12 w-[calc(100%-2rem)] max-w-[1160px] border-t border-line pt-6 sm:w-[calc(100%-3rem)] lg:w-[calc(100%-5rem)]"
        >
          <h2 id="editorial-sources" className="font-display text-xl font-bold text-ink">
            Bronnen en verdere informatie
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink/75">
            {sources.map((source) => (
              <li key={source.url}>
                <a
                  className="font-semibold text-accent underline underline-offset-2"
                  href={source.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
