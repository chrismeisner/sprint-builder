"use client";

import { useState, useCallback } from "react";
import Typography from "@/components/ui/Typography";

type Props = {
  projectId: string;
  projectName: string;
  figmaFileUrl: string;
  hubLastSyncedAt: string | null;
};

export default function ProjectHubClient({
  projectId,
  projectName,
  figmaFileUrl: initialFigmaUrl,
  hubLastSyncedAt,
}: Props) {
  const [figmaUrl, setFigmaUrl] = useState(initialFigmaUrl);
  const [savingUrl, setSavingUrl] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [markingSynced, setMarkingSynced] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(hubLastSyncedAt);

  const saveFigmaUrl = useCallback(async () => {
    setSavingUrl(true);
    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, figmaFileUrl: figmaUrl.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      // ignore for PoC
    } finally {
      setSavingUrl(false);
    }
  }, [projectId, figmaUrl]);

  const buildPrompt = useCallback(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const figmaPlaceholder = figmaUrl.trim() || "[paste your Figma file URL here]";
    return `Perform a sync for this project's Figma design system hub.

**Project**
- Project ID: ${projectId}
- Project name: ${projectName}

**Figma source**
- Figma file: ${figmaPlaceholder}

**What to do**
1. Read the Figma file (use Figma MCP or API) to get variables, colors, typography, and component styles.
2. Update the hub in this codebase so it matches the Figma design:
   - \`lib/design-system/tokens/\` (primitives.json, sizing.json, semantic-light.json, semantic-dark.json)
   - \`lib/design-system/hub/\` (manifest, component-specs) if needed
3. After updating the token files, tell the user to open this hub page and click "Mark as synced" to record the sync time (or they can call POST ${origin}/api/projects/${projectId}/hub/sync-complete while authenticated).`;
  }, [projectId, projectName, figmaUrl]);

  const markAsSynced = useCallback(async () => {
    setMarkingSynced(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/hub/sync-complete`, { method: "POST" });
      const data = res.ok ? await res.json() : null;
      if (data?.hubLastSyncedAt) setLastSyncedAt(data.hubLastSyncedAt);
    } finally {
      setMarkingSynced(false);
    }
  }, [projectId]);

  const copyPrompt = useCallback(async () => {
    const text = buildPrompt();
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // fallback: select the text area so user can Cmd+C
      const el = document.getElementById("hub-sync-prompt");
      if (el instanceof HTMLTextAreaElement) {
        el.select();
      }
    }
  }, [buildPrompt]);

  return (
    <div className="space-y-6">
      {/* Last synced — prominent */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Typography as="h2" scale="mono-sm" className="uppercase tracking-wide opacity-70">
              Last synced
            </Typography>
            <Typography as="p" scale="h4" className="mt-1">
              {lastSyncedAt
                ? new Date(lastSyncedAt).toLocaleString()
                : "Not synced yet"}
            </Typography>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={markAsSynced}
              disabled={markingSynced}
              className="inline-flex items-center rounded-md border border-black/15 dark:border-white/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition"
            >
              {markingSynced ? "Updating…" : "Mark as synced"}
            </button>
            <Typography as="p" scale="body-sm" className="opacity-60 max-w-md text-right">
              After Claude updates the hub, click to record the sync time.
            </Typography>
          </div>
        </div>
      </section>

      {/* Sync via Claude — copyable prompt */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
        <Typography as="h2" scale="h4">
          Sync via Claude
        </Typography>
        <p className="text-sm text-text-secondary">
          Copy the prompt below and paste it into Cursor (or Claude). Claude will read your Figma file and update the hub code in this repo, then record the sync.
        </p>
        <div className="relative">
          <textarea
            id="hub-sync-prompt"
            readOnly
            value={buildPrompt()}
            rows={18}
            className="w-full rounded-md border border-black/15 dark:border-white/15 bg-neutral-50 dark:bg-neutral-900/50 px-3 py-2.5 text-sm font-mono whitespace-pre-wrap focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-y min-h-[280px]"
            aria-label="Sync prompt for Claude"
          />
          <button
            type="button"
            onClick={copyPrompt}
            className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-3 py-1.5 text-sm font-medium hover:opacity-90 transition"
          >
            {copySuccess ? "Copied" : "Copy prompt"}
          </button>
        </div>
      </section>

      {/* Figma source — link and save */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-white dark:bg-black space-y-3">
        <Typography as="h2" scale="h4">
          Figma source of truth
        </Typography>
        <p className="text-sm text-text-secondary">
          Save your Figma file URL here so it’s included in the copyable prompt above. Sync is run in Claude, not from this button.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="url"
            value={figmaUrl}
            onChange={(e) => setFigmaUrl(e.target.value)}
            onBlur={saveFigmaUrl}
            placeholder="https://www.figma.com/design/..."
            className="flex-1 min-w-0 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            aria-label="Figma file URL"
          />
          <button
            type="button"
            onClick={saveFigmaUrl}
            disabled={savingUrl}
            className="inline-flex items-center justify-center rounded-md border border-black/15 dark:border-white/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition"
          >
            {savingUrl ? "Saving…" : "Save URL"}
          </button>
        </div>
      </section>

      {/* Hub preview */}
      <section className="rounded-lg border border-black/10 dark:border-white/15 p-6 bg-neutral-50 dark:bg-neutral-900/30 space-y-4">
        <Typography as="h2" scale="h4">
          Hub preview
        </Typography>
        <p className="text-sm text-text-secondary">
          After syncing, this area will show the project’s design tokens and component reference (colors, type, spacing, components) so you can use it as a high-fidelity reference for the app.
        </p>
        <div className="rounded-md border border-dashed border-black/20 dark:border-white/20 p-8 text-center">
          <Typography as="p" scale="body-sm" className="opacity-60">
            Hub content will render here after a successful sync.
          </Typography>
          <Typography as="p" scale="mono-sm" className="opacity-50 mt-2">
            Project: {projectName} ({projectId.slice(0, 8)}…)
          </Typography>
        </div>
      </section>
    </div>
  );
}
