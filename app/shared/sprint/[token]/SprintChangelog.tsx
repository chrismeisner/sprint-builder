"use client";

import { useState, useEffect, useCallback } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type ChangelogEntry = {
  id: string;
  action: string;
  summary: string;
  details: Record<string, unknown> | null;
  created_at: string;
  author_name: string | null;
};

type Props = {
  sprintId: string;
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(dateStr: string): string {
  const dt = new Date(dateStr);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(dt);
}

const ACTION_ICONS: Record<string, string> = {
  full_update: "pencil",
  overview: "document",
  status: "flag",
  week_notes: "calendar",
  contract_url: "link",
  contract_status: "document",
  invoice_url: "link",
  invoice_status: "currency",
  budget_status: "currency",
  signature: "check",
};

function ActionIcon({ action }: { action: string }) {
  const icon = ACTION_ICONS[action] || "pencil";

  const paths: Record<string, string> = {
    pencil:
      "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
    document:
      "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
    flag: "M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5",
    calendar:
      "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    link: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.34a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374",
    currency:
      "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    check:
      "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  return (
    <svg
      className="size-4 text-neutral-500 dark:text-neutral-500 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[icon]} />
    </svg>
  );
}

export default function SprintChangelog({ sprintId }: Props) {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const labelClass = `${getTypographyClassName("body-sm")} text-text-secondary`;
  const bodySmClass = `${getTypographyClassName("body-sm")} text-text-primary`;
  const captionClass = `${getTypographyClassName("mono-sm")} text-text-secondary`;

  const fetchChangelog = useCallback(async () => {
    try {
      const res = await fetch(`/api/sprint-drafts/${sprintId}/changelog`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } catch {
      // Silent fail — changelog is non-critical
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    fetchChangelog();
  }, [fetchChangelog]);

  if (loading) {
    return (
      <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded" />
          <div className="h-3 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded" />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6">
        <p className={`${labelClass} italic`}>
          No changes recorded yet. Changes will appear here when the sprint is updated.
        </p>
      </div>
    );
  }

  const visibleEntries = expanded ? entries : entries.slice(0, 5);
  const hasMore = entries.length > 5;

  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {visibleEntries.map((entry) => (
          <div key={entry.id} className="px-6 py-3 flex items-start gap-3">
            <div className="mt-0.5">
              <ActionIcon action={entry.action} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={bodySmClass}>{entry.summary}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {entry.author_name && (
                  <span className={captionClass}>{entry.author_name}</span>
                )}
                {entry.author_name && (
                  <span className="text-neutral-300 dark:text-neutral-600" aria-hidden="true">&middot;</span>
                )}
                <span className={captionClass} title={formatDate(entry.created_at)}>
                  {timeAgo(entry.created_at)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && !expanded && (
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Show all {entries.length} changes
          </button>
        </div>
      )}

      {expanded && hasMore && (
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  );
}
