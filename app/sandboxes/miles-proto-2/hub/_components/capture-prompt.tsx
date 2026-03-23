"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

const STORAGE_KEY_FIGMA = "miles-hub:figma-url";
const STORAGE_KEY_PAGE = "miles-hub:local-page-url";

function buildPrompt(
  template: string,
  localUrl: string,
  figmaUrl: string,
  hubUrl: string = ""
) {
  const local = localUrl.trim() || "[LOCAL_PAGE_URL]";
  const figma = figmaUrl.trim() || "[FIGMA_URL]";
  const hub = hubUrl.trim() || "[HUB_URL]";
  return template
    .replace(/\[LOCAL_PAGE_URL\]/g, local)
    .replace(/\[FIGMA_URL\]/g, figma)
    .replace(/\[HUB_URL\]/g, hub);
}

// Step 1 — capture the screen into Figma as hardcoded layers with semantic naming.
const CAPTURE_LIGHT = `You are recreating a UI screen as Figma layers.

Source: [LOCAL_PAGE_URL]
Figma destination: [FIGMA_URL]

The page should be in light mode. Read the source code — do not screenshot.

Instructions:
- Recreate the screen as Figma frames and layers, preserving the visual hierarchy exactly as it appears in the rendered UI
- Name every layer semantically (e.g. "card/header", "button/primary", "input/label") — do not use default Figma names like "Frame 47"
- Do NOT link variables or apply styles yet — use hardcoded hex values and raw numbers for now
- Preserve all spacing, radius, and typography values as literal numbers taken directly from the source tokens
- Group layers to match component boundaries in the code

Stop here. Do not write any checklist files.`;

const CAPTURE_DARK = `You are recreating a UI screen as Figma layers.

Source: [LOCAL_PAGE_URL]
Figma destination: [FIGMA_URL]

Put this page into dark mode first. Read the source code — do not screenshot.

Instructions:
- Recreate the screen as Figma frames and layers, preserving the visual hierarchy exactly as it appears in the rendered UI
- Name every layer semantically (e.g. "card/header", "button/primary", "input/label") — do not use default Figma names like "Frame 47"
- Do NOT link variables or apply styles yet — use hardcoded hex values and raw numbers for now
- Preserve all spacing, radius, and typography values as literal numbers taken directly from the source tokens
- Group layers to match component boundaries in the code

Stop here. Do not write any checklist files.`;

// Step 2 — audit the Figma file and write a per-layer variable-linking checklist.
const CHECKLIST_LIGHT = `You are now auditing the Figma screen you just created for variable and style bindings.

Figma file: [FIGMA_URL]
Token source: lib/design-system/tokens/

For every layer in the file:
1. List the layer name
2. Identify each hardcoded property (fill, stroke, corner radius, font size, font weight, line height, spacing)
3. Map each property to its matching design token:
   - Semantic tokens: lib/design-system/tokens/semantic-light.json
   - Primitives: lib/design-system/tokens/primitives.json
   - Sizing: lib/design-system/tokens/sizing.json
   - Text styles: Miles/* naming convention

Output a markdown checklist saved to:
  lib/design-system/variable-linking-instructions-[screen-name]-[YYYY-MM-DD-HHmm].md

Add this metadata header at the top of the file:

---
screen: [screen-name]
created: [YYYY-MM-DD HH:mm]
source-url: [LOCAL_PAGE_URL]
figma-url: [FIGMA_URL]
token-version: [pull from package.json]
---

Then the checklist body, one section per layer, in top-to-bottom Figma layer order:

## [Layer Name]
- [ ] fill → \`semantic → surface/card\`
- [ ] border → \`semantic → stroke/muted\`
- [ ] corner-radius → \`sizing → borderRadius/card\`
- [ ] font → Miles/Body/Regular

Rules:
- Work strictly top-to-bottom matching the layer order in Figma
- Every hardcoded property must have a corresponding checklist item
- If the correct token match is ambiguous, write it as:
  - [ ] fill → ⚠️ AMBIGUOUS — candidates: \`semantic → surface/card\`, \`semantic → surface/subtle\`
- Do not guess. Do not skip. Do not consolidate layers.

After writing the file, remind the designer to apply Miles/* text styles to all text layers, then toggle Light ↔ Dark to verify every token responds.`;

const CHECKLIST_DARK = `You are now auditing the Figma screen you just created (dark mode) for variable and style bindings.

Figma file: [FIGMA_URL]
Token source: lib/design-system/tokens/

For every layer in the file:
1. List the layer name
2. Identify each hardcoded property (fill, stroke, corner radius, font size, font weight, line height, spacing)
3. Map each property to its matching design token:
   - Semantic tokens: lib/design-system/tokens/semantic-dark.json (dark-mode values)
   - Primitives: lib/design-system/tokens/primitives.json
   - Sizing: lib/design-system/tokens/sizing.json
   - Text styles: Miles/* naming convention

Output a markdown checklist saved to:
  lib/design-system/variable-linking-instructions-[screen-name]-dark-[YYYY-MM-DD-HHmm].md

Add this metadata header at the top of the file:

---
screen: [screen-name]
created: [YYYY-MM-DD HH:mm]
source-url: [LOCAL_PAGE_URL]
figma-url: [FIGMA_URL]
mode: dark
token-version: [pull from package.json]
---

Then the checklist body, one section per layer, in top-to-bottom Figma layer order:

## [Layer Name]
- [ ] fill → \`semantic → surface/card\`
- [ ] border → \`semantic → stroke/muted\`
- [ ] corner-radius → \`sizing → borderRadius/card\`
- [ ] font → Miles/Body/Regular

Rules:
- Work strictly top-to-bottom matching the layer order in Figma
- Every hardcoded property must have a corresponding checklist item
- If the correct token match is ambiguous, write it as:
  - [ ] fill → ⚠️ AMBIGUOUS — candidates: \`semantic → surface/card\`, \`semantic → surface/subtle\`
- Do not guess. Do not skip. Do not consolidate layers.

After writing the file, toggle Light ↔ Dark in the variable panel to verify every token responds correctly.`;

// Step 3 (standalone) — generate a static design system reference page in Figma.
const DS_REFERENCE = `You are creating a static design system reference page in Figma from our live design hub.

Hub source: [HUB_URL]
Token endpoints — use these directly for structured data, do not scrape the rendered page:
  [HUB_URL]/tokens      — all token collections as JSON (primitives, semantic-light, semantic-dark, sizing)
  [HUB_URL]/typography  — Miles/* text style definitions

Figma destination: [FIGMA_URL]
Place everything on a Figma page named "_Design System Reference" — create it if it doesn't exist.

This is a reference artifact, not a product screen. Do not recreate interactive elements — recreate only the visual documentation.

Include the following sections in order, each as a clearly labelled Figma frame:

1. Color tokens
   - Render each semantic color as a labeled swatch (token name + hex value)
   - Group by category: surface, text, stroke, semantic
   - Show light and dark mode values side by side
   - Data: /tokens → semantic-light + semantic-dark collections

2. Typography scale
   - Render each Miles/* text style as a live text layer using that style
   - Label each row with: style name · font size · weight · line height · iOS equivalent
   - Data: /typography

3. Radius tokens
   - Render each radius token as a rounded rectangle
   - Label with token name and px value
   - Data: /tokens → sizing → borderRadius

4. Spacing tokens
   - Render as a visual scale (horizontal bars of increasing width)
   - Label each with token name and px value
   - Data: /tokens → sizing → spacing

5. Semantic token reference
   - Render as a table with columns: token name | category | light value | dark value | iOS mapping
   - Data: /tokens → semantic-light + semantic-dark collections

Layer naming convention: "reference/[section]/[token-name]"
Do NOT link Figma variables — use hardcoded values only.
This is a point-in-time snapshot.

Add a label at the top of the page:
"Design System Reference — generated [YYYY-MM-DD HH:mm] from [HUB_URL]"`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 rounded-control border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
        copied
          ? "border-semantic-success/30 bg-semantic-success/10 text-semantic-success"
          : "border-stroke-muted bg-surface-subtle text-text-secondary hover:bg-background hover:text-text-primary"
      }`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function CapturePrompt() {
  const [mode, setMode] = useState<Mode>("light");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [localPageUrl, setLocalPageUrl] = useState("");
  const [hubUrl, setHubUrl] = useState("");

  useEffect(() => {
    const storedFigma = localStorage.getItem(STORAGE_KEY_FIGMA) ?? "";
    const storedPage =
      localStorage.getItem(STORAGE_KEY_PAGE) ??
      `${window.location.origin}/sandboxes/miles-proto-2/dashboard`;
    setFigmaUrl(storedFigma);
    setLocalPageUrl(storedPage);
    setHubUrl(`${window.location.origin}/sandboxes/miles-proto-2/hub`);
    if (!localStorage.getItem(STORAGE_KEY_PAGE)) {
      localStorage.setItem(STORAGE_KEY_PAGE, storedPage);
    }
  }, []);

  function handleFigmaUrl(val: string) {
    setFigmaUrl(val);
    localStorage.setItem(STORAGE_KEY_FIGMA, val);
  }

  function handleLocalPageUrl(val: string) {
    setLocalPageUrl(val);
    localStorage.setItem(STORAGE_KEY_PAGE, val);
  }

  const captureTemplate = mode === "light" ? CAPTURE_LIGHT : CAPTURE_DARK;
  const checklistTemplate = mode === "light" ? CHECKLIST_LIGHT : CHECKLIST_DARK;
  const capturePrompt = buildPrompt(captureTemplate, localPageUrl, figmaUrl);
  const checklistPrompt = buildPrompt(checklistTemplate, localPageUrl, figmaUrl);
  const dsReferencePrompt = buildPrompt(DS_REFERENCE, localPageUrl, figmaUrl, hubUrl);

  const figmaFilled = figmaUrl.trim().length > 0;
  const localFilled = localPageUrl.trim().length > 0;
  const allFilled = figmaFilled && localFilled;

  return (
    <section className="mt-6 rounded-panel border border-stroke-muted bg-surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Figma capture prompts
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            allFilled
              ? "bg-semantic-success/10 text-semantic-success"
              : "bg-surface-subtle text-text-muted"
          }`}
        >
          {allFilled ? "ready — run step 1 then step 2" : "save URLs below · then copy"}
        </span>
      </div>
      <p className="mt-2 text-sm text-text-secondary">
        Three focused prompts — each does one job. Prompts 1 and 2 are a sequential screen capture workflow. Prompt 3 is a standalone design system documentation generator.
      </p>

      {/* URL inputs */}
      <div className="mt-4 flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Saved URLs
        </span>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <code className="font-mono text-[11px] font-semibold text-semantic-info">
                [LOCAL_PAGE_URL]
              </code>
              {localFilled && (
                <span className="rounded-full bg-semantic-success/10 px-1.5 py-0.5 text-[10px] font-medium text-semantic-success">
                  saved
                </span>
              )}
            </div>
            <input
              type="url"
              value={localPageUrl}
              onChange={(e) => handleLocalPageUrl(e.target.value)}
              placeholder="http://localhost:3000/sandboxes/miles-proto-2/dashboard"
              className="w-full rounded-control border border-stroke-muted bg-background px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-semantic-info focus:outline-none focus:ring-1 focus:ring-semantic-info"
            />
          </label>
          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <code className="font-mono text-[11px] font-semibold text-semantic-info">
                  [FIGMA_URL]
                </code>
                {figmaFilled && (
                  <span className="rounded-full bg-semantic-success/10 px-1.5 py-0.5 text-[10px] font-medium text-semantic-success">
                    saved
                  </span>
                )}
              </div>
              {figmaFilled && (
                <a
                  href={figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-control border border-stroke-muted bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
                >
                  Open in Figma ↗
                </a>
              )}
            </div>
            <input
              type="url"
              value={figmaUrl}
              onChange={(e) => handleFigmaUrl(e.target.value)}
              placeholder="https://www.figma.com/design/abc123/…?node-id=78:2"
              className="w-full rounded-control border border-stroke-muted bg-background px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-semantic-info focus:outline-none focus:ring-1 focus:ring-semantic-info"
            />
          </label>
        </div>
        <p className="text-[11px] text-text-muted">
          Saved to browser localStorage — persists across page reloads.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-[11px] font-semibold text-text-muted">Mode:</span>
        <div className="flex rounded-control border border-stroke-muted bg-surface-subtle p-0.5 gap-0.5">
          {(["light", "dark"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded px-3 py-1 text-[11px] font-semibold capitalize transition-colors ${
                mode === m
                  ? "bg-foreground text-background shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-text-muted">
          {mode === "light"
            ? "→ variable-linking-instructions-[screen]-[YYYY-MM-DD-HHmm].md"
            : "→ variable-linking-instructions-[screen]-dark-[YYYY-MM-DD-HHmm].md"}
        </span>
      </div>

      {/* Step 1 */}
      <div className="mt-5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
              1
            </span>
            <span className="text-[11px] font-semibold text-text-primary">
              Capture into Figma
            </span>
          </div>
          <CopyButton text={capturePrompt} />
        </div>
        <p className="text-[11px] text-text-muted pl-7">
          Claude reads the source code and recreates the screen as Figma layers with hardcoded values and semantic layer names (e.g. &quot;card/header&quot;, &quot;button/primary&quot;). No variables, no checklist.
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-panel border border-stroke-muted bg-background px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">
          {capturePrompt}
        </pre>
        <p className="text-[11px] text-text-muted">
          <strong>Before running:</strong> run the Figma Plugin first (step 3 in the pipeline) so variables and Miles/* text styles already exist in the file. Layer naming in the capture will then match what the checklist references.
        </p>
      </div>

      {/* Divider */}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-stroke-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          once the capture looks right
        </span>
        <div className="h-px flex-1 bg-stroke-muted" />
      </div>

      {/* Step 2 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
              2
            </span>
            <span className="text-[11px] font-semibold text-text-primary">
              Write linking checklist for designer
            </span>
          </div>
          <CopyButton text={checklistPrompt} />
        </div>
        <p className="text-[11px] text-text-muted pl-7">
          Claude audits every layer top-to-bottom and writes a timestamped checklist with YAML frontmatter — one checkbox per property, mapped to the correct token. Ambiguous matches are flagged rather than guessed.
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-panel border border-stroke-muted bg-background px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">
          {checklistPrompt}
        </pre>
        <p className="text-[11px] text-text-muted">
          <strong>After linking:</strong> toggle Light ↔ Dark in the variable panel. Anything that doesn&apos;t change is still hardcoded. Check off each item in the generated <code className="rounded bg-surface-strong px-1 font-mono">variable-linking-instructions-*.md</code> as you go.
        </p>
      </div>

      {/* Divider — standalone tools */}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-stroke-muted" />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          standalone
        </span>
        <div className="h-px flex-1 bg-stroke-muted" />
      </div>

      {/* Step 3 — design system reference */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-full bg-surface-strong text-[10px] font-semibold text-text-secondary">
              3
            </span>
            <span className="text-[11px] font-semibold text-text-primary">
              Generate design system reference page
            </span>
          </div>
          <CopyButton text={dsReferencePrompt} />
        </div>
        <p className="text-[11px] text-text-muted pl-7">
          Claude fetches structured data from <code className="rounded bg-surface-strong px-1 font-mono">/tokens</code> and <code className="rounded bg-surface-strong px-1 font-mono">/typography</code> and builds a static <code className="rounded bg-surface-strong px-1 font-mono">_Design System Reference</code> page in Figma — color swatches (light + dark), type scale, radius, spacing, and a semantic token table. Hardcoded snapshot, no variable linking.
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-panel border border-stroke-muted bg-background px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">
          {dsReferencePrompt}
        </pre>
        <p className="text-[11px] text-text-muted">
          <strong>Run this any time.</strong> It&apos;s independent of the screen capture workflow — use it to create or refresh the reference page after token changes.
        </p>
      </div>
    </section>
  );
}
