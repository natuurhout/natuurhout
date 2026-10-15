import Image from "next/image";
import Link from "next/link";

/**
 * An inline text link that shows a small photo of where it leads while the
 * mouse is over it (or it has keyboard focus). Touch screens just follow it.
 */
export default function PreviewLink({ href, image, children }: { href: string; image?: string; children: React.ReactNode }) {
  return (
    <span className="group/preview relative inline-block">
      <Link href={href} className="font-semibold text-accent-deep underline decoration-accent/40 underline-offset-2 hover:text-ink">
        {children}
      </Link>
      {image && (
        <span
          aria-hidden
          className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 hidden w-52 -translate-x-1/2 translate-y-1 overflow-hidden rounded-xl border border-line bg-white opacity-0 shadow-xl shadow-ink/15 transition duration-150 group-focus-within/preview:visible group-focus-within/preview:translate-y-0 group-focus-within/preview:opacity-100 [@media(hover:hover)]:block [@media(hover:hover)]:group-hover/preview:visible [@media(hover:hover)]:group-hover/preview:translate-y-0 [@media(hover:hover)]:group-hover/preview:opacity-100"
        >
          <span className="relative block aspect-[4/3] bg-brand-soft/60">
            <Image src={image} alt="" fill sizes="208px" className="object-cover" />
          </span>
          <span className="block px-3 py-2 text-xs font-semibold leading-snug text-ink">{children}</span>
        </span>
      )}
    </span>
  );
}
