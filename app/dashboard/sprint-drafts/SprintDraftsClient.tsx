"use client";

import { useState } from "react";
import Link from "next/link";

type SprintDraft = {
  id: string;
  status: string;
  title: string | null;
  deliverableCount: number;
  totalPrice: number | null;
  totalHours: number | null;
  totalPoints: number;
  sprintPackageId: string | null;
  packageName: string | null;
  workshopGenerated: boolean;
  createdAt: string;
  updatedAt: string | null;
  email: string | null;
  accountName: string | null;
  accountId: string | null;
};

type Props = {
  sprintDrafts: SprintDraft[];
};

type FilterStatus = "all" | "draft" | "negotiating" | "scheduled" | "in_progress" | "complete";

export default function SprintDraftsClient({ sprintDrafts }: Props) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter sprints
  const filteredSprints = sprintDrafts.filter((sprint) => {
    // Status filter
    if (filterStatus !== "all" && sprint.status !== filterStatus) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        sprint.title?.toLowerCase().includes(search) ||
        sprint.email?.toLowerCase().includes(search) ||
        sprint.accountName?.toLowerCase().includes(search) ||
        sprint.id.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Stats
  const stats = {
    total: sprintDrafts.length,
    draft: sprintDrafts.filter((s) => s.status === "draft").length,
    negotiating: sprintDrafts.filter((s) => s.status === "negotiating").length,
    scheduled: sprintDrafts.filter((s) => s.status === "scheduled").length,
    in_progress: sprintDrafts.filter((s) => s.status === "in_progress").length,
    complete: sprintDrafts.filter((s) => s.status === "complete").length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      negotiating: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      in_progress: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      complete: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    return colors[status] || colors.draft;
  };


  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs opacity-70">Total Sprints</div>
        </div>
        <div className="rounded-lg border border-gray-300 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold">{stats.draft}</div>
          <div className="text-xs opacity-70">Draft</div>
        </div>
        <div className="rounded-lg border border-amber-300 dark:border-amber-700 p-4">
          <div className="text-2xl font-bold">{stats.negotiating}</div>
          <div className="text-xs opacity-70">Negotiating</div>
        </div>
        <div className="rounded-lg border border-blue-300 dark:border-blue-700 p-4">
          <div className="text-2xl font-bold">{stats.scheduled}</div>
          <div className="text-xs opacity-70">Scheduled</div>
        </div>
        <div className="rounded-lg border border-green-300 dark:border-green-700 p-4">
          <div className="text-2xl font-bold">{stats.in_progress}</div>
          <div className="text-xs opacity-70">In Progress</div>
        </div>
        <div className="rounded-lg border border-purple-300 dark:border-purple-700 p-4">
          <div className="text-2xl font-bold">{stats.complete}</div>
          <div className="text-xs opacity-70">Complete</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by title, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black text-sm"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="negotiating">Negotiating</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm opacity-70">
        Showing {filteredSprints.length} of {sprintDrafts.length} sprint drafts
      </div>

      {/* Table */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Sprint</th>
                <th className="px-4 py-3 text-left font-semibold">Owner</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Deliverables</th>
                <th className="px-4 py-3 text-left font-semibold">Price</th>
                <th className="px-4 py-3 text-left font-semibold">Workshop</th>
                <th className="px-4 py-3 text-left font-semibold">Created</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSprints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center opacity-70">
                    No sprint drafts found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredSprints.map((sprint) => (
                  <tr
                    key={sprint.id}
                    className="border-t border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {sprint.title || <span className="opacity-50 italic">Untitled Sprint</span>}
                      </div>
                      <div className="text-xs font-mono opacity-60 mt-0.5">{sprint.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{sprint.accountName || <span className="opacity-50">—</span>}</div>
                      <div className="text-xs opacity-60">{sprint.email || <span className="opacity-50">—</span>}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${getStatusColor(sprint.status)}`}>
                        {sprint.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="font-semibold">{sprint.deliverableCount}</div>
                      <div className="text-xs opacity-60">{sprint.totalPoints} pts</div>
                    </td>
                    <td className="px-4 py-3">
                      {sprint.totalPrice ? (
                        <div>
                          <div className="font-semibold">${sprint.totalPrice.toLocaleString()}</div>
                          {sprint.totalHours && <div className="text-xs opacity-60">{sprint.totalHours}h</div>}
                        </div>
                      ) : (
                        <span className="opacity-50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sprint.workshopGenerated ? (
                        <span className="text-green-600 dark:text-green-400" title="Workshop generated">
                          ✓
                        </span>
                      ) : (
                        <span className="opacity-30" title="No workshop yet">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{new Date(sprint.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs opacity-60">{new Date(sprint.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/sprints/${sprint.id}`}
                        className="inline-flex items-center px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition text-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

