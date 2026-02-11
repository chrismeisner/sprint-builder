"use client";

import Link from "next/link";

type Props = {
  sprintId: string;
  shareToken: string | null;
  status: string | null;
  isAdmin?: boolean;
};

export default function SprintShareLink({ sprintId, shareToken, status, isAdmin }: Props) {
  const isDraft = !status || status === "draft";
  const isActive = status === "scheduled" || status === "in_progress" || status === "complete";

  // If draft status and has share token, show View Draft button (and Edit for admins)
  if (isDraft && shareToken) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/shared/sprint/${shareToken}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-1 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-150"
        >
          View Draft
        </Link>
        {isAdmin && (
          <Link
            href={`/dashboard/sprint-builder?sprintId=${sprintId}`}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150"
          >
            Edit
          </Link>
        )}
      </div>
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
            className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-1 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-150"
          >
            View Draft
          </Link>
        )}
        <Link
          href={`/sprints/${sprintId}`}
          className="inline-flex items-center gap-1 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-2.5 py-1 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900 transition-colors duration-150"
        >
          View Sprint
        </Link>
      </div>
    );
  }

  // Default: show nothing
  return <span className="opacity-40 text-xs">—</span>;
}
