import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import SprintBuilderClient from "./SprintBuilderClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Deliverable = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  categories: string[];
  scope: string | null;
  points: number | null;
};

type Project = {
  id: string;
  name: string;
};

export default async function SprintBuilderPage() {
  await ensureSchema();
  const pool = getPool();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch deliverables
  const deliverablesResult = await pool.query(`
    SELECT
      id,
      name,
      description,
      CASE
        WHEN 'Branding' = ANY(categories) THEN 'Branding'
        WHEN 'Product' = ANY(categories) THEN 'Product'
        ELSE COALESCE(category, categories[1])
      END AS category,
      CASE
        WHEN categories IS NOT NULL AND array_length(categories, 1) IS NOT NULL THEN categories
        WHEN category IS NOT NULL AND btrim(category) <> '' THEN ARRAY[category]::text[]
        ELSE '{}'::text[]
      END AS categories,
      scope,
      points
    FROM deliverables
    WHERE active = true
    ORDER BY
      CASE
        WHEN 'Branding' = ANY(categories) THEN 1
        WHEN 'Product' = ANY(categories) THEN 2
        ELSE 3
      END ASC,
      name ASC
  `);

  const deliverables: Deliverable[] = deliverablesResult.rows;

  // Fetch projects for the user (owner or member)
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

  const projects: Project[] = projectsResult.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
  }));

  return <SprintBuilderClient deliverables={deliverables} projects={projects} />;
}

