import { ensureSchema, getPool } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

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
    defaultEstimatePoints: number | null;
    quantity: number;
    complexityScore: number;
  }>;
};

export default async function PackageDetailPage({ params }: PageProps) {
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
      sp.flat_fee,
      sp.flat_hours,
      sp.discount_percentage,
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
            'defaultEstimatePoints', d.default_estimate_points,
            'quantity', spd.quantity,
            'complexityScore', COALESCE(spd.complexity_score, 2.5)
          ) ORDER BY spd.sort_order ASC, d.name ASC
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'
      ) as deliverables
    FROM sprint_packages sp
    LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
    LEFT JOIN deliverables d ON spd.deliverable_id = d.id AND d.active = true
    WHERE sp.slug = $1 AND sp.active = true
    GROUP BY sp.id
  `,
    [params.slug]
  );

  if (result.rowCount === 0) {
    notFound();
  }

  const pkg: Package = result.rows[0];

  // Calculate totals with complexity adjustments
  // Complexity multiplier: (complexity_score / 2.5) where 2.5 is standard
  let totalHours = 0;
  let totalPrice = 0;
  let totalPoints = 0;

  pkg.deliverables.forEach((d) => {
    const baseHours = d.fixedHours ?? 0;
    const basePrice = d.fixedPrice ?? 0;
    const points = d.defaultEstimatePoints ?? 0;
    const qty = d.quantity ?? 1;
    const complexityMultiplier = (d.complexityScore ?? 2.5) / 2.5;
    
    // Apply complexity adjustment to hours and price
    totalHours += baseHours * complexityMultiplier * qty;
    totalPrice += basePrice * complexityMultiplier * qty;
    totalPoints += points * qty;
  });

  const finalPrice = pkg.flat_fee ?? (pkg.discount_percentage != null
    ? totalPrice * (1 - pkg.discount_percentage / 100)
    : totalPrice);
  const finalHours = pkg.flat_hours ?? totalHours;
  const savings = pkg.flat_fee != null && totalPrice > pkg.flat_fee
    ? totalPrice - pkg.flat_fee
    : pkg.discount_percentage != null
    ? totalPrice - finalPrice
    : 0;

  return (
    <main className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <section className="bg-gradient-to-b from-black to-gray-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/packages"
            className="inline-flex items-center text-sm opacity-80 hover:opacity-100 mb-4"
          >
            ← Back to all packages
          </Link>
          {pkg.featured && (
            <div className="inline-flex items-center rounded-full bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-medium mb-4 ml-3">
              ⭐ Featured Package
            </div>
          )}
          {pkg.category && (
            <div className="inline-flex items-center rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium mb-4 ml-2">
              {pkg.category}
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">{pkg.name}</h1>
          {pkg.tagline && <p className="text-xl opacity-90 mb-6">{pkg.tagline}</p>}
          {pkg.description && <p className="text-lg opacity-80">{pkg.description}</p>}
        </div>
      </section>

      {/* Pricing & CTA */}
      <section className="border-b border-black/10 dark:border-white/10 py-8 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-5xl font-bold">${finalPrice.toLocaleString()}</span>
              <span className="text-lg opacity-70">fixed price</span>
            </div>
            <div className="flex items-center gap-4 text-sm opacity-80">
              <span>{finalHours} hours</span>
              <span>•</span>
              <span>2-week sprint</span>
              {totalPoints > 0 && (
                <>
                  <span>•</span>
                  <span>{totalPoints} story points</span>
                </>
              )}
            </div>
            {savings > 0 && (
              <p className="text-sm text-green-700 dark:text-green-400 mt-2">
                💰 Save ${savings.toLocaleString()} vs. purchasing deliverables separately
              </p>
            )}
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-8 py-4 text-lg font-medium hover:scale-105 transition-transform"
          >
            Get Started →
          </Link>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">What&apos;s Included</h2>
          <div className="space-y-6">
            {pkg.deliverables.map((d, i) => (
              <div
                key={`${d.deliverableId}-${i}`}
                className="rounded-lg border border-black/10 dark:border-white/10 p-6 hover:border-black/20 dark:hover:border-white/20 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-bold">
                    ✓
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {d.name}
                      {d.quantity > 1 && (
                        <span className="ml-2 text-sm opacity-70">(×{d.quantity})</span>
                      )}
                    </h3>
                    {d.description && <p className="text-sm opacity-80 mb-3">{d.description}</p>}
                    {d.scope && (
                      <div className="text-sm opacity-80 whitespace-pre-wrap bg-black/5 dark:bg-white/5 rounded p-3">
                        {d.scope}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs opacity-70">
                      {d.fixedHours != null && (
                        <span>
                          {(d.fixedHours * ((d.complexityScore ?? 2.5) / 2.5)).toFixed(1)}h
                          {d.complexityScore !== 2.5 && (
                            <span className="opacity-60"> (base: {d.fixedHours}h)</span>
                          )}
                        </span>
                      )}
                      {d.fixedPrice != null && (
                        <>
                          <span>•</span>
                          <span>
                            ${(d.fixedPrice * ((d.complexityScore ?? 2.5) / 2.5)).toLocaleString()}
                            {d.complexityScore !== 2.5 && (
                              <span className="opacity-60"> (base: ${d.fixedPrice.toLocaleString()})</span>
                            )}
                          </span>
                        </>
                      )}
                      {d.complexityScore !== 2.5 && (
                        <>
                          <span>•</span>
                          <span className="font-medium">
                            Complexity: {d.complexityScore}
                            {d.complexityScore < 2.5 && " (simpler)"}
                            {d.complexityScore > 2.5 && " (more complex)"}
                          </span>
                        </>
                      )}
                      {d.defaultEstimatePoints != null && (
                        <>
                          <span>•</span>
                          <span>{d.defaultEstimatePoints} story points</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Breakdown */}
      <section className="py-12 px-6 bg-black/5 dark:bg-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Package Breakdown</h2>
          <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/5 dark:bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Deliverable</th>
                  <th className="text-center px-4 py-3 font-semibold">Qty</th>
                  <th className="text-right px-4 py-3 font-semibold">Hours</th>
                  <th className="text-right px-4 py-3 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {pkg.deliverables.map((d, i) => {
                  const complexityMultiplier = (d.complexityScore ?? 2.5) / 2.5;
                  const adjustedHours = (d.fixedHours ?? 0) * complexityMultiplier * d.quantity;
                  const adjustedPrice = (d.fixedPrice ?? 0) * complexityMultiplier * d.quantity;
                  
                  return (
                    <tr key={`${d.deliverableId}-${i}`} className="border-t border-black/10 dark:border-white/10">
                      <td className="px-4 py-3">
                        {d.name}
                        {d.complexityScore !== 2.5 && (
                          <span className="ml-2 text-xs opacity-60">
                            (complexity: {d.complexityScore})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{d.quantity}</td>
                      <td className="px-4 py-3 text-right">
                        {adjustedHours.toFixed(1)}h
                      </td>
                      <td className="px-4 py-3 text-right">
                        ${adjustedPrice.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-black/20 dark:border-white/20 font-semibold">
                  <td className="px-4 py-3">Subtotal</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right">{totalHours}h</td>
                  <td className="px-4 py-3 text-right">${totalPrice.toLocaleString()}</td>
                </tr>
                {savings > 0 && (
                  <tr className="text-green-700 dark:text-green-400">
                    <td className="px-4 py-3">
                      {pkg.discount_percentage != null
                        ? `Package Discount (${pkg.discount_percentage}%)`
                        : "Package Savings"}
                    </td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3 text-right">-${savings.toLocaleString()}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-black/20 dark:border-white/20 font-bold text-lg">
                  <td className="px-4 py-3">Package Total</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right">{finalHours}h</td>
                  <td className="px-4 py-3 text-right">${finalPrice.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to start your sprint?</h2>
          <p className="text-lg opacity-80 mb-8">
            Tell us about your project and we&apos;ll get you set up with this package.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black px-8 py-4 text-lg font-medium hover:scale-105 transition-transform"
          >
            Get Started with {pkg.name} →
          </Link>
        </div>
      </section>
    </main>
  );
}

