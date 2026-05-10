import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        panel: "#13161b",
        panel2: "#181c22",
        border: "#262b33",
        muted: "#9aa3ad",
        text: "#e6e9ee",
        accent: "#22c55e",
        warn: "#f59e0b",
        bad: "#ef4444",
        good: "#22c55e",
        brand: "#6366f1",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
