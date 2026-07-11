"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Task = {
  id: string;
  hill_id: string | null;
  name: string;
  completed: boolean;
  progress: number;
  focus: string;
  origin: string;
  hill_title: string | null;
  hill_type: string | null;
  hill_phase: string | null;
};

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json().catch(() => ({}));
}

function hasTier(focus: string, tier: string) {
  return focus.split(",").map((s) => s.trim()).includes(tier);
}

function TaskLine({
  task,
  onToggle,
  onProgress,
  onFocus,
}: {
  task: Task;
  onToggle: (t: Task) => void;
  onProgress: (t: Task, delta: number) => void;
  onFocus: (t: Task, focus: string) => void;
}) {
  const isNow = hasTier(task.focus, "now");
  return (
    <div className="group flex items-center gap-3 py-2 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <button
        onClick={() => onToggle(task)}
        className={`text-base ${task.completed ? "text-emerald-500" : "text-neutral-300 dark:text-neutral-600 hover:text-neutral-500"}`}
        aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
      >
        {task.completed ? "✓" : "○"}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm leading-snug ${task.completed ? "text-neutral-400 dark:text-neutral-500 line-through" : "text-neutral-800 dark:text-neutral-200"}`}>
          {task.name}
        </div>
        {task.hill_title && (
          <Link href={`/dashboard/hills/${task.hill_id}`} className="text-[11px] text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 truncate block">
            {task.hill_title}
          </Link>
        )}
      </div>

      {/* progress */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => onProgress(task, -10)} className="text-xs w-5 h-5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">−</button>
        <button onClick={() => onProgress(task, 10)} className="text-xs w-5 h-5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">+</button>
      </div>
      <div className="w-20 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${task.progress}%` }} />
      </div>
      <span className="text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500 w-8 text-right">{task.progress}%</span>

      {/* focus controls */}
      <button
        onClick={() => onFocus(task, isNow ? "today" : "now,today")}
        className={`text-[11px] px-1.5 py-0.5 rounded transition ${isNow ? "bg-red-500/15 text-red-600 dark:text-red-400" : "text-neutral-400 hover:text-red-500"}`}
        title={isNow ? "Clear now" : "Focus now"}
      >
        🔥
      </button>
      <button
        onClick={() => onFocus(task, "")}
        className="text-[11px] px-1 text-neutral-300 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-0 group-hover:opacity-100 transition"
        title="Remove from today"
      >
        ×
      </button>
    </div>
  );
}

export default function TodayClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const d = await api("/api/admin/hills/today", "GET");
      setTasks(d.tasks ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const mutate = async (t: Task, patch: Record<string, unknown>) => {
    await api(`/api/admin/hills/${t.hill_id}/tasks/${t.id}`, "PATCH", patch);
    reload();
  };
  const onToggle = (t: Task) => mutate(t, { completed: !t.completed });
  const onProgress = (t: Task, delta: number) => mutate(t, { progress: Math.max(0, Math.min(100, t.progress + delta)) });
  const onFocus = (t: Task, focus: string) => mutate(t, { focus });

  const nowTask = useMemo(() => tasks.find((t) => hasTier(t.focus, "now") && !t.completed), [tasks]);
  const open = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const donePct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Today</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">What you&apos;re climbing today, across every hill.</p>
        </div>
        <Link href="/dashboard/hills" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline">All hills →</Link>
      </div>

      {!loading && !error && tasks.length > 0 && (
        <div className="flex items-center gap-2 mt-4 mb-6">
          <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${donePct}%` }} />
          </div>
          <span className="text-xs tabular-nums text-neutral-500">{done.length}/{tasks.length} done</span>
        </div>
      )}

      {loading && <p className="text-sm text-neutral-500 mt-8">Loading…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-8">Couldn&apos;t load today: {error}</p>}

      {!loading && !error && (
        <>
          {/* Now banner */}
          {nowTask && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-[11px] font-mono uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">🔥 In focus now</p>
              <div className="flex items-center gap-3">
                <button onClick={() => onToggle(nowTask)} className="text-lg text-neutral-300 dark:text-neutral-600 hover:text-emerald-500">○</button>
                <span className="flex-1 text-base font-medium text-neutral-900 dark:text-neutral-100">{nowTask.name}</span>
                <span className="text-xs tabular-nums text-neutral-500">{nowTask.progress}%</span>
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <p className="text-sm text-neutral-400 dark:text-neutral-600 mt-8 text-center">
              Nothing focused for today. Open a hill and send tasks to Today.
            </p>
          )}

          {open.length > 0 && (
            <div className="flex flex-col gap-2">
              {open.map((t) => (
                <TaskLine key={t.id} task={t} onToggle={onToggle} onProgress={onProgress} onFocus={onFocus} />
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Completed today</h2>
              <div className="flex flex-col gap-2 opacity-70">
                {done.map((t) => (
                  <TaskLine key={t.id} task={t} onToggle={onToggle} onProgress={onProgress} onFocus={onFocus} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
