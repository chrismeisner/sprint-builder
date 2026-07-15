"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  type_data: Record<string, unknown> | null;
};
type Idea = { id: string; title: string; summary: string | null; status: string };
type Deliverable = {
  id: string;
  name: string | null;
  notes: string | null;
  added_by: string | null;
  current_version: string | null;
  delivery_url: string | null;
  origin: string;
  accepted_at: string | null;
  dismissed_at: string | null;
  price: string | number | null;
  quantity: number | null;
  deliverable_category: string | null;
  deliverable_scope: string | null;
};
type Invoice = {
  id: string;
  kind: string;
  label: string;
  amount: string | number | null;
  invoice_status: string;
  invoice_url: string | null;
  stripe_invoice_id: string | null;
  paid_at: string | null;
};
type Billing = { scopeTotal: number; amountInvoiced: number; amountPaid: number };
type Task = {
  id: string;
  idea_id: string | null;
  deliverable_id: string | null;
  parent_task_id: string | null;
  name: string;
  note: string | null;
  completed: boolean;
  progress: number;
  focus: string;
  origin: string;
  accepted_at: string | null;
  dismissed_at: string | null;
};
type Payload = {
  hill: Hill;
  ideas: Idea[];
  deliverables: Deliverable[];
  invoices: Invoice[];
  tasks: Task[];
  billing: Billing;
};

const money = (n: number | string | null | undefined) =>
  (Number(n) || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

const INVOICE_STATUS_STYLE: Record<string, string> = {
  not_sent: "text-neutral-400",
  sent: "text-sky-600 dark:text-sky-400",
  processing: "text-amber-600 dark:text-amber-400",
  paid: "text-emerald-600 dark:text-emerald-400",
  failed: "text-red-600 dark:text-red-400",
  voided: "text-neutral-400 line-through",
  refunded: "text-red-500",
};

const PHASE_LABEL: Record<string, string> = { scope: "Scope the climb", climb: "The climb", descend: "Observe & descend" };
const PHASE_TEXT: Record<string, string> = {
  scope: "text-sky-600 dark:text-sky-400",
  climb: "text-amber-600 dark:text-amber-400",
  descend: "text-emerald-600 dark:text-emerald-400",
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

// Inline "add" input that appears on demand.
function AddInput({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!val.trim()) return;
    setBusy(true);
    try {
      await onAdd(val.trim());
      setVal("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition">
        + {placeholder}
      </button>
    );
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => (e.key === "Enter" ? submit() : e.key === "Escape" ? setOpen(false) : null)}
        placeholder={placeholder}
        className="flex-1 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100"
      />
      <button onClick={submit} disabled={busy || !val.trim()} className="text-xs px-2 py-1 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 disabled:opacity-40">
        {busy ? "…" : "Add"}
      </button>
    </div>
  );
}

function TaskRow({
  task,
  tasks,
  onToggle,
  onProgress,
  onDelete,
  onReview,
  onToday,
  onEdit,
  dragHandle,
  depth = 0,
}: {
  task: Task;
  tasks: Task[];
  onToggle: (t: Task) => void;
  onProgress: (t: Task, delta: number) => void;
  onDelete: (t: Task) => void;
  onReview: (t: Task, decision: "accepted" | "dismissed") => void;
  onToday: (t: Task) => void;
  onEdit: (t: Task, patch: { name?: string; note?: string | null }) => void;
  dragHandle?: React.ReactNode;
  depth?: number;
}) {
  const children = tasks.filter((t) => t.parent_task_id === task.id && !t.dismissed_at);
  const needsReview = task.origin === "suggested" && !task.accepted_at && !task.dismissed_at;
  const focusTiers = task.focus.split(",").map((s) => s.trim());
  const onToday_ = focusTiers.includes("today") || focusTiers.includes("now");

  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(task.name);
  const [noteVal, setNoteVal] = useState(task.note ?? "");

  function openEdit() {
    setNameVal(task.name);
    setNoteVal(task.note ?? "");
    setEditing(true);
  }
  function saveEdit() {
    const patch: { name?: string; note?: string | null } = {};
    if (nameVal.trim() && nameVal.trim() !== task.name) patch.name = nameVal.trim();
    if ((noteVal.trim() || null) !== (task.note ?? null)) patch.note = noteVal.trim() || null;
    if (patch.name !== undefined || patch.note !== undefined) onEdit(task, patch);
    setEditing(false);
  }

  return (
    <>
      {editing ? (
        <div className="flex flex-col gap-1.5 py-2 border-b border-neutral-100 dark:border-neutral-800/60" style={{ paddingLeft: `${depth * 1.25}rem` }}>
          <input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey ? saveEdit() : e.key === "Escape" ? setEditing(false) : null)}
            className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm text-neutral-900 dark:text-neutral-100"
          />
          <textarea
            value={noteVal}
            onChange={(e) => setNoteVal(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-[13px] text-neutral-700 dark:text-neutral-300"
          />
          <div className="flex gap-1.5">
            <button onClick={saveEdit} className="text-[11px] px-2 py-0.5 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">Save</button>
            <button onClick={() => setEditing(false)} className="text-[11px] px-2 py-0.5 rounded text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="group flex items-start gap-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0" style={{ paddingLeft: `${depth * 1.25}rem` }}>
          {dragHandle}
          {needsReview ? (
            <span className="text-amber-500 text-sm mt-0.5" aria-hidden>◇</span>
          ) : (
            <button onClick={() => onToggle(task)} className={`text-sm mt-0.5 ${task.completed ? "text-emerald-500" : "text-neutral-300 dark:text-neutral-600 hover:text-neutral-500"}`} aria-label={task.completed ? "Mark incomplete" : "Mark complete"}>
              {task.completed ? "✓" : "○"}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <span
              className={`text-sm leading-snug ${task.completed ? "text-neutral-400 dark:text-neutral-500 line-through" : "text-neutral-800 dark:text-neutral-200"} ${needsReview ? "" : "cursor-text"}`}
              onDoubleClick={needsReview ? undefined : openEdit}
              title={needsReview ? undefined : "Double-click to edit"}
            >
              {task.name}
              {task.origin !== "manual" && (
                <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 align-middle">{task.origin}</span>
              )}
            </span>
            {task.note && <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-snug mt-0.5 whitespace-pre-wrap">{task.note}</p>}
          </div>
          {needsReview ? (
            <div className="flex items-center gap-1 mt-0.5">
              <button onClick={() => onReview(task, "accepted")} className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25">Accept</button>
              <button onClick={() => onReview(task, "dismissed")} className="text-[11px] px-2 py-0.5 rounded text-neutral-400 hover:text-red-500">Dismiss</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-0.5">
              <button onClick={openEdit} className="text-xs text-neutral-300 dark:text-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300 opacity-0 group-hover:opacity-100 transition" aria-label="Edit task">✎</button>
              <button
                onClick={() => onToday(task)}
                className={`text-xs px-1 transition ${onToday_ ? "text-amber-500" : "text-neutral-300 dark:text-neutral-600 hover:text-amber-500 opacity-0 group-hover:opacity-100"}`}
                title={onToday_ ? "On today" : "Add to today"}
              >
                ☀️
              </button>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => onProgress(task, -10)} className="text-xs w-5 h-5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">−</button>
                <button onClick={() => onProgress(task, 10)} className="text-xs w-5 h-5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">+</button>
              </div>
              <span className="text-[11px] tabular-nums text-neutral-400 dark:text-neutral-500 w-8 text-right">{task.progress}</span>
              <button onClick={() => onDelete(task)} className="text-xs text-neutral-300 dark:text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition" aria-label="Delete task">×</button>
            </div>
          )}
        </div>
      )}
      {children.map((c) => (
        <TaskRow key={c.id} task={c} tasks={tasks} onToggle={onToggle} onProgress={onProgress} onDelete={onDelete} onReview={onReview} onToday={onToday} onEdit={onEdit} depth={depth + 1} />
      ))}
    </>
  );
}

type TaskHandlers = {
  onToggle: (t: Task) => void;
  onProgress: (t: Task, delta: number) => void;
  onDelete: (t: Task) => void;
  onReview: (t: Task, decision: "accepted" | "dismissed") => void;
  onToday: (t: Task) => void;
  onEdit: (t: Task, patch: { name?: string; note?: string | null }) => void;
};

// One draggable top-level task (its subtasks travel with it). A dedicated grip
// carries the drag listeners so the row's buttons stay clickable.
function SortableTaskItem({ task, tasks, handlers }: { task: Task; tasks: Task[]; handlers: TaskHandlers }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <TaskRow
        task={task}
        tasks={tasks}
        {...handlers}
        dragHandle={
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 text-xs mt-0.5 opacity-0 group-hover:opacity-100 transition touch-none"
            aria-label="Drag to reorder"
          >
            ⠿
          </button>
        }
      />
    </div>
  );
}

// A container's sibling tasks, drag-reorderable. onReorder gets the new id order.
function SortableTaskList({
  tasks,
  allTasks,
  handlers,
  onReorder,
}: {
  tasks: Task[];
  allTasks: Task[];
  handlers: TaskHandlers;
  onReorder: (orderedIds: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(tasks, oldIndex, newIndex).map((t) => t.id));
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((t) => (
          <SortableTaskItem key={t.id} task={t} tasks={allTasks} handlers={handlers} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Repeat this hill" — creates/stops a recurrence that clones this hill on a cadence.
function HillRepeat({ hillId }: { hillId: string }) {
  const [rec, setRec] = useState<{ description: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [freq, setFreq] = useState<"daily" | "weekly">("weekly");
  const [time, setTime] = useState("09:00");
  const [days, setDays] = useState<number[]>([1]); // Mon
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/hills/${hillId}/repeat`).then((x) => x.json()).catch(() => ({}));
    setRec(r.recurrence ?? null);
  }, [hillId]);
  useEffect(() => {
    load();
  }, [load]);

  async function start() {
    setBusy(true);
    try {
      await fetch(`/api/admin/hills/${hillId}/repeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freq, at_time: time, by_weekday: freq === "weekly" ? days : undefined }),
      });
      setOpen(false);
      load();
    } finally {
      setBusy(false);
    }
  }
  async function stop() {
    await fetch(`/api/admin/hills/${hillId}/repeat`, { method: "DELETE" });
    load();
  }

  if (rec) {
    return (
      <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-violet-500/25 bg-violet-500/5 px-4 py-2.5">
        <span className="text-sm text-violet-700 dark:text-violet-300">🔁 Repeats · {rec.description}</span>
        <button onClick={stop} className="text-xs text-neutral-400 hover:text-red-500 transition">Stop</button>
      </div>
    );
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-6 text-xs text-neutral-400 dark:text-neutral-500 hover:text-violet-600 dark:hover:text-violet-400 transition">
        🔁 Repeat this hill…
      </button>
    );
  }
  return (
    <div className="mb-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={freq} onChange={(e) => setFreq(e.target.value as "daily" | "weekly")} className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        {freq === "weekly" && (
          <div className="flex gap-1">
            {WEEKDAYS.map((w, i) => (
              <button
                key={w}
                onClick={() => setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]))}
                className={`text-[11px] w-7 h-7 rounded ${days.includes(i) ? "bg-violet-600 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"}`}
              >
                {w[0]}
              </button>
            ))}
          </div>
        )}
        <label className="text-xs text-neutral-500 flex items-center gap-1">at
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm" />
        </label>
      </div>
      <div className="flex gap-1.5">
        <button onClick={start} disabled={busy || (freq === "weekly" && days.length === 0)} className="text-xs px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-40">
          {busy ? "…" : "Start repeating"}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200">Cancel</button>
      </div>
      <p className="text-[11px] text-neutral-400 dark:text-neutral-500">A fresh copy of this hill (structure reset, nothing completed) will be created each time.</p>
    </div>
  );
}

// Notes filed under this hill (+ quick capture). Text-capture sibling of attachments.
function HillNotes({ hillId }: { hillId: string }) {
  const [notes, setNotes] = useState<{ id: string; body: string; created_at: string }[]>([]);
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ subjectType: "hill", subjectId: hillId });
    const r = await fetch(`/api/admin/notes?${p}`).then((x) => x.json()).catch(() => ({ notes: [] }));
    setNotes(r.notes ?? []);
  }, [hillId]);
  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    if (!val.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: val.trim(), subjectType: "hill", subjectId: hillId }),
      });
      setVal("");
      load();
    } finally {
      setBusy(false);
    }
  }
  async function del(id: string) {
    await fetch(`/api/admin/notes/${id}`, { method: "DELETE" });
    load();
  }
  const linkify = (t: string) =>
    t.split(/(https?:\/\/[^\s]+)/g).map((p, i) =>
      /^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline break-all">{p}</a> : <span key={i}>{p}</span>
    );

  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Notes</h2>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
        {notes.map((nt) => (
          <div key={nt.id} className="group flex items-start gap-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800/60 last:border-0">
            <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-snug">{linkify(nt.body)}</span>
            <button onClick={() => del(nt.id)} className="text-xs text-neutral-300 dark:text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition" aria-label="Delete note">×</button>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-2">
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Add a note…"
            className="flex-1 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
          <button onClick={add} disabled={busy || !val.trim()} className="text-xs px-2 py-1 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 disabled:opacity-40">Add</button>
        </div>
      </div>
    </section>
  );
}

type Attachment = { id: string; filename: string; mimetype: string | null; size_bytes: number | null; url: string | null };

function HillAttachments({ hillId }: { hillId: string }) {
  const [items, setItems] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/hills/${hillId}/attachments`);
      if (res.ok) setItems((await res.json()).attachments ?? []);
    } catch {
      /* ignore */
    }
  }, [hillId]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/hills/${hillId}/attachments`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/hills/${hillId}/attachments/${id}`, { method: "DELETE" });
    load();
  }

  const fmtSize = (b: number | null) => (b == null ? "" : b < 1024 * 1024 ? `${Math.round(b / 1024)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Attachments</h2>
        <label className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer transition">
          {busy ? "Uploading…" : "+ file"}
          <input type="file" accept="image/*,application/pdf" onChange={upload} disabled={busy} className="hidden" />
        </label>
      </div>
      {err && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{err}</p>}
      {items.length === 0 ? (
        <p className="text-xs text-neutral-400 dark:text-neutral-600">No files yet. Images and PDFs, up to 10MB.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((a) => (
            <div key={a.id} className="group flex items-center gap-2 py-1.5 px-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <span className="text-sm">{a.mimetype?.startsWith("image/") ? "🖼️" : a.mimetype === "application/pdf" ? "📄" : "🔗"}</span>
              {a.url ? (
                <a href={a.url} target="_blank" rel="noreferrer" className="flex-1 text-sm text-sky-600 dark:text-sky-400 hover:underline truncate">{a.filename}</a>
              ) : (
                <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate">{a.filename}</span>
              )}
              <span className="text-[11px] text-neutral-400 tabular-nums">{fmtSize(a.size_bytes)}</span>
              <button onClick={() => remove(a.id)} className="text-xs text-neutral-300 dark:text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition" aria-label="Delete file">×</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// Client billing panel (Path A): scope total, invoices (create / send to Stripe /
// void / delete), and the generated agreement. Replaces the legacy sprint/
// refinement pipeline bridge — the hill itself is the engagement.
function HillBilling({
  hillId,
  invoices,
  billing,
  onChange,
}: {
  hillId: string;
  invoices: Invoice[];
  billing: Billing;
  onChange: () => void | Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [agreement, setAgreement] = useState<{ markdown: string | null; pdfUrl: string | null; generatedAt: string | null }>({ markdown: null, pdfUrl: null, generatedAt: null });

  const loadAgreement = useCallback(async () => {
    const r = await fetch(`/api/admin/hills/${hillId}/agreement`).then((x) => x.json()).catch(() => ({}));
    setAgreement({ markdown: r.agreement ?? null, pdfUrl: r.pdfUrl ?? null, generatedAt: r.generatedAt ?? null });
  }, [hillId]);
  useEffect(() => { loadAgreement(); }, [loadAgreement]);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try { await fn(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  };

  const addInvoice = () =>
    act(async () => {
      if (!label.trim()) throw new Error("Label required");
      await api(`/api/admin/hills/${hillId}/invoices`, "POST", { label: label.trim(), amount: amount === "" ? null : Number(amount) });
      setLabel(""); setAmount("");
      await onChange();
    });
  const sendInvoice = (id: string) =>
    act(async () => { await api(`/api/admin/hills/${hillId}/invoices/${id}/stripe`, "POST", { action: "send" }); await onChange(); });
  const voidInvoice = (id: string) =>
    act(async () => { await api(`/api/admin/hills/${hillId}/invoices/${id}/stripe`, "POST", { action: "void" }); await onChange(); });
  const deleteInvoice = (id: string) =>
    act(async () => { await api(`/api/admin/hills/${hillId}/invoices/${id}`, "DELETE"); await onChange(); });
  const generateAgreement = () =>
    act(async () => { await api(`/api/admin/hills/${hillId}/agreement`, "POST"); await loadAgreement(); });

  return (
    <section className="mb-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Billing</h2>
        <div className="flex gap-3 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
          <span title="Scope total">scope {money(billing.scopeTotal)}</span>
          <span title="Invoiced">inv {money(billing.amountInvoiced)}</span>
          <span className="text-emerald-600 dark:text-emerald-400" title="Paid">paid {money(billing.amountPaid)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center gap-2 text-sm py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
            <span className="flex-1 truncate text-neutral-800 dark:text-neutral-200">{inv.label}</span>
            <span className="tabular-nums text-neutral-600 dark:text-neutral-300">{money(inv.amount)}</span>
            <span className={`text-[11px] font-mono w-20 text-right ${INVOICE_STATUS_STYLE[inv.invoice_status] ?? "text-neutral-400"}`}>{inv.invoice_status}</span>
            {inv.invoice_url && (
              <a href={inv.invoice_url} target="_blank" rel="noreferrer" className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline">link ↗</a>
            )}
            {inv.invoice_status === "not_sent" && (
              <button onClick={() => sendInvoice(inv.id)} disabled={busy} className="text-[11px] px-1.5 py-0.5 rounded bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40">Send</button>
            )}
            {inv.stripe_invoice_id && inv.invoice_status !== "voided" && inv.invoice_status !== "paid" && (
              <button onClick={() => voidInvoice(inv.id)} disabled={busy} className="text-[11px] px-1.5 py-0.5 rounded text-neutral-400 hover:text-red-500">Void</button>
            )}
            {!inv.stripe_invoice_id && (
              <button onClick={() => deleteInvoice(inv.id)} disabled={busy} className="text-[11px] text-neutral-300 hover:text-red-500">✕</button>
            )}
          </div>
        ))}
        {invoices.length === 0 && <p className="text-xs text-neutral-400">No invoices yet.</p>}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Invoice label (e.g. Deposit)" className="flex-1 text-sm px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="$" inputMode="decimal" className="w-24 text-sm px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-transparent" />
        <button onClick={addInvoice} disabled={busy} className="text-xs px-2.5 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500/50 disabled:opacity-40">Add</button>
      </div>
      {err && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{err}</p>}

      {/* agreement */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Agreement</span>
          <div className="flex items-center gap-2">
            {agreement.markdown && (
              <a href={`/api/admin/hills/${hillId}/agreement`} className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline" onClick={(e) => { e.preventDefault(); const w = window.open("", "_blank"); if (w) { w.document.write(`<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;padding:2rem;max-width:52rem;margin:auto">${(agreement.markdown ?? "").replace(/</g, "&lt;")}</pre>`); w.document.title = "Agreement"; } }}>View</a>
            )}
            {agreement.pdfUrl && <a href={agreement.pdfUrl} target="_blank" rel="noreferrer" className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline">PDF ↗</a>}
            <button onClick={generateAgreement} disabled={busy} className="text-[11px] px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 hover:border-emerald-500/50 disabled:opacity-40">{agreement.markdown ? "Regenerate" : "Generate"}</button>
          </div>
        </div>
        {agreement.generatedAt && <p className="text-[11px] text-neutral-400 mt-1">Generated {new Date(agreement.generatedAt).toLocaleString()}</p>}
      </div>
    </section>
  );
}

export default function HillDetailClient({ hillId }: { hillId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const d = await api(`/api/admin/hills/${hillId}`, "GET");
      setData(d);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [hillId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const patchHill = async (patch: Record<string, unknown>) => {
    await api(`/api/admin/hills/${hillId}`, "PATCH", patch);
    reload();
  };
  const addItem = async (kind: string, name: string, extra?: Record<string, unknown>) => {
    await api(`/api/admin/hills/${hillId}/items`, "POST", { kind, name, ...extra });
    reload();
  };
  const toggleTask = async (t: Task) => {
    await api(`/api/admin/hills/${hillId}/tasks/${t.id}`, "PATCH", { completed: !t.completed });
    reload();
  };
  const progressTask = async (t: Task, delta: number) => {
    await api(`/api/admin/hills/${hillId}/tasks/${t.id}`, "PATCH", { progress: Math.max(0, Math.min(100, t.progress + delta)) });
    reload();
  };
  const toggleToday = async (t: Task) => {
    const has = t.focus.split(",").map((s) => s.trim()).includes("today");
    await api(`/api/admin/hills/${hillId}/tasks/${t.id}`, "PATCH", { focus: has ? "" : "today" });
    reload();
  };
  const editTask = async (t: Task, patch: { name?: string; note?: string | null }) => {
    await api(`/api/admin/hills/${hillId}/tasks/${t.id}`, "PATCH", patch);
    reload();
  };
  const deleteTask = async (t: Task) => {
    await api(`/api/admin/hills/${hillId}/tasks/${t.id}`, "DELETE");
    reload();
  };
  const reviewTask = async (t: Task, decision: "accepted" | "dismissed") => {
    await api(`/api/admin/hills/${hillId}/tasks/${t.id}`, "PATCH", { [decision === "accepted" ? "accepted" : "dismissed"]: true });
    reload();
  };
  const reviewDeliverable = async (d: Deliverable, decision: "accepted" | "dismissed") => {
    await api(`/api/admin/hills/${hillId}/deliverables/${d.id}`, "PATCH", { [decision === "accepted" ? "accepted" : "dismissed"]: true });
    reload();
  };
  const editDeliverable = async (d: Deliverable, patch: Record<string, unknown>) => {
    await api(`/api/admin/hills/${hillId}/deliverables/${d.id}`, "PATCH", patch);
    reload();
  };
  // "Accept proposal" / "Activate" — the hill IS the engagement (Path A). Moves
  // it out of the proposal stage into active work; no legacy record is created.
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const acceptProposal = async () => {
    setActivating(true);
    setActivateError(null);
    try {
      await api(`/api/admin/hills/${hillId}/convert`, "POST");
      await reload();
    } catch (e) {
      setActivateError(e instanceof Error ? e.message : "Failed to activate");
    } finally {
      setActivating(false);
    }
  };
  const reorderTasks = async (orderedIds: string[]) => {
    await api(`/api/admin/hills/${hillId}/tasks/reorder`, "PATCH", { order: orderedIds });
    reload();
  };
  const taskHandlers: TaskHandlers = {
    onToggle: toggleTask,
    onProgress: progressTask,
    onDelete: deleteTask,
    onReview: reviewTask,
    onToday: toggleToday,
    onEdit: editTask,
  };
  const deleteHill = async () => {
    if (!window.confirm("Delete this hill? Its ideas, deliverables, and tasks are kept (moved to the loose backlog).")) return;
    await api(`/api/admin/hills/${hillId}`, "DELETE");
    router.push("/dashboard/hills");
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-8 text-sm text-neutral-500">Loading hill…</div>;
  if (error || !data)
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dashboard/hills" className="text-sm text-neutral-500 hover:underline">← Hills</Link>
        <p className="text-sm text-red-600 dark:text-red-400 mt-4">Couldn&apos;t load hill{error ? `: ${error}` : ""}.</p>
      </div>
    );

  const { hill, ideas, deliverables, invoices, tasks, billing } = data;
  const looseTasks = tasks.filter((t) => !t.idea_id && !t.deliverable_id && !t.parent_task_id && !t.dismissed_at);

  const isClientHill = hill.type === "sprint" || hill.type === "refinement_cycle";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/hills" className="text-sm text-neutral-500 dark:text-neutral-400 hover:underline">← Hills</Link>
        <button onClick={deleteHill} className="text-xs text-neutral-400 hover:text-red-500 transition">Delete hill</button>
      </div>

      {/* header */}
      <div className="mt-3 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-[11px] px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 capitalize">
            {hill.type.replace("_", " ")}
          </span>
          <select
            value={hill.phase ?? "scope"}
            onChange={(e) => patchHill({ phase: e.target.value })}
            className={`text-[11px] font-medium bg-transparent border-none cursor-pointer ${PHASE_TEXT[hill.phase ?? "scope"]}`}
          >
            {Object.entries(PHASE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {hill.status && <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">· {hill.status}</span>}
        </div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{hill.title || "Untitled hill"}</h1>
        {hill.summary && <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{hill.summary}</p>}

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2 max-w-xs flex-1">
            <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${hill.progress}%` }} />
            </div>
            <span className="text-[11px] tabular-nums text-neutral-500 w-8">{hill.progress}%</span>
          </div>
          <button
            onClick={() => patchHill({ completed: !hill.completed })}
            className={`text-xs px-2.5 py-1 rounded-md border transition ${
              hill.completed
                ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-emerald-500/50"
            }`}
          >
            {hill.completed ? "✓ Complete" : "Mark complete"}
          </button>
        </div>
      </div>

      {/* proposal review banner */}
      {hill.origin === "intake" && !hill.accepted_at && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Submitted proposal — needs review</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Scoped via the intake survey{hill.submitter_email ? ` by ${hill.submitter_email}` : ""}. Accept or dismiss the suggested items below, then accept the proposal.
            </p>
          </div>
          <div className="text-right">
            <button onClick={acceptProposal} disabled={activating} className="text-xs px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium transition disabled:opacity-40">
              {activating ? "Activating…" : "Accept & activate"}
            </button>
            {activateError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{activateError}</p>}
          </div>
        </div>
      )}

      <HillRepeat hillId={hillId} />

      {/* client-work billing: the hill itself is the engagement (Path A) */}
      {isClientHill && (
        <HillBilling hillId={hillId} invoices={invoices} billing={billing} onChange={reload} />
      )}

      {/* ideas */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">Ideas · uphill</h2>
        </div>
        <div className="flex flex-col gap-3">
          {ideas.map((idea) => {
            const it = tasks.filter((t) => t.idea_id === idea.id && !t.parent_task_id && !t.dismissed_at);
            return (
              <div key={idea.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{idea.title}</h3>
                  <span className="text-[10px] font-mono text-neutral-400">{idea.status}</span>
                </div>
                {it.length > 0 && (
                  <div className="mt-1">
                    <SortableTaskList tasks={it} allTasks={tasks} handlers={taskHandlers} onReorder={reorderTasks} />
                  </div>
                )}
                <div className="mt-2">
                  <AddInput placeholder="task" onAdd={(v) => addItem("task", v, { ideaId: idea.id })} />
                </div>
              </div>
            );
          })}
          <AddInput placeholder="idea" onAdd={(v) => addItem("idea", v)} />
        </div>
      </section>

      {/* deliverables */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Deliverables · downhill</h2>
        </div>
        <div className="flex flex-col gap-2">
          {deliverables.filter((d) => !d.dismissed_at).map((d) => {
            const dt = tasks.filter((t) => t.deliverable_id === d.id && !t.parent_task_id && !t.dismissed_at);
            const dNeedsReview = d.origin === "suggested" && !d.accepted_at;
            return (
              <div key={d.id} className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {dNeedsReview && <span className="text-amber-500 mr-1" aria-hidden>◇</span>}
                    {d.name || "Untitled deliverable"}
                    {d.origin !== "manual" && (
                      <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 align-middle">{d.origin}</span>
                    )}
                  </h3>
                  {dNeedsReview ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => reviewDeliverable(d, "accepted")} className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25">Accept</button>
                      <button onClick={() => reviewDeliverable(d, "dismissed")} className="text-[11px] px-2 py-0.5 rounded text-neutral-400 hover:text-red-500">Dismiss</button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-400">{d.added_by ? `${d.added_by} · ` : ""}v{d.current_version ?? "0"}</span>
                  )}
                </div>
                {d.notes && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-snug">{d.notes}</p>}
                {isClientHill && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-neutral-500">
                    <span className="text-neutral-400">$</span>
                    <input
                      defaultValue={d.price ?? ""}
                      onBlur={(e) => { if (e.target.value !== String(d.price ?? "")) editDeliverable(d, { price: e.target.value }); }}
                      placeholder="price"
                      inputMode="decimal"
                      className="w-24 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-transparent tabular-nums"
                    />
                    <span className="text-neutral-400">×</span>
                    <input
                      defaultValue={d.quantity ?? 1}
                      onBlur={(e) => { if (e.target.value !== String(d.quantity ?? 1)) editDeliverable(d, { quantity: e.target.value }); }}
                      inputMode="numeric"
                      className="w-12 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-transparent tabular-nums"
                    />
                    <span className="text-neutral-600 dark:text-neutral-300 tabular-nums">= {money((Number(d.price) || 0) * (Number(d.quantity) || 1))}</span>
                  </div>
                )}
                {d.delivery_url && (
                  <a href={d.delivery_url} target="_blank" rel="noreferrer" className="text-xs text-sky-600 dark:text-sky-400 hover:underline mt-1 inline-block">
                    Delivered ↗
                  </a>
                )}
                {dt.length > 0 && (
                  <div className="mt-1">
                    <SortableTaskList tasks={dt} allTasks={tasks} handlers={taskHandlers} onReorder={reorderTasks} />
                  </div>
                )}
                <div className="mt-2">
                  <AddInput placeholder="task" onAdd={(v) => addItem("task", v, { deliverableId: d.id })} />
                </div>
              </div>
            );
          })}
          <AddInput placeholder="deliverable" onAdd={(v) => addItem("deliverable", v)} />
        </div>
      </section>

      {/* loose tasks */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Unsorted tasks</h2>
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
          <SortableTaskList tasks={looseTasks} allTasks={tasks} handlers={taskHandlers} onReorder={reorderTasks} />
          <div className="mt-2">
            <AddInput placeholder="task" onAdd={(v) => addItem("task", v)} />
          </div>
        </div>
      </section>

      <HillNotes hillId={hillId} />
      <HillAttachments hillId={hillId} />
    </div>
  );
}
