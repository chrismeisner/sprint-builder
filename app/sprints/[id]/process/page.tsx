import { redirect } from "next/navigation";
import { ensureSchema, getPool } from "@/lib/db";

// The sprint "process" view is superseded by the hill (scope → climb → descend).
// Resolve the owning hill's project and redirect to the project surface.
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  await ensureSchema();
  const pool = getPool();
  const r = await pool.query(
    `SELECT project_id FROM hills
      WHERE type = 'sprint' AND (id = $1 OR type_data->>'linked_id' = $1)
      LIMIT 1`,
    [params.id]
  );
  const projectId = r.rowCount ? (r.rows[0].project_id as string | null) : null;
  redirect(projectId ? `/projects/${projectId}` : "/projects");
}
