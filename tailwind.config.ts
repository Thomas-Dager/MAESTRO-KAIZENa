import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#f4f4f5",
        card: {
          DEFAULT: "#121215",
          foreground: "#f4f4f5",
          hover: "#18181b",
          subtle: "#1c1c21",
        },
        border: {
          DEFAULT: "#27272a",
          subtle: "#1f1f23",
          active: "#3f3f46",
        },
        primary: {
          DEFAULT: "#10b981", // Emerald 500
          foreground: "#042f2e",
          hover: "#059669",
          muted: "rgba(16, 185, 129, 0.15)",
        },
        accent: {
          amber: {
            DEFAULT: "#f59e0b", // Amber 500
            hover: "#d97706",
            muted: "rgba(245, 158, 11, 0.15)",
          },
          emerald: {
            DEFAULT: "#10b981",
            hover: "#059669",
            muted: "rgba(16, 185, 129, 0.15)",
          },
        },
        muted: {
          DEFAULT: "#27272a",
          foreground: "#a1a1aa",
          dark: "#71717a",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
