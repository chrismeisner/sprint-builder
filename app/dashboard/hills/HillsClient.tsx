"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Hill = {
  id: string;
  type: "personal" | "sprint" | "refinement_cycle";
  title: string | null;
  summary: string | null;
  status: string | null;
  phase: "scope" | "climb" | "descend" | null;
  progress: number;
  project_name: string | null;
  span_granularity: string | null;
  target_date: string | null;
  completed: boolean;
  origin: string;
  accepted_at: string | null;
  submitter_email: string | null;
  idea_count: number;
  deliverable_count: number;
  task_count: number;
  task_done: number;
};

const PHASES = [
  { key: "scope", label: "Scope the climb", hint: "estimate the distance · name what to resolve" },
  { key: "climb", label: "The climb", hint: "the work · until clarity" },
  { key: "descend", label: "Observe & descend", hint: "wrap up · deliver · document" },
] as const;

const TYPE_META: Record<Hill["type"], { label: string; cls: string }> = {
  personal: { label: "Personal", cls: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30" },
  sprint: { label: "Sprint", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30" },
  refinement_cycle: { label: "Refinement", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
};

const PHASE_ACCENT: Record<string, string> = {
  scope: "text-sky-600 dark:text-sky-400 border-sky-500/40",
  climb: "text-amber-600 dark:text-amber-400 border-amber-500/40",
  descend: "text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
};
const PHASE_BAR: Record<string, string> = {
  scope: "bg-sky-500",
  climb: "bg-amber-500",
  descend: "bg-emerald-500",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function HillCard({ hill }: { hill: Hill }) {
  const type = TYPE_META[hill.type];
  const barColor = PHASE_BAR[hill.phase ?? ""] ?? "bg-neutral-400";
  return (
    <Link
      href={`/dashboard/hills/${hill.id}`}
      className="block rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium border ${type.cls}`}>{type.label}</span>
          {hill.origin === "intake" && !hill.accepted_at && (
            <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              Proposal
            </span>
          )}
        </div>
        {hill.status && (
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{hill.status}</span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug mb-1 line-clamp-2">
        {hill.title || "Untitled hill"}
      </h3>

      <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mb-3">
        {hill.project_name && <span className="truncate max-w-[10rem]">{hill.project_name}</span>}
        {hill.span_granularity && <span className="capitalize">· {hill.span_granularity}</span>}
        <span>· {formatDate(hill.target_date)}</span>
      </div>

      {/* progress */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${hill.progress}%` }} />
        </div>
        <span className="text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400 w-8 text-right">
          {hill.progress}%
        </span>
      </div>

      {/* rollup */}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {hill.idea_count > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300">
            {hill.idea_count} idea{hill.idea_count === 1 ? "" : "s"}
          </span>
        )}
        {hill.deliverable_count > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            {hill.deliverable_count} deliverable{hill.deliverable_count === 1 ? "" : "s"}
          </span>
        )}
        {hill.task_count > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 tabular-nums">
            {hill.task_done}/{hill.task_count} tasks
          </span>
        )}
      </div>
    </Link>
  );
}

function NewHillForm({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<Hill["type"]>("personal");
  const [span, setSpan] = useState("");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/hills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          span_granularity: span || undefined,
          target_date: target || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const { hill } = await res.json();
      onCreated();
      router.push(`/dashboard/hills/${hill.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition"
      >
        + New hill
      </button>
    );
  }

  return (
    <div className="w-full mt-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="flex flex-wrap gap-2 items-end">
        <label className="flex flex-col gap-1 flex-1 min-w-[12rem]">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Title</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="What are we climbing?"
            className="px-2 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as Hill["type"])}
            className="px-2 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100"
          >
            <option value="personal">Personal</option>
            <option value="sprint">Sprint</option>
            <option value="refinement_cycle">Refinement</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Span</span>
          <select
            value={span}
            onChange={(e) => setSpan(e.target.value)}
            className="px-2 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100"
          >
            <option value="">—</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">Target date</span>
          <input
            type="date"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="px-2 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100"
          />
        </label>
        <div className="flex gap-1.5">
          <button
            onClick={submit}
            disabled={saving || !title.trim()}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 transition"
          >
            {saving ? "Creating…" : "Create"}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 rounded-md text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition"
          >
            Cancel
          </button>
        </div>
      </div>
      {err && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{err}</p>}
    </div>
  );
}

export default function HillsClient() {
  const [hills, setHills] = useState<Hill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | Hill["type"]>("all");

  function load() {
    setLoading(true);
    fetch("/api/admin/hills")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        setHills(d.hills ?? []);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (typeFilter === "all" ? hills : hills.filter((h) => h.type === typeFilter)),
    [hills, typeFilter]
  );

  const byPhase = useMemo(() => {
    const map: Record<string, Hill[]> = { scope: [], climb: [], descend: [] };
    for (const h of filtered) {
      const p = h.phase ?? "scope";
      (map[p] ??= []).push(h);
    }
    return map;
  }, [filtered]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: hills.length, personal: 0, sprint: 0, refinement_cycle: 0 };
    for (const h of hills) c[h.type] = (c[h.type] ?? 0) + 1;
    return c;
  }, [hills]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Hills</h1>
            <Link href="/dashboard/hills/today" className="text-sm text-amber-600 dark:text-amber-400 hover:underline">☀️ Today</Link>
            <Link href="/dashboard/hills/activity" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline">Activity</Link>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Every climb — personal, sprint, and refinement — in one place, by phase.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 text-xs">
            {(["all", "personal", "sprint", "refinement_cycle"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md border transition ${
                  typeFilter === t
                    ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100"
                    : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                {t === "all" ? "All" : t === "refinement_cycle" ? "Refinement" : t.charAt(0).toUpperCase() + t.slice(1)}
                <span className="ml-1 opacity-60 tabular-nums">{counts[t] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <NewHillForm onCreated={load} />
      </div>

      {loading && <p className="text-sm text-neutral-500 mt-8">Loading hills…</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-8">Couldn&apos;t load hills: {error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {PHASES.map((phase) => {
            const list = byPhase[phase.key] ?? [];
            return (
              <section key={phase.key} className="min-w-0">
                <div className={`mb-3 pb-2 border-b ${PHASE_ACCENT[phase.key]}`}>
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-sm font-semibold">{phase.label}</h2>
                    <span className="text-xs tabular-nums opacity-70">{list.length}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">{phase.hint}</p>
                </div>
                <div className="flex flex-col gap-3">
                  {list.length === 0 ? (
                    <p className="text-xs text-neutral-400 dark:text-neutral-600 py-4 text-center">No hills here.</p>
                  ) : (
                    list.map((h) => <HillCard key={h.id} hill={h} />)
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
