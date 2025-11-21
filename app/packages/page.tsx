import { ensureSchema, getPool } from "@/lib/db";
import PackagesClient from "./PackagesClient";

export const dynamic = "force-dynamic";

type Package = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  tagline: string | null;
  flat_fee: number | null;
  flat_hours: number | null;
  discount_percentage: number | null;
  featured: boolean;
  deliverables: Array<{
    deliverableId: string;
    name: string;
    description: string | null;
    scope: string | null;
    fixedHours: number | null;
    fixedPrice: number | null;
    quantity: number;
    complexityScore: number;
  }>;
};

export default async function PackagesPage() {
  await ensureSchema();
  const pool = getPool();

  // Fetch only active packages with their deliverables
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
      sp.featured,
      COALESCE(
        json_agg(
          json_build_object(
            'deliverableId', d.id,
            'name', d.name,
            'description', d.description,
            'scope', d.scope,
            'fixedHours', d.fixed_hours,
            'fixedPrice', d.fixed_price,
            'quantity', spd.quantity,
            'complexityScore', COALESCE(spd.complexity_score, 1.0)
          ) ORDER BY spd.sort_order ASC, d.name ASC
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'
      ) as deliverables
    FROM sprint_packages sp
    LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
    LEFT JOIN deliverables d ON spd.deliverable_id = d.id AND d.active = true
    WHERE sp.active = true
    GROUP BY sp.id
    ORDER BY sp.featured DESC, sp.sort_order ASC, sp.name ASC
  `);

  const packages: Package[] = result.rows;

  return <PackagesClient packages={packages} />;
}

