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
      },
      fontFamily: {
        sans: ["var(--font-akkurat)", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-akkurat-mono)", "ui-monospace", "monospace"],
        "gt-america": ["var(--font-gt-america)", "sans-serif"],
        "gt-compressed": ["var(--font-gt-america-compressed)", "var(--font-gt-america)", "sans-serif"],
        akkurat: ["var(--font-akkurat)", "sans-serif"],
        "akkurat-light": ["var(--font-akkurat-light)", "sans-serif"],
        "akkurat-mono": ["var(--font-akkurat-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
