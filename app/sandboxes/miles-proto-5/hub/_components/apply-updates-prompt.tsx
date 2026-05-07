"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "miles-hub:figma-url";

const TEMPLATE = `Read the /figma-use skill. Inspect the Figma file at:
<figma-url>

Compare the current Figma variable values against the token source files:
  lib/design-system/tokens/primitives.json
  lib/design-system/tokens/semantic-light.json
  lib/design-system/tokens/semantic-dark.json
  lib/design-system/tokens/sizing.json

Step 1 — Drift report
List every token where the Figma value differs from the source file. For each:
- Token name
- Current source value
- Refined Figma value

Do not write anything yet. Confirm the list looks intentional before proceeding.

Step 2 — Write back
Update the matching token JSON files with the confirmed values. Match token names
exactly — do not rename, restructure, or add new tokens.

Step 3 — Version bump
Update versions.json:
- Increment the version number
- Add a changelog entry listing what changed and why
- Mark any token renames as breaking changes if applicable

Summarize: what changed, which files were updated, and the new version number.`;

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

export function ApplyUpdatesPrompt() {
  const [figmaUrl, setFigmaUrl] = useState("");

  useEffect(() => {
    setFigmaUrl(localStorage.getItem(STORAGE_KEY) ?? "");
  }, []);

  function handleFigmaUrl(val: string) {
    setFigmaUrl(val);
    localStorage.setItem(STORAGE_KEY, val);
  }

  const filled = figmaUrl.trim().length > 0;
  const prompt = TEMPLATE.replace(/<figma-url>/g, figmaUrl.trim() || "<figma-url>");

  return (
    <section className="mt-6 rounded-panel border border-stroke-muted bg-surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Apply updates
        </h2>
        <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted">
          Figma → tokens → version bump
        </span>
      </div>
      <p className="mt-2 text-sm text-text-secondary leading-relaxed">
        After the designer refines values in Figma, this prompt reads the updated variable values and writes them back to the token source files, then increments the version. Runs a drift report first — nothing is written until the changes are confirmed.
      </p>

      {/* Figma URL input */}
      <div className="mt-4 flex flex-col gap-2">
        <label className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <code className="font-mono text-[11px] font-semibold text-semantic-info">&lt;figma-url&gt;</code>
            {filled && (
              <span className="rounded-full bg-semantic-success/10 px-1.5 py-0.5 text-[10px] font-medium text-semantic-success">saved</span>
            )}
            {filled && (
              <a
                href={figmaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto rounded-control border border-stroke-muted bg-surface-subtle px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
              >
                Open in Figma ↗
              </a>
            )}
          </div>
          <input
            type="url"
            value={figmaUrl}
            onChange={(e) => handleFigmaUrl(e.target.value)}
            placeholder="https://www.figma.com/design/abc123/…"
            className="w-full rounded-control border border-stroke-muted bg-background px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-semantic-info focus:outline-none focus:ring-1 focus:ring-semantic-info"
          />
        </label>
        <p className="text-[11px] text-text-muted">Saved to localStorage — shared with the Capture Prompts section.</p>
      </div>

      {/* Prompt */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold text-text-primary">Sync back prompt</span>
          <CopyButton text={prompt} />
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-panel border border-stroke-muted bg-background px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">
          {prompt}
        </pre>
      </div>
    </section>
  );
}
