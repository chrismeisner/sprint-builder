#!/usr/bin/env node
/**
 * Build a single JSON file that Tokens Studio for Figma can load via URL.
 *
 * Reads lib/design-system/tokens/*.json and $metadata.json, merges them
 * into one object with tokenSetOrder, and writes to lib/design-system/tokens.figma.json
 * (or path given as first arg).
 *
 * Usage:
 *   node lib/design-system/build-figma-tokens.mjs
 *   node lib/design-system/build-figma-tokens.mjs path/to/out.json
 */

import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_DIR = join(__dirname, "tokens");

const metadata = JSON.parse(
  readFileSync(join(TOKENS_DIR, "$metadata.json"), "utf8")
);
const primitives = JSON.parse(
  readFileSync(join(TOKENS_DIR, "primitives.json"), "utf8")
);
const semanticLight = JSON.parse(
  readFileSync(join(TOKENS_DIR, "semantic-light.json"), "utf8")
);
const semanticDark = JSON.parse(
  readFileSync(join(TOKENS_DIR, "semantic-dark.json"), "utf8")
);
const sizing = JSON.parse(
  readFileSync(join(TOKENS_DIR, "sizing.json"), "utf8")
);
const typography = JSON.parse(
  readFileSync(join(TOKENS_DIR, "typography.json"), "utf8")
);
const state = JSON.parse(
  readFileSync(join(TOKENS_DIR, "state.json"), "utf8")
);

const combined = {
  $metadata: metadata,
  primitives,
  typography,
  state,
  "semantic-light": semanticLight,
  "semantic-dark": semanticDark,
  sizing,
};

const outPath =
  process.argv[2] || join(__dirname, "tokens.figma.json");
writeFileSync(outPath, JSON.stringify(combined, null, 2), "utf8");
console.log("Wrote:", outPath);
