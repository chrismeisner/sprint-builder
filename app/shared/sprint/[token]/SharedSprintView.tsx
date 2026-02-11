"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { SPRINT_WEEKS } from "@/lib/sprintProcess";
import SprintComments from "./SprintComments";
import SprintChangelog from "./SprintChangelog";

type WeekNotes = {
  kickoff: string | null;
  midweek: string | null;
  endOfWeek: string | null;
};

type SprintData = {
  title: string;
  projectName: string | null;
  projectId: string | null;
  startDate: string | null;
  dueDate: string | null;
  weeks: number;
  totalPoints: number;
  totalHours: number;
  totalPrice: number;
  approach: string | null;
  weekNotes: Record<string, WeekNotes>; // "week1" -> notes, "week2" -> notes, etc.
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
  currentUserEmail?: string | null;
  currentUserName?: string | null;
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
  currentUserEmail = null,
  currentUserName = null,
}: Props) {
  const h2Class = `${getTypographyClassName("h2")} text-text-primary`;
  const h3Class = `${getTypographyClassName("h3")} text-text-primary`;
  const cardTitleClass = `${getTypographyClassName("subtitle-md")} text-text-primary`;
  const overlineClass = `${getTypographyClassName("mono-sm")} text-text-secondary`;
  const bodyClass = `${getTypographyClassName("body-md")} text-text-primary`;
  const bodySmClass = `${getTypographyClassName("body-sm")} text-text-primary`;
  const labelClass = `${getTypographyClassName("body-sm")} text-text-secondary`;
  const metricLabelClass = `${getTypographyClassName("mono-sm")} text-text-secondary`;
  const metricValueClass = `${getTypographyClassName("h3")} text-text-primary`;

  const showSprintOutline = sprint.weeks >= 1;

  /* ── Week-notes inline edit state ──────────────────────── */
  const defaultWeekNotes = (wn: WeekNotes | null): WeekNotes => ({
    kickoff: wn?.kickoff ?? "",
    midweek: wn?.midweek ?? "",
    endOfWeek: wn?.endOfWeek ?? "",
  });

  // Dynamic week notes state for all N weeks
  const [allWeekNotesState, setAllWeekNotesState] = useState<Record<string, WeekNotes>>(() => {
    const initial: Record<string, WeekNotes> = {};
    for (let i = 1; i <= sprint.weeks; i++) {
      const key = `week${i}`;
      initial[key] = defaultWeekNotes(sprint.weekNotes[key] || null);
    }
    return initial;
  });

  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [editKickoff, setEditKickoff] = useState("");
  const [editMidweek, setEditMidweek] = useState("");
  const [editEndOfWeek, setEditEndOfWeek] = useState("");
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openEditor = useCallback((week: number) => {
    const key = `week${week}`;
    const notes = allWeekNotesState[key] || { kickoff: "", midweek: "", endOfWeek: "" };
    setEditingWeek(week);
    setEditKickoff(notes.kickoff ?? "");
    setEditMidweek(notes.midweek ?? "");
    setEditEndOfWeek(notes.endOfWeek ?? "");
  }, [allWeekNotesState]);

  const closeEditor = useCallback(() => {
    setEditingWeek(null);
    setEditKickoff("");
    setEditMidweek("");
    setEditEndOfWeek("");
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
      const weekKey = `week${editingWeek}`;
      const res = await fetch(`/api/sprint-drafts/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_notes: {
            weekKey,
            kickoff: editKickoff,
            midweek: editMidweek,
            endOfWeek: editEndOfWeek,
          },
        }),
      });
      if (res.ok) {
        const updated: WeekNotes = {
          kickoff: editKickoff,
          midweek: editMidweek,
          endOfWeek: editEndOfWeek,
        };
        setAllWeekNotesState((prev) => ({ ...prev, [weekKey]: updated }));
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
        <div className="container max-w-4xl py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={`${overlineClass} mb-1.5`}>Sprint Proposal</p>
              <h1 className={h2Class}>{sprint.title}</h1>
              {sprint.projectName && (
                <div className="mt-2">
                  {sprint.projectId ? (
                    <Link 
                      href={`/projects/${sprint.projectId}`}
                      className={`${labelClass} hover:text-blue-600 dark:hover:text-blue-400 hover:underline`}
                    >
                      ← {sprint.projectName}
                    </Link>
                  ) : (
                    <p className={labelClass}>{sprint.projectName}</p>
                  )}
                </div>
              )}
            </div>
            {isAdmin && sprintId && (
              <Link
                href={`/dashboard/sprint-builder?sprintId=${sprintId}`}
                className="shrink-0 inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-150"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                Edit in Builder
              </Link>
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
            <h2 className={`${cardTitleClass} mb-2`}>Timeline</h2>
            <div className={bodyClass}>
              {sprint.startDate && sprint.dueDate ? (
                <div className="flex items-center gap-3">
                  <span>{formatFriendly(sprint.startDate)}</span>
                  <span className="text-text-secondary">→</span>
                  <span>{formatFriendly(sprint.dueDate)}</span>
                </div>
              ) : sprint.startDate ? (
                <div>
                  <span className={metricLabelClass}>Start: </span>
                  <span>{formatFriendly(sprint.startDate)}</span>
                </div>
              ) : (
                <div>
                  <span className={metricLabelClass}>End: </span>
                  <span>{formatFriendly(sprint.dueDate)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approach */}
        {sprint.approach && (
          <div className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-6">
            <h2 className={`${cardTitleClass} mb-2`}>Approach</h2>
            <p className={`${bodyClass} whitespace-pre-line`}>{sprint.approach}</p>
          </div>
        )}

        {/* Deliverables */}
        <div className="space-y-4">
          <h2 className={h3Class}>
            Deliverables ({deliverables.length})
          </h2>

          {Object.entries(byCategory).map(([category, items]) => (
            <div
              key={category}
              className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden"
            >
              <div className="px-6 py-3 border-b border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-neutral-800">
                <h3 className={overlineClass}>{category}</h3>
              </div>
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {items.map((d, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className={`${bodyClass} font-medium`}>{d.name}</div>
                        {d.description && (
                          <p className={`${labelClass} mt-1`}>{d.description}</p>
                        )}
                        {d.scope && (
                          <div className="mt-2">
                            <div className={`${overlineClass} mb-0.5`}>Scope</div>
                            <p className={`${labelClass} whitespace-pre-line`}>{d.scope}</p>
                          </div>
                        )}
                        {d.note && (
                          <div className="mt-2">
                            <div className={`${overlineClass} mb-0.5`}>Note</div>
                            <p className={`${labelClass} whitespace-pre-line`}>{d.note}</p>
                          </div>
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
              <div className={`${labelClass} tabular-nums`}>
                {deliverables.length} deliverable{deliverables.length !== 1 ? "s" : ""} &middot;{" "}
                {formatNum(sprint.totalHours)} hours &middot;{" "}
                {sprint.weeks} week{sprint.weeks !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Sprint Outline — dynamic for N weeks */}
        {showSprintOutline && (
          <div className="space-y-4">
            <h2 className={h3Class}>Sprint Outline</h2>

            <div className={`grid gap-4 ${sprint.weeks >= 2 ? "sm:grid-cols-2" : ""}`}>
              {Array.from({ length: sprint.weeks }, (_, idx) => {
                const weekNum = idx + 1;
                const weekKey = `week${weekNum}`;
                const notes = allWeekNotesState[weekKey] || { kickoff: "", midweek: "", endOfWeek: "" };
                const weekHasNotes = !!(notes.kickoff || notes.midweek || notes.endOfWeek);

                // Use SPRINT_WEEKS data for weeks 1-2 if available for richer context
                const sprintWeekData = SPRINT_WEEKS[idx] || null;

                const noteEntries: { label: string; icon: string; value: string | null }[] = [
                  { label: "Kickoff", icon: "🚀", value: notes.kickoff },
                  { label: "Mid-Week", icon: "🔄", value: notes.midweek },
                  { label: "End of Week", icon: "🏁", value: notes.endOfWeek },
                ];

                return (
                  <div
                    key={weekKey}
                    className="rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden"
                  >
                    {/* Week header */}
                    <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-neutral-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {sprintWeekData && (
                            <span className="text-xl" aria-hidden="true">
                              {sprintWeekData.icon}
                            </span>
                          )}
                          <h3 className={cardTitleClass}>
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
                      {sprintWeekData && (
                        <p className={`${labelClass} mt-1`}>{sprintWeekData.summary}</p>
                      )}
                    </div>

                    {/* Three-phase notes area */}
                    <div className="divide-y divide-black/5 dark:divide-white/5">
                      {weekHasNotes ? (
                        noteEntries.map((entry) => (
                          <div key={entry.label} className="px-6 py-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-sm" aria-hidden="true">{entry.icon}</span>
                              <span className={overlineClass}>{entry.label}</span>
                            </div>
                            {entry.value ? (
                              <p className={`${bodySmClass} whitespace-pre-line`}>
                                {entry.value}
                              </p>
                            ) : (
                              <p className={`${labelClass} italic text-xs`}>
                                Not set
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-4">
                          <p className={`${labelClass} italic`}>
                            No notes yet for this week.
                          </p>
                        </div>
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
                <h2 className={cardTitleClass}>
                  Edit Week {editingWeek} Notes
                </h2>
                {editingWeek && SPRINT_WEEKS[editingWeek - 1] && (
                  <p className={labelClass}>
                    {SPRINT_WEEKS[editingWeek - 1].summary}
                  </p>
                )}

                {/* Kickoff */}
                <div className="space-y-1">
                  <label className={`${overlineClass} flex items-center gap-1.5`}>
                    <span aria-hidden="true">🚀</span> Kickoff
                  </label>
                  <textarea
                    value={editKickoff}
                    onChange={(e) => setEditKickoff(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
                    placeholder="How does this week start? Goals, alignment, key decisions…"
                  />
                </div>

                {/* Mid-Week */}
                <div className="space-y-1">
                  <label className={`${overlineClass} flex items-center gap-1.5`}>
                    <span aria-hidden="true">🔄</span> Mid-Week
                  </label>
                  <textarea
                    value={editMidweek}
                    onChange={(e) => setEditMidweek(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
                    placeholder="What to expect midway — check-in, review, pivot point…"
                  />
                </div>

                {/* End of Week */}
                <div className="space-y-1">
                  <label className={`${overlineClass} flex items-center gap-1.5`}>
                    <span aria-hidden="true">🏁</span> End of Week
                  </label>
                  <textarea
                    value={editEndOfWeek}
                    onChange={(e) => setEditEndOfWeek(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
                    placeholder="How this week wraps up — deliverable, handoff, demo…"
                  />
                </div>

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

        {/* Comments */}
        {sprintId && (
          <div className="space-y-4">
            <h2 className={h3Class}>Discussion</h2>
            <SprintComments
              sprintId={sprintId}
              currentUserEmail={currentUserEmail}
              currentUserName={currentUserName}
            />
          </div>
        )}

        {/* Change Log (admin only) */}
        {isAdmin && sprintId && (
          <div className="space-y-4">
            <h2 className={h3Class}>Change Log</h2>
            <SprintChangelog sprintId={sprintId} />
          </div>
        )}

        {/* Draft notice */}
        <div className="text-center py-8 border-t border-black/5 dark:border-white/5">
          <p className={labelClass}>
            This is a draft proposal. Details may change based on further discussion.
          </p>
        </div>
      </div>
    </div>
  );
}
