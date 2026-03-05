import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import UpdateCycleBuilderClient from "./UpdateCycleBuilderClient";

export const dynamic = "force-dynamic";

type Sprint = {
  id: string;
  title: string | null;
  status: string | null;
  total_fixed_price: number | null;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
};

export default async function UpdateCycleBuilderPage() {
  await ensureSchema();
  const pool = getPool();
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    redirect("/login");
  }

  // Fetch projects (admin sees all)
  const projectsResult = await pool.query(
    `SELECT id, name FROM projects ORDER BY created_at DESC`
  );
  const projects: Project[] = projectsResult.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
  }));

  // Fetch all sprints (foundation type) that could be parent sprints
  const sprintsResult = await pool.query(
    `SELECT id, title, status, total_fixed_price, project_id, created_at
     FROM sprint_drafts
     WHERE (type = 'sprint' OR type IS NULL)
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
      status: row.status as string | null,
      total_fixed_price: row.total_fixed_price != null ? Number(row.total_fixed_price) : null,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : (row.created_at as string),
    });
  }

  return (
    <UpdateCycleBuilderClient
      projects={projects}
      sprintsByProject={sprintsByProject}
    />
  );
}
