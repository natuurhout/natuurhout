import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import "./globals.css";

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
    <html lang="nl-BE">
      <body className="bg-ground font-sans text-ink antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
