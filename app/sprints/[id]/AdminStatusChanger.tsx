"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Props = {
  sprintId: string;
  currentStatus: string;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "scheduled", label: "Scheduled", color: "bg-blue-100 text-blue-800" },
  { value: "in_progress", label: "In Progress", color: "bg-green-100 text-green-800" },
  { value: "complete", label: "Complete", color: "bg-purple-100 text-purple-800" },
];

export default function AdminStatusChanger({ sprintId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    const confirmed = confirm(`Change sprint status from "${status}" to "${newStatus}"?`);
    if (!confirmed) return;

    setIsChanging(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/sprint-drafts/${sprintId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setStatus(newStatus);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload page to reflect changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isChanging}
        className={`px-2.5 py-1 rounded border border-black/20 dark:border-white/20 bg-white dark:bg-white/10 text-black dark:text-white/90 ${getTypographyClassName("body-sm")} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-black/30 dark:focus:ring-white/30`}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="text-black bg-white">
            {option.label}
          </option>
        ))}
      </select>
      {isChanging && (
        <svg className="animate-spin h-3.5 w-3.5 text-black/60 dark:text-white/60" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {success && (
        <span className={`${getTypographyClassName("body-sm")} text-green-600 dark:text-green-400`}>✓</span>
      )}
      {error && (
        <span className={`${getTypographyClassName("body-sm")} text-red-600 dark:text-red-400`} title={error}>✗</span>
      )}
    </div>
  );
}

