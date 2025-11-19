import { ensureSchema, getPool } from "@/lib/db";
import SprintPackagesClient from "./SprintPackagesClient";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  tagline: string | null;
  flat_fee: number | null;
  flat_hours: number | null;
  discount_percentage: number | null;
  active: boolean;
  featured: boolean;
  sort_order: number;
  created_at: string | Date;
  updated_at: string | Date;
  deliverables: Array<{
    deliverableId: string;
    name: string;
    fixedHours: number | null;
    fixedPrice: number | null;
    quantity: number;
  }>;
};

export default async function SprintPackagesPage() {
  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(`
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
      sp.created_at,
      sp.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'deliverableId', d.id,
            'name', d.name,
            'fixedHours', d.fixed_hours,
            'fixedPrice', d.fixed_price,
            'quantity', spd.quantity
          ) ORDER BY spd.sort_order ASC, d.name ASC
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'
      ) as deliverables
    FROM sprint_packages sp
    LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
    LEFT JOIN deliverables d ON spd.deliverable_id = d.id
    GROUP BY sp.id
    ORDER BY sp.featured DESC, sp.sort_order ASC, sp.name ASC
  `);

  const rows: Row[] = result.rows;

  return <SprintPackagesClient rows={rows} />;
}

