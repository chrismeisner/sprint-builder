"use client";

import Link from "next/link";

type Props = {
  sprintId: string;
  shareToken: string | null;
  status: string | null;
};

export default function SprintShareLink({ sprintId, shareToken, status }: Props) {
  const isDraft = !status || status === "draft";
  const isActive = status === "scheduled" || status === "in_progress" || status === "complete";

  // If draft status and has share token, show View Draft button
  if (isDraft && shareToken) {
    return (
      <Link
        href={`/shared/sprint/${shareToken}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
      >
        View Draft
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-60"
        >
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </Link>
    );
  }

  // If active status (scheduled, in_progress, or complete), show both buttons
  if (isActive) {
    return (
      <div className="flex items-center gap-2">
        {shareToken && (
          <Link
            href={`/shared/sprint/${shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
          >
            View Draft
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-60"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
        )}
        <Link
          href={`/sprints/${sprintId}`}
          className="inline-flex items-center gap-1 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-2.5 py-1 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition"
        >
          View Sprint
        </Link>
      </div>
    );
  }

  // Default: show nothing
  return <span className="opacity-40 text-xs">—</span>;
}
