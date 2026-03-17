# Miles Hub Bootstrap (MVP)

Figma development plugin that bootstraps a file from your local Miles hub endpoints.

## What it creates

- Variable collection `primitives` (mode: `Base`)
- Variable collection `typography` (mode: `Base`)
- Variable collection `state` (mode: `Base`)
- Variable collection `sizing` (mode: `Base`)
- Variable collection `semantic` (modes: `Light`, `Dark`)
- Optional text styles from `/sandboxes/miles-proto-2/hub/typography`

It is idempotent: re-running updates existing variables/styles and creates missing ones.
When semantic color values match a primitive value, the plugin writes a variable alias
to the primitive (instead of a raw color), which keeps semantic tokens linked.

## Local run

1. Start your app:
   - `npm run dev`
2. In Figma desktop app:
   - `Plugins` -> `Development` -> `Import plugin from manifest...`
   - Select: `figma-plugin/miles-hub-mvp/manifest.json`
3. Run plugin:
   - Use base URL `http://localhost:3000`
   - Click **Initialize / Upsert from Hub**
  - Optional: click **Create Color Samples** to generate a `Miles Color Samples`
    page in Figma with sample rows for local color variables.

## Endpoints used

- `GET /sandboxes/miles-proto-2/hub/tokens`
- `GET /sandboxes/miles-proto-2/hub/typography` (optional checkbox)

## Notes

- If font loading fails for a text style, the plugin logs it and continues.
- Map overlays (`black` gradients) remain intentional exceptions in dashboard token compliance.
