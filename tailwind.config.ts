import type { Config } from "tailwindcss";

// Palette per Xander (2026-08-17): browns pulled from the actual Natuurhout
// logo (logo-natuurhout-new-1.png → #504E44 olive-brown, #A05040 rust,
// #E8A068 tan). Layout patterns reference kastanjegjerde.no (utility bar,
// mega menu, calculator, product page) restyled in these brand colors.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#F4F1E8", // warm ivory page background
        ink: "#29261F", // near-black warm brown text
        brand: {
          DEFAULT: "#514E43", // logo olive-brown (mid surface / borders)
          dark: "#322F27", // darkest surface: nav, footer, hero panel
          soft: "#EAE5D6", // warm sand card surface
        },
        accent: {
          DEFAULT: "#A25640", // logo rust — primary buttons/links
          deep: "#8A4634", // rust hover
          tan: "#DDA15E", // logo tan — secondary buttons (cards)
          bright: "#E8B77D", // highlight text on dark surfaces
        },
      },
      fontFamily: {
        // Slots wired for self-hosted licensed woff2 files dropped into
        // public/fonts/ later — see globals.css @font-face stubs.
        sans: ["Brand", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
