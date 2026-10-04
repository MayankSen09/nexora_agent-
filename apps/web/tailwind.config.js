/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          base: "hsl(var(--surface-base))",
          raised: "hsl(var(--surface-raised))",
          overlay: "hsl(var(--surface-overlay))",
          inset: "hsl(var(--surface-inset))",
        },
        trade: {
          buy: "hsl(var(--trade-buy))",
          "buy-bg": "hsl(var(--trade-buy-bg))",
          sell: "hsl(var(--trade-sell))",
          "sell-bg": "hsl(var(--trade-sell-bg))",
        },
        accent: {
          cyan: "hsl(var(--status-info))",
          "cyan-bg": "hsl(var(--status-info-bg))",
          amber: "hsl(var(--status-watch))",
          "amber-bg": "hsl(var(--status-watch-bg))",
        },
        border: {
          DEFAULT: "hsl(var(--border-subtle))",
          muted: "hsl(var(--border-muted))",
          strong: "hsl(var(--border-strong))",
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Roboto Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
