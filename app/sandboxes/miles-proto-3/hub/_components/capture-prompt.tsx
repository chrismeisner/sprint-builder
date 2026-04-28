"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY_PAGE = "miles-hub:local-page-url";
const STORAGE_KEY_HUB  = "miles-hub:hub-url";

function buildPrompt(template: string, pageUrl: string, hubUrl: string) {
  const page = pageUrl.trim() || "<dashboard-url>";
  const hub  = hubUrl.trim()  || "<hub-url>";
  return template
    .replace(/<dashboard-url>/g, page)
    .replace(/<hub-url>/g, hub);
}

// ─── Prompt templates ────────────────────────────────────────────────────────

const PROMPT_1 = `Read the /figma-use skill. Create a new Figma file. Use the generate_figma_design
tool to translate the live page into Figma layers:
<dashboard-url>

Focus on structure only — layout, hierarchy, naming, and auto layout throughout.
Layer names must mirror the source code exactly, no Figma defaults like "Frame 12"
or "Group 3". Hardcoded values are fine for now.

We'll bind tokens and extract components in later steps.`;

const PROMPT_2 = `Inspect the live page code at:
<dashboard-url>

And the design hub:
<hub-url>

Output a brief covering: all design tokens (colors, spacing, type, radii), a
component inventory, and layout structure.

This brief will be used directly in the next step to set up variables and styles
in the created file.`;

const PROMPT_3 = `Read the /figma-use skill. Using the Phase 2 brief, set up all variables and styles
via the use_figma tool in the created file — colors (primitives then aliases), type
styles, spacing, and radii. Match source token names exactly.

We'll tokenize the frame next, but not yet. Confirm what was created and flag
anything that didn't map cleanly.`;

const PROMPT_4 = `Read the /figma-use skill. Re-inspect the live page code at:
<dashboard-url>

Using the use_figma tool, go through every layer in the Figma frame and bind it to
the correct variable from Phase 3. No raw values anywhere — every color, spacing,
type, and radii value must reference a token.

For each binding, confirm it's correct against the source — not just visually
plausible. Flag anything that couldn't be bound cleanly and explain why.

After all values are bound, take a screenshot of the frame and do a self-healing
pass — compare against the live page and correct any remaining visual drift before
moving to Step 5.

We're done when there are zero raw values left and the frame matches the live page.`;

const PROMPT_5 = `Read the /figma-use skill. Using the use_figma tool, extract all repeating patterns
from the tokenized frame into proper Figma components.

Each component should have correct variants where the source has states or
variations. All components must use existing variables — no new raw values. Layer
naming inside components must continue to mirror the source code.

Confirm when all repeating elements have been extracted and the main frame
references components rather than raw layers.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Step block ──────────────────────────────────────────────────────────────

const STEPS: {
  n: string;
  label: string;
  description: string;
  template: string;
  dividerLabel?: string;
}[] = [
  {
    n: "1",
    label: "Build",
    description:
      "Agent reads the /figma-use skill, creates a new Figma file, and uses generate_figma_design to translate the live page into layers. Structure, hierarchy, auto layout, and semantic layer naming only — hardcoded values throughout.",
    template: PROMPT_1,
    dividerLabel: "capture looks right",
  },
  {
    n: "2",
    label: "Audit",
    description:
      "Agent inspects the live page code and the design hub, then outputs a structured brief: all design tokens (colors, spacing, type, radii), a component inventory, and layout structure. This brief drives Step 3.",
    template: PROMPT_2,
    dividerLabel: "brief is ready",
  },
  {
    n: "3",
    label: "Tokens",
    description:
      "Agent reads /figma-use and uses the Phase 2 brief to set up all Figma variables and styles via use_figma — colors (primitives first, then semantic aliases), type styles, spacing, and radii. Token names match source exactly.",
    template: PROMPT_3,
    dividerLabel: "variables confirmed",
  },
  {
    n: "4",
    label: "Bind",
    description:
      "Agent reads /figma-use and re-inspects the live page, then binds every layer to the correct variable from Step 3 — no raw values anywhere. Takes a screenshot and does a self-healing pass to correct visual drift. Done when zero raw values remain and the frame matches the live page.",
    template: PROMPT_4,
    dividerLabel: "frame is fully bound",
  },
  {
    n: "5",
    label: "Components",
    description:
      "Agent reads /figma-use and extracts all repeating patterns into proper Figma components with variants. All components use existing variables — no new raw values. Main frame references components, not raw layers.",
    template: PROMPT_5,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function CapturePrompt() {
  const [pageUrl, setPageUrl] = useState("");
  const [hubUrl, setHubUrl]   = useState("");

  useEffect(() => {
    const storedPage =
      localStorage.getItem(STORAGE_KEY_PAGE) ??
      `${window.location.origin}/sandboxes/miles-proto-3/dashboard`;
    const storedHub =
      localStorage.getItem(STORAGE_KEY_HUB) ??
      `${window.location.origin}/sandboxes/miles-proto-3/hub`;
    setPageUrl(storedPage);
    setHubUrl(storedHub);
    if (!localStorage.getItem(STORAGE_KEY_PAGE)) localStorage.setItem(STORAGE_KEY_PAGE, storedPage);
    if (!localStorage.getItem(STORAGE_KEY_HUB))  localStorage.setItem(STORAGE_KEY_HUB, storedHub);
  }, []);

  function handlePageUrl(val: string) {
    setPageUrl(val);
    localStorage.setItem(STORAGE_KEY_PAGE, val);
  }

  function handleHubUrl(val: string) {
    setHubUrl(val);
    localStorage.setItem(STORAGE_KEY_HUB, val);
  }

  const pageFilled = pageUrl.trim().length > 0;
  const hubFilled  = hubUrl.trim().length > 0;
  const allFilled  = pageFilled && hubFilled;

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
          {allFilled ? "ready — run steps 1–5 in order" : "save URLs below · then copy"}
        </span>
      </div>
      <p className="mt-2 text-sm text-text-secondary leading-relaxed">
        Five sequential prompts — run in order for each screen. Structure first, then audit, variables, tokenize, and componentize. Each step builds on the last.
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
                &lt;dashboard-url&gt;
              </code>
              {pageFilled && (
                <span className="rounded-full bg-semantic-success/10 px-1.5 py-0.5 text-[10px] font-medium text-semantic-success">
                  saved
                </span>
              )}
            </div>
            <input
              type="url"
              value={pageUrl}
              onChange={(e) => handlePageUrl(e.target.value)}
              placeholder="http://localhost:3000/sandboxes/miles-proto-3/dashboard"
              className="w-full rounded-control border border-stroke-muted bg-background px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-semantic-info focus:outline-none focus:ring-1 focus:ring-semantic-info"
            />
          </label>
          <label className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <code className="font-mono text-[11px] font-semibold text-semantic-info">
                &lt;hub-url&gt;
              </code>
              {hubFilled && (
                <span className="rounded-full bg-semantic-success/10 px-1.5 py-0.5 text-[10px] font-medium text-semantic-success">
                  saved
                </span>
              )}
            </div>
            <input
              type="url"
              value={hubUrl}
              onChange={(e) => handleHubUrl(e.target.value)}
              placeholder="http://localhost:3000/sandboxes/miles-proto-3/hub"
              className="w-full rounded-control border border-stroke-muted bg-background px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-semantic-info focus:outline-none focus:ring-1 focus:ring-semantic-info"
            />
          </label>
        </div>
        <p className="text-[11px] text-text-muted">
          Saved to browser localStorage — persists across page reloads.
        </p>
      </div>

      {/* Step blocks */}
      <div className="mt-5 flex flex-col gap-0">
        {STEPS.map((step, i) => {
          const prompt = buildPrompt(step.template, pageUrl, hubUrl);
          return (
            <div key={step.n}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                      {step.n}
                    </span>
                    <span className="text-[11px] font-semibold text-text-primary">
                      {step.label}
                    </span>
                  </div>
                  <CopyButton text={prompt} />
                </div>
                <p className="pl-7 text-[11px] text-text-muted leading-relaxed">
                  {step.description}
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-panel border border-stroke-muted bg-background px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">
                  {prompt}
                </pre>
              </div>

              {step.dividerLabel && i < STEPS.length - 1 && (
                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-stroke-muted" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    {step.dividerLabel}
                  </span>
                  <div className="h-px flex-1 bg-stroke-muted" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
