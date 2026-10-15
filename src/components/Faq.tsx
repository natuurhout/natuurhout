import JsonLd from "@/components/JsonLd";

export type FaqItem = {
  q: string;
  /** Plain-text answer, for the FAQPage structured data. */
  text: string;
  /** Rich answer on the page (links), when it differs from the text. */
  body?: React.ReactNode;
};

/**
 * Frequently asked questions as open/close rows, with FAQPage structured
 * data so search engines and AI assistants can quote the answers.
 */
export default function Faq({ items, title = "Veelgestelde vragen", id = "veelgestelde-vragen" }: { items: FaqItem[]; title?: string; id?: string }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.text },
          })),
        }}
      />
      <h2 id={id} className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
      <div className="mt-5 divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
        {items.map((item, i) => (
          <details key={item.q} open={i === 0} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink hover:text-accent-deep [&::-webkit-details-marker]:hidden">
              <h3 className="text-base">{item.q}</h3>
              <span aria-hidden className="text-xl leading-none text-accent-deep transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="px-5 pb-5 leading-7 text-ink/75">{item.body ?? item.text}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
