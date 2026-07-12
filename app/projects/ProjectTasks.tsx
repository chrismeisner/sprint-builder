"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Typography from "@/components/ui/Typography";

// The project's live work, as hills. (Replaces the retired admin_tasks
// "initiatives" panel — a project has hills; each hill holds its ideas,
// deliverables, and tasks, managed in /dashboard/hills.)
type Hill = {
  id: string;
  type: "personal" | "sprint" | "refinement_cycle";
  title: string | null;
  phase: "scope" | "climb" | "descend" | null;
  status: string | null;
  progress: number;
  target_date: string | null;
  idea_count: number;
  deliverable_count: number;
  task_count: number;
  task_done: number;
};

const TYPE_LABEL: Record<string, string> = { personal: "Personal", sprint: "Sprint", refinement_cycle: "Refinement" };
const PHASE_LABEL: Record<string, string> = { scope: "Scope", climb: "Climb", descend: "Descend" };
const PHASE_TONE: Record<string, string> = {
  scope: "text-sky-600 dark:text-sky-400",
  climb: "text-amber-600 dark:text-amber-400",
  descend: "text-emerald-600 dark:text-emerald-400",
};

export default function ProjectTasks({ projectId }: { projectId: string }) {
  const [hills, setHills] = useState<Hill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHills = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/hills?projectId=${encodeURIComponent(projectId)}`);
      if (!res.ok) throw new Error(res.status === 403 ? "Admin access required." : "Failed to load hills.");
      const data = await res.json();
      setHills(data.hills ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchHills();
  }, [fetchHills]);

  if (loading) return <div className="py-4 text-sm opacity-70">Loading hills…</div>;
  if (error) return <div className="py-4 text-sm text-red-600 dark:text-red-400">{error}</div>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Typography as="h2" scale="h3">Hills</Typography>
          <Typography as="span" scale="body-sm" className="opacity-60">{hills.length} total</Typography>
        </div>
        <Link
          href="/dashboard/hills"
          className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          Manage in Hills →
        </Link>
      </div>

      {hills.length === 0 ? (
        <Typography as="div" scale="body-sm" className="opacity-70">
          No hills for this project yet.{" "}
          <Link href="/dashboard/hills" className="text-blue-600 dark:text-blue-400 hover:underline">Create one in Hills →</Link>
        </Typography>
      ) : (
        <div className="flex flex-col gap-2">
          {hills.map((h) => (
            <Link
              key={h.id}
              href={`/dashboard/hills/${h.id}`}
              className="flex items-center gap-3 rounded-md border border-black/10 dark:border-white/15 px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{h.title || "Untitled hill"}</span>
                  <span className="text-[11px] opacity-50">{TYPE_LABEL[h.type] ?? h.type}</span>
                  {h.phase && <span className={`text-[11px] ${PHASE_TONE[h.phase]}`}>· {PHASE_LABEL[h.phase]}</span>}
                </div>
                <div className="text-[11px] opacity-50 mt-0.5 tabular-nums">
                  {h.task_count > 0 && <span>{h.task_done}/{h.task_count} tasks</span>}
                  {h.deliverable_count > 0 && <span>{h.task_count > 0 ? " · " : ""}{h.deliverable_count} deliverable{h.deliverable_count === 1 ? "" : "s"}</span>}
                  {h.task_count === 0 && h.deliverable_count === 0 && <span>no items yet</span>}
                </div>
              </div>
              <div className="w-16 h-1.5 rounded-full bg-black/10 dark:bg-white/15 overflow-hidden flex-none">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${h.progress}%` }} />
              </div>
              <span className="text-[11px] tabular-nums opacity-50 w-8 text-right flex-none">{h.progress}%</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
