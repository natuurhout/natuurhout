import Image from "next/image";
import Link from "next/link";
import type { LegacyBlock, LegacyPage } from "@/lib/legacy";

function Heading({ block }: { block: Extract<LegacyBlock, { type: "heading" }> }) {
  const className =
    block.level <= 2
      ? "mt-12 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
      : "mt-9 font-display text-xl font-semibold text-ink sm:text-2xl";
  if (block.level === 1) return <h2 className={className}>{block.text}</h2>;
  if (block.level === 2) return <h2 className={className}>{block.text}</h2>;
  if (block.level === 3) return <h3 className={className}>{block.text}</h3>;
  return <h4 className={className}>{block.text}</h4>;
}

function RichBlock({ block }: { block: Exclude<LegacyBlock, { type: "heading" | "image" }> }) {
  const className = {
    paragraph: "mt-5 leading-7 text-ink/75",
    ul: "mt-5 list-disc space-y-2 pl-6 leading-7 text-ink/75",
    ol: "mt-5 list-decimal space-y-2 pl-6 leading-7 text-ink/75",
    blockquote: "mt-6 border-l-2 border-accent pl-5 italic leading-7 text-ink/70",
    table: "mt-6 w-full border-collapse overflow-hidden text-left text-sm text-ink/75",
  }[block.type];

  const Tag: "p" | "ul" | "ol" | "blockquote" | "table" =
    block.type === "paragraph" ? "p" : block.type;
  return (
    <Tag
      className={`${className} [&_a]:font-medium [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-ink [&_td]:border [&_td]:border-line [&_td]:p-3 [&_th]:border [&_th]:border-line [&_th]:bg-brand-soft [&_th]:p-3`}
      dangerouslySetInnerHTML={{ __html: block.html }}
    />
  );
}

export default function LegacyContent({ page }: { page: LegacyPage }) {
  return (
    <>
      <section className="border-b border-line bg-brand-dark text-white">
        <div className="px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
          <nav aria-label="Breadcrumb" className="text-sm text-white/55">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <span className="mx-2" aria-hidden>›</span>
            <span>{page.heading}</span>
          </nav>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-accent-bright">
            {page.kind === "project" ? "Realisatie" : page.kind === "archive" ? "Overzicht" : "Natuurhout"}
          </p>
          <h1 className="mt-3 max-w-5xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            {page.heading}
          </h1>
        </div>
      </section>

      <article className="px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <div className={page.kind === "archive" ? "mx-auto max-w-6xl" : "mx-auto max-w-4xl"}>
          {page.blocks.map((block, index) => {
            if (block.type === "heading") return <Heading key={index} block={block} />;
            if (block.type === "image") {
              return (
                <figure key={index} className="my-8 overflow-hidden rounded-card border border-line bg-white">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    width={block.width}
                    height={block.height}
                    sizes="(max-width: 1024px) 100vw, 896px"
                    className="h-auto w-full object-cover"
                  />
                </figure>
              );
            }
            return <RichBlock key={index} block={block} />;
          })}

          <aside className="mt-14 rounded-card bg-brand-soft p-7 sm:p-9">
            <p className="font-display text-xl font-semibold text-ink">Advies of een offerte nodig?</p>
            <p className="mt-2 max-w-2xl leading-7 text-ink/70">
              Vertel ons wat u wilt realiseren. We helpen u graag met materiaalkeuze, hoeveelheden en plaatsing.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/offerte-aanvragen/" className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-deep">
                Offerte aanvragen
              </Link>
              <a href="https://natuurhout.shop/" target="_blank" rel="noopener" className="rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink hover:border-ink/40">
                Naar de webshop
              </a>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
