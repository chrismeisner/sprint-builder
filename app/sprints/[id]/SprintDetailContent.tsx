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
  contract_url: string | null;
  contract_status: string | null;
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
  
  // Sprint totals state - these update when deliverable points change
  const [totalPoints, setTotalPoints] = useState(Number(row.total_estimate_points ?? 0));
  const [totalPrice, setTotalPrice] = useState(Number(row.total_fixed_price ?? 0));
  const [totalHours, setTotalHours] = useState(
    row.total_fixed_hours != null
      ? Number(row.total_fixed_hours)
      : hoursFromPoints(Number(row.total_estimate_points ?? 0))
  );
  
  // Deliverable edit modal state
  const [editingDeliverable, setEditingDeliverable] = useState<SprintDeliverable | null>(null);
  const [editingUrlValue, setEditingUrlValue] = useState("");
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const [editingPointsValue, setEditingPointsValue] = useState("");
  const [savingDeliverable, setSavingDeliverable] = useState(false);
  
  // Contract URL and status state
  const [contractUrl, setContractUrl] = useState(row.contract_url);
  const [editingContractUrl, setEditingContractUrl] = useState(false);
  const [contractUrlValue, setContractUrlValue] = useState(row.contract_url || "");
  const [savingContractUrl, setSavingContractUrl] = useState(false);
  const [contractStatus, setContractStatus] = useState(row.contract_status || "not_linked");
  const [savingContractStatus, setSavingContractStatus] = useState(false);
  
  // Effective admin view: only true if user is actually admin AND viewing as admin
  const showAdminContent = isAdmin && viewAsAdmin;

  const handleOpenEditModal = (deliverable: SprintDeliverable) => {
    setEditingDeliverable(deliverable);
    setEditingUrlValue(deliverable.deliveryUrl || "");
    setEditingNoteValue(deliverable.note || "");
    setEditingPointsValue(deliverable.customPoints?.toString() || deliverable.basePoints?.toString() || "");
  };

  const handleCloseEditModal = () => {
    setEditingDeliverable(null);
    setEditingUrlValue("");
    setEditingNoteValue("");
    setEditingPointsValue("");
  };

  const handleSaveDeliverable = async () => {
    if (!editingDeliverable) return;
    
    try {
      setSavingDeliverable(true);
      const pointsNum = parseFloat(editingPointsValue);
      const customPoints = !isNaN(pointsNum) && pointsNum >= 0 ? pointsNum : null;
      
      const res = await fetch(`/api/sprint-drafts/${row.id}/deliverables/${editingDeliverable.sprintDeliverableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryUrl: editingUrlValue.trim() || null,
          notes: editingNoteValue.trim() || null,
          customEstimatePoints: customPoints,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save deliverable");
      }
      
      // Parse response to get updated sprint totals
      const responseData = await res.json();
      
      // Update sprint totals if returned from API
      if (responseData.sprintTotals) {
        setTotalPoints(responseData.sprintTotals.totalPoints);
        setTotalPrice(responseData.sprintTotals.totalPrice);
        setTotalHours(responseData.sprintTotals.totalHours);
      }
      
      // Update local state
      setDeliverables((prev) =>
        prev.map((d) =>
          d.sprintDeliverableId === editingDeliverable.sprintDeliverableId
            ? { 
                ...d, 
                deliveryUrl: editingUrlValue.trim() || null,
                note: editingNoteValue.trim() || null,
                customPoints: customPoints,
              }
            : d
        )
      );
      handleCloseEditModal();
    } catch (err) {
      console.error(err);
      alert("Failed to save deliverable");
    } finally {
      setSavingDeliverable(false);
    }
  };

  const handleSaveContractUrl = async () => {
    try {
      setSavingContractUrl(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_url: contractUrlValue.trim() || null,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save contract URL");
      }
      setContractUrl(contractUrlValue.trim() || null);
      setEditingContractUrl(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save contract URL");
    } finally {
      setSavingContractUrl(false);
    }
  };

  const handleContractStatusChange = async (newStatus: string) => {
    try {
      setSavingContractStatus(true);
      const res = await fetch(`/api/sprint-drafts/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contract_status: newStatus,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update contract status");
      }
      setContractStatus(newStatus);
    } catch (err) {
      console.error(err);
      alert("Failed to update contract status");
    } finally {
      setSavingContractStatus(false);
    }
  };

  const contractStatusOptions = [
    { value: "not_linked", label: "Not linked", color: "text-text-muted" },
    { value: "drafted", label: "Drafted", color: "text-amber-600 dark:text-amber-400" },
    { value: "signed", label: "Signed", color: "text-green-700 dark:text-green-300" },
  ];

  const currentStatusOption = contractStatusOptions.find(o => o.value === contractStatus) || contractStatusOptions[0];

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
            {(totalPoints != null || totalHours != null) && (
              <div className="pt-3 border-t border-amber-400/30">
                <SprintTotals
                  initialPoints={totalPoints}
                  initialHours={totalHours}
                  initialPrice={totalPrice}
                  isEditable={false}
                  showPointsAndHours={true}
                  showRate={true}
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
      {/* ADMIN ONLY: Agreement/Contract */}
      {/* ============================================ */}
      {showAdminContent && (
        <AdminOnlySection label="Admin Only">
          <div className={`p-4 space-y-3 ${t.bodySm}`}>
            <div className="flex items-center justify-between">
              <h2 className={t.cardHeading}>Agreement</h2>
              <div className="flex items-center gap-2">
                <select
                  value={contractStatus}
                  onChange={(e) => handleContractStatusChange(e.target.value)}
                  disabled={savingContractStatus}
                  className={`${getTypographyClassName("body-sm")} ${currentStatusOption.color} bg-transparent border border-black/10 dark:border-white/15 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white disabled:opacity-50 cursor-pointer`}
                >
                  {contractStatusOptions.map((option) => (
                    <option key={option.value} value={option.value} className="text-black dark:text-white bg-white dark:bg-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {editingContractUrl ? (
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={contractUrlValue}
                  onChange={(e) => setContractUrlValue(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 min-w-[200px] rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={savingContractUrl}
                />
                <button
                  onClick={handleSaveContractUrl}
                  disabled={savingContractUrl}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
                >
                  {savingContractUrl ? "..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingContractUrl(false);
                    setContractUrlValue(contractUrl || "");
                  }}
                  disabled={savingContractUrl}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
                >
                  Cancel
                </button>
              </div>
            ) : contractUrl ? (
              <div className="flex items-center justify-between">
                <a
                  href={contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                >
                  View agreement <span className="opacity-50">↗</span>
                </a>
                <button
                  onClick={() => {
                    setEditingContractUrl(true);
                    setContractUrlValue(contractUrl || "");
                  }}
                  className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                >
                  Edit URL
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className={t.bodySm}>No agreement URL linked.</span>
                <button
                  onClick={() => setEditingContractUrl(true)}
                  className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition ${getTypographyClassName("button-sm")}`}
                >
                  Add URL
                </button>
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
                      <th className="text-left px-3 py-2 text-text-muted">Points</th>
                    )}
                    <th className="text-left px-3 py-2 text-text-muted">Delivery</th>
                    {showAdminContent && (
                      <th className="text-center px-3 py-2 text-text-muted">Edit</th>
                    )}
                  </tr>
                </thead>
                <tbody className={getTypographyClassName("body-sm")}>
                  {deliverables.map((d, i) => (
                    <tr
                      key={d.sprintDeliverableId || `${d.name}-${i}`}
                      className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-gray-950/40 hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <td className="px-3 py-3 align-top">
                        <div className="space-y-1">
                          {d.deliverableId ? (
                            <Link
                              href={`/deliverables/${d.deliverableId}`}
                              className={`${getTypographyClassName("body-sm")} font-medium text-text-primary hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition`}
                            >
                              {d.name || "Untitled"}
                            </Link>
                          ) : (
                            <span className={`${getTypographyClassName("body-sm")} font-medium text-text-primary`}>
                              {d.name || "Untitled"}
                            </span>
                          )}
                          {d.note && (
                            <p className={`${getTypographyClassName("body-sm")} text-text-muted italic whitespace-pre-wrap`}>
                              {d.note}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">{d.category ?? "—"}</td>
                      {showAdminContent && (
                        <td className="px-3 py-3 align-top">
                          {d.customPoints != null ? `${d.customPoints} pts` : "—"}
                        </td>
                      )}
                      <td className="px-3 py-3 align-top">
                        {d.deliveryUrl ? (
                          <a
                            href={d.deliveryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${getTypographyClassName("body-sm")} text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1`}
                          >
                            View <span className="opacity-50">↗</span>
                          </a>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      {showAdminContent && (
                        <td className="px-3 py-3 align-top text-center">
                          <button
                            onClick={() => handleOpenEditModal(d)}
                            className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
                          >
                            Edit
                          </button>
                        </td>
                      )}
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

      {/* ============================================ */}
      {/* Edit Deliverable Modal */}
      {/* ============================================ */}
      {editingDeliverable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={handleCloseEditModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
              <h2 className={t.cardHeading}>Edit Deliverable</h2>
              <button
                onClick={handleCloseEditModal}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Deliverable Name (read-only) */}
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  Deliverable
                </label>
                <p className={`${getTypographyClassName("body-md")} text-text-primary font-medium`}>
                  {editingDeliverable.name || "Untitled"}
                </p>
                {editingDeliverable.category && (
                  <p className={`${getTypographyClassName("body-sm")} text-text-muted`}>
                    {editingDeliverable.category}
                  </p>
                )}
              </div>

              {/* Points */}
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  Points
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editingPointsValue}
                    onChange={(e) => setEditingPointsValue(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-32 rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    disabled={savingDeliverable}
                  />
                  <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>
                    pts
                  </span>
                  {editingDeliverable.basePoints != null && (
                    <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>
                      (base: {editingDeliverable.basePoints})
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery URL */}
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  Delivery URL
                </label>
                <input
                  type="url"
                  value={editingUrlValue}
                  onChange={(e) => setEditingUrlValue(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={savingDeliverable}
                />
              </div>

              {/* Notes */}
              <div>
                <label className={`${getTypographyClassName("subtitle-sm")} text-text-muted block mb-1`}>
                  Notes
                </label>
                <textarea
                  value={editingNoteValue}
                  onChange={(e) => setEditingNoteValue(e.target.value)}
                  placeholder="Add notes about this deliverable..."
                  rows={3}
                  className="w-full rounded-md border border-black/15 dark:border-white/15 bg-white dark:bg-black px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                  disabled={savingDeliverable}
                />
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-black/10 dark:border-white/10">
              <button
                onClick={handleCloseEditModal}
                disabled={savingDeliverable}
                className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDeliverable}
                disabled={savingDeliverable}
                className={`${getTypographyClassName("button-sm")} px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black hover:opacity-90 disabled:opacity-50 transition`}
              >
                {savingDeliverable ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
