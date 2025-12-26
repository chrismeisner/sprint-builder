import { ensureSchema, getPool } from "@/lib/db";
import SprintPackageFormClient from "../SprintPackageFormClient";

export const dynamic = "force-dynamic";

type Deliverable = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  scope: string | null;
  points: number | null;
};

export default async function NewSprintPackagePage() {
  await ensureSchema();
  const pool = getPool();

  // Fetch all active deliverables for selection
  const result = await pool.query(`
    SELECT id, name, description, category, scope, points
    FROM deliverables
    WHERE active = true
    ORDER BY name ASC
  `);

  const deliverables: Deliverable[] = result.rows;

  return <SprintPackageFormClient deliverables={deliverables} />;
}

