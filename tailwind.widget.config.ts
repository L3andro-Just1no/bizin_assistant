import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/widget/**/*.{js,ts,jsx,tsx}",
    "./src/widget/**/*.{js,ts,jsx,tsx}",
    "./src/components/ui/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Gradient colors for the widget
    'from-teal-500',
    'from-teal-600',
    'to-emerald-600',
    'to-emerald-700',
    'bg-gradient-to-br',
    'bg-gradient-to-r',
    'hover:from-teal-600',
    'hover:to-emerald-700',
    // Text colors
    'text-teal-500',
    'text-teal-600',
    'text-teal-700',
    'text-teal-800',
    'text-teal-900',
    'text-emerald-500',
    'text-emerald-600',
    // Background colors
    'bg-teal-50',
    'bg-teal-500',
    'bg-emerald-50',
    // Border colors
    'border-teal-200',
    'border-teal-400',
    'border-teal-500',
    'hover:border-teal-400',
    // Additional utility classes used in the widget
    'bg-gray-50',
    'bg-gray-100',
    'bg-gray-800',
    'bg-gray-900',
    'text-gray-400',
    'text-gray-500',
    'text-gray-600',
    'text-gray-700',
    'text-gray-800',
    'border-gray-200',
    'border-gray-700',
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

