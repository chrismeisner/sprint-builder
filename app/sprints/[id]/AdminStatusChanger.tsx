"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";

type Props = {
  sprintId: string;
  currentStatus: string;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "studio_review", label: "Studio Review", color: "bg-blue-100 text-blue-800" },
  { value: "pending_client", label: "Pending Client", color: "bg-yellow-100 text-yellow-800" },
  { value: "in_progress", label: "In Progress", color: "bg-green-100 text-green-800" },
  { value: "completed", label: "Completed", color: "bg-purple-100 text-purple-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

export default function AdminStatusChanger({ sprintId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const t = {
    label: `${getTypographyClassName("subtitle-sm")} text-white/90`,
    body: `${getTypographyClassName("body-sm")} text-white/90`,
  };

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
    <div className={`space-y-2 ${t.body}`}>
      <div className="flex items-center gap-3">
        <label className={t.label}>Change Status:</label>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isChanging}
          className={`px-3 py-1.5 rounded-md border border-white/20 bg-white/10 text-white ${getTypographyClassName("body-sm")} backdrop-blur disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/30`}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="text-black">
              {option.label}
            </option>
          ))}
        </select>
        {isChanging && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
      </div>

      {success && (
        <div className={`${getTypographyClassName("subtitle-sm")} bg-green-500/20 text-green-100 px-3 py-1.5 rounded`}>
          ✓ Status updated successfully
        </div>
      )}

      {error && (
        <div className={`${getTypographyClassName("subtitle-sm")} bg-red-500/20 text-red-100 px-3 py-1.5 rounded`}>
          ✗ {error}
        </div>
      )}
    </div>
  );
}

