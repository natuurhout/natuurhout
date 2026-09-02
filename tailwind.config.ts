import type { Config } from "tailwindcss";

// Preservation-led palette based on the original Natuurhout WordPress header:
// cool greys, charcoal navigation and one practical orange accent.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#F5F5F3",
        ink: "#42474B",
        brand: {
          DEFAULT: "#565C62",
          dark: "#303130",
          soft: "#E7E8E7",
        },
        accent: {
          DEFAULT: "#D77D1F",
          deep: "#B96512",
          tan: "#CDA27A",
          bright: "#F2A03D",
        },
        line: "#D7D8D6",
      },
      fontFamily: {
        // One family (Satoshi) for body and display; headings differ by
        // weight/tracking, not typeface.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
