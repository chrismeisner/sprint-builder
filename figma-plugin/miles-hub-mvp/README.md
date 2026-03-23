# Miles Hub Plugin

Figma development plugin that syncs design tokens and text styles from the live Miles hub into Figma variables and Miles/* text styles.

## What it creates

| Collection | Modes | Default |
|---|---|---|
| `primitives` | Base | ✅ checked |
| `semantic` | Light · Dark | ✅ checked |
| `sizing` | Base | ✅ checked |
| `typography` | Base | ✅ checked |
| `state` | Base | ✅ checked |
| Miles/* text styles | — | ✅ checked |

Semantic color tokens are written as Figma variable aliases to the matching primitive (not raw hex), so toggling Light/Dark mode in Figma updates everything automatically.

It is idempotent — re-running updates existing variables/styles and creates missing ones. Safe to run after any token change.

## Setup

1. Start the app: `npm run dev`
2. In Figma desktop: **Plugins → Development → Import plugin from manifest** → select `figma-plugin/miles-hub-mvp/manifest.json`
3. Run the plugin, enter the full hub URL:
   ```
   http://localhost:3000/sandboxes/miles-proto-2/hub
   ```
   Click **Upsert from Hub**
4. Optional: click **Color Samples** to generate a `Miles Color Samples` page in Figma with live-bound swatches for every color variable — useful for verifying Light/Dark mode values after a sync.

## Endpoints used

The plugin appends these paths to whatever hub URL you enter:

- `GET {hubUrl}/tokens` — all token collections as JSON (`primitives`, `semantic-light`, `semantic-dark`, `sizing`, `typography`, `state`)
- `GET {hubUrl}/typography` — Miles/* text style definitions (`name`, `fontFamily`, `fontStyle`, `fontSizePx`, `lineHeightPx`, `letterSpacingPercent`)

## Sync modes

- **Upsert** (default) — updates existing variables and creates missing ones. Safe to run repeatedly.
- **Clear & Rebuild** — deletes the checked collections and Miles/* text styles first, then rebuilds from scratch. Use when you need a clean slate after renaming tokens.

## Notes

- If font loading fails for a text style, the plugin falls back through a candidate list and logs the result — it never hard-stops.
- Map overlay gradients (`from-black/*`, `to-transparent`) are intentional exceptions to the token compliance checker in the hub; they are not part of the token set.
