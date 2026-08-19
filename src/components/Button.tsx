import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "accent" | "dark" | "outline" | "ghost";
  /** External links (webshop) open in a new tab — .be and .shop grow
      together, so the shop opens alongside the site, not instead of it. */
  external?: boolean;
  className?: string;
};

const styles = {
  accent: "bg-accent text-white hover:bg-accent-deep",
  dark: "bg-brand-dark text-white hover:bg-brand",
  outline:
    "border border-ink/20 text-ink hover:border-ink/40 hover:bg-white/40",
  ghost: "border border-white/25 text-white hover:border-white/60",
};

export default function Button({
  href,
  children,
  variant = "accent",
  external = false,
  className = "",
}: Props) {
  const cls = `group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors ${styles[variant]} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cls}>
        {children}
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
