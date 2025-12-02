import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ensureSchema, getPool } from "@/lib/db";
import ComponentsClient from "./ComponentsClient";
import type { SprintPackage } from "@/app/components/PackageCard";

export default async function ComponentsPage() {
  const user = await getCurrentUser();
  
  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  await ensureSchema();
  const pool = getPool();

  const result = await pool.query(
    `
      SELECT 
        sp.id,
        sp.name,
        sp.slug,
        sp.description,
        sp.category,
        sp.package_type,
        sp.tagline,
        sp.featured,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'deliverableId', d.id,
                'name', d.name,
                'description', d.description,
                'scope', d.scope,
                'fixedHours', d.fixed_hours,
                'fixedPrice', d.fixed_price,
                'quantity', spd.quantity,
                'complexityScore', COALESCE(spd.complexity_score, 1.0)
              )
              ORDER BY spd.sort_order ASC, d.name ASC
            )
            FROM sprint_package_deliverables spd
            LEFT JOIN deliverables d ON spd.deliverable_id = d.id AND d.active = true
            WHERE spd.sprint_package_id = sp.id
          ),
          '[]'::json
        ) AS deliverables
      FROM sprint_packages sp
      WHERE sp.active = true
      ORDER BY 
        CASE WHEN sp.package_type = 'foundation' THEN 0 ELSE 1 END,
        sp.featured DESC,
        sp.sort_order ASC,
        sp.name ASC
      LIMIT 3
    `
  );

  const samplePackages = (result.rows as SprintPackage[]) ?? [];

  return <ComponentsClient samplePackages={samplePackages} />;
}

