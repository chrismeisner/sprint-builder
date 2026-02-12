"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
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
  weekNotes: Record<string, WeekNotes>;
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

type BudgetMilestone = {
  id: number;
  summary: string;
  multiplier: number;
  date: string;
};

type BudgetInputs = {
  isDeferred?: boolean;
  totalProjectValue?: number;
  upfrontPayment?: number;
  upfrontPaymentTiming?: string;
  completionPaymentTiming?: string;
  equitySplit?: number;
  milestones?: BudgetMilestone[];
  milestoneMissOutcome?: string;
};

type BudgetOutputs = {
  upfrontAmount?: number;
  equityAmount?: number;
  deferredAmount?: number;
  milestoneBonusAmount?: number;
  remainingOnCompletion?: number;
  totalProjectValue?: number;
};

type BudgetPlan = {
  id: string;
  label: string | null;
  inputs: BudgetInputs;
  outputs: BudgetOutputs;
  created_at: string | Date;
};

type Props = {
  sprint: SprintData;
  deliverables: DeliverableItem[];
  sprintId?: string | null;
  isAdmin?: boolean;
  currentUserEmail?: string | null;
  currentUserName?: string | null;
  budgetPlan?: BudgetPlan | null;
  budgetStatus?: string;
  totalFixedPrice?: number;
};

/* ── Helpers ──────────────────────────────────────────── */

function formatFriendly(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const dt = new Date(`${dateStr}T00:00:00`);
  if (isNaN(dt.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
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

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/* ── Component ────────────────────────────────────────── */

export default function SharedSprintView({
  sprint,
  deliverables,
  sprintId = null,
  isAdmin = false,
  currentUserEmail = null,
  currentUserName = null,
  budgetPlan = null,
  budgetStatus = "draft",
  totalFixedPrice = 0,
}: Props) {
  const showSprintOutline = sprint.weeks >= 1;

  /* ── Week-notes inline edit state ──────────────────── */
  const defaultWeekNotes = (wn: WeekNotes | null): WeekNotes => ({
    kickoff: wn?.kickoff ?? "",
    midweek: wn?.midweek ?? "",
    endOfWeek: wn?.endOfWeek ?? "",
  });

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
  const [syncing, setSyncing] = useState(false);
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (editingWeek) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [editingWeek]);

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

  const handleSyncDeliverables = async () => {
    if (!sprintId) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/sprint-drafts/${sprintId}/sync-deliverables`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        // Reload the page to show updated deliverables
        window.location.reload();
      } else {
        alert(data.error || "Failed to sync deliverables");
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Failed to sync deliverables");
    } finally {
      setSyncing(false);
    }
  };

  /* ── Derived data ──────────────────────────────────── */

  const byCategory: Record<string, DeliverableItem[]> = {};
  deliverables.forEach((d) => {
    const cat = d.category || "Deliverables";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(d);
  });

  const totalDays = sprint.weeks * 5;

  /* ── Render ────────────────────────────────────────── */

  return (
    <div className="min-h-dvh bg-neutral-50 dark:bg-neutral-900">

      {/* ── Header ──────────────────────────────────── */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 mb-2">
                Sprint Proposal
              </p>
              <h1 className="text-2xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
                {sprint.title}
              </h1>
              {sprint.projectName && (
                <div className="mt-2">
                  {sprint.projectId ? (
                    <Link
                      href={`/projects/${sprint.projectId}`}
                      className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150"
                    >
                      {sprint.projectName}
                    </Link>
                  ) : (
                    <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                      {sprint.projectName}
                    </p>
                  )}
                </div>
              )}
            </div>
            {isAdmin && sprintId && (
              <Link
                href={`/dashboard/sprint-builder?sprintId=${sprintId}`}
                className="shrink-0 inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-md bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-150"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                Edit in Builder
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* ── Overview metrics ──────────────────────── */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
            <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 mb-2">
              Total Investment
            </p>
            <p className="text-2xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
              ${sprint.totalPrice.toLocaleString()}
            </p>
          </div>
          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
            <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 mb-2">
              Duration
            </p>
            <p className="text-xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
              {sprint.weeks} {sprint.weeks === 1 ? "week" : "weeks"}
            </p>
            <p className="text-sm font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500 mt-1">
              {totalDays} working days
            </p>
          </div>
          <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
            <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 mb-2">
              Estimated Hours
            </p>
            <p className="text-xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
              {formatNum(sprint.totalHours)}
            </p>
            <p className="text-sm font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500 mt-1">
              ~{formatNum(sprint.totalHours / Math.max(totalDays, 1))} hrs/day
            </p>
          </div>
        </section>

        {/* ── Timeline ──────────────────────────────── */}
        {(sprint.startDate || sprint.dueDate) && (
          <section className="grid gap-4 sm:grid-cols-2">
            {sprint.startDate && (
              <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
                <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 mb-2">
                  Start Date
                </p>
                <p className="text-xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatFriendly(sprint.startDate)}
                </p>
              </div>
            )}
            {sprint.dueDate && (
              <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
                <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 mb-2">
                  Due Date
                </p>
                <p className="text-xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
                  {formatFriendly(sprint.dueDate)}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── Approach ──────────────────────────────── */}
        {sprint.approach && (
          <section className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
            <h2 className="text-lg font-medium leading-snug text-neutral-900 dark:text-neutral-100 mb-2">
              Approach
            </h2>
            <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
              {sprint.approach}
            </p>
          </section>
        )}

        {/* ── Deliverables ──────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
              Deliverables
              <span className="text-neutral-500 dark:text-neutral-500 font-normal ml-2">
                {deliverables.length}
              </span>
            </h2>
            {isAdmin && sprintId && (
              <button
                type="button"
                onClick={handleSyncDeliverables}
                disabled={syncing}
                className="inline-flex items-center gap-2 h-8 px-3 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150 disabled:opacity-50"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                {syncing ? "Syncing..." : "Sync"}
              </button>
            )}
          </div>

          {Object.entries(byCategory).map(([category, items]) => (
            <div
              key={category}
              className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden"
            >
              <div className="px-6 py-3 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                <h3 className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
                  {category}
                </h3>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                {items.map((d, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                          {d.name}
                        </p>
                        {d.description && (
                          <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500 mt-1">
                            {d.description}
                          </p>
                        )}
                        {d.scope && (
                          <div className="mt-3">
                            <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 mb-1">
                              Scope
                            </p>
                            <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
                              {d.scope}
                            </p>
                          </div>
                        )}
                        {d.note && (
                          <div className="mt-3">
                            <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 mb-1">
                              Note
                            </p>
                            <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
                              {d.note}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold leading-normal tabular-nums text-neutral-900 dark:text-neutral-100">
                          {formatNum(d.hours)} hrs
                        </p>
                        {d.multiplier !== 1 && (
                          <p className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500 mt-0.5">
                            {d.multiplier}x
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ── Budget ────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
              Budget
            </h2>
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                budgetStatus === "agreed"
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                  : "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
              }`}
            >
              {budgetStatus === "agreed" ? "Agreed" : "Draft"}
            </span>
          </div>

          {budgetPlan ? (
            <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">

              {/* Budget header */}
              <div className="px-6 py-6 border-b border-neutral-100 dark:border-neutral-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 mb-2">
                      Total Project Value
                    </p>
                    <p className="text-2xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
                      {formatCurrency(budgetPlan.outputs.totalProjectValue ?? sprint.totalPrice)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    budgetPlan.inputs.isDeferred !== false
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                      : "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400"
                  }`}>
                    {budgetPlan.inputs.isDeferred !== false ? "Deferred" : "Standard"}
                  </span>
                </div>
              </div>

              {/* Payment breakdown */}
              {(() => {
                const { inputs, outputs } = budgetPlan;
                const isDeferred = inputs.isDeferred !== false;
                const upfrontAmount = outputs.upfrontAmount ?? 0;
                const equityAmount = outputs.equityAmount ?? 0;
                const deferredAmount = outputs.deferredAmount ?? 0;
                const remainingOnCompletion = outputs.remainingOnCompletion ?? 0;
                const totalValue = outputs.totalProjectValue ?? (upfrontAmount + equityAmount + deferredAmount);
                const upfrontPercent = totalValue > 0 ? Math.round((upfrontAmount / totalValue) * 100) : 0;
                const completionPercent = totalValue > 0 ? Math.round((remainingOnCompletion / totalValue) * 100) : 0;
                const equityPercent = totalValue > 0 ? Math.round((equityAmount / totalValue) * 100) : 0;
                const deferredPercent = totalValue > 0 ? Math.round((deferredAmount / totalValue) * 100) : 0;
                const hasDeferred = isDeferred && deferredAmount > 0.01;
                const hasEquity = isDeferred && equityAmount > 0.01;
                const milestones = isDeferred ? (inputs.milestones ?? []) : [];
                const timingLabels: Record<string, string> = {
                  on_start: "Due upon signing",
                  net7: "Net 7 (due 7 days after kickoff)",
                  net14: "Net 14 (due 14 days after kickoff)",
                  net30: "Net 30 (due 30 days after kickoff)",
                };
                const completionTimingLabels: Record<string, string> = {
                  on_delivery: "Due upon final delivery",
                  net7: "Net 7 (due 7 days after delivery)",
                  net15: "Net 15 (due 15 days after delivery)",
                  net30: "Net 30 (due 30 days after delivery)",
                };
                const timing = inputs.upfrontPaymentTiming
                  ? timingLabels[inputs.upfrontPaymentTiming] ?? inputs.upfrontPaymentTiming
                  : null;
                const completionTiming = inputs.completionPaymentTiming
                  ? completionTimingLabels[inputs.completionPaymentTiming] ?? completionTimingLabels.on_delivery
                  : "Due upon final delivery";

                return (
                  <div className="px-6 py-6 space-y-6">
                    {/* Visual bar */}
                    {totalValue > 0 && (
                      <div className="h-3 rounded-full overflow-hidden flex bg-neutral-100 dark:bg-neutral-700">
                        {upfrontAmount > 0 && (
                          <div
                            className="bg-teal-500 dark:bg-teal-400 h-full"
                            style={{ width: `${upfrontPercent}%` }}
                          />
                        )}
                        {remainingOnCompletion > 0 && !isDeferred && (
                          <div
                            className="bg-blue-500 dark:bg-blue-400 h-full"
                            style={{ width: `${completionPercent}%` }}
                          />
                        )}
                        {hasEquity && (
                          <div
                            className="bg-purple-500 dark:bg-purple-400 h-full"
                            style={{ width: `${equityPercent}%` }}
                          />
                        )}
                        {hasDeferred && (
                          <div
                            className="bg-amber-500 dark:bg-amber-400 h-full"
                            style={{ width: `${deferredPercent}%` }}
                          />
                        )}
                      </div>
                    )}

                    {/* Line items */}
                    <div className="space-y-4">
                      {/* Kickoff / Upfront */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="size-3 rounded-full bg-teal-500 dark:bg-teal-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                              {isDeferred ? "Upfront" : "Kickoff"}
                            </p>
                            {timing && (
                              <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500 mt-0.5">
                                {timing}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-semibold leading-normal tabular-nums text-neutral-900 dark:text-neutral-100">
                          {formatCurrency(upfrontAmount)}
                          <span className="font-normal text-neutral-500 dark:text-neutral-500 ml-1">
                            {upfrontPercent}%
                          </span>
                        </p>
                      </div>

                      {/* On Completion (standard only) */}
                      {!isDeferred && remainingOnCompletion > 0.01 && (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="size-3 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0" />
                            <div>
                              <p className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                                On Completion
                              </p>
                              <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500 mt-0.5">
                                {completionTiming}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold leading-normal tabular-nums text-neutral-900 dark:text-neutral-100">
                            {formatCurrency(remainingOnCompletion)}
                            <span className="font-normal text-neutral-500 dark:text-neutral-500 ml-1">
                              {completionPercent}%
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Equity */}
                      {hasEquity && (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="size-3 rounded-full bg-purple-500 dark:bg-purple-400 shrink-0" />
                            <p className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                              Equity
                            </p>
                          </div>
                          <p className="text-sm font-semibold leading-normal tabular-nums text-neutral-900 dark:text-neutral-100">
                            {formatCurrency(equityAmount)}
                            <span className="font-normal text-neutral-500 dark:text-neutral-500 ml-1">
                              {equityPercent}%
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Deferred */}
                      {hasDeferred && (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="size-3 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
                            <div>
                              <p className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                                Deferred
                              </p>
                              <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500 mt-0.5">
                                Performance-based
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold leading-normal tabular-nums text-neutral-900 dark:text-neutral-100">
                            {formatCurrency(deferredAmount)}
                            <span className="font-normal text-neutral-500 dark:text-neutral-500 ml-1">
                              {deferredPercent}%
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Milestones */}
                    {hasDeferred && milestones.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                        <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
                          Performance Milestones
                        </p>
                        <div className="space-y-2">
                          {milestones.map((m, i) => (
                            <div key={m.id ?? i} className="flex items-center justify-between py-2 px-3 rounded-md bg-neutral-50 dark:bg-neutral-700">
                              <div>
                                <p className="text-sm font-normal leading-normal text-neutral-900 dark:text-neutral-100">
                                  {m.summary || "Milestone"}
                                </p>
                                {m.date && (
                                  <p className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500 mt-0.5">
                                    {new Date(`${m.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm font-semibold leading-normal tabular-nums text-neutral-900 dark:text-neutral-100">
                                {formatCurrency(deferredAmount * m.multiplier)}
                                <span className="font-normal text-neutral-500 dark:text-neutral-500 ml-1">
                                  {m.multiplier}x
                                </span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Admin footer */}
              {isAdmin && sprintId && (
                <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-end">
                  <Link
                    href={`/deferred-compensation?sprintId=${sprintId}&amountCents=${Math.round(totalFixedPrice * 100)}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 transition-colors duration-150"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                    Edit Budget
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  No budget configured yet.
                </p>
                {isAdmin && sprintId && (
                  <Link
                    href={`/deferred-compensation?sprintId=${sprintId}&amountCents=${Math.round(totalFixedPrice * 100)}`}
                    className="inline-flex items-center gap-2 h-8 px-3 text-sm font-medium rounded-md bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-150"
                  >
                    Add Budget
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Sprint Outline ────────────────────────── */}
        {showSprintOutline && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
              Sprint Outline
            </h2>

            <div className={`grid gap-4 ${sprint.weeks >= 2 ? "sm:grid-cols-2" : ""}`}>
              {Array.from({ length: sprint.weeks }, (_, idx) => {
                const weekNum = idx + 1;
                const weekKey = `week${weekNum}`;
                const notes = allWeekNotesState[weekKey] || { kickoff: "", midweek: "", endOfWeek: "" };
                const weekHasNotes = !!(notes.kickoff || notes.midweek || notes.endOfWeek);
                const sprintWeekData = SPRINT_WEEKS[idx] || null;

                const noteEntries: { label: string; icon: string; value: string | null }[] = [
                  { label: "Kickoff", icon: "🚀", value: notes.kickoff },
                  { label: "Mid-Week", icon: "🔄", value: notes.midweek },
                  { label: "End of Week", icon: "🏁", value: notes.endOfWeek },
                ];

                return (
                  <div
                    key={weekKey}
                    className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden"
                  >
                    {/* Week header */}
                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {sprintWeekData && (
                            <span className="text-lg" aria-hidden="true">
                              {sprintWeekData.icon}
                            </span>
                          )}
                          <h3 className="text-lg font-medium leading-snug text-neutral-900 dark:text-neutral-100">
                            Week {weekNum}
                          </h3>
                        </div>
                        {isAdmin && sprintId && (
                          <button
                            type="button"
                            onClick={() => openEditor(weekNum)}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 transition-colors duration-150"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {sprintWeekData && (
                        <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500 mt-1">
                          {sprintWeekData.summary}
                        </p>
                      )}
                    </div>

                    {/* Three-phase notes */}
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                      {weekHasNotes ? (
                        noteEntries.map((entry) => (
                          <div key={entry.label} className="px-6 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm" aria-hidden="true">{entry.icon}</span>
                              <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
                                {entry.label}
                              </span>
                            </div>
                            {entry.value ? (
                              <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
                                {entry.value}
                              </p>
                            ) : (
                              <p className="text-xs font-normal leading-normal italic text-neutral-400 dark:text-neutral-600">
                                Not set
                              </p>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-4">
                          <p className="text-sm font-normal leading-normal italic text-neutral-400 dark:text-neutral-600">
                            No notes yet for this week.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Week-notes edit modal (admin) ──────────── */}
        {isAdmin && (
          <dialog
            ref={dialogRef}
            onClick={handleBackdropClick}
            className="backdrop:bg-neutral-900/60 bg-white dark:bg-neutral-900 rounded-md shadow-xl border border-neutral-200 dark:border-neutral-600 p-0 max-w-lg w-full mx-4 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
            style={{ margin: 0 }}
          >
            {editingWeek && (
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-medium leading-snug text-neutral-900 dark:text-neutral-100">
                  Edit Week {editingWeek} Notes
                </h2>
                {editingWeek && SPRINT_WEEKS[editingWeek - 1] && (
                  <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                    {SPRINT_WEEKS[editingWeek - 1].summary}
                  </p>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 flex items-center gap-2">
                    <span aria-hidden="true">🚀</span> Kickoff
                  </label>
                  <textarea
                    value={editKickoff}
                    onChange={(e) => setEditKickoff(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
                    placeholder="How does this week start?"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 flex items-center gap-2">
                    <span aria-hidden="true">🔄</span> Mid-Week
                  </label>
                  <textarea
                    value={editMidweek}
                    onChange={(e) => setEditMidweek(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
                    placeholder="What to expect midway?"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500 flex items-center gap-2">
                    <span aria-hidden="true">🏁</span> End of Week
                  </label>
                  <textarea
                    value={editEndOfWeek}
                    onChange={(e) => setEditEndOfWeek(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y"
                    placeholder="How does this week wrap up?"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="h-10 px-4 text-sm font-medium rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-10 px-4 text-sm font-medium rounded-md bg-blue-600 dark:bg-blue-500 text-neutral-100 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-150 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </dialog>
        )}

        {/* ── Discussion ────────────────────────────── */}
        {sprintId && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
              Discussion
            </h2>
            <SprintComments
              sprintId={sprintId}
              currentUserEmail={currentUserEmail}
              currentUserName={currentUserName}
            />
          </section>
        )}

        {/* ── Change Log (admin) ────────────────────── */}
        {isAdmin && sprintId && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
              Change Log
            </h2>
            <SprintChangelog sprintId={sprintId} />
          </section>
        )}
      </main>
    </div>
  );
}
