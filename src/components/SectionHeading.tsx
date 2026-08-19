// Editorial section header: small uppercase kicker + display-serif title.
export default function SectionHeading({
  kicker,
  children,
  as: Tag = "h2",
  light = false,
  className = "",
}: {
  kicker?: string;
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {kicker && (
        <p
          className={`mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] ${
            light ? "text-accent-bright" : "text-accent"
          }`}
        >
          <span aria-hidden className={`h-px w-8 ${light ? "bg-accent-bright" : "bg-accent"}`} />
          {kicker}
        </p>
      )}
      <Tag
        className={`font-display text-3xl font-bold tracking-tight sm:text-4xl ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {children}
      </Tag>
    </div>
  );
}
