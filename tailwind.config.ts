import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3F5F4",
        ink: "#16233B",
        ledger: {
          50: "#EEF3F0",
          100: "#D8E4DC",
          400: "#4C7A5E",
          600: "#2C5A40",
          900: "#16301F",
        },
        rule: "#D6DAD8",
        amber: "#B7791F",
        rust: "#9A3B2E",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};
export default config;
