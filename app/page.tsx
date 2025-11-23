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
  'Foundation Workshop': '🎯',
  'Mini Foundation Workshop': '⚡',
  'Sprint Kickoff Workshop': '🎯',
  'Wordmark Logo': '✏️',
  'Typography Scale + Wordmark Logo': '✏️',
  'Brand Style Guide': '📋',
  'Landing Page': '🚀',
  'Landing Page (Marketing)': '🚀',
  'Working Prototype': '💻',
  'Prototype - Level 1 (Basic)': '💻',
  'Social Media Kit': '📱',
  'Social Media Template Kit': '📱',
  'Pitch Deck': '📊',
  'Pitch Deck Template (Branded)': '📊',
  'UX Audit + Recommendations': '🔍',
};

function getDeliverableEmoji(name: string): string {
  return deliverableEmojis[name] || '✓';
}

export default async function Home() {
  await ensureSchema();
  const pool = getPool();

  // Fetch the two featured foundation packages for the homepage
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
      AND sp.featured = true
      AND sp.slug IN ('branding-foundations-sprint', 'product-foundations-sprint')
    GROUP BY sp.id
    ORDER BY sp.sort_order ASC
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
          <div className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-black/70 dark:text-white/70">
            Foundation Sprint → Extend &amp; Iterate Sprints
          </div>
          <h1 className="text-huge font-gt-compressed-black">
            LET&apos;S BUILD
          </h1>
          <p className="text-lg sm:text-xl opacity-80">
            Turn your vision into a structured 2-week sprint—no endless meetings, no scope creep, just results.
          </p>
          <p className="text-base opacity-70 max-w-xl mx-auto">
            Start with a Brand or Product Foundation Sprint. We run a strategic workshop, ship your core deliverables in 10 working days, and create the source of truth for every build that follows.
          </p>
          <p className="text-sm sm:text-base opacity-70 max-w-xl mx-auto">
            Once your foundation is locked, you can book Extend &amp; Iterate sprints (also 2 weeks) whenever you need a launch, feature, or refresh—no repeat discovery.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="#foundation-packages"
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              View Foundation Packages
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              How it works
            </Link>
            <Link
              href="#extend-iterate"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Extend &amp; Iterate
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

      {/* Foundation Packages - Primary CTAs */}
      <section id="foundation-packages" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Start with a Foundation Sprint
          </h2>
          <p className="text-base sm:text-lg opacity-70 max-w-2xl mx-auto">
            Every new client begins with our Foundation Workshop—strategic alignment that sets the direction for your entire sprint.
          </p>
          <p className="text-sm sm:text-base opacity-60 max-w-2xl mx-auto">
            Complete Brand or Product Foundations in 2 weeks, then unlock Extend &amp; Iterate sprints so you can keep building without redoing discovery.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {packages.map((pkg) => {
            const { price, hours } = calculatePackageTotal(pkg);
            
            return (
              <Link 
                key={pkg.id}
                href={`/packages/${pkg.slug}`}
                className="rounded-lg border-2 border-black/10 dark:border-white/15 bg-white dark:bg-black p-8 space-y-6 hover:border-black/30 dark:hover:border-white/30 hover:shadow-xl transition"
              >
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold">{pkg.name}</h3>
                  <p className="text-base opacity-80 leading-relaxed">
                    {pkg.description}
                  </p>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="font-semibold opacity-90">What you get:</div>
                  <div className="space-y-2 opacity-80">
                    {pkg.deliverables.map((deliverable, idx) => (
                      <div key={`${deliverable.deliverableId}-${idx}`} className="flex items-start gap-2">
                        <span className="text-base mt-0.5">{getDeliverableEmoji(deliverable.name)}</span>
                        <span>
                          {deliverable.name}
                          {deliverable.quantity > 1 && ` (×${deliverable.quantity})`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-black/10 dark:border-white/15">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold">${price.toLocaleString()}</span>
                    <span className="text-sm opacity-60">fixed price</span>
                  </div>
                  <div className="text-sm opacity-60">{Math.round(hours)} hours · 2 weeks · 50% deposit to start</div>
                </div>

                <div className="pt-4">
                  <span className="inline-flex items-center text-sm font-semibold">
                    Learn more & get started →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/packages"
            className="inline-flex items-center text-sm font-medium opacity-70 hover:opacity-100 transition underline"
          >
            View all sprint packages →
          </Link>
        </div>
      </section>

      {/* Returning Clients Section */}
      <section
        id="extend-iterate"
        className="bg-black/[0.02] dark:bg-white/[0.02] py-16 px-6"
      >
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Extend &amp; Iterate Sprints
          </h2>
          <p className="text-base sm:text-lg opacity-80 max-w-2xl mx-auto">
            After your foundation sprint, stack additional 2-week sprints whenever you need to ship a landing page, prototype, feature release, or brand refresh. We reuse your original workshop insights—no re-onboarding, just execution.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/intake"
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              Request your next sprint
            </Link>
            <Link
              href="/packages"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Browse deliverables
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Review the process
            </Link>
          </div>
          <p className="text-xs sm:text-sm opacity-60 max-w-lg mx-auto pt-2">
            Unlocked after Brand or Product Foundations. Each Extend &amp; Iterate sprint starts with a 1-hour Mini Foundation session to realign, then we execute for 10 working days.
          </p>
        </div>
      </section>
    </main>
  );
}
