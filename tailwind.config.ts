import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F8F7",
        ink: "#1a2332",
        ledger: {
          50: "#f0f5f1",
          100: "#dce8df",
          200: "#b5d1bc",
          400: "#4a7e5c",
          600: "#2e6b45",
          700: "#245636",
          900: "#162e1e",
        },
        rule: "#e2e5e3",
        muted: "#6b7280",
        amber: "#b5850a",
        rust: "#b83e2e",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        soft: "0 2px 8px rgba(0,0,0,0.06)",
        inner: "inset 0 1px 2px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
