"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// A hill is a milestone: this is the deadline-focused lens over hills that have
// a target_date. Reuses GET /api/admin/hills (no new endpoint).
type Hill = {
  id: string;
  type: "personal" | "sprint" | "refinement_cycle";
  title: string | null;
  status: string | null;
  phase: string | null;
  progress: number;
  target_date: string | null;
  completed: boolean;
  task_count: number;
  task_done: number;
  deliverable_count: number;
};

const TYPE_LABEL: Record<string, string> = { personal: "Personal", sprint: "Sprint", refinement_cycle: "Refinement" };

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntil(target: string): number {
  const t = startOfDay(new Date(target));
  const now = startOfDay(new Date());
  return Math.round((t.getTime() - now.getTime()) / 86400000);
}

function countdownLabel(days: number, completed: boolean): { text: string; tone: string } {
  if (completed) return { text: "done", tone: "text-emerald-600 dark:text-emerald-400" };
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: "text-red-600 dark:text-red-400" };
  if (days === 0) return { text: "today", tone: "text-amber-600 dark:text-amber-400" };
  if (days === 1) return { text: "tomorrow", tone: "text-amber-600 dark:text-amber-400" };
  if (days <= 7) return { text: `in ${days}d`, tone: "text-amber-600 dark:text-amber-400" };
  return { text: `in ${days}d`, tone: "text-neutral-500 dark:text-neutral-400" };
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function DeadlinesClient() {
  const [hills, setHills] = useState<Hill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/hills")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => active && setHills(d.hills ?? []))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const dated = useMemo(
    () =>
      hills
        .filter((h) => h.target_date && (showDone || !h.completed))
        .sort((a, b) => new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime()),
    [hills, showDone]
  );

  // Group by horizon.
  const groups = useMemo(() => {
    const g: { key: string; label: string; items: Hill[] }[] = [
      { key: "overdue", label: "Overdue", items: [] },
      { key: "week", label: "This week", items: [] },
      { key: "later", label: "Later", items: [] },
      { key: "done", label: "Completed", items: [] },
    ];
    for (const h of dated) {
      const days = daysUntil(h.target_date!);
      if (h.completed) g[3].items.push(h);
      else if (days < 0) g[0].items.push(h);
      else if (days <= 7) g[1].items.push(h);
      else g[2].items.push(h);
    }
    return g.filter((x) => x.items.length > 0);
  }, [dated]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Deadlines</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Every hill with a target date, by how close it is.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowDone((s) => !s)} className="text-xs text-neutral-500 dark:text-neutral-400 hover:underline">
            {showDone ? "Hide completed" : "Show completed"}
          </button>
          <Link href="/dashboard/hills" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline">All hills →</Link>
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-500 mt-8">Loading…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-8">Couldn&apos;t load: {error}</p>}
      {!loading && !error && dated.length === 0 && (
        <p className="text-sm text-neutral-400 dark:text-neutral-600 mt-8 text-center">No hills with target dates yet.</p>
      )}

      <div className="flex flex-col gap-6 mt-6">
        {groups.map((g) => (
          <section key={g.key}>
            <h2 className={`text-[11px] font-mono uppercase tracking-widest mb-2 ${g.key === "overdue" ? "text-red-600 dark:text-red-400" : "text-neutral-400 dark:text-neutral-500"}`}>
              {g.label} <span className="opacity-60">· {g.items.length}</span>
            </h2>
            <div className="flex flex-col gap-2">
              {g.items.map((h) => {
                const days = daysUntil(h.target_date!);
                const cd = countdownLabel(days, h.completed);
                return (
                  <Link key={h.id} href={`/dashboard/hills/${h.id}`} className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{h.title || "Untitled hill"}</div>
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-2">
                        <span>{TYPE_LABEL[h.type] ?? h.type}</span>
                        <span>· {fmt(h.target_date!)}</span>
                        {h.task_count > 0 && <span className="tabular-nums">· {h.task_done}/{h.task_count} tasks</span>}
                      </div>
                    </div>
                    <div className="w-16 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex-none">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${h.progress}%` }} />
                    </div>
                    <span className={`text-xs font-medium tabular-nums w-20 text-right flex-none ${cd.tone}`}>{cd.text}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
