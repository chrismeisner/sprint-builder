import { ensureSchema, getPool } from "@/lib/db";
import { notFound } from "next/navigation";
import DeliverableDetailClient from "./DeliverableDetailClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function DeliverableDetailPage({ params }: PageProps) {
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
    WHERE d.id = $1
    GROUP BY d.id, d.name, d.description, d.category, d.categories, d.points, d.scope, d.format, d.active, d.created_at, d.updated_at
    `,
    [params.id]
  );
  if (res.rowCount === 0) {
    notFound();
  }
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
  const row = res.rows[0] as Row;

  const allTagsRes = await pool.query(
    `
      SELECT name
      FROM deliverable_tags
      ORDER BY name ASC
    `
  );
  const availableTags = allTagsRes.rows.map((r) => r.name as string);

  return <DeliverableDetailClient row={row} availableTags={availableTags} />;
}


