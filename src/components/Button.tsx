import Link from "next/link";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "accent" | "dark" | "outline";
  external?: boolean;
  className?: string;
};

const styles = {
  accent:
    "bg-accent text-brand-dark hover:bg-accent-bright",
  dark: "bg-brand-dark text-white hover:bg-brand",
  outline:
    "border border-brand/30 text-brand hover:border-brand hover:bg-brand-soft",
};

export default function Button({
  href,
  children,
  variant = "accent",
  external = false,
  className = "",
}: Props) {
  const cls = `inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${styles[variant]} ${className}`;
  if (external) {
    return (
      <a href={href} className={cls}>
        {children}
        <span aria-hidden className="text-base leading-none">↗</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
