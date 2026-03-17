"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
];

type Props = {
  sprintId: string;
  currentStatus: string;
  /** Compact styling for table cells */
  compact?: boolean;
  /** Callback after successful change; if not provided, page reloads */
  onSuccess?: () => void;
};

export default function AdminSprintStatusDropdown({
  sprintId,
  currentStatus,
  compact = true,
  onSuccess,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;

    const confirmed = confirm(`Change status from "${status.replace("_", " ")}" to "${newStatus.replace("_", " ")}"?`);
    if (!confirmed) return;

    setIsChanging(true);
    setError(null);

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
      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsChanging(false);
    }
  };

  const selectClass = compact
    ? "px-2 py-0.5 text-xs rounded border border-black/20 dark:border-white/20 bg-white dark:bg-white/10 text-black dark:text-white/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-black/30 dark:focus:ring-white/30 min-w-0 max-w-[7rem]"
    : "px-2.5 py-1 text-sm rounded border border-black/20 dark:border-white/20 bg-white dark:bg-white/10 text-black dark:text-white/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-black/30 dark:focus:ring-white/30";

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isChanging}
        className={selectClass}
        title="Change sprint status (admin)"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isChanging && (
        <span className="text-xs opacity-60" aria-hidden>
          …
        </span>
      )}
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 truncate max-w-20" title={error}>
          ✗
        </span>
      )}
    </div>
  );
}
