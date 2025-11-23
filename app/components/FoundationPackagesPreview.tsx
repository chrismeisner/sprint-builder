import Link from "next/link";
import { ensureSchema, getPool } from "@/lib/db";

type PackageDeliverable = {
  deliverableId: string;
  name: string;
  description: string | null;
  scope: string | null;
  fixedHours: number | null;
  fixedPrice: number | null;
  quantity: number;
  complexityScore: number;
};

type SprintPackage = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  tagline: string | null;
  deliverables: PackageDeliverable[];
};

type FoundationPackagesPreviewProps = {
  heading?: string;
  description?: string;
  ctaLabel?: string;
  limit?: number;
};

function calculatePackageTotal(pkg: SprintPackage) {
  return pkg.deliverables.reduce(
    (totals, d) => {
      const multiplier = d.complexityScore ?? 1;
      const qty = d.quantity ?? 1;
      totals.price += (d.fixedPrice ?? 0) * multiplier * qty;
      totals.hours += (d.fixedHours ?? 0) * multiplier * qty;
      return totals;
    },
    { price: 0, hours: 0 }
  );
}

export default async function FoundationPackagesPreview({
  heading = "Example packages",
  description = "Pulled straight from our sprint packages table—start with one of these or browse every foundation option and customize from there.",
  ctaLabel = "browse every foundation option",
  limit = 2,
}: FoundationPackagesPreviewProps) {
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
        sp.tagline,
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
      GROUP BY 
        sp.id,
        sp.name,
        sp.slug,
        sp.description,
        sp.category,
        sp.tagline,
        sp.featured,
        sp.sort_order
      ORDER BY sp.featured DESC, sp.sort_order ASC, sp.name ASC
      LIMIT $1
    `,
    [limit]
  );
  const packages: SprintPackage[] = result.rows;

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
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
        <div className="grid md:grid-cols-2 gap-6">
          {packages.map((pkg) => {
            const { price, hours } = calculatePackageTotal(pkg);
            const snippet = pkg.description ?? pkg.tagline ?? "Fixed-scope sprint package.";
            const highlights = pkg.deliverables.slice(0, 3);

            return (
              <Link
                key={pkg.id}
                href={`/packages/${pkg.slug}`}
                className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4 hover:border-black/20 dark:hover:border-white/25 hover:shadow-lg transition"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{pkg.name}</h3>
                  <p className="text-sm opacity-70">{snippet}</p>
                </div>

                {highlights.length > 0 && (
                  <div className="space-y-2 text-sm">
                    <div className="font-medium opacity-90">Includes:</div>
                    <div className="space-y-1 opacity-80">
                      {highlights.map((d, idx) => (
                        <div key={`${pkg.id}-${d.deliverableId}-${idx}`} className="flex items-start gap-2">
                          <span className="text-xs mt-0.5">•</span>
                          <span>{d.name}</span>
                        </div>
                      ))}
                      {pkg.deliverables.length > highlights.length && (
                        <div className="text-xs opacity-60 italic">
                          + {pkg.deliverables.length - highlights.length} more deliverable
                          {pkg.deliverables.length - highlights.length === 1 ? "" : "s"}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-black/10 dark:border-white/15">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">${price.toLocaleString()}</span>
                    <span className="text-sm opacity-60">fixed price</span>
                  </div>
                  <div className="text-sm opacity-60 mt-1">
                    {Math.round(hours)} hours · 2 weeks
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

