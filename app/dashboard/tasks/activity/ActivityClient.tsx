"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type TaskEvent = {
  id: string;
  task_id: string | null;
  idea_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
  task_name: string | null;
  idea_title: string | null;
};

const EVENT_ICONS: Record<string, string> = {
  created: "✨",
  completed: "✅",
  uncompleted: "↩️",
  focused: "🔥",
  unfocused: "💨",
  added_to_today: "☀️",
  removed_from_today: "🌙",
  deleted: "🗑️",
  note_updated: "📝",
  milestone_changed: "🎯",
  reordered: "↕️",
};

const EVENT_LABELS: Record<string, string> = {
  created: "Created",
  completed: "Completed",
  uncompleted: "Uncompleted",
  focused: "Focused",
  unfocused: "Unfocused",
  added_to_today: "Added to Today",
  removed_from_today: "Removed from Today",
  deleted: "Deleted",
  note_updated: "Note Updated",
  milestone_changed: "Milestone Changed",
  reordered: "Reordered",
};

const EVENT_COLORS: Record<string, string> = {
  created: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  uncompleted: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
  focused: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  unfocused: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
  added_to_today: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  removed_from_today: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
  deleted: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  note_updated: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  milestone_changed: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
  reordered: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30",
};

export default function ActivityClient() {
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filterType, setFilterType] = useState<string>("");
  const limit = 50;

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (filterType) {
        params.set("eventType", filterType);
      }

      const res = await fetch(`/api/admin/tasks/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch events");

      const data = await res.json();
      setEvents(data.events);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, filterType]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.created_at).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TaskEvent[]>);

  const eventTypes = [
    "created",
    "completed",
    "uncompleted",
    "focused",
    "unfocused",
    "added_to_today",
    "removed_from_today",
    "note_updated",
    "milestone_changed",
    "deleted",
  ];

  if (loading && events.length === 0) {
    return (
      <div className="p-6">
        <p className="opacity-70">Loading activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300 font-semibold">Error</p>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="opacity-70 mt-1">
            {total} events recorded
          </p>
        </div>
        <Link
          href="/dashboard/tasks"
          className="px-4 py-2 border border-black/10 dark:border-white/15 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          ← Back to Tasks
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setFilterType("");
            setOffset(0);
          }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            filterType === ""
              ? "bg-black dark:bg-white text-white dark:text-black"
              : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15"
          }`}
        >
          All
        </button>
        {eventTypes.map((type) => (
          <button
            key={type}
            onClick={() => {
              setFilterType(type);
              setOffset(0);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
              filterType === type
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15"
            }`}
          >
            <span>{EVENT_ICONS[type]}</span>
            <span>{EVENT_LABELS[type]}</span>
          </button>
        ))}
      </div>

      {/* Events Timeline */}
      {events.length === 0 ? (
        <div className="text-center py-12 opacity-50">
          <p className="text-lg">No events found</p>
          <p className="text-sm mt-1">Task activity will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold uppercase tracking-wide opacity-50 mb-3 sticky top-0 bg-white dark:bg-black py-2">
                {date}
              </h2>
              <div className="space-y-2">
                {dateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-black hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
                  >
                    {/* Event Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border ${
                        EVENT_COLORS[event.event_type] || "bg-gray-500/10 text-gray-600 border-gray-500/30"
                      }`}
                    >
                      {EVENT_ICONS[event.event_type] || "📋"}
                    </div>

                    {/* Event Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">
                            {EVENT_LABELS[event.event_type] || event.event_type}
                          </p>
                          <p className="text-sm opacity-70 truncate">
                            {(event.event_data as { name?: string })?.name || event.task_name || "Unknown task"}
                          </p>
                        </div>
                        <span
                          className="text-xs opacity-50 flex-shrink-0"
                          title={formatFullDate(event.created_at)}
                        >
                          {formatTime(event.created_at)}
                        </span>
                      </div>

                      {/* Idea link */}
                      {event.idea_id && event.idea_title && (
                        <Link
                          href={`/dashboard/tasks/${event.idea_id}`}
                          className="inline-flex items-center gap-1 mt-1 text-xs opacity-50 hover:opacity-100 transition"
                        >
                          📁 {event.idea_title}
                        </Link>
                      )}

                      {/* Additional event data */}
                      {event.event_data && Object.keys(event.event_data).length > 1 && (
                        <div className="mt-2 text-xs opacity-50">
                          {(event.event_data as { previous_focus?: string }).previous_focus && (
                            <span>Previous: {(event.event_data as { previous_focus: string }).previous_focus || "none"}</span>
                          )}
                          {(event.event_data as { new_focus?: string }).new_focus && (
                            <span>New: {(event.event_data as { new_focus: string }).new_focus || "none"}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between pt-4 border-t border-black/10 dark:border-white/10">
          <p className="text-sm opacity-70">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-3 py-1.5 text-sm border border-black/10 dark:border-white/15 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
