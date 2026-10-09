import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Realisatie } from "@/lib/realisaties";

/** "Zo ziet het eruit bij onze klanten": customer projects with this product. */
export default function Realisaties({
  items,
  title = "Zo ziet het eruit bij onze klanten",
  intro = "Realisaties met dit product, geplaatst door Natuurhout.",
  allLink = true,
  className = "mt-16 border-t border-line pt-10",
  heading = "h2",
}: {
  items: Realisatie[];
  title?: string;
  intro?: string;
  allLink?: boolean;
  className?: string;
  /** "p" where the block comes before the page's own h1. */
  heading?: "h2" | "p";
}) {
  if (!items.length) return null;
  const Heading = heading;
  return (
    <section className={className} aria-labelledby="realisaties-titel">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading id="realisaties-titel" className="font-display text-2xl font-semibold">
            {title}
          </Heading>
          <p className="mt-1 text-sm text-ink/60">{intro}</p>
        </div>
        {allLink && (
          <Link href="/onze-realisaties/" className="text-sm font-medium text-accent hover:text-accent-deep">
            Alle realisaties →
          </Link>
        )}
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-ink/10"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-brand-soft/50">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              </span>
              <span className="flex flex-1 items-start justify-between gap-2 p-3.5 text-sm font-semibold leading-snug text-ink group-hover:text-accent-deep">
                {item.title}
                <ArrowRight aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink/30 transition-colors group-hover:text-accent" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
