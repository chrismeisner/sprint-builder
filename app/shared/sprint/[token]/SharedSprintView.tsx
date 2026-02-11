"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { SPRINT_WEEKS } from "@/lib/sprintProcess";

type SprintData = {
  title: string;
  projectName: string | null;
  startDate: string | null;
  dueDate: string | null;
  weeks: number;
  totalPoints: number;
  totalHours: number;
  totalPrice: number;
  approach: string | null;
  week1Overview: string | null;
  week2Overview: string | null;
};

type DeliverableItem = {
  name: string;
  description: string | null;
  category: string | null;
  scope: string | null;
  basePoints: number;
  adjustedPoints: number;
  multiplier: number;
  hours: number;
  note: string | null;
  quantity: number;
};

type Props = {
  sprint: SprintData;
  deliverables: DeliverableItem[];
  sprintId?: string | null;
  isAdmin?: boolean;
};

function formatFriendly(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const dt = new Date(`${dateStr}T00:00:00`);
  if (isNaN(dt.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

function formatNum(value: number): string {
  return Number(value)
    .toFixed(1)
    .replace(/\.0$/, "");
}

export default function SharedSprintView({
  sprint,
  deliverables,
  sprintId = null,
  isAdmin = false,
}: Props) {
  const h1Class = `${getTypographyClassName("h1")} text-text-primary`;
  const h2Class = `${getTypographyClassName("h2")} text-text-primary`;
  const h3Class = `${getTypographyClassName("h3")} text-text-primary`;
  const subtitleClass = `${getTypographyClassName("subtitle-sm")} text-text-secondary`;
  const bodyClass = `${getTypographyClassName("body-md")} text-text-primary`;
  const bodySmClass = `${getTypographyClassName("body-sm")} text-text-primary`;
  const labelClass = `${getTypographyClassName("body-sm")} text-text-secondary`;
  const metricLabelClass = `${getTypographyClassName("subtitle-sm")} text-text-secondary`;
  const metricValueClass = `${getTypographyClassName("h3")} text-text-primary`;

  const isTwoWeekSprint = sprint.weeks === 2;

  /* ── Week-notes inline edit state ──────────────────────── */
  const [week1Notes, setWeek1Notes] = useState(sprint.week1Overview ?? "");
  const [week2Notes, setWeek2Notes] = useState(sprint.week2Overview ?? "");
  const [editingWeek, setEditingWeek] = useState<1 | 2 | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openEditor = useCallback((week: 1 | 2) => {
    setEditingWeek(week);
    setEditValue(week === 1 ? week1Notes : week2Notes);
  }, [week1Notes, week2Notes]);

  const closeEditor = useCallback(() => {
    setEditingWeek(null);
    setEditValue("");
  }, []);

  // Sync dialog open/close with state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (editingWeek) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [editingWeek]);

  // Handle ESC / backdrop
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      closeEditor();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [closeEditor]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inside) closeEditor();
  };

  const handleSave = async () => {
    if (!sprintId || !editingWeek) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sprint-drafts/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_notes: {
            weekKey: editingWeek === 1 ? "week1" : "week2",
            overview: editValue,
          },
        }),
      });
      if (res.ok) {
        if (editingWeek === 1) setWeek1Notes(editValue);
        else setWeek2Notes(editValue);
        closeEditor();
      }
    } finally {
      setSaving(false);
    }
  };

  // Group deliverables by category
  const byCategory: Record<string, DeliverableItem[]> = {};
  deliverables.forEach((d) => {
    const cat = d.category || "Deliverables";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(d);
  });

  const totalDays = sprint.weeks * 5;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-black/10 dark:border-white/10">
        <div className="container max-w-4xl py-12">
          <div className="space-y-2">
            <p className={`${subtitleClass} uppercase tracking-wider`}>Sprint Proposal</p>
            <h1 className={h1Class}>{sprint.title}</h1>
            {sprint.projectName && (
              <p className={`${bodyClass} text-text-secondary`}>{sprint.projectName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-4xl py-8 space-y-8">
        {/* Overview cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6">
            <div className={`${metricLabelClass} mb-1`}>Total Investment</div>
            <div className={`${h2Class} tabular-nums`}>${sprint.totalPrice.toLocaleString()}</div>
          </div>
          <div className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6">
            <div className={`${metricLabelClass} mb-1`}>Duration</div>
            <div className={`${metricValueClass} tabular-nums`}>
              {sprint.weeks} {sprint.weeks === 1 ? "week" : "weeks"}
            </div>
            <div className={`${labelClass} tabular-nums`}>{totalDays} working days</div>
          </div>
          <div className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6">
            <div className={`${metricLabelClass} mb-1`}>Estimated Hours</div>
            <div className={`${metricValueClass} tabular-nums`}>{formatNum(sprint.totalHours)}</div>
            <div className={`${labelClass} tabular-nums`}>~{formatNum(sprint.totalHours / Math.max(totalDays, 1))} hrs/day</div>
          </div>
        </div>

        {/* Timeline */}
        {(sprint.startDate || sprint.dueDate) && (
          <div className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6">
            <h2 className={`${h3Class} mb-3`}>Timeline</h2>
            <div className="flex flex-wrap gap-6">
              {sprint.startDate && (
                <div>
                  <div className={metricLabelClass}>Start</div>
                  <div className={bodyClass}>{formatFriendly(sprint.startDate)}</div>
                </div>
              )}
              {sprint.dueDate && (
                <div>
                  <div className={metricLabelClass}>End</div>
                  <div className={bodyClass}>{formatFriendly(sprint.dueDate)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approach */}
        {sprint.approach && (
          <div className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6">
            <h2 className={`${h3Class} mb-3`}>Approach</h2>
            <p className={`${bodyClass} whitespace-pre-line`}>{sprint.approach}</p>
          </div>
        )}

        {/* Deliverables */}
        <div className="space-y-4">
          <h2 className={h2Class}>
            Deliverables ({deliverables.length})
          </h2>

          {Object.entries(byCategory).map(([category, items]) => (
            <div
              key={category}
              className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden"
            >
              <div className="px-6 py-3 border-b border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-neutral-800">
                <h3 className={`${subtitleClass} uppercase tracking-wider`}>{category}</h3>
              </div>
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {items.map((d, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className={`${bodyClass} font-semibold`}>{d.name}</div>
                        {d.description && (
                          <p className={`${labelClass} mt-1`}>{d.description}</p>
                        )}
                        {d.scope && (
                          <p className={`${labelClass} mt-1 italic whitespace-pre-line`}>Scope: {d.scope}</p>
                        )}
                        {d.note && (
                          <p className={`${bodySmClass} mt-1.5 text-text-secondary italic`}>
                            Note: {d.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`${bodySmClass} font-semibold tabular-nums`}>
                          {formatNum(d.hours)} hrs
                        </div>
                        {d.multiplier !== 1 && (
                          <div className={`${labelClass} tabular-nums`}>{d.multiplier}x complexity</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer summary */}
        <div className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className={metricLabelClass}>Total Investment</div>
              <div className={`${h2Class} tabular-nums`}>${sprint.totalPrice.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className={`${metricLabelClass} tabular-nums`}>
                {deliverables.length} deliverable{deliverables.length !== 1 ? "s" : ""} &middot;{" "}
                {formatNum(sprint.totalHours)} hours &middot;{" "}
                {sprint.weeks} week{sprint.weeks !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Sprint Outline (only for 2-week sprints) */}
        {isTwoWeekSprint && (
          <div className="space-y-4">
            <h2 className={h2Class}>Sprint Outline</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {SPRINT_WEEKS.map((week, idx) => {
                const weekNum = (idx + 1) as 1 | 2;
                const customNotes = weekNum === 1 ? week1Notes : week2Notes;

                return (
                  <div
                    key={week.id}
                    className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden"
                  >
                    {/* Week header */}
                    <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-neutral-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl" aria-hidden="true">
                            {week.icon}
                          </span>
                          <h3 className={`${bodyClass} font-semibold`}>
                            Week {weekNum}
                          </h3>
                        </div>
                        {isAdmin && sprintId && (
                          <button
                            type="button"
                            onClick={() => openEditor(weekNum)}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <p className={`${labelClass} mt-1`}>{week.summary}</p>
                    </div>

                    {/* Custom notes area */}
                    <div className="px-6 py-4">
                      {customNotes ? (
                        <p className={`${bodyClass} whitespace-pre-line`}>
                          {customNotes}
                        </p>
                      ) : (
                        <p className={`${labelClass} italic`}>
                          No notes yet for this week.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week-notes edit modal (admin only) */}
        {isAdmin && (
          <dialog
            ref={dialogRef}
            onClick={handleBackdropClick}
            className="backdrop:bg-black/60 backdrop:backdrop-blur-sm bg-white dark:bg-neutral-900 rounded-md shadow-xl border border-black/10 dark:border-white/10 p-0 max-w-lg w-full mx-4 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ margin: 0 }}
          >
            {editingWeek && (
              <div className="p-6 space-y-4">
                <h2 className={`${h3Class}`}>
                  Edit Week {editingWeek} Notes
                </h2>
                <p className={labelClass}>
                  {editingWeek === 1
                    ? SPRINT_WEEKS[0].summary
                    : SPRINT_WEEKS[1].summary}
                </p>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
                  placeholder={`Describe the plan for Week ${editingWeek}…`}
                />
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className={`${getTypographyClassName("button-sm")} h-10 px-4 rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={`${getTypographyClassName("button-sm")} h-10 px-4 rounded-md bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50`}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            )}
          </dialog>
        )}

        {/* Draft notice */}
        <div className="text-center py-6">
          <p className={`${labelClass}`}>
            This is a draft proposal. Details may change based on further discussion.
          </p>
        </div>
      </div>
    </div>
  );
}
