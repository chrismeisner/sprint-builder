"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  sprintId: string;
};

export default function DeleteSprintButton({ sprintId }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    const ok = window.confirm("Delete this sprint draft? This cannot be undone.");
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/sprint-drafts?id=${encodeURIComponent(sprintId)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to delete sprint");
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete sprint");
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="px-3 py-1.5 text-xs rounded-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
      {error && <span className="text-[11px] text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
