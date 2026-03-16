# Figma file organization for hub sync (no Tokens Studio)

This doc defines how to structure your Figma file so an MCP or sync script can read it via the [Figma Variables REST API](https://developers.figma.com/docs/rest-api/variables-endpoints/) and emit token files that match our hub (`lib/design-system/tokens/`).

**Constraint:** Variable names in Figma cannot contain `.` or `{}`. We use a path convention so the reader can reconstruct nested token paths.

---

## 1. Variable collections = token sets

Create **one variable collection per token file** (or logical set). Names must be stable and match what the sync logic expects.

| Collection name (exact) | Maps to hub file | Modes |
|-------------------------|------------------|--------|
| `primitives` | `primitives.json` + `sizing.json` (see below) | 1 (default) |
| `sizing` | `sizing.json` | 1 (default) |
| `semantic` | `semantic-light.json` + `semantic-dark.json` | 2: `light`, `dark` |

**Why:** The API returns `meta.variableCollections` and `meta.variables`. Your reader filters by `variableCollection.name`, then iterates variables and (for semantic) uses `valuesByMode` keyed by mode name.

---

## 2. Variable naming convention (path → nested JSON)

Use **slash-separated paths** so the sync can rebuild nested structure. Figma allows `/` in variable names.

| Figma variable name | Hub path | File |
|---------------------|----------|------|
| `color/neutral/50` | `color.neutral.50` | primitives.json |
| `color/green/light` | `color.green.light` | primitives.json |
| `spacing/4` | `spacing.4` | sizing.json |
| `borderRadius/default` | `borderRadius.default` | sizing.json |
| `background` | `background` (top-level) | semantic-light.json (mode=light) |
| `text/primary` | `text.primary` | semantic-light.json |
| `surface/card` | `surface.card` | semantic-light.json |

**Rule:** Split variable `name` by `/`. The last segment is the leaf key; preceding segments are the path. Write into the hub JSON at that path.

---

## 3. Collection → file mapping

### 3.1 `primitives` collection

- **Variables:** Only color primitives (e.g. `color/neutral/50`, `color/white`, `color/green/light`).
- **Sync:** Write into `lib/design-system/tokens/primitives.json` under the `color` key. Path from name: `color/neutral/50` → `color.neutral.50` → `{ color: { neutral: { 50: { $value: "...", $type: "color" } } } }`.

### 3.2 `sizing` collection

- **Variables:** Spacing, radius, shadow. Names: `spacing/0`, `spacing/1`, …, `spacing/page`, `borderRadius/sm`, `borderRadius/default`, `boxShadow/card`, etc.
- **Types:** FLOAT for spacing/radius (sync converts to `"4px"`, `"8px"` using your scale); STRING or a single FLOAT for shadow if needed.
- **Sync:** Write into `lib/design-system/tokens/sizing.json`. Paths like `spacing.4`, `borderRadius.default`, `boxShadow.card`.

### 3.3 `semantic` collection (modes = light / dark)

- **Modes:** Create two modes: `light` and `dark` (mode names must match exactly).
- **Variables:** Same names in both modes; values differ. Examples: `background`, `foreground`, `text/primary`, `text/secondary`, `brand/primary`, `brand/accent`, `surface/subtle`, `surface/card`, `stroke/muted`, `semantic/success`, etc.
- **Sync:**
  - Mode `light` → `lib/design-system/tokens/semantic-light.json`
  - Mode `dark` → `lib/design-system/tokens/semantic-dark.json`
- **Flat vs nested:** Variable `text/primary` → `text.primary` in JSON. Variable `background` (no slash) → top-level key `background`.

---

## 4. Variable types and value format

| Figma `resolvedType` | Hub `$type` | Value format |
|----------------------|-------------|--------------|
| COLOR | `color` | Figma returns `{ r, g, b, a }` (0–1). Convert to hex: `#rrggbb` or `#rrggbbaa`. |
| FLOAT | `dimension` | Map to your scale (e.g. 4 → `"4px"`, 8 → `"8px"`) or store as string `"4px"` if you use STRING. |
| STRING | (e.g. dimension) | Use as-is for things like `"9999px"` (pill), or shadow strings. |

**Aliases:** If a variable’s `valuesByMode[modeId]` is a `VariableAlias` (object with `type: "VARIABLE_ALIAS"`, `id`), resolve that `id` to another variable and use that variable’s value (or its alias chain) for the token value. Semantic tokens often alias to primitives (e.g. `background` → `color/neutral/50`).

---

## 5. Page/layer structure (optional but useful for MCP)

If your MCP also reads **nodes** (e.g. for components or documentation):

- **Pages:** Use clear page names, e.g. `_Design system`, `_Tokens`, `App / Dashboard`. Leading underscore can mean “meta” pages for the system.
- **Frames for token reference:** A frame named `Tokens – Primitives` or `Tokens – Semantic (Light)` can list styles that use the variables; the reader can correlate by bound variables.
- **Components:** Name components so they map to your design-system components (e.g. `Button/Primary`, `Card/Default`). The MCP can then list “which variables this component uses” via `boundVariables` on the file JSON.

This keeps the **single source of truth** in Variables; frames and components are for reference and documentation.

---

## 6. Sync flow (Figma → hub)

1. **Auth:** Use Figma REST API with a token that has `file_variables:read` (and `file_variables:write` if you ever push hub → Figma).
2. **GET** `GET /v1/files/:file_key/variables/local` for the design-system file.
3. **Parse:** For each variable collection:
   - `primitives` → build nested object from variable names (split by `/`), convert COLOR to hex, write `primitives.json` (and optionally merge sizing from `sizing` collection if you combine them in one collection).
   - `sizing` → build nested object, FLOAT → dimension string, write `sizing.json`.
   - `semantic` → for each mode (`light` / `dark`), build nested object from variable names and `valuesByMode[modeId]`; resolve aliases; write `semantic-light.json` and `semantic-dark.json`.
4. **Emit:** Write JSON files into `lib/design-system/tokens/` with `$value` and `$type` so Style Dictionary and your app stay in sync.
5. **Optional:** Run `npx style-dictionary build --config style-dictionary.config.mjs` after writing tokens.

---

## 7. Checklist for your Figma file

- [ ] One variable collection named **primitives** (color primitives only; path names like `color/neutral/50`).
- [ ] One variable collection named **sizing** (spacing, borderRadius, boxShadow; path names like `spacing/4`, `borderRadius/default`).
- [ ] One variable collection named **semantic** with two modes: **light**, **dark** (variable names like `background`, `text/primary`, `surface/card`).
- [ ] No `.` or `{}` in variable names; use **/** for path segments.
- [ ] Semantic variables use **Variable Aliases** to primitives where possible (so the file stays maintainable and the sync can resolve to hex).
- [ ] (Optional) Pages/frames named so an MCP can find “token reference” or “design system” content.

With this structure, an MCP or CLI that calls the Variables API can reliably “sync” Figma → hub without Tokens Studio, and your Style Dictionary pipeline stays the single consumer of the hub.
