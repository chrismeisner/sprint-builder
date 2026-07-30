"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

const PROJECT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type ProjectStatus = typeof PROJECT_STATUSES[number]["value"];

type Props = {
  projectId: string;
  initialStatus: ProjectStatus;
};

export default function ProjectStatusForm({ projectId, initialStatus }: Props) {
  const [status, setStatus] = useState<ProjectStatus>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bodySm = getTypographyClassName("body-sm");

  const handleChange = async (next: ProjectStatus) => {
    if (next === status) return;
    const previous = status;
    setStatus(next);
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update project status");
      }
      setMessage("Saved");
    } catch (err) {
      setStatus(previous);
      setError(err instanceof Error ? err.message : "Failed to update project status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className={`${bodySm} font-medium`}>Project status (admin)</label>
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value as ProjectStatus)}
          disabled={saving}
          className="rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50"
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {saving && <span className={`${bodySm} opacity-70`}>Saving...</span>}
        {!saving && message && <p className={`${bodySm} text-green-700 dark:text-green-300`}>{message}</p>}
        {!saving && error && <p className={`${bodySm} text-red-700 dark:text-red-300`}>{error}</p>}
      </div>
    </div>
  );
}
