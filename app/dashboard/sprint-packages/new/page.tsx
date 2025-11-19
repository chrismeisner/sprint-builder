import { ensureSchema, getPool } from "@/lib/db";
import SprintPackageFormClient from "../SprintPackageFormClient";

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

export default async function NewSprintPackagePage() {
  await ensureSchema();
  const pool = getPool();

  // Fetch all active deliverables for selection
  const result = await pool.query(`
    SELECT id, name, description, category, scope, fixed_hours, fixed_price, default_estimate_points
    FROM deliverables
    WHERE active = true
    ORDER BY name ASC
  `);

  const deliverables: Deliverable[] = result.rows;

  return <SprintPackageFormClient deliverables={deliverables} />;
}

