"use client";

import { useState } from "react";
import Link from "next/link";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";
import { hoursFromPoints } from "@/lib/pricing";
import AdminStatusChanger from "./AdminStatusChanger";
import DeleteSprintButton from "./DeleteSprintButton";
import SprintTotals from "./SprintTotals";
import AdminOnlySection from "./AdminOnlySection";
import ViewModeToggle from "./ViewModeToggle";

type SprintDeliverable = {
  sprintDeliverableId: string;
  deliverableId: string;
  name: string;
  category: string | null;
  deliverableType: null;
  complexityScore: number;
  customHours: number | null;
  customPoints: number | null;
  customScope: string | null;
  note: string | null;
  deliveryUrl: string | null;
  baseHours: number | null;
  basePrice: number | null;
  basePoints: number | null;
};

type WeekPlan = {
  overview?: string;
  goals?: string[];
  deliverables?: string[];
  milestones?: string[];
};

type TimelineItem = {
  day?: string | number;
  dayOfWeek?: string;
  focus?: string;
  items?: string[];
};

type DraftPlan = {
  sprintTitle?: string;
  goals?: string[];
  approach?: string;
  week1?: WeekPlan;
  week2?: WeekPlan;
  timeline?: TimelineItem[];
  assumptions?: string[];
  risks?: string[];
  notes?: string[];
};

type BudgetPlan = {
  id: string;
  label: string | null;
  created_at: string | Date;
};

type SprintRow = {
  id: string;
  document_id: string;
  status: string | null;
  title: string | null;
  deliverable_count: number | null;
  total_estimate_points: number | null;
  total_fixed_hours: number | null;
  total_fixed_price: number | null;
  created_at: string | Date;
  updated_at: string | Date | null;
  email: string | null;
  account_id: string | null;
  project_id: string | null;
  weeks: number | null;
  start_date: string | Date | null;
  due_date: string | Date | null;
};

type Props = {
  row: SprintRow;
  plan: DraftPlan;
  sprintDeliverables: SprintDeliverable[];
  budgetPlan: BudgetPlan | null;
  isOwner: boolean;
  isAdmin: boolean;
  isProjectMember: boolean;
};

export default function SprintDetailContent(props: Props) {
  const {
    row,
    plan,
    sprintDeliverables: initialDeliverables,
    budgetPlan,
    isOwner,
    isAdmin,
  } = props;
  const [viewAsAdmin, setViewAsAdmin] = useState(true);
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [editingUrlValue, setEditingUrlValue] = useState("");
  const [savingUrl, setSavingUrl] = useState(false);
  
  // Effective admin view: only true if user is actually admin AND viewing as admin
  const showAdminContent = isAdmin && viewAsAdmin;

  const handleEditUrl = (deliverable: SprintDeliverable) => {
    setEditingUrlId(deliverable.sprintDeliverableId);
    setEditingUrlValue(deliverable.deliveryUrl || "");
  };

  const handleCancelEditUrl = () => {
    setEditingUrlId(null);
    setEditingUrlValue("");
  };

  const handleSaveUrl = async (sprintDeliverableId: string) => {
    try {
      setSavingUrl(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}/deliverables/${sprintDeliverableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryUrl: editingUrlValue.trim() || null,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save URL");
      }
      // Update local state
      setDeliverables((prev) =>
        prev.map((d) =>
          d.sprintDeliverableId === sprintDeliverableId
            ? { ...d, deliveryUrl: editingUrlValue.trim() || null }
            : d
        )
      );
      setEditingUrlId(null);
      setEditingUrlValue("");
    } catch (err) {
      console.error(err);
      alert("Failed to save delivery URL");
    } finally {
      setSavingUrl(false);
    }
  };

  const t = {
    pageTitle: `${typography.headingSection}`,
    subhead: `${getTypographyClassName("body-sm")} text-text-secondary`,
    body: `${getTypographyClassName("body-md")} text-text-secondary`,
    bodySm: `${getTypographyClassName("body-sm")} text-text-secondary`,
    label: `${getTypographyClassName("subtitle-sm")} text-text-muted`,
    monoLabel: `${getTypographyClassName("mono-sm")} text-text-muted`,
    sectionHeading: `${getTypographyClassName("h3")} text-text-primary`,
    cardHeading: `${typography.headingCard}`,
  };

  return (
    <main className="min-h-screen max-w-6xl mx-auto p-6 space-y-6">
      {/* Admin Controls Section */}
      {isAdmin && (
        <section className="rounded-lg border border-black/10 dark:border-white/15 p-4 bg-black/5 dark:bg-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`${getTypographyClassName("mono-sm")} uppercase tracking-wide text-black dark:text-white`}>Admin Controls</span>
              <ViewModeToggle 
                isAdminView={viewAsAdmin} 
                onToggle={() => setViewAsAdmin(!viewAsAdmin)} 
              />
            </div>
            {showAdminContent && (
              <AdminStatusChanger sprintId={row.id} currentStatus={row.status || "draft"} />
            )}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className={t.pageTitle} data-typography-id="h2">
            {row.title || plan.sprintTitle?.trim() || "Sprint draft"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(isOwner || showAdminContent) && (row.status ?? "draft") === "draft" && (
            <Link
              href={`/dashboard/sprint-builder?sprintId=${row.id}`}
              className={`inline-flex items-center rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 hover:opacity-90 transition ${getTypographyClassName("button-sm")}`}
            >
              Edit in builder
            </Link>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* EVERYONE SEES: Sprint Overview */}
      {/* ============================================ */}
      <section className={`rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-4 bg-white/40 dark:bg-black/40`}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <p className={t.subhead}>
              {row.weeks || 2} week sprint
              {row.start_date ? ` · Starts ${new Date(row.start_date).toLocaleDateString()}` : ""}
              {row.due_date ? ` · Ends ${new Date(row.due_date).toLocaleDateString()}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 ${getTypographyClassName("subtitle-sm")}`}
            >
              {row.status || "draft"}
            </span>
          </div>
        </div>

        {/* Member view: Limited info */}
        <div className="grid gap-3 sm:grid-cols-2">
          {row.deliverable_count != null && row.deliverable_count > 0 && (
            <div>
              <span className={t.monoLabel}>deliverables:</span> {row.deliverable_count}
            </div>
          )}
        </div>

        {/* Total price (admin only) */}
        {showAdminContent && row.total_fixed_price != null && row.total_fixed_price > 0 && (
          <SprintTotals
            initialPoints={Number(row.total_estimate_points ?? 0)}
            initialHours={
              row.total_fixed_hours != null
                ? Number(row.total_fixed_hours)
                : hoursFromPoints(Number(row.total_estimate_points ?? 0))
            }
            initialPrice={Number(row.total_fixed_price ?? 0)}
            isEditable={row.status === "draft" && Boolean(isOwner)}
            showPointsAndHours={false}
            variant="inline"
            hideHeading
            className="pt-2 border-t border-black/10 dark:border-white/10"
          />
        )}
      </section>

      {/* ============================================ */}
      {/* ADMIN ONLY: Extended Sprint Details */}
      {/* ============================================ */}
      {showAdminContent && (
        <AdminOnlySection label="Admin Only" className="space-y-4">
          <div className="p-4 space-y-4">
            <h3 className={`${t.cardHeading}`}>Extended Sprint Details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {row.email && (
                <div className={t.bodySm}>
                  <span className={t.monoLabel}>email:</span> {row.email}
                </div>
              )}
              <div className={t.bodySm}>
                <span className={t.monoLabel}>created:</span>{" "}
                {new Date(row.created_at).toLocaleString()}
              </div>
              {row.updated_at && (
                <div className={t.bodySm}>
                  <span className={t.monoLabel}>updated:</span>{" "}
                  {new Date(row.updated_at).toLocaleString()}
                </div>
              )}
              <div className={t.bodySm}>
                <span className={t.monoLabel}>document_id:</span> {row.document_id}
              </div>
              {row.project_id && (
                <div className={t.bodySm}>
                  <span className={t.monoLabel}>project_id:</span> {row.project_id}
                </div>
              )}
              {row.account_id && (
                <div className={t.bodySm}>
                  <span className={t.monoLabel}>account_id:</span> {row.account_id}
                </div>
              )}
            </div>

            {/* Full totals with points and hours for admin */}
            {(row.total_estimate_points != null || row.total_fixed_hours != null) && (
              <div className="pt-3 border-t border-amber-400/30">
                <SprintTotals
                  initialPoints={Number(row.total_estimate_points ?? 0)}
                  initialHours={
                    row.total_fixed_hours != null
                      ? Number(row.total_fixed_hours)
                      : hoursFromPoints(Number(row.total_estimate_points ?? 0))
                  }
                  initialPrice={Number(row.total_fixed_price ?? 0)}
                  isEditable={false}
                  showPointsAndHours={true}
                  variant="inline"
                  hideHeading
                />
              </div>
            )}
          </div>
        </AdminOnlySection>
      )}

      {/* ============================================ */}
      {/* ADMIN ONLY: Budget Status */}
      {/* ============================================ */}
      {showAdminContent && (
        <AdminOnlySection label="Admin Only">
          <div className={`p-4 space-y-3 ${t.bodySm}`}>
            <div className="flex items-center justify-between">
              <h2 className={t.cardHeading}>Budget Status</h2>
              {budgetPlan ? (
                <span className={`${getTypographyClassName("body-sm")} text-green-700 dark:text-green-300`}>
                  Attached
                </span>
              ) : (
                <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>Not attached</span>
              )}
            </div>
            {budgetPlan ? (
              <div className="space-y-1">
                {budgetPlan.label && <div className={t.bodySm}>Label: {budgetPlan.label}</div>}
                <div className={t.bodySm}>
                  Saved: {new Date(budgetPlan.created_at).toLocaleString()}
                </div>
                <div>
                  <Link
                    href={`/deferred-compensation?sprintId=${row.id}&amountCents=${Math.round(
                      Number(row.total_fixed_price ?? 0) * 100
                    )}`}
                    className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition ${getTypographyClassName("button-sm")}`}
                  >
                    View / Update budget
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className={t.bodySm}>No budget attached to this sprint.</span>
                <Link
                  href={`/deferred-compensation?sprintId=${row.id}&amountCents=${Math.round(
                    Number(row.total_fixed_price ?? 0) * 100
                  )}`}
                  className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition ${getTypographyClassName("button-sm")}`}
                >
                  Add budget
                </Link>
              </div>
            )}
          </div>
        </AdminOnlySection>
      )}

      {/* ============================================ */}
      {/* EVERYONE SEES: Deliverables Table */}
      {/* ============================================ */}
      <section className={`space-y-6 ${t.bodySm}`}>
        {deliverables.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className={t.cardHeading}>Deliverables</h2>
              <span className={t.subhead}>{deliverables.length} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-black/10 dark:border-white/15 rounded-lg overflow-hidden">
                <thead className="bg-black/5 dark:bg-white/5">
                  <tr className={getTypographyClassName("body-sm")}>
                    <th className="text-left px-3 py-2 text-text-muted">Name</th>
                    <th className="text-left px-3 py-2 text-text-muted">Category</th>
                    {showAdminContent && (
                      <th className="text-left px-3 py-2 text-text-muted">Adjusted Points</th>
                    )}
                    <th className="text-left px-3 py-2 text-text-muted">Delivery</th>
                    <th className="text-center px-3 py-2 text-text-muted">Template</th>
                  </tr>
                </thead>
                <tbody className={getTypographyClassName("body-sm")}>
                  {deliverables.map((d, i) => (
                    <tr
                      key={d.sprintDeliverableId || `${d.name}-${i}`}
                      className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-gray-950/40 hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <td className="px-3 py-3 align-top">
                        <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary`}>
                          {d.name || "Untitled"}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">{d.category ?? "—"}</td>
                      {showAdminContent && (
                        <td className="px-3 py-3 align-top">
                          {d.customPoints != null ? `${d.customPoints} pts` : "—"}
                        </td>
                      )}
                      <td className="px-3 py-3 align-top">
                        {editingUrlId === d.sprintDeliverableId ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={editingUrlValue}
                              onChange={(e) => setEditingUrlValue(e.target.value)}
                              placeholder="https://..."
                              className="flex-1 min-w-[200px] rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                              disabled={savingUrl}
                            />
                            <button
                              onClick={() => handleSaveUrl(d.sprintDeliverableId)}
                              disabled={savingUrl}
                              className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
                            >
                              {savingUrl ? "..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelEditUrl}
                              disabled={savingUrl}
                              className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : d.deliveryUrl ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={d.deliveryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                            >
                              View delivery <span className="opacity-50">↗</span>
                            </a>
                            {showAdminContent && (
                              <button
                                onClick={() => handleEditUrl(d)}
                                className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted">—</span>
                            {showAdminContent && (
                              <button
                                onClick={() => handleEditUrl(d)}
                                className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                              >
                                Add URL
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top text-center">
                        {d.deliverableId && (
                          <Link
                            href={`/deliverables/${d.deliverableId}`}
                            className={`${getTypographyClassName("button-sm")} inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                          >
                            Template
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Process Link - everyone sees */}
        <Link
          href={`/sprints/${row.id}/process`}
          className={`${t.bodySm} text-text-secondary hover:text-text-primary hover:underline transition`}
        >
          View sprint process →
        </Link>

        {/* ============================================ */}
        {/* EVERYONE SEES: Goals */}
        {/* ============================================ */}
        {plan.goals && plan.goals.length > 0 && (
          <div className={`rounded-lg border border-black/10 dark:border-white/15 p-4 ${t.bodySm}`}>
            <h2 className={`${t.cardHeading} mb-3`}>Goals</h2>
            <ul className="list-disc pl-5 space-y-1">
              {plan.goals.map((g, i) => (
                <li key={`${g}-${i}`}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ============================================ */}
        {/* ADMIN ONLY: Timeline (detailed planning) */}
        {/* ============================================ */}
        {showAdminContent && plan.timeline && plan.timeline.length > 0 && (
          <AdminOnlySection label="Admin Only">
            <div className={`p-4 ${t.bodySm}`}>
              <h2 className={`${t.cardHeading} mb-3`}>Timeline</h2>
              <ol className="space-y-3">
                {plan.timeline.map((entry, i) => (
                  <li key={`${entry.day || i}`} className="rounded border border-black/10 dark:border-white/15 p-3 bg-white/50 dark:bg-black/30">
                    <div className={t.bodySm}>
                      <div className={`${getTypographyClassName("subtitle-sm")} flex items-baseline gap-2 text-text-primary`}>
                        <span>Day {typeof entry.day === "number" ? entry.day : entry.day || i + 1}</span>
                        {entry.dayOfWeek && (
                          <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>({entry.dayOfWeek})</span>
                        )}
                        {entry.focus && <span className="text-text-secondary">— {entry.focus}</span>}
                      </div>
                      {entry.items && entry.items.length > 0 ? (
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {entry.items.map((it, j) => (
                            <li key={`${it}-${j}`}>{it}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </AdminOnlySection>
        )}

        {/* ============================================ */}
        {/* EVERYONE SEES: Approach & Weekly Overview */}
        {/* ============================================ */}
        {(plan.approach || plan.week1?.overview || plan.week2?.overview) && (
          <div className={`rounded-lg border border-black/10 dark:border-white/15 p-4 ${t.bodySm}`}>
            <h2 className={`${t.cardHeading} mb-3`}>Approach & Weekly Overview</h2>
            <div className="space-y-3">
              {plan.approach && (
                <div>
                  <div className={`${getTypographyClassName("subtitle-sm")} text-text-primary mb-1`}>Approach</div>
                  <p className={t.bodySm}>{plan.approach}</p>
                </div>
              )}
              {plan.week1?.overview && (
                <div>
                  <div className={`${getTypographyClassName("subtitle-sm")} text-text-primary mb-1`}>Week 1 Overview</div>
                  <p className={t.bodySm}>{plan.week1.overview}</p>
                </div>
              )}
              {plan.week2?.overview && (
                <div>
                  <div className={`${getTypographyClassName("subtitle-sm")} text-text-primary mb-1`}>Week 2 Overview</div>
                  <p className={t.bodySm}>{plan.week2.overview}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ADMIN ONLY: Assumptions */}
        {/* ============================================ */}
        {showAdminContent && plan.assumptions && plan.assumptions.length > 0 && (
          <AdminOnlySection label="Admin Only">
            <div className={`p-4 ${t.bodySm}`}>
              <h2 className={`${t.cardHeading} mb-2`}>Assumptions</h2>
              <ul className="list-disc pl-5 space-y-1">
                {plan.assumptions.map((a, i) => (
                  <li key={`${a}-${i}`}>{a}</li>
                ))}
              </ul>
            </div>
          </AdminOnlySection>
        )}

        {/* ============================================ */}
        {/* ADMIN ONLY: Risks */}
        {/* ============================================ */}
        {showAdminContent && plan.risks && plan.risks.length > 0 && (
          <AdminOnlySection label="Admin Only">
            <div className={`p-4 ${t.bodySm}`}>
              <h2 className={`${t.cardHeading} mb-2`}>Risks</h2>
              <ul className="list-disc pl-5 space-y-1">
                {plan.risks.map((r, i) => (
                  <li key={`${r}-${i}`}>{r}</li>
                ))}
              </ul>
            </div>
          </AdminOnlySection>
        )}

        {/* ============================================ */}
        {/* ADMIN ONLY: Notes */}
        {/* ============================================ */}
        {showAdminContent && plan.notes && plan.notes.length > 0 && (
          <AdminOnlySection label="Admin Only">
            <div className={`p-4 ${t.bodySm}`}>
              <h2 className={`${t.cardHeading} mb-2`}>Notes</h2>
              <ul className="list-disc pl-5 space-y-1">
                {plan.notes.map((n, i) => (
                  <li key={`${n}-${i}`}>{n}</li>
                ))}
              </ul>
            </div>
          </AdminOnlySection>
        )}
      </section>

      {/* ============================================ */}
      {/* ADMIN ONLY: Danger zone */}
      {/* ============================================ */}
      {showAdminContent && (
        <AdminOnlySection label="Admin Only">
          <div className="p-4">
            <DeleteSprintButton sprintId={row.id} visible={true} />
          </div>
        </AdminOnlySection>
      )}
    </main>
  );
}
