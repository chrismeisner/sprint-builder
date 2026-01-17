import { ensureSchema, getPool } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { hoursFromPoints } from "@/lib/pricing";
import SprintDetailContent from "./SprintDetailContent";

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
            sd.project_id, sd.contract_url, sd.contract_status,
            d.email, d.account_id, d.project_id AS document_project_id
     FROM sprint_drafts sd
     LEFT JOIN documents d ON sd.document_id = d.id
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
    contract_url: string | null;
    contract_status: string | null;
  };
  
  // Check if current user owns this sprint or is a member of the linked project
  // For sprints without a document (from sprint builder), check project ownership/membership
  const isOwner = row.account_id === currentUser.accountId;
  const projectId = row.project_id || row.document_project_id;
  
  // Check project ownership
  let isProjectOwner = false;
  if (projectId) {
    const projectRes = await pool.query(
      `SELECT account_id FROM projects WHERE id = $1`,
      [projectId]
    );
    if (projectRes.rowCount && projectRes.rowCount > 0) {
      const projectRow = projectRes.rows[0] as { account_id: string | null };
      isProjectOwner = projectRow.account_id === currentUser.accountId;
    }
  }
  
  // Check project membership
  const memberRes =
    projectId
      ? await pool.query(
          `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
          [projectId, currentUser.email]
        )
      : null;
  const isProjectMember = Boolean(memberRes?.rowCount && memberRes.rowCount > 0);
  const isAdmin = currentUser?.isAdmin === true;

  if (!isOwner && !isProjectOwner && !isAdmin && !isProjectMember) {
    redirect(`/login?redirect=${encodeURIComponent(`/sprints/${params.id}`)}`);
  }

  // Fetch deliverables from junction table with complexity scores and custom scope
  const deliverablesResult = await pool.query(
    `SELECT 
      spd.id AS sprint_deliverable_id,
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
      spd.delivery_url,
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
    sprintDeliverableId: row.sprint_deliverable_id as string,
    deliverableId: row.deliverable_id as string,
    name: (row.deliverable_name as string | null) ?? (row.base_name as string | null) ?? "",
    category: (row.deliverable_category as string | null) ?? (row.base_category as string | null),
    deliverableType: null,
    complexityScore: row.complexity_score != null ? Number(row.complexity_score) : 1.0,
    customHours: row.custom_hours != null ? Number(row.custom_hours) : null,
    customPoints: row.custom_estimate_points != null ? Number(row.custom_estimate_points) : null,
    customScope: (row.custom_scope as string | null) ?? (row.deliverable_scope as string | null) ?? (row.base_scope as string | null),
    note: (row.notes as string | null) ?? null,
    deliveryUrl: (row.delivery_url as string | null) ?? null,
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

  // Convert dates to strings for client component
  const rowForClient = {
    id: row.id,
    document_id: row.document_id,
    status: row.status,
    title: row.title,
    deliverable_count: row.deliverable_count,
    total_estimate_points: row.total_estimate_points,
    total_fixed_hours: row.total_fixed_hours,
    total_fixed_price: row.total_fixed_price,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
    email: row.email,
    account_id: row.account_id,
    project_id: row.project_id,
    weeks: row.weeks,
    start_date: row.start_date instanceof Date ? row.start_date.toISOString() : row.start_date,
    due_date: row.due_date instanceof Date ? row.due_date.toISOString() : row.due_date,
    contract_url: row.contract_url,
    contract_status: row.contract_status,
  };

  const budgetPlanForClient = budgetPlan
    ? {
        id: budgetPlan.id,
        label: budgetPlan.label,
        created_at: budgetPlan.created_at instanceof Date ? budgetPlan.created_at.toISOString() : budgetPlan.created_at,
      }
    : null;

  // Filter plan for client (only serializable data)
  const planForClient = {
    sprintTitle: plan.sprintTitle,
    goals: plan.goals,
    approach: plan.approach,
    week1: plan.week1,
    week2: plan.week2,
    timeline: plan.timeline,
    assumptions: plan.assumptions,
    risks: plan.risks,
    notes: plan.notes,
  };

  return (
    <SprintDetailContent
      row={rowForClient}
      plan={planForClient}
      sprintDeliverables={sprintDeliverables}
      budgetPlan={budgetPlanForClient}
      isOwner={isOwner}
      isAdmin={isAdmin}
      isProjectMember={isProjectMember}
    />
  );
}
