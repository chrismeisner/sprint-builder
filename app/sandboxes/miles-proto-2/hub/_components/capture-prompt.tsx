"use client";

import { useState } from "react";

type Mode = "light" | "dark";

const LIGHT_PROMPT = `[LOCAL_PAGE_URL]

Capture this page into Figma: [FIGMA_URL]

The page should be in light mode. Read the source code — do not
screenshot. Read lib/design-system/tokens/ to discover variable
collections.

After the capture write a linking checklist at:
  lib/design-system/variable-linking-instructions-[screen].md

The checklist maps every Figma layer to the correct variable
so a designer can swap each hardcoded value in one pass.

  Layer | Property | Variable

Variable format — collection → path:
  semantic → text/primary
  sizing   → borderRadius/card
  primitives → color/black`;

const DARK_PROMPT = `[LOCAL_PAGE_URL]

Put this page into dark mode, then capture it into Figma: [FIGMA_URL]

Read the source code — do not screenshot. Read
lib/design-system/tokens/ to discover variable collections.

After the capture update the linking checklist with dark mode variants:
  lib/design-system/variable-linking-instructions-[screen]-dark.md

The checklist maps every Figma layer to the correct variable
so a designer can swap each hardcoded value in one pass.

  Layer | Property | Variable

Variable format — collection → path:
  semantic → text/primary
  sizing   → borderRadius/card
  primitives → color/black`;

export function CapturePrompt() {
  const [mode, setMode] = useState<Mode>("light");
  const prompt = mode === "light" ? LIGHT_PROMPT : DARK_PROMPT;

  return (
    <section className="mt-6 rounded-panel border border-stroke-muted bg-surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Figma capture prompt
        </h2>
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted">
          copy → paste into Claude · swap 2 placeholders
        </span>
      </div>
      <p className="mt-2 text-sm text-text-secondary">
        Reusable for any project. Claude captures the page into Figma (hardcoded values), then writes a linking checklist so you can bind variables and text styles manually.
      </p>

      {/* What Claude does vs what you do */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-control border border-stroke-muted bg-surface-subtle px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Claude does</span>
          <ul className="mt-1 space-y-0.5 text-[11px] text-text-secondary">
            <li>• Reads source code + token files</li>
            <li>• Captures the page into Figma</li>
            <li>• Writes the linking checklist to your repo</li>
          </ul>
        </div>
        <div className="rounded-control border border-stroke-muted bg-surface-subtle px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">You do (manually)</span>
          <ul className="mt-1 space-y-0.5 text-[11px] text-text-secondary">
            <li>• Bind variables to fills / strokes / radii</li>
            <li>• Apply Miles/* text styles to each text layer</li>
            <li>• Toggle Light ↔ Dark to verify</li>
          </ul>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mt-3 flex items-center gap-2">
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
            ? "→ writes variable-linking-instructions-[screen].md"
            : "→ writes variable-linking-instructions-[screen]-dark.md"}
        </span>
      </div>

      {/* Placeholders */}
      <div className="mt-3 flex flex-wrap gap-3">
        {[
          { label: "[LOCAL_PAGE_URL]", desc: "e.g. http://localhost:3000/sandboxes/miles-proto-2/dashboard" },
          { label: "[FIGMA_URL]", desc: "e.g. https://www.figma.com/design/abc123/…?node-id=78:2" },
        ].map((v) => (
          <div key={v.label} className="flex items-start gap-2 rounded-control border border-stroke-muted bg-surface-subtle px-3 py-2">
            <code className="font-mono text-[11px] font-semibold text-semantic-info">{v.label}</code>
            <span className="text-[11px] text-text-muted">{v.desc}</span>
          </div>
        ))}
      </div>

      {/* Prompt */}
      <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-panel border border-stroke-muted bg-background px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">
        {prompt}
      </pre>

      <div className="mt-3 flex flex-col gap-1">
        <p className="text-[11px] text-text-muted">
          <strong>Before running:</strong> run the Figma Plugin first (step 3) so variables and text styles exist in the file before Claude writes the checklist.
        </p>
        <p className="text-[11px] text-text-muted">
          <strong>After linking:</strong> toggle Light ↔ Dark in the variable panel. Anything that doesn&apos;t change is still hardcoded.
        </p>
      </div>
    </section>
  );
}
