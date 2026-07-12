"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Job = {
  id: string;
  job_key: string;
  label: string;
  description: string | null;
  command: string | null;
  endpoint: string | null;
  cadence: string | null;
  expected_interval_minutes: number | null;
  status: "active" | "inactive" | "draft";
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_note: string | null;
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

function relTime(iso: string | null): string {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Is the job actually firing? (fresh run within ~2× its expected interval)
function isFresh(job: Job): boolean {
  if (!job.last_run_at) return false;
  const mins = (Date.now() - new Date(job.last_run_at).getTime()) / 60000;
  const window = (job.expected_interval_minutes ?? 1440) * 2;
  return mins <= window;
}

const STATUS_GROUPS = [
  { key: "active", label: "Active", hint: "marked on — should be wired in Heroku Scheduler" },
  { key: "inactive", label: "Inactive", hint: "turned off" },
  { key: "draft", label: "Draft", hint: "planned, not built or scheduled yet" },
] as const;

function JobCard({ job, onChange }: { job: Job; onChange: () => void }) {
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fresh = isFresh(job);
  const isDraft = job.status === "draft";
  const isBuiltIn = !job.job_key.startsWith("draft-");

  async function setStatus(status: string) {
    await api(`/api/admin/scheduled-jobs/${job.id}`, "PATCH", { status });
    onChange();
  }
  async function runNow() {
    if (!job.endpoint) return;
    setRunning(true);
    setMsg(null);
    try {
      const r = await fetch(job.endpoint, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? "Ran ✓" : d.error || `HTTP ${r.status}`);
      onChange();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setRunning(false);
    }
  }
  async function del() {
    if (!window.confirm(`Delete draft "${job.label}"?`)) return;
    await api(`/api/admin/scheduled-jobs/${job.id}`, "DELETE");
    onChange();
  }
  function copy() {
    if (!job.command) return;
    navigator.clipboard?.writeText(job.command).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {!isDraft && (
              <span className={`w-2 h-2 rounded-full ${fresh ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`} title={fresh ? "Firing" : "Not firing"} />
            )}
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{job.label}</h3>
            {job.cadence && <span className="text-[11px] font-mono text-neutral-400">{job.cadence}</span>}
          </div>
          {job.description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">{job.description}</p>}
        </div>
        {/* status toggle */}
        <div className="flex gap-0.5 flex-none text-[10px] font-mono">
          {(["active", "inactive", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-1.5 py-0.5 rounded uppercase tracking-wide transition ${
                job.status === s
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                  : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              {s === "active" ? "on" : s === "inactive" ? "off" : "draft"}
            </button>
          ))}
        </div>
      </div>

      {job.command && (
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 text-[12px] font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/70 rounded px-2 py-1.5 overflow-x-auto whitespace-nowrap">{job.command}</code>
          <button onClick={copy} className="text-[11px] px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex-none">
            {copied ? "copied" : "copy"}
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-[11px]">
        {!isDraft && (
          <span className={fresh ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-400 dark:text-neutral-500"}>
            {fresh ? "🟢 firing" : job.last_run_at ? "⚪ stale" : "⚪ never fired"} · last {relTime(job.last_run_at)}
            {job.last_run_note && <span className="text-neutral-400"> · {job.last_run_note}</span>}
          </span>
        )}
        {isDraft && <span className="text-neutral-400 dark:text-neutral-500">not scheduled</span>}
        <div className="ml-auto flex items-center gap-2">
          {msg && <span className="text-neutral-400">{msg}</span>}
          {job.endpoint && !isDraft && (
            <button onClick={runNow} disabled={running} className="text-[11px] px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-40">
              {running ? "running…" : "Run now"}
            </button>
          )}
          {!isBuiltIn && <button onClick={del} className="text-[11px] text-neutral-400 hover:text-red-500">delete</button>}
        </div>
      </div>
    </div>
  );
}

export default function SchedulersClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftDesc, setDraftDesc] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const d = await api("/api/admin/scheduled-jobs", "GET").catch(() => ({ jobs: [] }));
    setJobs(d.jobs ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const g: Record<string, Job[]> = { active: [], inactive: [], draft: [] };
    for (const j of jobs) (g[j.status] ??= []).push(j);
    return g;
  }, [jobs]);

  async function addDraft() {
    if (!draftLabel.trim()) return;
    await api("/api/admin/scheduled-jobs", "POST", { label: draftLabel.trim(), description: draftDesc.trim() || undefined });
    setDraftLabel("");
    setDraftDesc("");
    setAdding(false);
    load();
  }

  const firing = jobs.filter((j) => j.status !== "draft" && isFresh(j)).length;
  const notFiring = jobs.filter((j) => j.status === "active" && !isFresh(j)).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-3 mb-1">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Schedulers</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">The automation jobs — which are firing, which need wiring, and what&apos;s planned.</p>
        </div>
        <Link href="/dashboard/hills" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline">Hills →</Link>
      </div>

      <div className="mt-4 mb-6 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3.5 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
        The app can&apos;t read Heroku Scheduler&apos;s config, so a job shows <b className="text-emerald-600 dark:text-emerald-400">🟢 firing</b> only when it has actually run recently. To turn one on: open
        {" "}<span className="font-mono text-xs">heroku addons:open scheduler</span> and add its command below.
        {notFiring > 0 && <> <b className="text-amber-700 dark:text-amber-400">{notFiring} job{notFiring === 1 ? " is" : "s are"} marked on but not firing</b> — likely not wired yet.</>}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : (
        <div className="flex flex-col gap-7">
          {STATUS_GROUPS.map((grp) => {
            const list = grouped[grp.key] ?? [];
            if (list.length === 0 && grp.key !== "draft") return null;
            return (
              <section key={grp.key}>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{grp.label}</h2>
                    <span className="text-[11px] text-neutral-400">{grp.hint}</span>
                  </div>
                  {grp.key === "active" && <span className="text-[11px] font-mono text-neutral-400">{firing}/{list.length} firing</span>}
                </div>
                <div className="flex flex-col gap-2.5">
                  {list.map((j) => <JobCard key={j.id} job={j} onChange={load} />)}
                  {grp.key === "draft" && (
                    adding ? (
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-2">
                        <input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} autoFocus placeholder="Job name (e.g. Weekly digest email)" className="px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm" />
                        <input value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} placeholder="What it should do (optional)" className="px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm" />
                        <div className="flex gap-1.5">
                          <button onClick={addDraft} disabled={!draftLabel.trim()} className="text-xs px-2.5 py-1 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 disabled:opacity-40">Add draft</button>
                          <button onClick={() => setAdding(false)} className="text-xs px-2.5 py-1 rounded text-neutral-500">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setAdding(true)} className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 self-start">+ Draft a future job</button>
                    )
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
