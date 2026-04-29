import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { preferredDeliveryDateOptionsEt } from "@/lib/refinementCycle";
import RefinementCycleNewClient from "./RefinementCycleNewClient";

export const dynamic = "force-dynamic";

export type ProjectOption = {
  id: string;
  name: string;
  emoji: string | null;
};

export type ProjectMember = {
  email: string;
  displayName: string | null;
};

export default async function RefinementCycleNewPage({
  searchParams,
}: {
  searchParams?: { projectId?: string };
}) {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const pool = getPool();
  const result = await pool.query(
    `
    SELECT DISTINCT p.id, p.name, p.emoji, p.created_at
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

  const projects: ProjectOption[] = result.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    emoji: (row.emoji as string | null) ?? null,
  }));

  const projectIds = projects.map((p) => p.id);
  const membersByProject: Record<string, ProjectMember[]> = {};
  if (projectIds.length > 0) {
    const membersResult = await pool.query(
      `SELECT pm.project_id, pm.email,
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
      if (!membersByProject[pid]) membersByProject[pid] = [];
      // Skip the submitter themselves — they're already the primary recipient.
      if ((row.email as string).toLowerCase() === user.email.toLowerCase()) {
        continue;
      }
      membersByProject[pid].push({
        email: row.email as string,
        displayName: (row.display_name as string | null) ?? null,
      });
    }
  }

  const preselectedProjectId =
    typeof searchParams?.projectId === "string" ? searchParams.projectId : null;

  const preferredDeliveryOptions = preferredDeliveryDateOptionsEt();

  const submitterName =
    (user.name && user.name.trim()) ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    null;

  return (
    <RefinementCycleNewClient
      projects={projects}
      membersByProject={membersByProject}
      preselectedProjectId={preselectedProjectId}
      submitterEmail={user.email}
      submitterName={submitterName}
      preferredDeliveryOptions={preferredDeliveryOptions}
    />
  );
}
