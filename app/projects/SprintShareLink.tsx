"use client";

import Link from "next/link";

type Props = {
  sprintId: string;
  shareToken: string | null;
  status: string | null;
  isAdmin?: boolean;
};

export default function SprintShareLink({ sprintId, shareToken, status, isAdmin }: Props) {
  const isInProgress = status === "in_progress";
  const isActive = status === "scheduled" || status === "in_progress" || status === "complete";

  // Admins always see View Sprint + Builder, plus View Draft when a share token exists.
  // All buttons are always active — no disabled states.
  if (isAdmin) {
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
        <Link
          href={`/dashboard/sprint-builder?sprintId=${sprintId}`}
          className="inline-flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-700 px-2.5 py-1 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150"
        >
          Builder
        </Link>
      </div>
    );
  }

  // Non-admins: if in_progress, show View Sprint (takes priority over View Draft)
  if (isInProgress) {
    return (
      <Link
        href={`/sprints/${sprintId}`}
        className="inline-flex items-center gap-1 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-2.5 py-1 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900 transition-colors duration-150"
      >
        View Sprint
      </Link>
    );
  }

  // Non-admins: show View Draft if available
  if (shareToken) {
    return (
      <Link
        href={`/shared/sprint/${shareToken}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-1 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-150"
      >
        View Draft
      </Link>
    );
  }

  // Non-admins: show View Sprint for other active statuses
  if (isActive) {
    return (
      <Link
        href={`/sprints/${sprintId}`}
        className="inline-flex items-center gap-1 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-2.5 py-1 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900 transition-colors duration-150"
      >
        View Sprint
      </Link>
    );
  }

  return <span className="opacity-40 text-xs">—</span>;
}
