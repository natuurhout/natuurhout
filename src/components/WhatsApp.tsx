import { WHATSAPP } from "@/lib/contact";

/* WhatsApp's own glyph (lucide has no brand icons). */
export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41z" />
    </svg>
  );
}

/*
 * Floating WhatsApp button, bottom right. Hidden on pages with the sticky
 * price-list total (data-sticky-cta, see globals.css), where it would cover
 * the order button; those pages carry a WhatsApp link in their contact card.
 */
export default function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Stuur ons een bericht via WhatsApp"
      className="wa-float group fixed bottom-4 right-4 z-30 inline-flex h-14 items-center gap-2 rounded-full bg-[#25D366] pl-4 pr-4 text-sm font-bold text-[#0b3d1f] shadow-lg shadow-ink/25 transition-transform hover:scale-105 sm:bottom-6 sm:right-6 sm:pr-5"
    >
      <WhatsAppIcon className="h-6 w-6 shrink-0" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
