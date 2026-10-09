import type { Config } from "tailwindcss";

// Preservation-led palette based on the original Natuurhout WordPress header:
// cool greys, charcoal navigation and one practical orange accent.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    // Tailwind's default breakpoints plus `desk` (992px), where the header
    // switches between the mobile bar and the full desktop navigation.
    // Listed in order so desk: sits between md: and lg: in the cascade.
    screens: {
      sm: "640px",
      md: "768px",
      desk: "992px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
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
          deep: "#B05E10", // white text on it: 4.7:1 (WCAG AA)
          tan: "#CDA27A",
          bright: "#F2A03D",
        },
        line: "#D7D8D6",
      },
      fontFamily: {
        // Figtree for text and UI, Fraunces (a soft serif) for headings.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        // 13px instead of 12px: the smallest text (per-metre prices, stock
        // notes, labels) must stay easy to read on a phone.
        xs: ["0.8125rem", { lineHeight: "1.125rem" }],
      },
      borderRadius: {
        card: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
