// GardenGlory-style heading: last word carries an accent underline.
export default function SectionHeading({
  children,
  underline,
  as: Tag = "h2",
  light = false,
}: {
  children: React.ReactNode;
  underline?: string;
  as?: "h1" | "h2" | "h3";
  light?: boolean;
}) {
  return (
    <Tag
      className={`text-3xl font-semibold tracking-tight sm:text-4xl ${
        light ? "text-white" : "text-ink"
      }`}
    >
      {children}
      {underline ? (
        <>
          {" "}
          <span className="underline decoration-accent decoration-4 underline-offset-8">
            {underline}
          </span>
        </>
      ) : null}
    </Tag>
  );
}
