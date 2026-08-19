import type { Config } from "tailwindcss";

// Palette per Xander (2026-08-17): browns pulled from the actual Natuurhout
// logo (logo-natuurhout-new-1.png → #504E44 olive-brown, #A05040 rust,
// #E8A068 tan). Typography: Fraunces (display serif) + Instrument Sans,
// self-hosted via next/font — see src/app/layout.tsx.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#F7F3EA", // warm paper background
        ink: "#26221B", // near-black warm brown text
        brand: {
          DEFAULT: "#514E43", // logo olive-brown (mid surface / borders)
          dark: "#2E2B24", // darkest surface: nav, footer, hero panel
          soft: "#EDE7D8", // warm sand card surface
        },
        accent: {
          DEFAULT: "#A25640", // logo rust — primary buttons/links
          deep: "#874332", // rust hover
          tan: "#DDA15E", // logo tan — secondary highlights
          bright: "#E8B77D", // highlight text on dark surfaces
        },
        line: "#E2DBC9", // hairline borders on light surfaces
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
