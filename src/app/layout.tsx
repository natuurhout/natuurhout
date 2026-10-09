import type { Metadata } from "next";
import localFont from "next/font/local";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import WhatsAppFloat from "@/components/WhatsApp";
import { siteIndexingEnabled } from "@/lib/site";
import "./globals.css";

// Figtree (body) and Fraunces (headings), both SIL Open Font License — see
// public/fonts/*-LICENSE-OFL.txt. Self-hosted variable fonts (latin subset,
// from Fontsource): no request to Google, one file per style. Fraunces
// carries the optical-size axis, so headings get finer detail when large and
// sturdier strokes when small (mobile).
const figtree = localFont({
  src: [
    { path: "../../public/fonts/Figtree-Variable.woff2", weight: "300 900", style: "normal" },
    { path: "../../public/fonts/Figtree-VariableItalic.woff2", weight: "300 900", style: "italic" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = localFont({
  src: [
    { path: "../../public/fonts/Fraunces-Variable.woff2", weight: "100 900", style: "normal" },
    { path: "../../public/fonts/Fraunces-VariableItalic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.natuurhout.be"),
  // Title + description are VERBATIM from the live Dutch SERP snippet
  // (migration/url-inventory.csv, row "/"). Do not rewrite or "improve" —
  // SEO parity rule, see the migration prompt.
  title: "Specialist in natuurhout | Natuurhout",
  description:
    "Als specialist in natuurhout bieden wij tuinproducten aan in verschillende kwaliteitsvolle houtsoorten. Bekijk ons assortiment en vraag uw offerte aan!",
  openGraph: {
    title: "Specialist in natuurhout | Natuurhout",
    description:
      "Als specialist in natuurhout bieden wij tuinproducten aan in verschillende kwaliteitsvolle houtsoorten. Bekijk ons assortiment en vraag uw offerte aan!",
    locale: "nl_BE",
    type: "website",
  },
  robots: {
    // STAGING PROTECTION: the live WordPress site still owns the domain.
    // Everything is noindex until cutover, then this flips to
    // `index: true, "max-image-preview": "large"` (parity with live).
    // See migration/phase0-report.md — CUTOVER PLAN step 2.
    index: siteIndexingEnabled,
    follow: siteIndexingEnabled,
    googleBot: siteIndexingEnabled
      ? { index: true, follow: true, "max-image-preview": "large" }
      : { index: false, follow: false },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl-BE" className={`${figtree.variable} ${fraunces.variable}`}>
      <body className="bg-ground font-sans text-ink antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
