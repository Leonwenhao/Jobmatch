import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        marty: {
          orange: "#FF8100",
          "orange-hover": "#E67300",
          black: "#111111",
          white: "#FFFFFF",
          gray: "#F4F4F4",
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tight: '-0.02em',
      },
      animation: {
        'bounce-loader': 'bounce-loader 0.6s infinite alternate cubic-bezier(0.5, 0.05, 1, 0.5)',
      },
      keyframes: {
        'bounce-loader': {
          'from': { transform: 'translateY(0) scale(1.1)' },
          'to': { transform: 'translateY(40px) scale(0.9)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
