# Roll-your-own Figma → Hub plugin

Workflow: **Tailwind-based local wireframe app** → design in Figma → **plugin pushes variables into the repo** so the hub (and app) stay in sync.

Yes, that makes sense: the hub is the contract. You run the app, use the hub at `/sandboxes/miles-proto-2/hub` as the reference, and your plugin **uploads/updates** the token files that the hub reads from (`lib/design-system/tokens/*.json`).

---

## Flow

```
Figma file (Variables + optional styles)
         │
         ▼
  Your Figma plugin
  - Reads figma.variables.getLocalVariableCollectionsAsync()
  - Maps collections/modes → primitives, semantic-light, semantic-dark, sizing
  - Builds JSON in hub token shape (DTCG $value / $type)
         │
         ▼
  POST to your app (or write files locally)
         │
         ▼
  lib/design-system/tokens/*.json updated
         │
         ▼
  Hub (/sandboxes/miles-proto-2/hub) and GET /hub/tokens reflect new values
  → Style Dictionary / Tailwind / app consume updated tokens
```

---

## What the plugin has to do

### 1. Read from Figma

- **Variables:** `figma.variables.getLocalVariableCollectionsAsync()` → list of `VariableCollection`.
- Each collection has: `id`, `name`, `modes` (e.g. `[{ modeId, name: "Light" }, { name: "Dark" }]`), `variableIds`.
- Resolve variables: `figma.variables.getVariableByIdAsync(id)` → `Variable` with `name`, `resolvedType` (e.g. `"COLOR"`, `"FLOAT"`), and per-mode values via `valuesByMode`.

**Naming contract:** So the plugin knows which collection is which, use fixed names (or a convention), e.g.:

- Collection name **"primitives"** → token set `primitives` (nested: `color.neutral.50`, etc.).
- **"semantic"** with modes **"Light"** / **"Dark"** → token sets `semantic-light` and `semantic-dark` (flat: `background`, `text.primary`, etc.).
- **"sizing"** → token set `sizing` (`spacing`, `borderRadius`, `boxShadow`).

If you use different names in Figma, the plugin maps them (e.g. "Primitives" → primitives, "Semantic" + mode Light → semantic-light).

### 2. Map Figma values → your JSON shape

- **Color:** Figma returns RGB 0–1; convert to hex (e.g. `#rrggbb`) for `$value`; `$type: "color"`.
- **Float (number):** Figma FLOAT variables are unitless; if you store "4px", the plugin can append `"px"` and use `$type: "dimension"`.
- **String:** e.g. for shadow strings; `$type: "shadow"` if your format expects it.

Output shape must match what the hub expects:

- **primitives:** nested, e.g. `{ color: { neutral: { "50": { $value: "#fafafa", $type: "color" } }, ... } }`.
- **semantic-light / semantic-dark:** flat/nested mix matching `semantic-light.json` (e.g. `background`, `text: { primary, ... }`, `brand`, `surface`, `stroke`, `semantic`).
- **sizing:** `{ spacing: { ... }, borderRadius: { ... }, boxShadow: { ... } }`.

So the plugin needs a **mapping layer**: Figma variable IDs or names → token path (e.g. `"background"`, `"text/primary"` → `text.primary`). You can derive paths from variable names if you use a convention (e.g. "text/primary" in Figma → `text.primary` in JSON).

### 3. Upload / update the hub files

Options:

| Option | How | Best for |
|--------|-----|-----------|
| **A. POST to your app** | Plugin sends combined payload (same shape as `GET /hub/tokens`) to e.g. `POST /api/design-tokens/sync`. Your API writes to `lib/design-system/tokens/*.json`. | Local dev (app running, plugin pushes to localhost). |
| **B. Download JSON** | Plugin builds the 4 JSON files, user downloads and copies into repo. | No backend; manual but simple. |
| **C. GitHub / Git** | Plugin (or a small backend) creates a commit or PR with updated token files via GitHub API. | Team workflow; design pushes a PR. |

For “upload and update the file created by the hub,” **A** is the direct fit: the plugin POSTs the same structure the hub serves, and the app writes it to disk so the hub and `GET /hub/tokens` are updated.

---

## What we added in the repo

1. **POST endpoint** (see below): accepts the combined token payload and writes `primitives.json`, `semantic-light.json`, `semantic-dark.json`, `sizing.json` under `lib/design-system/tokens/`. Intended for local/dev; protect or disable in production.
2. **This doc**: so you have a single place for the “roll your own” workflow and plugin responsibilities.

---

## Plugin implementation sketch

- **UI:** Small form or one-shot “Push to hub” button; optional: text field for app base URL (default `http://localhost:3000`).
- **Logic:**
  1. `const collections = await figma.variables.getLocalVariableCollectionsAsync();`
  2. For each collection, get variables and build a token object (nested or flat per set).
  3. Convert Figma color/float/string to your `$value` / `$type` format.
  4. Build payload: `{ primitives, "semantic-light", "semantic-dark", sizing }` (and optionally `$metadata` if you ever want to push set order).
  5. `fetch(baseUrl + "/api/design-tokens/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })`.
  6. Show success or error (e.g. “Hub updated” or “Is the app running?”).

Figma plugins run in a sandbox; they can only talk to the outside world via `fetch`. So the plugin cannot write to your repo directly—it must either POST to an API that writes the files (A), or export JSON for the user to drop in (B), or call a service that talks to Git (C).

---

## Summary

- **Workflow:** Tailwind wireframe app + hub → design in Figma → **plugin reads Variables and uploads/updates the hub token files** so the hub (and app) stay in sync.
- **Makes sense:** Yes. The hub is the contract; the plugin’s job is to push from Figma into that contract (the token JSON files the hub reads).
- **To roll your own:** (1) Figma plugin that reads Variables and maps to your token set shapes, (2) mapping from Figma types to DTCG `$value`/`$type`, (3) POST to your sync API (or download/manual/Git) so `lib/design-system/tokens/*.json` are updated.
