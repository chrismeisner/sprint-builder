import { ensureSchema, getPool } from "@/lib/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hoursFromPoints } from "@/lib/pricing";
import SprintTotals from "./SprintTotals";
import AdminStatusChanger from "./AdminStatusChanger";
import DeleteSprintButton from "./DeleteSprintButton";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import { typography } from "@/app/components/typography";
import SprintPlaybook from "./SprintPlaybook";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function SprintDetailPage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();
  
  // Get current user if logged in
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/login?redirect=${encodeURIComponent(`/sprints/${params.id}`)}`);
  }
  
  // Fetch sprint with document info including account_id and email
  const result = await pool.query(
    `SELECT sd.id, sd.document_id, sd.ai_response_id, sd.draft, sd.status, sd.title,
            sd.deliverable_count, sd.total_estimate_points, sd.total_fixed_hours, sd.total_fixed_price, 
            sd.created_at, sd.updated_at, sd.weeks, sd.start_date, sd.due_date,
            sd.project_id,
            d.email, d.account_id, d.project_id AS document_project_id
     FROM sprint_drafts sd
     JOIN documents d ON sd.document_id = d.id
     WHERE sd.id = $1`,
    [params.id]
  );
  if (result.rowCount === 0) {
    notFound();
  }
  const row = result.rows[0] as {
    id: string;
    document_id: string;
    ai_response_id: string | null;
    draft: unknown;
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
    document_project_id: string | null;
    weeks: number | null;
    start_date: string | Date | null;
    due_date: string | Date | null;
  };
  
  // Check if current user owns this sprint or is a member of the linked project
  const isOwner = row.account_id === currentUser.accountId;
  const projectId = row.project_id || row.document_project_id;
  const memberRes =
    projectId
      ? await pool.query(
          `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
          [projectId, currentUser.email]
        )
      : null;
  const isProjectMember = Boolean(memberRes?.rowCount && memberRes.rowCount > 0);
  const isAdmin = currentUser?.isAdmin === true;

  if (!isOwner && !isAdmin && !isProjectMember) {
    redirect(`/login?redirect=${encodeURIComponent(`/sprints/${params.id}`)}`);
  }

  // Fetch deliverables from junction table with complexity scores and custom scope
  const deliverablesResult = await pool.query(
    `SELECT 
      spd.deliverable_id,
      spd.complexity_score,
      spd.custom_hours,
      spd.custom_estimate_points,
      spd.custom_scope,
      spd.notes,
      spd.deliverable_name,
      spd.deliverable_description,
      spd.deliverable_category,
      spd.deliverable_scope,
      spd.base_points,
      d.name AS base_name,
      d.category AS base_category,
      d.scope AS base_scope,
      d.fixed_hours,
      d.fixed_price,
      d.points
     FROM sprint_deliverables spd
     LEFT JOIN deliverables d ON spd.deliverable_id = d.id
     WHERE spd.sprint_draft_id = $1
     ORDER BY spd.created_at`,
    [params.id]
  );

  const sprintDeliverables = deliverablesResult.rows.map((row) => ({
    deliverableId: row.deliverable_id as string,
    name: (row.deliverable_name as string | null) ?? (row.base_name as string | null) ?? "",
    category: (row.deliverable_category as string | null) ?? (row.base_category as string | null),
    deliverableType: null,
    complexityScore: row.complexity_score != null ? Number(row.complexity_score) : 1.0,
    customHours: row.custom_hours != null ? Number(row.custom_hours) : null,
    customPoints: row.custom_estimate_points != null ? Number(row.custom_estimate_points) : null,
    customScope: (row.custom_scope as string | null) ?? (row.deliverable_scope as string | null) ?? (row.base_scope as string | null),
    note: (row.notes as string | null) ?? null,
    baseHours:
      row.base_points != null
        ? hoursFromPoints(Number(row.base_points))
        : row.points != null
          ? hoursFromPoints(Number(row.points))
          : row.fixed_hours != null
            ? Number(row.fixed_hours)
            : null,
    basePrice: row.fixed_price != null ? Number(row.fixed_price) : null,
    basePoints:
      row.custom_estimate_points != null
        ? Number(row.custom_estimate_points)
        : row.base_points != null
          ? Number(row.base_points)
          : row.points != null
            ? Number(row.points)
            : null,
  }));

  // Check for attached deferred comp / budget
  const budgetRes = await pool.query(
    `SELECT id, label, created_at
     FROM deferred_comp_plans
     WHERE sprint_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [params.id]
  );
  const budgetPlan =
    (budgetRes?.rowCount ?? 0) > 0
      ? (budgetRes.rows[0] as { id: string; label: string | null; created_at: string | Date })
      : null;

  function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.map((v) => (typeof v === "string" ? v : String(v))).filter((v) => v.trim().length > 0);
  }
  type PlanDeliverable = {
    deliverableId?: string;
    name?: string;
    reason?: string;
  };
  type TimelineItem = {
    day?: string | number;
    dayOfWeek?: string;
    focus?: string;
    items?: string[];
  };
  type WeekPlan = {
    overview?: string;
    goals?: string[];
    deliverables?: string[];
    milestones?: string[];
  };
  type DraftPlan = {
    sprintTitle?: string;
    goals?: string[];
    deliverables?: PlanDeliverable[];
    week1?: WeekPlan;
    week2?: WeekPlan;
    approach?: string;
    timeline?: TimelineItem[];
    assumptions?: string[];
    risks?: string[];
    notes?: string[];
  };

  const plan: DraftPlan = (() => {
    if (!isObject(row.draft)) return {};
    const d = row.draft as Record<string, unknown>;
    const deliverablesRaw = Array.isArray(d.deliverables) ? (d.deliverables as unknown[]) : [];
    const timelineRaw = Array.isArray(d.timeline) ? (d.timeline as unknown[]) : [];
    
    // Parse week1
    const week1 = isObject(d.week1) ? (d.week1 as Record<string, unknown>) : null;
    const week1Plan: WeekPlan | undefined = week1 ? {
      overview: typeof week1.overview === "string" ? week1.overview : undefined,
      goals: asStringArray(week1.goals),
      deliverables: asStringArray(week1.deliverables),
      milestones: asStringArray(week1.milestones),
    } : undefined;
    
    // Parse week2
    const week2 = isObject(d.week2) ? (d.week2 as Record<string, unknown>) : null;
    const week2Plan: WeekPlan | undefined = week2 ? {
      overview: typeof week2.overview === "string" ? week2.overview : undefined,
      goals: asStringArray(week2.goals),
      deliverables: asStringArray(week2.deliverables),
      milestones: asStringArray(week2.milestones),
    } : undefined;
    
    return {
      sprintTitle: typeof d.sprintTitle === "string" ? d.sprintTitle : undefined,
      goals: asStringArray(d.goals),
      approach: typeof d.approach === "string" ? d.approach : undefined,
      week1: week1Plan,
      week2: week2Plan,
      deliverables: deliverablesRaw
        .map((it): PlanDeliverable => {
          if (!isObject(it)) return {};
          const o = it as Record<string, unknown>;
          return {
            deliverableId: typeof o.deliverableId === "string" ? o.deliverableId : undefined,
            name: typeof o.name === "string" ? o.name : undefined,
            reason: typeof o.reason === "string" ? o.reason : undefined,
          };
        })
        .filter((d) => isObject(d)),
      timeline: timelineRaw
        .map((it): TimelineItem => {
          if (!isObject(it)) return {};
          const o = it as Record<string, unknown>;
          const items = asStringArray(o.items);
          const tasks = asStringArray((o as Record<string, unknown>).tasks);
          return {
            day: typeof o.day === "number" || typeof o.day === "string" ? (o.day as number | string) : undefined,
            dayOfWeek: typeof o.dayOfWeek === "string" ? o.dayOfWeek : undefined,
            focus: typeof o.focus === "string" ? o.focus : undefined,
            items: items.length > 0 ? items : tasks,
          };
        })
        .filter((x) => isObject(x)),
      assumptions: asStringArray(d.assumptions),
      risks: asStringArray(d.risks),
      notes: asStringArray(d.notes),
    };
  })();

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
      {/* Admin Mode Banner */}
      {isAdmin && (
        <div className="sticky top-0 z-50 -mx-6 -mt-6 mb-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                <span className={getTypographyClassName("subtitle-sm")}>Admin Mode</span>
              </div>
              <span className={`${getTypographyClassName("body-sm")} opacity-90 hidden sm:inline`}>
                Viewing as administrator • Extended permissions active
              </span>
            </div>
            <AdminStatusChanger sprintId={row.id} currentStatus={row.status || "draft"} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className={t.pageTitle} data-typography-id="h2">
            {row.title || plan.sprintTitle?.trim() || "Sprint draft"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(isOwner || isAdmin) && (
            <Link
              href={`/dashboard/sprint-builder?sprintId=${row.id}`}
              className={`inline-flex items-center rounded-md bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 hover:opacity-90 transition ${getTypographyClassName("button-sm")}`}
            >
              Edit in builder
            </Link>
          )}
        {(row.total_fixed_price != null || row.total_estimate_points != null) && (
          <Link
            href={`/deferred-compensation?sprintId=${row.id}&amount=${Number(row.total_fixed_price ?? 0)}`}
            className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition ${getTypographyClassName("button-sm")}`}
          >
            Open deferred comp
          </Link>
        )}
        </div>
      </div>

      {/* Sprint Setup Checklist */}
      {/* SprintSetupChecklist intentionally kept in codebase for future use but hidden from UI */}

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

        <div className="grid gap-3 sm:grid-cols-2">
          {row.email && (
            <div>
              <span className={t.monoLabel}>email:</span> {row.email}
            </div>
          )}
          {row.deliverable_count != null && row.deliverable_count > 0 && (
            <div>
              <span className={t.monoLabel}>deliverables:</span> {row.deliverable_count}
            </div>
          )}
          <div>
            <span className={t.monoLabel}>created:</span>{" "}
            {new Date(row.created_at).toLocaleString()}
          </div>
          {row.updated_at && (
            <div>
              <span className={t.monoLabel}>updated:</span>{" "}
              {new Date(row.updated_at).toLocaleString()}
            </div>
          )}
        </div>

        {(row.total_estimate_points != null || row.total_fixed_hours != null || row.total_fixed_price != null) && (
          <SprintTotals
            initialPoints={Number(row.total_estimate_points ?? 0)}
            initialHours={
              row.total_fixed_hours != null
                ? Number(row.total_fixed_hours)
                : hoursFromPoints(Number(row.total_estimate_points ?? 0))
            }
            initialPrice={Number(row.total_fixed_price ?? 0)}
            isEditable={row.status === "draft" && Boolean(isOwner)}
            showPointsAndHours={Boolean(isAdmin)}
            variant="inline"
            hideHeading
            className="pt-2 border-t border-black/10 dark:border-white/10"
          />
        )}
      </section>

      <section className={`rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3 bg-white/40 dark:bg-black/40 ${t.bodySm}`}>
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
                href={`/deferred-compensation?sprintId=${row.id}&amount=${Number(row.total_fixed_price ?? 0)}`}
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
              href={`/deferred-compensation?sprintId=${row.id}&amount=${Number(row.total_fixed_price ?? 0)}`}
              className={`inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition ${getTypographyClassName("button-sm")}`}
            >
              Add budget
            </Link>
          </div>
        )}
      </section>

      <section className={`space-y-6 ${t.bodySm}`}>
        {/* Show editable deliverables if draft and owned by user */}
        {sprintDeliverables.length > 0 && (
          <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className={t.cardHeading}>Deliverables Table</h2>
              <span className={t.subhead}>Live sprint deliverables</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-black/10 dark:border-white/15 rounded-lg overflow-hidden">
                <thead className="bg-black/5 dark:bg-white/5">
                  <tr className={getTypographyClassName("body-sm")}>
                    <th className="text-left px-3 py-2 text-text-muted">Name</th>
                    <th className="text-left px-3 py-2 text-text-muted">Category</th>
                    <th className="text-left px-3 py-2 text-text-muted">Adjusted Points</th>
                    <th className="text-left px-3 py-2 text-text-muted">Scope</th>
                    <th className="text-left px-3 py-2 text-text-muted">Notes</th>
                  </tr>
                </thead>
                <tbody className={getTypographyClassName("body-sm")}>
                  {sprintDeliverables.map((d, i) => (
                    <tr
                      key={d.deliverableId || `${d.name}-${i}`}
                      className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-gray-950/40"
                    >
                      <td className="px-3 py-3 align-top">
                        <div className={getTypographyClassName("body-sm")}>{d.name || "Untitled"}</div>
                      </td>
                      <td className="px-3 py-3 align-top">{d.category ?? "—"}</td>
                      <td className="px-3 py-3 align-top">
                        {d.customPoints != null ? `${d.customPoints} pts` : "—"}
                      </td>
                      <td className="px-3 py-3 align-top whitespace-pre-wrap">
                        {d.customScope ?? "—"}
                      </td>
                      <td className="px-3 py-3 align-top whitespace-pre-wrap">
                        {d.note ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <SprintPlaybook />

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

        {plan.timeline && plan.timeline.length > 0 && (
          <div className={`rounded-lg border border-black/10 dark:border-white/15 p-4 ${t.bodySm}`}>
            <h2 className={`${t.cardHeading} mb-3`}>Timeline</h2>
            <ol className="space-y-3">
              {plan.timeline.map((t, i) => (
                <li key={`${t.day || i}`} className="rounded border border-black/10 dark:border-white/15 p-3">
                  <div className={t.bodySm}>
                    <div className={`${getTypographyClassName("subtitle-sm")} flex items-baseline gap-2 text-text-primary`}>
                      <span>Day {typeof t.day === "number" ? t.day : t.day || i + 1}</span>
                      {t.dayOfWeek && (
                        <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>({t.dayOfWeek})</span>
                      )}
                      {t.focus && <span className="text-text-secondary">— {t.focus}</span>}
                    </div>
                    {t.items && t.items.length > 0 ? (
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        {t.items.map((it, j) => (
                          <li key={`${it}-${j}`}>{it}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

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

        {plan.assumptions && plan.assumptions.length > 0 && (
          <div className={`rounded-lg border border-black/10 dark:border-white/15 p-4 ${t.bodySm}`}>
            <h2 className={`${t.cardHeading} mb-2`}>Assumptions</h2>
            <ul className="list-disc pl-5 space-y-1">
              {plan.assumptions.map((a, i) => (
                <li key={`${a}-${i}`}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {plan.risks && plan.risks.length > 0 && (
          <div className={`rounded-lg border border-black/10 dark:border-white/15 p-4 ${t.bodySm}`}>
            <h2 className={`${t.cardHeading} mb-2`}>Risks</h2>
            <ul className="list-disc pl-5 space-y-1">
              {plan.risks.map((r, i) => (
                <li key={`${r}-${i}`}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {plan.notes && plan.notes.length > 0 && (
          <div className={`rounded-lg border border-black/10 dark:border-white/15 p-4 ${t.bodySm}`}>
            <h2 className={`${t.cardHeading} mb-2`}>Notes</h2>
            <ul className="list-disc pl-5 space-y-1">
              {plan.notes.map((n, i) => (
                <li key={`${n}-${i}`}>{n}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Danger zone */}
      <DeleteSprintButton sprintId={row.id} visible={Boolean(isOwner)} />
    </main>
  );
}


