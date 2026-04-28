"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SmokeTestSprintRow } from "./page";

type Props = {
  rows: SmokeTestSprintRow[];
};

type FilterStatus = "all" | "draft" | "scheduled" | "in_progress" | "complete";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  complete: "Complete",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  draft:
    "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
  scheduled:
    "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  in_progress:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800",
  complete:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
};

function formatCurrency(n: number | null): string {
  if (n == null) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function truncate(text: string | null, max = 80): string {
  if (!text) return "";
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export default function SmokeTestSprintsClient({ rows }: Props) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (filterStatus !== "all" && row.status !== filterStatus) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          row.title?.toLowerCase().includes(search) ||
          row.projectName?.toLowerCase().includes(search) ||
          row.whatsNext?.toLowerCase().includes(search) ||
          row.id.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [rows, filterStatus, searchTerm]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      draft: rows.filter((r) => r.status === "draft").length,
      scheduled: rows.filter((r) => r.status === "scheduled").length,
      in_progress: rows.filter((r) => r.status === "in_progress").length,
      complete: rows.filter((r) => r.status === "complete").length,
    }),
    [rows]
  );

  async function handleDelete(id: string) {
    if (!confirm("Delete this smoke test sprint? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/smoke-test-sprints/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Delete failed (${res.status})`);
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`text-left rounded-lg border p-4 transition ${
            filterStatus === "all"
              ? "border-black dark:border-white"
              : "border-black/10 dark:border-white/15 hover:border-black/30 dark:hover:border-white/30"
          }`}
        >
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs opacity-70">Total</div>
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("draft")}
          className={`text-left rounded-lg border p-4 transition ${
            filterStatus === "draft"
              ? "border-black dark:border-white"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-500"
          }`}
        >
          <div className="text-2xl font-bold">{stats.draft}</div>
          <div className="text-xs opacity-70">Draft</div>
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("scheduled")}
          className={`text-left rounded-lg border p-4 transition ${
            filterStatus === "scheduled"
              ? "border-black dark:border-white"
              : "border-blue-300 dark:border-blue-700 hover:border-blue-500"
          }`}
        >
          <div className="text-2xl font-bold">{stats.scheduled}</div>
          <div className="text-xs opacity-70">Scheduled</div>
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("in_progress")}
          className={`text-left rounded-lg border p-4 transition ${
            filterStatus === "in_progress"
              ? "border-black dark:border-white"
              : "border-green-300 dark:border-green-700 hover:border-green-500"
          }`}
        >
          <div className="text-2xl font-bold">{stats.in_progress}</div>
          <div className="text-xs opacity-70">In Progress</div>
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus("complete")}
          className={`text-left rounded-lg border p-4 transition ${
            filterStatus === "complete"
              ? "border-black dark:border-white"
              : "border-purple-300 dark:border-purple-700 hover:border-purple-500"
          }`}
        >
          <div className="text-2xl font-bold">{stats.complete}</div>
          <div className="text-xs opacity-70">Complete</div>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by project, scope, or ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[240px] px-4 py-2 rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black text-sm"
        />
        <Link
          href="/dashboard/smoke-test-sprint-builder"
          className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-sm font-medium hover:opacity-90 transition"
        >
          + New smoke test
        </Link>
      </div>

      {/* Table */}
      {filteredRows.length === 0 ? (
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-8 text-center text-sm opacity-70">
          {rows.length === 0
            ? "No smoke test sprints yet."
            : "No results match the current filters."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5 text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="text-left px-4 py-3">Title / Project</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Scope</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Hours</th>
                <th className="text-left px-4 py-3">Start</th>
                <th className="text-right px-4 py-3">Files</th>
                <th className="text-left px-4 py-3">Updated</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-text-primary">
                        {row.title?.trim() || (
                          <span className="opacity-60 italic">Untitled</span>
                        )}
                      </span>
                      {row.projectName ? (
                        <Link
                          href={`/projects/${row.projectId}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {row.projectName}
                        </Link>
                      ) : (
                        <span className="text-xs opacity-60">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        STATUS_BADGE_CLASSES[row.status] ??
                        STATUS_BADGE_CLASSES.draft
                      }`}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[280px]">
                    <span className="text-text-secondary">
                      {truncate(row.whatsNext) || (
                        <span className="opacity-60">—</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(row.totalPrice)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.impliedHours != null ? `${row.impliedHours}` : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.proposedStartDate || (
                      <span className="opacity-60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.attachmentCount > 0 ? row.attachmentCount : (
                      <span className="opacity-50">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-text-muted">
                    <div>{formatDateTime(row.updatedAt)}</div>
                    {row.updatedByLabel && (
                      <div className="text-xs opacity-70">
                        by {row.updatedByLabel}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/dashboard/smoke-test-sprint-builder?draftId=${row.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={deletingId === row.id}
                        className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition"
                      >
                        {deletingId === row.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
