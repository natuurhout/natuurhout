import type { Config } from "tailwindcss";

// Design direction: GardenGlory e-commerce template (Behance 230941561),
// adapted for Natuurhout per Xander (2026-08-17): warm ivory ground, deep
// forest-green surfaces, one vivid green accent, pill buttons, large-radius
// image cards. Style is adapted, not copied — no assets from the template.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#F4F1E8", // warm ivory page background
        ink: "#1A2420", // near-black green-tinted text
        brand: {
          DEFAULT: "#24402E", // deep forest green
          dark: "#16281D", // darkest surface (hero/footer)
          soft: "#E8EDDD", // pale green-tinted card surface
        },
        accent: {
          DEFAULT: "#7DBE3F", // vivid leaf green (buttons/highlights)
          bright: "#A4E257", // highlight text on dark surfaces
        },
      },
      fontFamily: {
        // Slots wired for self-hosted licensed woff2 files dropped into
        // public/fonts/ later — see globals.css @font-face stubs.
        sans: ["Brand", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "1.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
