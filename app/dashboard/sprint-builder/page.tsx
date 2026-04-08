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

type PackageDeliverable = {
  deliverableId: string;
  name: string;
  points: number | null;
  quantity: number;
  complexityScore: number | null;
};

type Package = {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  category: string | null;
  packageType: string | null;
  durationWeeks: number;
  requiresPackageType: string | null;
  pricingMode: "calculated" | "flat";
  flatFee: number | null;
  baseRate: number | null;
  active: boolean;
  deliverables: PackageDeliverable[];
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

  // Fetch active packages with their deliverables
  const packagesResult = await pool.query(`
    SELECT
      sp.id,
      sp.name,
      sp.description,
      sp.emoji,
      sp.category,
      sp.package_type,
      sp.duration_weeks,
      sp.requires_package_type,
      sp.pricing_mode,
      sp.flat_fee,
      sp.base_rate,
      sp.active,
      sp.sort_order,
      COALESCE(
        json_agg(
          json_build_object(
            'deliverableId', d.id,
            'name', d.name,
            'points', d.points,
            'quantity', spd.quantity,
            'complexityScore', spd.complexity_score
          ) ORDER BY spd.sort_order ASC, d.name ASC
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'
      ) AS deliverables
    FROM sprint_packages sp
    LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
    LEFT JOIN deliverables d ON spd.deliverable_id = d.id
    WHERE sp.active = true
    GROUP BY sp.id
    ORDER BY sp.sort_order ASC, sp.name ASC
  `);

  const packages: Package[] = packagesResult.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    emoji: row.emoji as string | null,
    category: row.category as string | null,
    packageType: (row.package_type as string | null) ?? null,
    durationWeeks: Number(row.duration_weeks ?? 2),
    requiresPackageType: (row.requires_package_type as string | null) ?? null,
    pricingMode: row.pricing_mode === "flat" ? "flat" : "calculated",
    flatFee: row.flat_fee != null ? Number(row.flat_fee) : null,
    baseRate: row.base_rate != null ? Number(row.base_rate) : null,
    active: row.active as boolean,
    deliverables: (row.deliverables as PackageDeliverable[]) ?? [],
  }));

  return (
    <SprintBuilderClient
      deliverables={deliverables}
      projects={projects}
      packages={packages}
    />
  );
}

