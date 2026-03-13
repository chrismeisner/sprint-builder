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
      CASE
        WHEN 'Branding' = ANY(d.categories) THEN 'Branding'
        WHEN 'Product' = ANY(d.categories) THEN 'Product'
        ELSE COALESCE(d.category, d.categories[1])
      END AS category,
      CASE
        WHEN d.categories IS NOT NULL AND array_length(d.categories, 1) IS NOT NULL THEN d.categories
        WHEN d.category IS NOT NULL AND btrim(d.category) <> '' THEN ARRAY[d.category]::text[]
        ELSE '{}'::text[]
      END AS categories,
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
    GROUP BY d.id, d.name, d.description, d.category, d.categories, d.points, d.scope, d.format, d.active, d.created_at, d.updated_at
    ORDER BY d.active DESC, d.name ASC
    `
  );
  type Row = {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    categories: string[];
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


