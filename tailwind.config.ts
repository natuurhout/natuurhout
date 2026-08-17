import type { Config } from "tailwindcss";

// Brand tokens are PLACEHOLDERS until Xander confirms design direction
// (migration/phase0-report.md §10.6). Warm neutrals + deep green proposed
// for a natural-wood brand; every value below may change in Phase 1 design
// review — nothing else in the codebase should hardcode colors.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2f4a34", // SWAP-LATER: primary (deep green, proposal)
          dark: "#1f3123", // SWAP-LATER: dark surface
        },
        ground: "#faf8f5", // SWAP-LATER: near-white warm background
      },
      fontFamily: {
        // Slots wired for self-hosted licensed woff2 files dropped into
        // public/fonts/ later — see globals.css @font-face stubs.
        sans: ["Brand", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
