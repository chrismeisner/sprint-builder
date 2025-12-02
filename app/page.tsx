import Link from "next/link";
import { ensureSchema, getPool } from "@/lib/db";
import PackageCard, { type SprintPackage } from "./components/PackageCard";
import HeroSection from "./components/HeroSection";
import HowItWorksSteps, { type HowItWorksStep } from "./components/HowItWorksSteps";
import SectionHeader from "./components/SectionHeader";
import { resolveComponentGridPreset } from "./components/componentGrid";

export const dynamic = "force-dynamic";

type Package = SprintPackage & {
  flat_fee: number | null;
  flat_hours: number | null;
};

export default async function Home() {
  await ensureSchema();
  const pool = getPool();

  // Fetch the two featured foundation packages for the homepage
  const foundationResult = await pool.query(`
    SELECT 
      sp.id,
      sp.name,
      sp.slug,
      sp.description,
      sp.category,
      sp.package_type,
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
      AND sp.featured = true
      AND sp.package_type = 'foundation'
      AND sp.slug IN ('branding-foundations-sprint', 'product-foundations-sprint')
    GROUP BY sp.id
    ORDER BY sp.sort_order ASC
  `);

  const foundationPackages: Package[] = foundationResult.rows;

  // Fetch extend/iterate packages for the homepage
  const extendResult = await pool.query(`
    SELECT 
      sp.id,
      sp.name,
      sp.slug,
      sp.description,
      sp.category,
      sp.package_type,
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
      AND sp.package_type = 'extend'
    GROUP BY sp.id
    ORDER BY sp.featured DESC, sp.sort_order ASC
    LIMIT 4
  `);

  const extendPackages: Package[] = extendResult.rows;
  const foundationGridPreset = resolveComponentGridPreset(foundationPackages.length || 1);
  const extendGridPreset = resolveComponentGridPreset(extendPackages.length || 1);


  const howItWorksSteps: HowItWorksStep[] = [
    {
      icon: "1",
      title: "Pick your sprint & lock kickoff",
      description:
        "Choose the sprint you need—start with Brand/Product Foundations or stack an Expansion Sprint once your strategy is set. Every sprint has preset workshops and deliverables so you know exactly what ships in a 2-week (10 working day) arc. Share your preferred Monday kickoff, sign the agreement, pay 50% via Stripe, and your slot is locked.",
      meta: "🎯 Fixed scope, transparent pricing",
    },
    {
      icon: "2",
      title: "Kickoff & go uphill",
      description:
        "Every sprint begins with a Monday alignment session (3-hour workshop for Foundations, 1-hour Mini Foundation for Expansion Sprints). The rest of Week 1 is divergence + alignment—direction options, async updates, Decision Day Thursday, plan locked by Friday so execution is crystal clear.",
      meta: "⛰️ Same uphill cadence for every sprint",
    },
    {
      icon: "3",
      title: "Go downhill & deliver",
      description:
        "Week 2 is execution for the exact deliverables you booked. Monday we map the plan, midweek we run a Work-in-Progress review, Thursday is refinement, and Friday we hand off final files with a Loom walkthrough or live demo. Settle the remaining 50% and you're ready to ship, test, or stack the next sprint.",
      meta: "🏁 Done in 10 working days, every time",
    },
  ];

  return (
    <main className="min-h-screen">
      <HeroSection
        title="Let's climb"
        supportingText={
          <>
            <span className="block">
              Turn your vision into a structured 2-week sprint—no endless meetings, no scope creep, just results.
            </span>
            <span className="block mt-4">
              Start with a Brand or Product Foundation Sprint. We run a strategic workshop, ship your core deliverables in 10 working days, and create
              the source of truth for every build that follows.
            </span>
            <span className="block mt-4">
              Once your foundation is locked, you can book Expansion Sprints (also 2 weeks) whenever you need a launch, feature, or refresh—no repeat
              discovery.{" "}
              <Link href="#expansion-sprints" className="font-semibold underline underline-offset-4">
                Jump to Expansion Sprints
              </Link>
              .
            </span>
          </>
        }
        primaryCta={{ label: "View Foundation Packages", href: "#foundation-packages" }}
        secondaryCta={{ label: "How it works", href: "/how-it-works" }}
      />

      {/* How It Works - Condensed */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16">
        <div className="container max-w-5xl space-y-12">
          <SectionHeader
            label="How it works"
            heading="From idea to execution in 3 moves"
            description="Built for founders who need to move fast without sacrificing quality"
            align="center"
          />

          <HowItWorksSteps steps={howItWorksSteps} className="gap-8 md:gap-6 md:grid-cols-3" />

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
      <section id="foundation-packages" className="container py-16">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Start with a Foundation Sprint
          </h2>
          <p className="text-base sm:text-lg opacity-70 max-w-2xl mx-auto">
            Every new client begins with our Foundation Workshop—strategic alignment that sets the direction for your entire sprint.
          </p>
          <p className="text-sm sm:text-base opacity-60 max-w-2xl mx-auto">
            Complete Brand or Product Foundations in 2 weeks, then unlock Expansion Sprints so you can keep building without redoing discovery.
          </p>
        </div>

        <div
          className={`${foundationGridPreset.className} mb-12`}
          data-component-grid={foundationGridPreset.id}
        >
          {foundationPackages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} variant="detailed" showEmojis={true} />
          ))}
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

      {/* Expansion Sprints Section */}
      <section
        id="expansion-sprints"
        className="bg-black/[0.02] dark:bg-white/[0.02] py-16"
      >
        <div className="container space-y-12">
          <div className="text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Expansion Sprints
            </h2>
            <p className="text-base sm:text-lg opacity-80 max-w-2xl mx-auto">
              After your foundation sprint, stack additional 2-week sprints whenever you need to ship a landing page, prototype, feature release, or brand refresh. We reuse your original workshop insights—no re-onboarding, just execution.
            </p>
            <p className="text-xs sm:text-sm opacity-60 max-w-lg mx-auto">
              Unlocked after Brand or Product Foundations. Each Expansion Sprint starts with a 1-hour Mini Foundation session to realign, then we execute for 10 working days.
            </p>
          </div>

          {/* Display Extend Packages */}
          {extendPackages.length > 0 && (
            <div className={extendGridPreset.className} data-component-grid={extendGridPreset.id}>
              {extendPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} variant="default" showEmojis={false} />
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
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
              Browse all packages
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Review the process
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
