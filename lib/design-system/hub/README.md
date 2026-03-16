# Design system hub

This folder is the **hub**: the shared language between Figma and the app.

- **Tokens** live in `../tokens/` (primitives, sizing, semantic-light, semantic-dark). Style Dictionary reads them and generates CSS + Tailwind.
- **Manifest** (`manifest.json`) describes what’s in the hub, where tokens come from (Figma file key), and where they’re consumed.
- **Component specs** (`component-specs.json`) define component names and which tokens they use. Figma and the web app both reference these so “Button/primary” and “Card” stay in sync.

## Flow

```
Figma (variables)  →  sync script / MCP  →  hub tokens (../tokens/*.json)
                                                      ↓
                                              Style Dictionary
                                                      ↓
                                              CSS + Tailwind
                                                      ↓
                                              App + reference site
```

## Files

| File | Purpose |
|------|--------|
| `manifest.json` | Hub index: token set order, paths, Figma file key, outputs |
| `component-specs.json` | Component IDs, variants, and token usage (shared contract) |
| `README.md` | This file |

## Using the hub

- **Sync from Figma:** A script or MCP reads Figma Variables (see `docs/figma-organization-for-hub-sync.md`) and writes `../tokens/*.json`. Then run `npx style-dictionary build --config ../../style-dictionary.config.mjs`.
- **Prompt / MCP:** “Look at our Figma reference and update with the latest” = read Figma → write hub tokens → rebuild. The “reference” can be the generated CSS + this manifest + component-specs.
