import { ensureSchema, getPool } from "@/lib/db";
import SprintBuilderClient from "./SprintBuilderClient";

export const dynamic = "force-dynamic";

type Deliverable = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  scope: string | null;
  points: number | null;
};

type Package = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  emoji: string | null;
  deliverables: Array<{
    deliverableId: string;
    quantity: number;
  }>;
};

export default async function SprintBuilderPage() {
  await ensureSchema();
  const pool = getPool();

  // Fetch deliverables
  const deliverablesResult = await pool.query(`
    SELECT id, name, description, category, scope, points
    FROM deliverables
    WHERE active = true
    ORDER BY category ASC, name ASC
  `);

  // Fetch packages
  const packagesResult = await pool.query(`
    SELECT 
      sp.id,
      sp.name,
      sp.slug,
      sp.tagline,
      sp.emoji,
      COALESCE(
        json_agg(
          json_build_object(
            'deliverableId', spd.deliverable_id,
            'quantity', spd.quantity
          ) ORDER BY spd.sort_order ASC
        ) FILTER (WHERE spd.deliverable_id IS NOT NULL),
        '[]'
      ) as deliverables
    FROM sprint_packages sp
    LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
    WHERE sp.active = true
    GROUP BY sp.id
    ORDER BY sp.sort_order ASC, sp.name ASC
  `);

  const deliverables: Deliverable[] = deliverablesResult.rows;
  const packages: Package[] = packagesResult.rows;

  return <SprintBuilderClient deliverables={deliverables} packages={packages} />;
}

