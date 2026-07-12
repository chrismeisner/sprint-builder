"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Note = {
  id: string;
  body: string;
  subject_type: string | null;
  subject_id: string | null;
  created_at: string;
  updated_at: string;
};
type HillLite = { id: string; title: string | null; type: string };

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json().catch(() => ({}));
}

function linkify(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a key={i} href={p} target="_blank" rel="noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline break-all">{p}</a>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}
function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const SUBJECT_LABEL: Record<string, string> = { hill: "Hill", idea: "Idea", deliverable: "Deliverable", task: "Task", project: "Project" };

function NoteCard({ note, hills, onChange }: { note: Note; hills: HillLite[]; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(note.body);
  const [moving, setMoving] = useState(false);
  const [printState, setPrintState] = useState<"idle" | "printing" | "sent">("idle");
  const filedHill = note.subject_type === "hill" ? hills.find((h) => h.id === note.subject_id) : null;

  async function print() {
    setPrintState("printing");
    try {
      await api("/api/print/quick", "POST", { text: note.body, source: "note" });
      setPrintState("sent");
      setTimeout(() => setPrintState("idle"), 2000);
    } catch (e) {
      setPrintState("idle");
      alert(e instanceof Error ? e.message : "Failed to send to printer");
    }
  }

  async function save() {
    if (val.trim() && val.trim() !== note.body) await api(`/api/admin/notes/${note.id}`, "PATCH", { body: val.trim() });
    setEditing(false);
    onChange();
  }
  async function move(subjectType: string | null, subjectId: string | null) {
    await api(`/api/admin/notes/${note.id}`, "PATCH", { subjectType, subjectId });
    setMoving(false);
    onChange();
  }
  async function del() {
    if (!window.confirm("Delete this note?")) return;
    await api(`/api/admin/notes/${note.id}`, "DELETE");
    onChange();
  }

  return (
    <div className="group rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5">
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={4} autoFocus className="w-full px-2 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm" />
          <div className="flex gap-1.5">
            <button onClick={save} className="text-xs px-2.5 py-1 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">Save</button>
            <button onClick={() => { setVal(note.body); setEditing(false); }} className="text-xs px-2.5 py-1 rounded text-neutral-500">Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">{linkify(note.body)}</p>
          <div className="flex items-center gap-2 mt-2.5 text-[11px] text-neutral-400 dark:text-neutral-500">
            <span title={new Date(note.created_at).toLocaleString()}>{relTime(note.created_at)}</span>
            {filedHill ? (
              <Link href={`/dashboard/hills/${filedHill.id}`} className="px-1.5 py-0.5 rounded bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 hover:underline">⛰ {filedHill.title}</Link>
            ) : note.subject_type ? (
              <span className="px-1.5 py-0.5 rounded bg-neutral-500/10 text-neutral-600 dark:text-neutral-300">{SUBJECT_LABEL[note.subject_type] ?? note.subject_type}</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">inbox</span>
            )}
            <div className="ml-auto flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition">
              <button onClick={() => setEditing(true)} className="hover:text-neutral-700 dark:hover:text-neutral-300">edit</button>
              <button onClick={() => setMoving((m) => !m)} className="hover:text-neutral-700 dark:hover:text-neutral-300">move</button>
              <button onClick={print} disabled={printState !== "idle"} className="hover:text-neutral-700 dark:hover:text-neutral-300 disabled:opacity-100">
                {printState === "printing" ? "sending…" : printState === "sent" ? "🖨 sent ✓" : "print"}
              </button>
              <button onClick={del} className="hover:text-red-500">delete</button>
            </div>
          </div>
          {moving && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-neutral-100 dark:border-neutral-800 pt-2.5">
              <span className="text-[11px] text-neutral-400">File under:</span>
              {note.subject_type && (
                <button onClick={() => move(null, null)} className="text-[11px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20">inbox</button>
              )}
              <select onChange={(e) => e.target.value && move("hill", e.target.value)} defaultValue="" className="text-[11px] px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent max-w-[14rem]">
                <option value="" disabled>a hill…</option>
                {hills.map((h) => (<option key={h.id} value={h.id}>{h.title}</option>))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

type Scope = "all" | "inbox" | "filed";

export default function NotesClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hills, setHills] = useState<HillLite[]>([]);
  const [capture, setCapture] = useState("");
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [sort, setSort] = useState<"new" | "old">("new");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (scope === "inbox") params.set("inbox", "true");
    if (scope === "filed") params.set("filed", "true");
    if (q.trim()) params.set("q", q.trim());
    const d = await api(`/api/admin/notes?${params}`, "GET").catch(() => ({ notes: [] }));
    setNotes(d.notes ?? []);
    setLoading(false);
  }, [scope, q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/admin/hills").then((r) => r.json()).then((d) => setHills((d.hills ?? []).map((h: HillLite) => ({ id: h.id, title: h.title, type: h.type })))).catch(() => {});
  }, []);

  const sorted = useMemo(() => {
    const arr = [...notes];
    arr.sort((a, b) => (sort === "new" ? +new Date(b.created_at) - +new Date(a.created_at) : +new Date(a.created_at) - +new Date(b.created_at)));
    return arr;
  }, [notes, sort]);

  const counts = useMemo(() => ({
    total: notes.length,
    inbox: notes.filter((n) => !n.subject_type).length,
    filed: notes.filter((n) => n.subject_type).length,
  }), [notes]);

  async function saveCapture() {
    if (!capture.trim()) return;
    setSaving(true);
    try {
      await api("/api/admin/notes", "POST", { body: capture.trim() });
      setCapture("");
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between gap-3 mb-1">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Notes</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Everything you&apos;ve jotted — capture, search, and file under any hill.</p>
        </div>
        <Link href="/dashboard/hills" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline">Hills →</Link>
      </div>

      {/* quick capture */}
      <div className="mt-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
        <textarea
          value={capture}
          onChange={(e) => setCapture(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveCapture(); }}
          rows={2}
          placeholder="Capture a thought, a link, a supplier… (⌘↵ to save)"
          className="w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none"
        />
        <div className="flex justify-end">
          <button onClick={saveCapture} disabled={saving || !capture.trim()} className="text-xs px-3 py-1.5 rounded-md bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 disabled:opacity-40">{saving ? "Saving…" : "Capture"}</button>
        </div>
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2 mt-5 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all notes…" className="flex-1 min-w-[10rem] px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-transparent text-sm" />
        <div className="flex gap-1 text-xs">
          {(["all", "inbox", "filed"] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} className={`px-2.5 py-1.5 rounded-md border transition capitalize ${scope === s ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100" : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"}`}>
              {s}{s !== "all" && <span className="ml-1 opacity-60 tabular-nums">{s === "inbox" ? counts.inbox : counts.filed}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setSort((x) => (x === "new" ? "old" : "new"))} className="text-xs px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
          {sort === "new" ? "Newest" : "Oldest"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-neutral-400 dark:text-neutral-600 text-center py-10">{q ? "No notes match your search." : scope === "inbox" ? "Inbox is empty." : "No notes yet — capture your first above."}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((note) => (<NoteCard key={note.id} note={note} hills={hills} onChange={load} />))}
        </div>
      )}
    </div>
  );
}
