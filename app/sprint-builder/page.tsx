import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import SprintBuilderClient from "../dashboard/sprint-builder/SprintBuilderClient";

export const dynamic = "force-dynamic";

type Deliverable = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  scope: string | null;
  points: number | null;
};

type Project = {
  id: string;
  name: string;
};

export default async function PublicSprintBuilderPage() {
  await ensureSchema();
  const pool = getPool();
  const user = await getCurrentUser();

  const deliverablesResult = await pool.query(`
    SELECT id, name, description, category, scope, points
    FROM deliverables
    WHERE active = true
    ORDER BY category ASC, name ASC
  `);

  const deliverables: Deliverable[] = deliverablesResult.rows;

  let projects: Project[] = [];

  if (user) {
    const projectsResult = await pool.query(
      `
        SELECT DISTINCT
          p.id,
          p.name,
          p.created_at
        FROM projects p
        LEFT JOIN project_members pm
          ON pm.project_id = p.id
         AND lower(pm.email) = lower($2)
        WHERE p.account_id = $1
           OR pm.email IS NOT NULL
        ORDER BY p.created_at DESC
      `,
      [user.accountId, user.email]
    );

    projects = projectsResult.rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
    }));
  }

  return (
    <SprintBuilderClient
      deliverables={deliverables}
      projects={projects}
      isAuthenticated={Boolean(user)}
      loginRedirectPath="/sprint-builder"
    />
  );
}


