import Link from "next/link";
import { ensureSchema, getPool } from "@/lib/db";
import PackageCard, { type SprintPackage } from "./PackageCard";
import { resolveComponentGridPreset } from "./componentGrid";

type FoundationPackagesPreviewProps = {
  heading?: string;
  description?: string;
  ctaLabel?: string;
  limit?: number;
  packageType?: "foundation" | "extend";
  variant?: "default" | "compact" | "detailed";
};

export default async function FoundationPackagesPreview({
  heading = "Example packages",
  description = "Pulled straight from our sprint packages table—start with one of these or browse every foundation option and customize from there.",
  ctaLabel = "browse every foundation option",
  limit = 2,
  packageType = "foundation",
  variant = "compact",
}: FoundationPackagesPreviewProps) {
  await ensureSchema();
  const pool = getPool();
  
  // Build WHERE clause based on packageType
  const whereClause = packageType 
    ? `WHERE sp.active = true AND sp.package_type = $1`
    : `WHERE sp.active = true`;
  
  const result = await pool.query(
    `
      SELECT 
        sp.id,
        sp.name,
        sp.slug,
        sp.description,
        sp.package_type,
        sp.tagline,
        sp.emoji,
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
      ${whereClause}
      GROUP BY 
        sp.id,
        sp.name,
        sp.slug,
        sp.description,
        sp.package_type,
        sp.tagline,
        sp.emoji,
        sp.featured,
        sp.sort_order
      ORDER BY sp.featured DESC, sp.sort_order ASC, sp.name ASC
      LIMIT $${packageType ? '2' : '1'}
    `,
    packageType ? [packageType, limit] : [limit]
  );
  const packages: SprintPackage[] = result.rows;
  const gridPreset = resolveComponentGridPreset(packages.length || 1);

  return (
    <section className="container max-w-6xl py-16">
      <div className="text-center space-y-2 mb-12">
        <h2 className="text-3xl font-bold">{heading}</h2>
        <p className="text-lg opacity-70 max-w-2xl mx-auto">
          {description}{" "}
          <Link href="/packages" className="font-medium underline hover:opacity-80 transition">
            {ctaLabel}
          </Link>
          .
        </p>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-12 text-sm opacity-70">
          No packages are active yet. Check back soon or{" "}
          <Link href="/packages" className="underline hover:opacity-100">
            talk to us about drafting your sprint
          </Link>
          .
        </div>
      ) : (
        <div className={gridPreset.className} data-component-grid={gridPreset.id}>
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} variant={variant} />
          ))}
        </div>
      )}
    </section>
  );
}

