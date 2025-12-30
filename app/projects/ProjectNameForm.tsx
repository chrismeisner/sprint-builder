"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Props = {
  projectId: string;
  initialName: string;
};

export default function ProjectNameForm({ projectId, initialName }: Props) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bodySm = getTypographyClassName("body-sm");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update project name");
      }
      setMessage("Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className={`${bodySm} font-medium`}>Project name</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          disabled={saving}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className={`${getTypographyClassName("button-sm")} px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      {message && <p className={`${bodySm} text-green-700 dark:text-green-300`}>{message}</p>}
      {error && <p className={`${bodySm} text-red-700 dark:text-red-300`}>{error}</p>}
    </div>
  );
}

