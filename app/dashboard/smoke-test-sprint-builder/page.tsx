import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  SMOKE_TEST_DAY_THEMES,
  SMOKE_TEST_TIMELINE_WORKING_DAYS,
} from "@/lib/pricing";
import SmokeTestSprintBuilderClient from "./SmokeTestSprintBuilderClient";

export const dynamic = "force-dynamic";

type Sprint = {
  id: string;
  title: string | null;
  type: string | null;
  status: string | null;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
};

type ProjectMember = {
  email: string;
  displayName: string | null;
};

export type DayPlan = { theme: string; notes: string };
export type Deliverable = { week: 1 | 2; title: string; description: string };

export type Attachment = {
  id: string;
  name: string;
  linkType: "url" | "file";
  url: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSizeBytes: number | null;
  mimetype: string | null;
  description: string | null;
  createdAt: string;
};

export type InitialDraft = {
  id: string;
  projectId: string;
  status: string;
  title: string;
  buildingFromSprintIds: string[];
  noPriorSprint: boolean;
  currentState: string;
  whatsNext: string;
  whyNow: string;
  goodLooksLike: string;
  howWeKnow: string;
  browserPrototypeScope: string;
  figmaFileScope: string;
  implementationMembers: string[];
  existingAssets: string;
  complexityScore: number;
  hourlyRate: number;
  proposedStartDate: string;
  notes: string;
  dayPlans: DayPlan[];
  deliverables: Deliverable[];
  attachments: Attachment[];
  updatedAt: string;
  updatedByLabel: string | null;
};

function hydrateDeliverables(value: unknown): Deliverable[] {
  if (!Array.isArray(value)) return [];
  const out: Deliverable[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Record<string, unknown>;
    const weekNum = Number(obj.week);
    const week: 1 | 2 = weekNum === 2 ? 2 : 1;
    const title = typeof obj.title === "string" ? obj.title : "";
    const description = typeof obj.description === "string" ? obj.description : "";
    out.push({ week, title, description });
  }
  return out;
}

function hydrateDayPlans(value: unknown): DayPlan[] {
  const out: DayPlan[] = [];
  const input = Array.isArray(value) ? value : [];
  for (let i = 0; i < SMOKE_TEST_TIMELINE_WORKING_DAYS; i++) {
    const raw = input[i];
    const obj =
      raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const theme =
      typeof obj.theme === "string" && obj.theme.trim()
        ? obj.theme.trim()
        : SMOKE_TEST_DAY_THEMES[i] ?? "";
    const notes = typeof obj.notes === "string" ? obj.notes : "";
    out.push({ theme, notes });
  }
  return out;
}

export default async function SmokeTestSprintBuilderPage({
  searchParams,
}: {
  searchParams?: { draftId?: string };
}) {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    redirect("/login");
  }
  const pool = getPool();

  const projectsResult = await pool.query(
    `SELECT id, name FROM projects ORDER BY created_at DESC`
  );
  const projects: Project[] = projectsResult.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
  }));

  const sprintsResult = await pool.query(
    `SELECT id, title, type, status, project_id, created_at
     FROM sprint_drafts
     WHERE project_id IS NOT NULL
     ORDER BY created_at DESC`
  );
  const sprintsByProject: Record<string, Sprint[]> = {};
  for (const row of sprintsResult.rows) {
    const pid = row.project_id as string;
    if (!pid) continue;
    if (!sprintsByProject[pid]) sprintsByProject[pid] = [];
    sprintsByProject[pid].push({
      id: row.id as string,
      title: row.title as string | null,
      type: row.type as string | null,
      status: row.status as string | null,
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : (row.created_at as string),
    });
  }

  const projectMembersByProject: Record<string, ProjectMember[]> = {};
  const projectIds = projects.map((p) => p.id);
  if (projectIds.length > 0) {
    const membersResult = await pool.query(
      `SELECT
         pm.project_id,
         pm.email,
         COALESCE(
           NULLIF(a.name, ''),
           NULLIF(CONCAT_WS(' ', NULLIF(a.first_name, ''), NULLIF(a.last_name, '')), '')
         ) AS display_name
       FROM project_members pm
       LEFT JOIN accounts a ON lower(a.email) = lower(pm.email)
       WHERE pm.project_id = ANY($1::text[])
       ORDER BY pm.project_id ASC, lower(pm.email) ASC`,
      [projectIds]
    );

    for (const row of membersResult.rows) {
      const pid = row.project_id as string;
      if (!projectMembersByProject[pid]) projectMembersByProject[pid] = [];
      projectMembersByProject[pid].push({
        email: row.email as string,
        displayName: (row.display_name as string | null) ?? null,
      });
    }
  }

  let initialDraft: InitialDraft | null = null;
  const draftId = searchParams?.draftId;
  if (draftId) {
    const draftRes = await pool.query(
      `SELECT sts.id, sts.project_id, sts.status, sts.title,
              sts.building_from_sprint_ids, sts.no_prior_sprint,
              sts.current_state,
              sts.whats_next, sts.why_now, sts.good_looks_like, sts.how_we_know,
              sts.browser_prototype_scope, sts.figma_file_scope,
              sts.implementation_members, sts.existing_assets,
              sts.complexity_score, sts.hourly_rate, sts.proposed_start_date,
              sts.notes, sts.day_plans, sts.deliverables, sts.updated_at,
              COALESCE(
                NULLIF(au.name, ''),
                NULLIF(CONCAT_WS(' ', NULLIF(au.first_name, ''), NULLIF(au.last_name, '')), ''),
                au.email
              ) AS updated_by_label
       FROM smoke_test_sprints sts
       LEFT JOIN accounts au ON au.id = COALESCE(sts.updated_by, sts.created_by)
       WHERE sts.id = $1`,
      [draftId]
    );
    if (draftRes.rowCount && draftRes.rowCount > 0) {
      const row = draftRes.rows[0];
      const attachmentsRes = await pool.query(
        `SELECT id, name, link_type, url, file_url, file_name,
                file_size_bytes, mimetype, description, created_at
         FROM smoke_test_sprint_links
         WHERE smoke_test_sprint_id = $1
         ORDER BY created_at DESC`,
        [draftId]
      );
      const attachments: Attachment[] = attachmentsRes.rows.map((r) => ({
        id: r.id as string,
        name: r.name as string,
        linkType: r.link_type as "url" | "file",
        url: (r.url as string | null) ?? null,
        fileUrl: (r.file_url as string | null) ?? null,
        fileName: (r.file_name as string | null) ?? null,
        fileSizeBytes: r.file_size_bytes ? Number(r.file_size_bytes) : null,
        mimetype: (r.mimetype as string | null) ?? null,
        description: (r.description as string | null) ?? null,
        createdAt:
          r.created_at instanceof Date
            ? r.created_at.toISOString()
            : (r.created_at as string),
      }));
      initialDraft = {
        id: row.id as string,
        projectId: row.project_id as string,
        status: row.status as string,
        title: (row.title as string | null) ?? "",
        buildingFromSprintIds: (row.building_from_sprint_ids as string[]) ?? [],
        noPriorSprint: Boolean(row.no_prior_sprint),
        currentState: (row.current_state as string | null) ?? "",
        whatsNext: (row.whats_next as string | null) ?? "",
        whyNow: (row.why_now as string | null) ?? "",
        goodLooksLike: (row.good_looks_like as string | null) ?? "",
        howWeKnow: (row.how_we_know as string | null) ?? "",
        browserPrototypeScope: (row.browser_prototype_scope as string | null) ?? "",
        figmaFileScope: (row.figma_file_scope as string | null) ?? "",
        implementationMembers: (row.implementation_members as string[]) ?? [],
        existingAssets: (row.existing_assets as string | null) ?? "",
        complexityScore: Number(row.complexity_score) || 3,
        hourlyRate: Number(row.hourly_rate) || 250,
        proposedStartDate:
          row.proposed_start_date instanceof Date
            ? row.proposed_start_date.toISOString().slice(0, 10)
            : ((row.proposed_start_date as string | null) ?? ""),
        notes: (row.notes as string | null) ?? "",
        dayPlans: hydrateDayPlans(row.day_plans),
        deliverables: hydrateDeliverables(row.deliverables),
        attachments,
        updatedAt:
          row.updated_at instanceof Date
            ? row.updated_at.toISOString()
            : (row.updated_at as string),
        updatedByLabel: (row.updated_by_label as string | null) ?? null,
      };
    }
  }

  const currentUserLabel =
    (user.name && user.name.trim()) ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email;

  return (
    <SmokeTestSprintBuilderClient
      projects={projects}
      sprintsByProject={sprintsByProject}
      projectMembersByProject={projectMembersByProject}
      initialDraft={initialDraft}
      currentUserLabel={currentUserLabel}
    />
  );
}
