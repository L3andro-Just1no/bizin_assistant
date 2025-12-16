import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/widget/**/*.{js,ts,jsx,tsx}",
    "./src/widget/**/*.{js,ts,jsx,tsx}",
    "./src/components/ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "oklch(0.922 0 0)",
        input: "oklch(0.922 0 0)",
        ring: "oklch(0.708 0 0)",
        background: "oklch(1 0 0)",
        foreground: "oklch(0.145 0 0)",
        primary: {
          DEFAULT: "oklch(0.205 0 0)",
          foreground: "oklch(0.985 0 0)",
        },
        secondary: {
          DEFAULT: "oklch(0.97 0 0)",
          foreground: "oklch(0.205 0 0)",
        },
        muted: {
          DEFAULT: "oklch(0.97 0 0)",
          foreground: "oklch(0.556 0 0)",
        },
        accent: {
          DEFAULT: "oklch(0.97 0 0)",
          foreground: "oklch(0.205 0 0)",
        },
        destructive: {
          DEFAULT: "oklch(0.577 0.245 27.325)",
          foreground: "oklch(0.985 0 0)",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "calc(0.625rem - 2px)",
        sm: "calc(0.625rem - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tw-animate-css")],
};

export default config;

