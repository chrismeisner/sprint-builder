import { ensureSchema, getPool } from "@/lib/db";
import DeliverablesClient from "./DeliverablesClient";

export const dynamic = "force-dynamic";

export default async function DeliverablesPage() {
  await ensureSchema();
  const pool = getPool();
  const res = await pool.query(
    `SELECT id, name, description, category, points, scope, format, active, created_at, updated_at
     FROM deliverables
     ORDER BY active DESC, name ASC`
  );
  type Row = {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    points: number | null;
    scope: string | null;
    format: string | null;
    active: boolean;
    created_at: string | Date;
    updated_at: string | Date;
  };
  const rows = res.rows as Row[];

  return <DeliverablesClient rows={rows} />;
}


