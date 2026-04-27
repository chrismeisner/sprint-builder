import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
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

export default async function SmokeTestSprintBuilderPage() {
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

  return (
    <SmokeTestSprintBuilderClient
      projects={projects}
      sprintsByProject={sprintsByProject}
      projectMembersByProject={projectMembersByProject}
    />
  );
}
