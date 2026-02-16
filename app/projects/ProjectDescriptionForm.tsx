"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Props = {
  projectId: string;
  initialDescription: string;
};

export default function ProjectDescriptionForm({ projectId, initialDescription }: Props) {
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bodySm = getTypographyClassName("body-sm");

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, description: description.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update description");
      }
      setMessage("Saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update description");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className={`${bodySm} font-medium`}>Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Add a short description for this project..."
        className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-y"
        disabled={saving}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`${getTypographyClassName("button-sm")} px-3 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {message && <p className={`${bodySm} text-green-700 dark:text-green-300`}>{message}</p>}
        {error && <p className={`${bodySm} text-red-700 dark:text-red-300`}>{error}</p>}
      </div>
    </div>
  );
}
