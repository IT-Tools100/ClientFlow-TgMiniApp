import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#070A12",
          text: "#F8FAFC",
          muted: "#AEB7C8"
        },
        accent: {
          blue: "#60A5FA",
          cyan: "#22D3EE",
          purple: "#A78BFA",
          green: "#34D399",
          orange: "#FBBF24",
          red: "#FB7185"
        }
      },
      boxShadow: {
        glass: "0 24px 70px rgba(0, 0, 0, 0.34)",
        glow: "0 0 38px rgba(34, 211, 238, 0.18)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
