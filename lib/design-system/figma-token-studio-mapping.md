# Figma / Token Studio mapping

How this repo’s design tokens map to Figma Variables and plugins like **Tokens Studio for Figma**.

---

## 1. What Token Studio expects

- **Format**: [Design Tokens Community Group (DTCG)](https://tr.designtokens.org/format/) — same spec your repo already uses.
- **Structure**: Each **token** has at least `$value`; optional `$type`, `$description`.
- **Token sets**: One “set” = one logical group (e.g. primitives, semantic, sizing). Token Studio can load one JSON per set or a single JSON with multiple top-level sets.
- **Modes**: For light/dark, Token Studio maps **modes** to Figma variable modes. You can either:
  - Use **two token sets** (e.g. `semantic-light`, `semantic-dark`) and assign each set to a Figma mode, or
  - Use **one set** with mode-specific values per token (e.g. `"background": { "Light": "#fafafa", "Dark": "#0a0a0a" }`).

---

## 2. Your repo → Figma / Token Studio

| Repo | Token Studio / Figma |
|------|----------------------|
| `lib/design-system/tokens/primitives.json` | **Token set:** `primitives`. **Figma:** One collection, no modes. Raw color palette. |
| `lib/design-system/tokens/typography.json` | **Token set:** `typography`. **Figma:** One collection, no modes. Primitive font families/weights/sizes/line-heights/letter-spacing. |
| `lib/design-system/tokens/semantic-light.json` | **Token set:** `semantic-light`. **Figma:** Assign to mode **Light** in a “Semantic” collection. |
| `lib/design-system/tokens/semantic-dark.json` | **Token set:** `semantic-dark`. **Figma:** Assign to mode **Dark** in the same “Semantic” collection. |
| `lib/design-system/tokens/sizing.json` | **Token set:** `sizing`. **Figma:** One collection, no modes. Spacing, radius, shadow. |
| `lib/design-system/tokens/state.json` | **Token set:** `state`. **Figma:** One collection, no modes. Hover/active/focus/disabled/selected interaction tokens. |
| `lib/design-system/tokens/$metadata.json` | **tokenSetOrder:** `["primitives", "typography", "state", "semantic-light", "semantic-dark", "sizing"]` — tells Token Studio which set overrides which. |

---

## 3. Type mapping (your `$type` → Figma variable kind)

| Your `$type` | Token Studio / Figma |
|--------------|----------------------|
| `color` | Figma **Color** variable. |
| `dimension` | Figma **Float** (number). Token Studio often strips `px` and syncs as number; Figma uses unit in the UI. |
| `shadow` | Figma **Variables** don’t support shadows; use **Effect (drop shadow)** styles, or keep as token for dev/CSS only. |

Your semantic files use a **flat** structure (e.g. `"background": { "$value": "#fafafa", "$type": "color" }`). That’s valid; Token Studio will create one variable per token. Nested groups (e.g. `text.primary`) become variables like `text/primary` in Figma (path = variable name).

---

## 4. What’s required for Token Studio

1. **A URL or file Token Studio can read**  
   - Option A: **Single JSON** that merges all sets (see “Single-file export” below).  
   - Option B: **Multi-file**: point Token Studio at a **manifest** or at individual JSON URLs (if the plugin supports multiple files). Many setups use one URL to a single combined JSON.

2. **Token set order**  
   - Already in `$metadata.json` as `tokenSetOrder`. If you use a single combined file, include a top-level `$metadata` with the same `tokenSetOrder`.

3. **Modes for semantic**  
   - In Token Studio: create a **Semantic** (or “semantic”) token set with two **modes**: e.g. `Light` and `Dark`.  
   - Map **semantic-light** set → mode **Light**, **semantic-dark** set → mode **Dark**.  
   - Figma will show one “Semantic” variable collection with two modes.

4. **Typography**  
   - Figma **Variables** don’t support typography. Use **Text Styles** in Figma (as in `figma-variables-guide.md`).  
   - Your `lib/design-system/tokens.ts` typography scale stays the source of truth for code; Figma text styles are maintained to match (e.g. heading/page, body/md, etc.).

---

## 5. Single-file export for Token Studio

If the plugin is configured with **one URL**, use one JSON that contains all sets. Structure:

```json
{
  "$metadata": {
    "tokenSetOrder": ["primitives", "typography", "state", "semantic-light", "semantic-dark", "sizing"]
  },
  "primitives": { ... content of primitives.json ... },
  "typography": { ... content of typography.json ... },
  "state": { ... content of state.json ... },
  "semantic-light": { ... content of semantic-light.json ... },
  "semantic-dark": { ... content of semantic-dark.json ... },
  "sizing": { ... content of sizing.json ... }
}
```

Notes:

- **primitives.json** has a root `color` group; keep that so the content is `{ "color": { "neutral": { ... }, ... } }`.
- **typography.json** provides primitive typography variables for Figma Variables.
- **semantic-light.json** / **semantic-dark.json** are flat; use them as-is.
- **sizing.json** has `spacing`, `borderRadius`, `boxShadow` at root; use as-is.

**Script:** Run `node lib/design-system/build-figma-tokens.mjs` to generate `lib/design-system/tokens.figma.json`. Point Token Studio at that file (e.g. raw GitHub URL) for a single-URL sync.

---

## 6. Naming: CSS variables vs Figma variables

| Your CSS (globals.css / Style Dictionary) | Figma variable name (typical) |
|------------------------------------------|-------------------------------|
| `--background` | `background` (semantic set) |
| `--text-primary` | `text/primary` or `text.primary` |
| `--color-brand-accent` | `brand/accent` or `brand.accent` |
| `--color-semantic-danger` | `semantic/danger` or `semantic.danger` |

Figma uses **paths** (group/token). Token Studio usually turns dot or path notation into Figma’s variable ID; your flat semantic names (`background`, `foreground`, `text.primary`, etc.) map to one variable each. Primitives stay under `color.neutral.50`, etc.

---

## 7. Sync workflow (summary)

```
Figma (Token Studio)  ←→  GitHub (this repo)
         │                           │
         │    lib/design-system/     │
         │    tokens/*.json          │
         │    (source of truth)      │
         └──────────────────────────┘
                        │
                        ▼
         npx style-dictionary build
                        │
                        ▼
         app/generated-tokens.css (+ semantic-light / semantic-dark)
                        │
                        ▼
         app/globals.css @import
```

- **Design → code:** Designer updates tokens in Figma (Token Studio) → export JSON → commit to `lib/design-system/tokens/` (or replace the relevant .json files) → run Style Dictionary → CSS and app stay in sync.
- **Code → design:** You change tokens in `lib/design-system/tokens/*.json` → commit → in Figma, re-import or sync from the repo’s JSON (or from the single-file export URL).

---

## 8. Checklist for Token Studio

- [ ] Create a single combined JSON (or make multi-file URLs available) with `primitives`, `typography`, `state`, `semantic-light`, `semantic-dark`, `sizing`.
- [ ] Set `tokenSetOrder` in `$metadata` so semantic overrides primitives where applicable.
- [ ] In Token Studio, create two modes (e.g. **Light**, **Dark**) for the semantic set and attach `semantic-light` to Light, `semantic-dark` to Dark.
- [ ] Push tokens to Figma Variables (Token Studio “Sync” or “Apply to Figma”).
- [ ] Keep typography in Figma as **Text Styles**; align names with `figma-variables-guide.md` and `tokens.ts` (e.g. heading/page, body/md, label/section).
- [ ] Optional: Add a `tokens:build:figma` (or similar) script that outputs the single combined JSON for Token Studio’s URL.
