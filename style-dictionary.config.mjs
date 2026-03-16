/**
 * Style Dictionary config
 *
 * Reads from lib/design-system/tokens/ and generates:
 *   app/generated-tokens.css  ← drop this into globals.css via @import
 *
 * Usage:
 *   npx style-dictionary build --config style-dictionary.config.mjs
 *
 * Or add to package.json scripts:
 *   "tokens:build": "style-dictionary build --config style-dictionary.config.mjs"
 *   "tokens:watch": "style-dictionary build --config style-dictionary.config.mjs --watch"
 */

/** Convert a dot-path like "text.primary" → "--text-primary" CSS var name */
function toCssVar(path) {
  return `--${path.join("-")}`;
}

/** Custom format: emits :root:not(.dark) { } and :root { } blocks from separate token files */
function semanticCssFormat({ dictionary, options }) {
  const { selector } = options;
  const lines = dictionary.allTokens.map((token) => {
    const name = toCssVar(token.path);
    return `  ${name}: ${token.$value ?? token.value};`;
  });
  return `${selector} {\n${lines.join("\n")}\n}\n`;
}

export default {
  source: [],
  platforms: {
    // ─── Primitives → CSS custom properties (always-on, no theme) ───────────
    "css/primitives": {
      transformGroup: "css",
      files: [
        {
          destination: "app/generated-tokens.css",
          format: "css/variables",
          filter: (token) => !token.filePath.includes("semantic"),
          options: {
            selector: ":root",
            outputReferences: false,
          },
        },
      ],
      source: [
        "lib/design-system/tokens/primitives.json",
        "lib/design-system/tokens/sizing.json",
      ],
    },

    // ─── Semantic light → :root:not(.dark) ──────────────────────────────────
    "css/semantic-light": {
      transformGroup: "css",
      files: [
        {
          destination: "app/generated-semantic-light.css",
          format: "css/variables",
          options: {
            selector: ":root:not(.dark)",
            outputReferences: false,
          },
        },
      ],
      source: ["lib/design-system/tokens/semantic-light.json"],
    },

    // ─── Semantic dark → :root (dark mode class on html element) ────────────
    "css/semantic-dark": {
      transformGroup: "css",
      files: [
        {
          destination: "app/generated-semantic-dark.css",
          format: "css/variables",
          options: {
            selector: ":root",
            outputReferences: false,
          },
        },
      ],
      source: ["lib/design-system/tokens/semantic-dark.json"],
    },

    // ─── Tailwind theme extension (JSON) ─────────────────────────────────────
    // Import this in tailwind.config.ts to keep theme in sync with tokens.
    "js/tailwind": {
      transformGroup: "js",
      files: [
        {
          destination: "lib/design-system/tailwind-tokens.json",
          format: "json/nested",
        },
      ],
      source: [
        "lib/design-system/tokens/primitives.json",
        "lib/design-system/tokens/sizing.json",
      ],
    },
  },
};
