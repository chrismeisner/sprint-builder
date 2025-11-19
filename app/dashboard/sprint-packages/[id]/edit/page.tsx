import { ensureSchema, getPool } from "@/lib/db";
import { notFound } from "next/navigation";
import SprintPackageFormClient from "../../SprintPackageFormClient";

export const dynamic = "force-dynamic";

type Deliverable = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  scope: string | null;
  fixed_hours: number | null;
  fixed_price: number | null;
  default_estimate_points: number | null;
};

type PageProps = {
  params: { id: string };
};

export default async function EditSprintPackagePage({ params }: PageProps) {
  await ensureSchema();
  const pool = getPool();

  // Fetch the package
  const packageResult = await pool.query(
    `
    SELECT 
      sp.id,
      sp.name,
      sp.slug,
      sp.description,
      sp.category,
      sp.tagline,
      sp.flat_fee,
      sp.flat_hours,
      sp.discount_percentage,
      sp.active,
      sp.featured,
      sp.sort_order,
      COALESCE(
        json_agg(
          json_build_object(
            'deliverableId', spd.deliverable_id,
            'quantity', spd.quantity,
            'sortOrder', spd.sort_order
          ) ORDER BY spd.sort_order ASC
        ) FILTER (WHERE spd.deliverable_id IS NOT NULL),
        '[]'
      ) as deliverables
    FROM sprint_packages sp
    LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
    WHERE sp.id = $1
    GROUP BY sp.id
  `,
    [params.id]
  );

  if (packageResult.rowCount === 0) {
    notFound();
  }

  const existingPackage = packageResult.rows[0];

  // Fetch all active deliverables for selection
  const deliverablesResult = await pool.query(`
    SELECT id, name, description, category, scope, fixed_hours, fixed_price, default_estimate_points
    FROM deliverables
    WHERE active = true
    ORDER BY name ASC
  `);

  const deliverables: Deliverable[] = deliverablesResult.rows;

  return (
    <SprintPackageFormClient deliverables={deliverables} existingPackage={existingPackage} />
  );
}

