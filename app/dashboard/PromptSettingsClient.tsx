"use client";

import { useEffect, useState } from "react";

export default function PromptSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sprintSystemPrompt, setSprintSystemPrompt] = useState("");
  const [sprintUserPrompt, setSprintUserPrompt] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        setSuccess(null);
        const res = await fetch("/api/admin/settings", { method: "GET" });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load settings");
        }
        if (!cancelled) {
          setSprintSystemPrompt(data?.sprintSystemPrompt || "");
          setSprintUserPrompt(data?.sprintUserPrompt || "");
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Failed to load settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload = {
        sprintSystemPrompt,
        sprintUserPrompt,
      };
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save settings");
      }
      setSuccess("Saved");
    } catch (e) {
      setError((e as Error).message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold mb-3">Sprint Prompt Settings</h2>
      <p className="text-sm opacity-70 mb-4">
        Configure the prompts used when generating sprint drafts.
      </p>
      {loading ? (
        <div className="text-sm opacity-70">Loading…</div>
      ) : (
        <div className="space-y-6">
          <div>
            <label htmlFor="sprintSystemPrompt" className="block text-sm font-medium mb-1">
              System Prompt
            </label>
            <textarea
              id="sprintSystemPrompt"
              className="w-full rounded-md border border-black/10 dark:border-white/15 p-2 text-sm min-h-[120px] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              value={sprintSystemPrompt}
              onChange={(e) => setSprintSystemPrompt(e.target.value)}
              placeholder="Default system instruction..."
            />
          </div>
          <div>
            <label htmlFor="sprintUserPrompt" className="block text-sm font-medium mb-1">
              User Prompt
            </label>
            <textarea
              id="sprintUserPrompt"
              className="w-full rounded-md border border-black/10 dark:border-white/15 p-2 text-sm min-h-[160px] bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              value={sprintUserPrompt}
              onChange={(e) => setSprintUserPrompt(e.target.value)}
              placeholder="Default user instruction..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm hover:opacity-90 disabled:opacity-60 transition"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {success && <span className="text-green-600 dark:text-green-400 text-sm">{success}</span>}
            {error && <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>}
          </div>
        </div>
      )}
    </section>
  );
}


