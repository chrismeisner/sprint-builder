import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import PurchaseButton from "./PurchaseButton";

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
  flat_fee: number | null;      // NULL = dynamic pricing (most packages)
  flat_hours: number | null;    // NULL = dynamic hours (most packages)
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
  
  // Check if user is logged in
  const user = await getCurrentUser();

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
            'complexityScore', COALESCE(spd.complexity_score, 1.0)
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

  // Calculate totals dynamically from deliverables (base complexity 1.0)
  // Packages NEVER have stored flat_fee - always calculated from deliverables
  let totalHours = 0;
  let totalPrice = 0;
  let totalPoints = 0;

  pkg.deliverables.forEach((d) => {
    const baseHours = d.fixedHours ?? 0;
    const basePrice = d.fixedPrice ?? 0;
    const points = d.defaultEstimatePoints ?? 0;
    const qty = d.quantity ?? 1;
    // Base complexity is 1.0 (no adjustment)
    const complexityMultiplier = d.complexityScore ?? 1.0;
    
    // Apply complexity adjustment to hours and price
    totalHours += baseHours * complexityMultiplier * qty;
    totalPrice += basePrice * complexityMultiplier * qty;
    totalPoints += points * qty;
  });

  // Always use calculated values (no stored flat_fee)
  const finalPrice = totalPrice;
  const finalHours = totalHours;

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
          </div>
          <PurchaseButton 
            packageSlug={pkg.slug} 
            packageName={pkg.name}
            isLoggedIn={!!user}
          />
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
                          {(d.fixedHours * (d.complexityScore ?? 1.0)).toFixed(1)}h
                          {d.complexityScore !== 1.0 && (
                            <span className="opacity-60"> (base: {d.fixedHours}h)</span>
                          )}
                        </span>
                      )}
                      {d.fixedPrice != null && (
                        <>
                          <span>•</span>
                          <span>
                            ${(d.fixedPrice * (d.complexityScore ?? 1.0)).toLocaleString()}
                            {d.complexityScore !== 1.0 && (
                              <span className="opacity-60"> (base: ${d.fixedPrice.toLocaleString()})</span>
                            )}
                          </span>
                        </>
                      )}
                      {d.complexityScore !== 1.0 && (
                        <>
                          <span>•</span>
                          <span className="font-medium">
                            Complexity: {d.complexityScore}x
                            {d.complexityScore < 1.0 && " (simpler)"}
                            {d.complexityScore > 1.0 && " (more complex)"}
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
                  const complexityMultiplier = d.complexityScore ?? 1.0;
                  const adjustedHours = (d.fixedHours ?? 0) * complexityMultiplier * d.quantity;
                  const adjustedPrice = (d.fixedPrice ?? 0) * complexityMultiplier * d.quantity;
                  
                  return (
                    <tr key={`${d.deliverableId}-${i}`} className="border-t border-black/10 dark:border-white/10">
                      <td className="px-4 py-3">
                        {d.name}
                        {d.complexityScore !== 1.0 && (
                          <span className="ml-2 text-xs opacity-60">
                            ({d.complexityScore}x complexity)
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
                <tr className="border-t-2 border-black/20 dark:border-white/20 font-bold text-lg">
                  <td className="px-4 py-3">Package Total</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right">{finalHours.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-right">${finalPrice.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* What Happens Next */}
      <section className="py-12 px-6 bg-gray-50 dark:bg-gray-900/30 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">What happens after you purchase?</h2>
            <p className="text-sm opacity-70">5 simple steps to activate your sprint</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold">Review Draft Sprint Deliverables</h3>
                <p className="text-xs opacity-70 mt-0.5">Check scope, prices, and timeline match your needs.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold">Confirm Deliverables with Studio</h3>
                <p className="text-xs opacity-70 mt-0.5">Approve the draft sprint or request an optional 15-min discovery call.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold">Choose Your Kickoff Monday</h3>
                <p className="text-xs opacity-70 mt-0.5">Select your preferred start date from available Mondays.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold">Sign Sprint Agreement</h3>
                <p className="text-xs opacity-70 mt-0.5">Auto-generated with your deliverables, pricing, and schedule.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                5
              </div>
              <div>
                <h3 className="font-semibold">Pay 50% Deposit</h3>
                <p className="text-xs opacity-70 mt-0.5">Secure your sprint slot (Stripe link provided).</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700 text-center">
            <p className="text-sm font-semibold">
              ✅ Once complete → Your Sprint Is Locked In
            </p>
            <p className="text-xs opacity-70 mt-1">
              Kickoff starts on your scheduled Monday.
            </p>
          </div>
        </div>
      </section>

      {/* Week 1 Alignment Guarantee */}
      <section className="py-12 px-6 bg-blue-50 dark:bg-blue-950/20 border-y border-blue-200 dark:border-blue-800">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 text-3xl">⭐</div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                Week 1 Alignment Guarantee
              </h3>
              <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200 leading-relaxed">
                We believe the most important part of any sprint is nailing the direction before execution. If at the end of Week 1 you feel we haven&apos;t aligned on a clear, confident solution direction — for any reason — you may choose to end the sprint.
              </p>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0">🔹</span>
                  <span>No additional payment required</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0">🔹</span>
                  <span>We retain the 50% deposit to cover Week 1 strategy, exploration, and direction work</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0">🔹</span>
                  <span>You keep all Week 1 insights and artifacts</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0">🔹</span>
                  <span>The sprint ends with no obligation to continue</span>
                </div>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 opacity-80 italic pt-2">
                This ensures you never feel &quot;locked in&quot; to a direction that isn&apos;t working — and it gives us strong incentives to nail Week 1 alignment.
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 opacity-80 pt-3">
                Feel free to pick up where we left off by booking another sprint in the future with more insights or revised direction.
              </p>
            </div>
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
          <PurchaseButton 
            packageSlug={pkg.slug} 
            packageName={pkg.name}
            isLoggedIn={!!user}
          />
        </div>
      </section>
    </main>
  );
}

