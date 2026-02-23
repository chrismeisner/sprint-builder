import Link from "next/link";
import FoundationPackagesPreview from "@/app/components/FoundationPackagesPreview";
import ProcessSection from "./ProcessSection";

export const dynamic = "force-static";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 text-sm font-medium">
            Our Method
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">How we work</h1>
          <p className="text-xl sm:text-2xl opacity-80 max-w-3xl mx-auto">
            Every sprint is a focused 2-week engagement. Week 1: explore and decide. Week 2: execute and deliver. Then rest, reflect, and book the next one when you&apos;re ready.
          </p>
          <p className="text-base sm:text-lg opacity-70 max-w-3xl mx-auto">
            Each sprint is built from our deliverable library—brand, product, or mixed. You pick the scope, the studio prices it transparently from your selections, and the same 10-day cadence runs every time. No re-onboarding, no spin-up.
          </p>
          <p className="text-sm sm:text-base opacity-70 max-w-3xl mx-auto">
            Below is the full playbook: the philosophy, the four-step process, and how to plan back-to-back sprints when you need more momentum.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/packages"
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              View Foundation Packages
            </Link>
            <Link
              href="/deliverables"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Browse Deliverable Library
            </Link>
            <Link
              href="https://cal.com/chrismeisner/sprint-planner"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Plan a sprint call
            </Link>
          </div>
        </div>
      </section>


      {/* Sprint builder model */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6 border-y border-black/10 dark:border-white/15">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full bg-white dark:bg-black px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              How every sprint is built
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Choose deliverables. Lock the scope. Ship in 2 weeks.</h2>
            <p className="text-base sm:text-lg opacity-70 max-w-3xl mx-auto">
              Every sprint starts from the same deliverable library. You pick what fits your goals, the studio builds a transparent proposal priced from those selections, and the 10-day cadence does the rest.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3">
              <p className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wide">Step 1</p>
              <h3 className="text-2xl font-bold">Pick your deliverables</h3>
              <p className="text-sm opacity-80">
                Browse the deliverable library—brand, product, or mixed. Each item shows scope, complexity points, and estimated hours so you can right-size the sprint before committing.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3">
              <p className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wide">Step 2</p>
              <h3 className="text-2xl font-bold">Get a transparent proposal</h3>
              <p className="text-sm opacity-80">
                The studio builds a sprint draft with your selected deliverables, priced transparently from complexity points. Sprints start around $8,000 and scale up based on scope—no hidden fees.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3">
              <p className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wide">Step 3</p>
              <h3 className="text-2xl font-bold">Kick off and ship</h3>
              <p className="text-sm opacity-80">
                Sign, pay 50%, and pick your Monday kickoff. The same 10-day uphill → downhill cadence runs every sprint. Final delivery and Loom walkthrough on Day 10.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <ProcessSection />

      {/* Week overview */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Week-by-week at a glance</h2>
            <p className="text-lg opacity-70">Uphill Week 1, Downhill Week 2—repeatable forever</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4">
              <p className="text-xs uppercase tracking-wide opacity-60">Week 1 (Days 1-5)</p>
              <h3 className="text-2xl font-semibold">Go uphill</h3>
              <p className="text-sm opacity-80">
                Workshop, divergent exploration, Ingredient Review Thursday, direction locked on Friday. Async updates + Loom recaps keep you in the loop without daily standups.
              </p>
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Daily themes</p>
                <ul className="text-sm opacity-80 space-y-1.5">
                  <li><span className="font-medium">Day 1:</span> Kickoff workshop to align on strategy, goals, and vision</li>
                  <li><span className="font-medium">Day 2:</span> Exploration phase begins—studio researches and generates options</li>
                  <li><span className="font-medium">Day 3:</span> Divergent thinking continues with work-in-progress sharing</li>
                  <li><span className="font-medium">Day 4:</span> Ingredient Review—grouped solutions evaluated, direction shaped together</li>
                  <li><span className="font-medium">Day 5:</span> Direction locked—async outline confirms the solution for Week 2</li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4">
              <p className="text-xs uppercase tracking-wide opacity-60">Week 2 (Days 6-10)</p>
              <h3 className="text-2xl font-semibold">Go downhill</h3>
              <p className="text-sm opacity-80">
                Direction check Monday, heads-down build, Work-in-Progress Wednesday, polish Thursday, final delivery Friday with Loom walkthrough + optional live demo.
              </p>
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Daily themes</p>
                <ul className="text-sm opacity-80 space-y-1.5">
                  <li><span className="font-medium">Day 6:</span> Direction check—confirm alignment, answer last questions, no changes after today</li>
                  <li><span className="font-medium">Day 7:</span> Heads-down build mode—studio focused on implementation</li>
                  <li><span className="font-medium">Day 8:</span> Work-in-Progress Wednesday—see it coming together, early testing, request tweaks</li>
                  <li><span className="font-medium">Day 9:</span> Polish, refinement, and final quality checks</li>
                  <li><span className="font-medium">Day 10:</span> Final delivery with Loom walkthrough and optional live demo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing explainer */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16 px-6 border-y border-black/10 dark:border-white/15">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full bg-white dark:bg-black px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Transparent pricing
            </div>
            <h2 className="text-3xl font-bold">Budget scales with your deliverables</h2>
            <p className="text-base sm:text-lg opacity-70 max-w-3xl mx-auto">
              There are no fixed packages. Every sprint is priced from the deliverables you select—each one carries a complexity point value that rolls up to a total before you sign anything.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 space-y-2">
              <p className="text-xs uppercase tracking-wide opacity-60">Starting point</p>
              <h3 className="text-xl font-semibold">From $8,000</h3>
              <p className="text-sm opacity-80">
                A lighter sprint with a focused set of deliverables. Ideal when you have a single clear goal and want to move fast without overloading the two weeks.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 space-y-2">
              <p className="text-xs uppercase tracking-wide opacity-60">Typical range</p>
              <h3 className="text-xl font-semibold">$10,000 – $15,000</h3>
              <p className="text-sm opacity-80">
                Most sprints fall in this range—a handful of core deliverables that fill the two weeks without stretching capacity. The Day 1 workshop is included in every sprint.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 space-y-2">
              <p className="text-xs uppercase tracking-wide opacity-60">Fully loaded</p>
              <h3 className="text-xl font-semibold">Up to $20,000</h3>
              <p className="text-sm opacity-80">
                High-complexity deliverables or a larger scope. The budget ceiling keeps the two-week timeline honest—we scope to what can actually be done well.
              </p>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm opacity-70">
              See what&apos;s available in the library.{' '}
              <Link href="/deliverables" className="font-medium underline hover:opacity-100">
                Browse deliverables →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Why our sprints work */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Why our 2-week sprints work</h2>
            <p className="text-lg opacity-70">The sustainable way to build ambitious products</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-black rounded-lg p-6 space-y-3">
              <div className="text-4xl">⚡</div>
              <h3 className="text-xl font-semibold">Predictable progress → not burnout</h3>
              <p className="text-sm opacity-80">
                Instead of a huge 12-week engagement with hidden timelines, you get 2 focused weeks, a clear deliverable, a rest point to reflect, and the option to climb again when ready.
              </p>
              <p className="text-sm opacity-70 pt-2 border-t border-black/10 dark:border-white/15">
                A clear scope before kickoff keeps the plan grounded, and the fixed 2-week window prevents scope creep from burning your team out.
              </p>
            </div>
            <div className="bg-white dark:bg-black rounded-lg p-6 space-y-3">
              <div className="text-4xl">🎯</div>
              <h3 className="text-xl font-semibold">Clarity at every turn</h3>
              <p className="text-sm opacity-80">
                Each sprint starts with alignment, ends with tangible work, and gives you visibility the entire way. You always know where you&apos;re headed, what we&apos;re making, and what&apos;s coming next.
              </p>
              <p className="text-sm opacity-70 pt-2 border-t border-black/10 dark:border-white/15">
                No guessing. No surprises. Just clear progress.
              </p>
            </div>
            <div className="bg-white dark:bg-black rounded-lg p-6 space-y-3">
              <div className="text-4xl">🧘</div>
              <h3 className="text-xl font-semibold">Flexibility without chaos</h3>
              <p className="text-sm opacity-80">
                Need time after a sprint to get team feedback, talk to users, or test something? Take it. Your path is modular—climb at the pace your company needs.
              </p>
              <p className="text-sm opacity-70 pt-2 border-t border-black/10 dark:border-white/15">
                Sprint, rest, learn, repeat. Build at your rhythm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-sprint journey */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">One sprint or many—your pace</h2>
            <p className="text-lg opacity-70">How the Appliance Studio cadence scales with your ambition</p>
          </div>
          <div className="bg-white dark:bg-black rounded-lg p-8 space-y-6">
            <p className="text-base opacity-80">
                Most founders have bigger visions than 2 weeks can solve. That&apos;s by design. The studio cadence works for a single focused sprint and for long-term product development alike.
            </p>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Example journey:</h3>
              <div className="space-y-3 pl-4 border-l-2 border-black/20 dark:border-white/20">
                <div className="space-y-1">
                  <p className="font-medium">Sprint 1: Brand Identity</p>
                  <p className="text-sm opacity-70">Logo, typography, color system, brand guidelines — Day 1 workshop included</p>
                  <p className="text-xs opacity-60 italic">→ Rest: 2 weeks. Test brand with early users, finalize messaging.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Sprint 2: Landing Page</p>
                  <p className="text-sm opacity-70">Marketing site design + build, waitlist automation</p>
                  <p className="text-xs opacity-60 italic">→ Rest: 3 weeks. Launch landing page, collect signups, validate demand.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Sprint 3: MVP Prototype</p>
                  <p className="text-sm opacity-70">Core user flows, interactive prototype, usability test plan</p>
                  <p className="text-xs opacity-60 italic">→ Rest: 4 weeks. Test prototype with users, secure seed funding.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Sprint 4: Production Build</p>
                  <p className="text-sm opacity-70">Development-ready specs, polish, launch prep</p>
                  <p className="text-xs opacity-60 italic">→ You&apos;re live. 4 sprints of work, spread over 3–4 months at your pace.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Monthly Support (optional, ongoing)</p>
                  <p className="text-sm opacity-70">Biweekly check-ins + updates on existing deliverables</p>
                  <p className="text-xs opacity-60 italic">→ Studio stays on call. Feedback every 2 weeks, updates shipped on a rolling basis. From $4,000/month.</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-black/10 dark:border-white/15">
              <p className="text-sm opacity-70">
                <span className="font-medium">This is how great products get built:</span> focused bursts with time to breathe, test, and learn. Not endless agency cycles. Not rushed freelancer chaos. Each sprint is a fresh proposal built from the deliverable library—same cadence, new goals, no wasted setup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Foundation previews */}
      <FoundationPackagesPreview
        heading="Example sprint packages"
        description="These are a few curated starting points from our deliverable library—priced transparently from the deliverables included. Every sprint can be customized from there."
        ctaLabel="browse all packages"
        limit={2}
      />

      {/* CTA */}
      <section className="container max-w-4xl py-16 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to start your sprint?</h2>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Browse the deliverable library, pick your scope, and we&apos;ll build a transparent proposal. Same 10-day cadence every sprint.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/packages"
            className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            View sprint packages →
          </Link>
          <Link
            href="/deliverables"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Browse deliverables
          </Link>
          <Link
            href="/intake"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Plan a sprint
          </Link>
        </div>
        <p className="text-sm opacity-60">Questions? Reach out to discuss your next sprint</p>
        <p className="text-sm opacity-50 max-w-lg mx-auto">
          Already shipped a sprint? <strong>Monthly Support</strong> keeps the studio on call—starting at $4,000/month for biweekly check-ins and ongoing deliverable updates.
        </p>
      </section>
    </main>
  );
}
