import type { Metadata } from "next";
import localFont from "next/font/local";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import "./globals.css";

// Satoshi (Fontshare, ITF Free Font License — see public/fonts/
// SATOSHI-LICENSE-FFL.txt), self-hosted per the migration prompt.
// Variable font covers all weights in one file; one family for headings
// and body, differentiated by weight.
const satoshi = localFont({
  src: [
    {
      path: "../../public/fonts/Satoshi-Variable.woff2",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "../../public/fonts/Satoshi-VariableItalic.woff2",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-sans",
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
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl-BE" className={satoshi.variable}>
      <body className="bg-ground font-sans text-ink antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
