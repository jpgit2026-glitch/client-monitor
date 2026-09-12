import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f8faf8",
        ink: "#1b2e24",
        green: {
          50: "#f1f8f3",
          100: "#e0f0e4",
          200: "#c2e1ca",
          300: "#93cba0",
          400: "#5aab6e",
          500: "#3d9457",
          600: "#2d7a44",
          700: "#256238",
          800: "#1f4e2e",
          900: "#1a3f26",
        },
        rule: "#e0e8e2",
        muted: "#6b7c71",
        amber: "#c48a08",
        rust: "#c0392b",
        white: "#ffffff",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        xs: ["0.75rem", { lineHeight: "1.125rem" }],
        sm: ["0.8125rem", { lineHeight: "1.375rem" }],
        base: ["0.875rem", { lineHeight: "1.5rem" }],
        lg: ["1rem", { lineHeight: "1.5rem" }],
        xl: ["1.125rem", { lineHeight: "1.625rem" }],
        "2xl": ["1.375rem", { lineHeight: "1.75rem" }],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(27,46,36,0.04), 0 1px 2px rgba(27,46,36,0.03)",
        soft: "0 2px 12px rgba(27,46,36,0.06)",
        elevated: "0 4px 20px rgba(27,46,36,0.08), 0 1px 3px rgba(27,46,36,0.04)",
        inner: "inset 0 1px 2px rgba(27,46,36,0.05)",
        ring: "0 0 0 3px rgba(45,122,68,0.12)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
    },
  },
  plugins: [],
};
export default config;
