import { ensureSchema, getPool } from "@/lib/db";
import DeliverablesClient from "./DeliverablesClient";

export const dynamic = "force-dynamic";

export default async function DeliverablesPage() {
  await ensureSchema();
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, name, description, category, deliverable_type, default_estimate_points, fixed_hours, fixed_price, scope, active, created_at, updated_at
     FROM deliverables
     ORDER BY active DESC, deliverable_type ASC, name ASC`
  );
  type Row = {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    deliverable_type: string | null;
    default_estimate_points: number | null;
    fixed_hours: number | null;
    fixed_price: number | null;
    scope: string | null;
    active: boolean;
    created_at: string | Date;
    updated_at: string | Date;
  };
  const rows = res.rows as Row[];

  return <DeliverablesClient rows={rows} />;
}


