import { ensureSchema, getPool } from "@/lib/db";
import DeliverablesClient from "./DeliverablesClient";

export const dynamic = "force-dynamic";

export default async function DeliverablesPage() {
  await ensureSchema();
  const pool = getPool();
  const res = await pool.query(
    `
    SELECT
      d.id,
      d.name,
      d.description,
      d.category,
      d.points,
      d.scope,
      d.format,
      d.active,
      d.created_at,
      d.updated_at,
      COALESCE(array_remove(array_agg(dt.name ORDER BY dt.name), NULL), '{}') AS tags
    FROM deliverables d
    LEFT JOIN deliverable_tag_links dtl ON dtl.deliverable_id = d.id
    LEFT JOIN deliverable_tags dt ON dt.id = dtl.tag_id
    GROUP BY d.id, d.name, d.description, d.category, d.points, d.scope, d.format, d.active, d.created_at, d.updated_at
    ORDER BY d.active DESC, d.name ASC
    `
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
    tags: string[];
  };
  const rows = res.rows as Row[];

  return <DeliverablesClient rows={rows} />;
}


