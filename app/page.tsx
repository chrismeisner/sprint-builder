import Link from "next/link";
import { ensureSchema, getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

type Package = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  flat_fee: number | null;
  flat_hours: number | null;
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

// Emoji map for deliverable types
const deliverableEmojis: Record<string, string> = {
  'Sprint Kickoff Workshop': '🎯',
  'Wordmark Logo': '✏️',
  'Brand Style Guide': '📋',
  'Landing Page': '🚀',
  'Working Prototype': '💻',
  'Social Media Kit': '📱',
  'Pitch Deck': '📊',
};

function getDeliverableEmoji(name: string): string {
  return deliverableEmojis[name] || '✓';
}

export default async function Home() {
  await ensureSchema();
  const pool = getPool();

  // Fetch the three featured packages for the homepage
  const result = await pool.query(`
    SELECT 
      sp.id,
      sp.name,
      sp.slug,
      sp.description,
      sp.tagline,
      sp.flat_fee,
      sp.flat_hours,
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
      AND sp.slug IN ('brand-identity-sprint', 'mvp-launch-sprint', 'startup-branding-sprint')
    GROUP BY sp.id
    ORDER BY 
      CASE sp.slug 
        WHEN 'brand-identity-sprint' THEN 1
        WHEN 'mvp-launch-sprint' THEN 2
        WHEN 'startup-branding-sprint' THEN 3
      END
  `);

  const packages: Package[] = result.rows;

  // Calculate package totals from deliverables
  function calculatePackageTotal(pkg: Package): { hours: number; price: number } {
    let totalHours = 0;
    let totalPrice = 0;

    pkg.deliverables.forEach((d) => {
      const baseHours = d.fixedHours ?? 0;
      const basePrice = d.fixedPrice ?? 0;
      const qty = d.quantity ?? 1;
      const complexityMultiplier = d.complexityScore ?? 1.0;
      
      totalHours += baseHours * complexityMultiplier * qty;
      totalPrice += basePrice * complexityMultiplier * qty;
    });

    return { hours: totalHours, price: totalPrice };
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="min-h-[60vh] grid place-items-center p-6">
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <h1 className="text-huge font-gt-compressed-black">
            LET&apos;S BUILD
          </h1>
          <p className="text-lg sm:text-xl opacity-80">
            Turn your vision into a structured 2-week sprint—no endless meetings, no scope creep, just results.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              How it works
            </Link>
            <Link
              href="https://form.typeform.com/to/eEiCy7Xj"
              target="_blank"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Start your sprint →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - Condensed */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              From idea to execution in 3 steps
            </h2>
            <p className="text-base sm:text-lg opacity-70 max-w-2xl mx-auto">
              Built for founders who need to move fast without sacrificing quality
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {/* Step 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-lg font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold">Scope & Schedule</h3>
              </div>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed">
                Fill out a quick intake form. We&apos;ll analyze your needs and generate a personalized sprint proposal with specific deliverables, fixed pricing, and a 2-week timeline. Review it, book your kickoff Monday, and lock in your spot with a 50% deposit.
              </p>
              <div className="text-xs sm:text-sm opacity-60 pt-2">
                📋 Fixed pricing, clear deliverables
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-lg font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold">Kickoff & Go Uphill</h3>
              </div>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed">
                Week 1 starts with a discovery workshop on Monday. Then we create direction options, present solutions for your review, collect feedback, and refine. By Friday, we&apos;ve locked in one clear direction—no more second-guessing, just execution mode.
              </p>
              <div className="text-xs sm:text-sm opacity-60 pt-2">
                ⛰️ Regular check-ins, async by default
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-lg font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold">Execute & Deliver</h3>
              </div>
              <p className="text-sm sm:text-base opacity-80 leading-relaxed">
                Week 2 is all execution. Monday we revisit deliverables and map the solution to what we&apos;re building, Tuesday-Thursday we execute and refine, Wednesday we review progress together. Friday: final delivery, demo walkthrough, and handoff. Pay the remaining 50% and you&apos;re ready to launch.
              </p>
              <div className="text-xs sm:text-sm opacity-60 pt-2">
                🏁 Done in 10 days, no exceptions
              </div>
            </div>
          </div>

          <div className="text-center pt-6 space-y-3">
            <Link
              href="/how-it-works"
              className="inline-flex items-center text-sm font-medium opacity-70 hover:opacity-100 transition underline"
            >
              See the full process →
            </Link>
            <p className="text-xs opacity-60 max-w-md mx-auto">
              After booking, you&apos;ll complete a simple 5-step checklist to activate your sprint (most complete in under 10 minutes).
            </p>
          </div>
        </div>
      </section>

      {/* Sample Sprints */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Sample sprints
          </h2>
          <p className="text-base sm:text-lg opacity-70 max-w-2xl mx-auto">
            Ready-to-go packages with fixed pricing, or{" "}
            <Link href="https://form.typeform.com/to/eEiCy7Xj" target="_blank" className="font-medium underline hover:opacity-90 transition">
              customize your own
            </Link>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const { price, hours } = calculatePackageTotal(pkg);
            
            return (
              <Link 
                key={pkg.id}
                href={`/packages/${pkg.slug}`}
                className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4 hover:border-black/20 dark:hover:border-white/25 hover:shadow-lg transition"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{pkg.name}</h3>
                  <p className="text-sm opacity-70">
                    {pkg.tagline || pkg.description}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="font-medium opacity-90">Includes:</div>
                  <div className="space-y-1 opacity-80">
                    {pkg.deliverables.slice(0, 4).map((deliverable, idx) => (
                      <div key={`${deliverable.deliverableId}-${idx}`} className="flex items-start gap-2">
                        <span className="text-xs mt-0.5">{getDeliverableEmoji(deliverable.name)}</span>
                        <span>
                          {deliverable.name}
                          {deliverable.quantity > 1 && ` (×${deliverable.quantity})`}
                        </span>
                      </div>
                    ))}
                    {pkg.deliverables.length > 4 && (
                      <div className="text-xs opacity-60 pl-5">
                        + {pkg.deliverables.length - 4} more
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-black/10 dark:border-white/15">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">${price.toLocaleString()}</span>
                    <span className="text-xs opacity-60">fixed</span>
                  </div>
                  <div className="text-xs opacity-60 mt-1">{Math.round(hours)} hours · 2 weeks</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/packages"
            className="inline-flex items-center text-sm font-medium opacity-70 hover:opacity-100 transition underline"
          >
            View all packages →
          </Link>
        </div>
      </section>
    </main>
  );
}
