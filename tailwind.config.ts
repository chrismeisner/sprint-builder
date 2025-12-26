import type { Config } from "tailwindcss";
import { typographyScale } from "./lib/design-system/tokens";

const splitClasses = (value: string) => value.split(/\s+/).filter(Boolean);

const typographySafelist = (() => {
  const classes = new Set<string>();

  typographyScale.forEach((token) => {
    splitClasses(token.baseClass).forEach((cls) => classes.add(cls));
    splitClasses(token.mobile.sizeClass).forEach((cls) => classes.add(cls));

    const desktopSizeClass = token.desktop.sizeClass.trim();
    if (desktopSizeClass) {
      splitClasses(desktopSizeClass).forEach((cls) => classes.add(`md:${cls}`));
    }

    const mobileLeading = token.mobile.lineHeight.trim();
    if (mobileLeading) {
      classes.add(`leading-[${mobileLeading}]`);
    }

    const desktopLeading = token.desktop.lineHeight.trim();
    if (desktopLeading) {
      classes.add(`md:leading-[${desktopLeading}]`);
    }
  });

  return Array.from(classes);
})();

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: typographySafelist,
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
        },
        brand: {
          primary: "var(--color-brand-primary)",
          inverse: "var(--color-brand-inverse)",
          muted: "var(--color-brand-muted)",
          accent: "var(--color-brand-accent)",
        },
        surface: {
          subtle: "var(--color-surface-subtle)",
          strong: "var(--color-surface-strong)",
          card: "var(--color-surface-card)",
        },
        stroke: {
          muted: "var(--color-stroke-muted)",
          strong: "var(--color-stroke-strong)",
        },
        semantic: {
          info: "var(--color-semantic-info)",
          success: "var(--color-semantic-success)",
          warning: "var(--color-semantic-warning)",
          danger: "var(--color-semantic-danger)",
        },
      },
      spacing: {
        page: "2.5rem",
        section: "3rem",
        gutter: "1.5rem",
      },
      borderRadius: {
        card: "1.5rem",
        pill: "9999px",
      },
      boxShadow: {
        card: "0 24px 70px rgba(0,0,0,0.08)",
      },
      fontFamily: {
        sans: ["var(--font-akkurat)", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-akkurat-mono)", "ui-monospace", "monospace"],
        "gt-america": ["var(--font-gt-america)", "sans-serif"],
        "gt-compressed": ["var(--font-gt-america-compressed)", "var(--font-gt-america)", "sans-serif"],
        akkurat: ["var(--font-akkurat)", "sans-serif"],
        "akkurat-light": ["var(--font-akkurat-light)", "sans-serif"],
        "akkurat-mono": ["var(--font-akkurat-mono)", "monospace"],
        general: ["var(--font-general-grotesque)", "var(--font-akkurat)", "sans-serif"],
        "general-mono": ["var(--font-general-grotesque-mono)", "var(--font-akkurat-mono)", "ui-monospace", "monospace"],
        inter: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        "inter-tight": ["var(--font-inter-tight)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        gooper: ["var(--font-gooper)", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        "gooper-condensed": ["var(--font-gooper-condensed)", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        "gooper-semicondensed": ["var(--font-gooper-semicondensed)", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        "gooper-text": ["var(--font-gooper-text)", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        system: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica Neue", "sans-serif"],
        emoji: ["var(--font-noto-emoji)", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "sans-serif"],
      },
      fontSize: {
        "display-1": ["4rem", { lineHeight: "1", letterSpacing: "-0.04em" }],
        "display-2": ["3rem", { lineHeight: "1", letterSpacing: "-0.03em" }],
      },
    },
  },
  plugins: [],
};
export default config;
