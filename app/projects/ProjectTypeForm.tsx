"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

const PROJECT_TYPES = [
  { value: "client", label: "Client" },
  { value: "internal", label: "Internal" },
] as const;

type ProjectType = typeof PROJECT_TYPES[number]["value"];

type Props = {
  projectId: string;
  initialType: ProjectType;
};

export default function ProjectTypeForm({ projectId, initialType }: Props) {
  const [type, setType] = useState<ProjectType>(initialType);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bodySm = getTypographyClassName("body-sm");

  const handleChange = async (next: ProjectType) => {
    if (next === type) return;
    const previous = type;
    setType(next);
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, projectType: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update project type");
      }
      setMessage("Saved");
    } catch (err) {
      setType(previous);
      setError(err instanceof Error ? err.message : "Failed to update project type");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className={`${bodySm} font-medium`}>Project type (admin)</label>
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => handleChange(e.target.value as ProjectType)}
          disabled={saving}
          className="rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50"
        >
          {PROJECT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
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
