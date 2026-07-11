"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Event = {
  id: string;
  hill_id: string | null;
  subject_type: string;
  kind: string;
  event_type: string | null;
  body: string | null;
  author_email: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
  hill_title: string | null;
  hill_type: string | null;
  author_name: string | null;
  author_account_email: string | null;
};

const KIND_FILTERS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "event", label: "Events" },
  { key: "note", label: "Notes" },
  { key: "update", label: "Updates" },
  { key: "comment", label: "Comments" },
  { key: "changelog", label: "Changelog" },
];

// Map an event to a glyph + tone. Semantic color, separate from any accent.
function glyph(e: Event): { icon: string; tone: string } {
  const t = e.event_type || e.kind;
  if (/complete|delivered/.test(t)) return { icon: "✓", tone: "text-emerald-600 dark:text-emerald-400" };
  if (/created|submitted/.test(t)) return { icon: "＋", tone: "text-sky-600 dark:text-sky-400" };
  if (/reset/.test(t)) return { icon: "↻", tone: "text-violet-600 dark:text-violet-400" };
  if (e.kind === "note" || e.kind === "comment") return { icon: "✎", tone: "text-neutral-500 dark:text-neutral-400" };
  if (e.kind === "update") return { icon: "◷", tone: "text-amber-600 dark:text-amber-400" };
  if (e.kind === "changelog") return { icon: "⇄", tone: "text-neutral-500 dark:text-neutral-400" };
  return { icon: "•", tone: "text-neutral-400" };
}

function label(e: Event): string {
  if (e.event_type) {
    if (e.event_type === "daily_reset") return "Daily focus reset";
    if (e.event_type === "weekly_reset") return "Weekly focus reset";
    if (e.event_type === "submitted") return "Scoped via intake";
    return e.event_type.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  }
  return e.kind.replace(/^\w/, (c) => c.toUpperCase());
}

function relTime(iso: string): string {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

export default function ActivityClient() {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [kind, setKind] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const PAGE = 50;

  const load = useCallback(async (k: string, offset: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE), offset: String(offset) });
      if (k) params.set("kind", k);
      const res = await fetch(`/api/admin/hills/events?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setEvents((prev) => (offset === 0 ? d.events : [...prev, ...d.events]));
      setTotal(d.total ?? 0);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(kind, 0);
  }, [kind, load]);

  // Group by day for the timeline.
  const groups: { day: string; items: Event[] }[] = [];
  for (const e of events) {
    const day = dayKey(e.created_at);
    const g = groups[groups.length - 1];
    if (g && g.day === day) g.items.push(e);
    else groups.push({ day, items: [e] });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Activity</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Everything that&apos;s happened across every hill.</p>
        </div>
        <Link href="/dashboard/hills" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline">All hills →</Link>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 text-xs">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setKind(f.key)}
            className={`px-2.5 py-1 rounded-md border transition ${
              kind === f.key
                ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100"
                : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">Couldn&apos;t load activity: {error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="text-sm text-neutral-400 dark:text-neutral-600 text-center py-8">No activity yet.</p>
      )}

      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <div key={g.day}>
            <h2 className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2 sticky top-0 bg-[var(--paper,transparent)] py-1">
              {g.day}
            </h2>
            <div className="flex flex-col">
              {g.items.map((e) => {
                const gl = glyph(e);
                return (
                  <div key={e.id} className="flex items-start gap-3 py-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0">
                    <span className={`mt-0.5 text-sm w-4 text-center ${gl.tone}`} aria-hidden>{gl.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-neutral-800 dark:text-neutral-200">
                        {label(e)}
                        {e.hill_title && (
                          <>
                            {" — "}
                            {e.hill_id ? (
                              <Link href={`/dashboard/hills/${e.hill_id}`} className="text-neutral-600 dark:text-neutral-300 hover:underline">
                                {e.hill_title}
                              </Link>
                            ) : (
                              <span className="text-neutral-600 dark:text-neutral-300">{e.hill_title}</span>
                            )}
                          </>
                        )}
                      </div>
                      {e.body && <p className="text-[13px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug line-clamp-2">{e.body}</p>}
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                        {relTime(e.created_at)}
                        {(e.author_name || e.author_email) && ` · ${e.author_name || e.author_email}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {events.length < total && (
        <div className="mt-6 text-center">
          <button
            onClick={() => load(kind, events.length)}
            disabled={loading}
            className="text-sm px-4 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700 disabled:opacity-40"
          >
            {loading ? "Loading…" : `Load more (${events.length}/${total})`}
          </button>
        </div>
      )}
    </div>
  );
}
