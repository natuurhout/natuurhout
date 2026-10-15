import PreviewLink from "@/components/PreviewLink";
import { categories } from "@/lib/categories";

/*
 * Building blocks of the SEO landing pages (houten tuinpoorten, landelijke
 * afsluitingen): a titled text section and a product card whose link shows a
 * small photo on hover.
 */

/** The menu tile photo of a product page, for link previews. */
export const tilePhoto = (href: string) => categories.find((tile) => tile.href === href)?.src;

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 leading-7 text-ink/75">{children}</div>
    </section>
  );
}

export function ProductItem({ href, name, children }: { href: string; name: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-line bg-white p-4">
      <PreviewLink href={href} image={tilePhoto(href)}>{name}</PreviewLink>
      <p className="mt-1 text-[15px] leading-6 text-ink/70">{children}</p>
    </li>
  );
}

/** An inline product link with its tile photo as hover preview. */
export function P({ href, children }: { href: string; children: React.ReactNode }) {
  return <PreviewLink href={href} image={tilePhoto(href)}>{children}</PreviewLink>;
}

export const textLink = "font-semibold text-accent-deep underline decoration-accent/40 underline-offset-2 hover:text-ink";

/**
 * The snapshot's structured data with the page's current name and
 * description, so it matches the approved title and meta description.
 */
export function withPageMeta(data: Record<string, unknown>, name: string, description: string): Record<string, unknown> {
  const graph = Array.isArray(data["@graph"]) ? (data["@graph"] as Record<string, unknown>[]) : null;
  if (!graph) return data;
  return {
    ...data,
    "@graph": graph.map((node) => (node["@type"] === "WebPage" ? { ...node, name, description } : node)),
  };
}

/** Places where Natuurhout delivered and placed fences and gates (the realisations). */
export const PLACES = [
  "Zele", "Berlare", "Overmere", "Dendermonde", "Grembergen", "Lebbeke", "Hamme", "Waasmunster", "Sint-Niklaas",
  "Sint-Gillis-Waas", "Lochristi", "Destelbergen", "Merelbeke", "Lievegem", "Zulte", "Ronse", "Denderleeuw",
  "Brugge", "Moerkerke", "Menen", "Keerbergen",
];
