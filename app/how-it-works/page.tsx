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
            Every sprint is a focused 2-week engagement with Great Work Studio. Week 1: explore and decide. Week 2: execute and deliver. Then rest, reflect, and schedule the next one when you&apos;re ready.
          </p>
          <p className="text-base sm:text-lg opacity-70 max-w-3xl mx-auto">
            Every engagement starts with a Brand or Product Foundation Sprint (preset workshops + deliverables). Once delivered, you can stack Expansion Sprints from the Deliverable Library using the exact same cadence—no re-onboarding, no spin-up.
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


      {/* Two-phase model */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6 border-y border-black/10 dark:border-white/15">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full bg-white dark:bg-black px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              2-phase engagement model
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Foundation → Expansion</h2>
            <p className="text-base sm:text-lg opacity-70 max-w-3xl mx-auto">
              The Foundation Sprint is your entry ticket. It captures strategy, direction, and source-of-truth documentation that every future sprint references. After that, you can stack Expansion Sprints whenever you need more momentum.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3">
              <p className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wide">Phase 1</p>
              <h3 className="text-2xl font-bold">Brand or Product Foundation</h3>
              <p className="text-sm opacity-80">
                2-week sprint with a strategic workshop, preset deliverables, and alignment artifacts. Required for every new client so we never guess in the dark.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3">
              <p className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wide">Phase 1 Output</p>
              <h3 className="text-2xl font-bold">Reusable Source of Truth</h3>
              <p className="text-sm opacity-80">
                Workshop recordings, decision logs, brand/product guidelines, and a prioritized backlog. These sit inside your client portal for every future sprint.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3">
              <p className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wide">Phase 2 (repeatable)</p>
              <h3 className="text-2xl font-bold">Expansion Sprints</h3>
              <p className="text-sm opacity-80">
                Additional 2-week sprints you can book on demand for launches, features, and refreshes. Kick off with a 1-hour Mini Foundation session, then we execute.
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
                Workshop, divergent exploration, Decision Day Thursday, execution plan on Friday. Async updates + Loom recaps keep you in the loop without daily standups.
              </p>
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Daily themes</p>
                <ul className="text-sm opacity-80 space-y-1.5">
                  <li><span className="font-medium">Day 1:</span> Kickoff workshop to align on strategy, goals, and vision</li>
                  <li><span className="font-medium">Day 2:</span> Exploration phase begins—studio researches and generates options</li>
                  <li><span className="font-medium">Day 3:</span> Divergent thinking continues with work-in-progress sharing</li>
                  <li><span className="font-medium">Day 4:</span> Decision Day—options presented, feedback gathered, direction chosen</li>
                  <li><span className="font-medium">Day 5:</span> Execution plan finalized and prepped for Week 2 delivery</li>
                </ul>
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4">
              <p className="text-xs uppercase tracking-wide opacity-60">Week 2 (Days 6-10)</p>
              <h3 className="text-2xl font-semibold">Go downhill</h3>
              <p className="text-sm opacity-80">
                Heads-down build, Work-in-Progress Wednesday, polish Thursday, final delivery Friday with Loom walkthrough + optional live demo.
              </p>
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Daily themes</p>
                <ul className="text-sm opacity-80 space-y-1.5">
                  <li><span className="font-medium">Day 6:</span> Align on execution plan and begin building the chosen solution</li>
                  <li><span className="font-medium">Day 7:</span> Heads-down build mode—studio focused on implementation</li>
                  <li><span className="font-medium">Day 8:</span> Work-in-Progress Wednesday—live feedback and course corrections</li>
                  <li><span className="font-medium">Day 9:</span> Polish, refinement, and final quality checks</li>
                  <li><span className="font-medium">Day 10:</span> Final delivery with Loom walkthrough and optional live demo</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expansion Sprint explainer */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16 px-6 border-y border-black/10 dark:border-white/15">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full bg-white dark:bg-black px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              After your foundation
            </div>
            <h2 className="text-3xl font-bold">Expansion Sprints on demand</h2>
            <p className="text-base sm:text-lg opacity-70 max-w-3xl mx-auto">
              Once your Foundation Sprint is done, you can request additional 2-week sprints any time. We reference your original workshop artifacts, run a 1-hour Mini Foundation sync, then build the deliverables you choose from our library.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 space-y-2">
              <p className="text-xs uppercase tracking-wide opacity-60">Menu-based deliverables</p>
              <h3 className="text-xl font-semibold">Pick what fits</h3>
              <p className="text-sm opacity-80">
                Browse the Deliverables Library, mix Brand + Product work, and right-size a sprint using hours, price, and complexity details.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 space-y-2">
              <p className="text-xs uppercase tracking-wide opacity-60">Mini Foundation kickoff</p>
              <h3 className="text-xl font-semibold">Alignment workshop</h3>
              <p className="text-sm opacity-80">
                We run a focused 1-hour alignment workshop to confirm goals, plug new insights into your strategy doc, and make sure deliverables map to outcomes.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 space-y-2">
              <p className="text-xs uppercase tracking-wide opacity-60">Same 2-week arc</p>
              <h3 className="text-xl font-semibold">Uphill → downhill cadence</h3>
              <p className="text-sm opacity-80">
                Diverge Week 1, converge Week 2, ship on Friday. Pause as long as you need between sprints and pick back up when ready.
              </p>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm opacity-70">
              Ready for your next sprint?{' '}
              <Link href="/intake" className="font-medium underline hover:opacity-100">
                Submit a follow-on intake →
              </Link>
            </p>
            <p className="text-xs opacity-60">
              Expansion Sprints unlock after you complete a Brand or Product Foundation Sprint.
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
                Foundation first keeps the plan grounded, then Expansion Sprints add momentum without burning your team out.
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
            <p className="text-lg opacity-70">How the Great Work Studio cadence scales with your ambition</p>
          </div>
          <div className="bg-white dark:bg-black rounded-lg p-8 space-y-6">
            <p className="text-base opacity-80">
              Most founders have bigger visions than 2 weeks can solve. That&apos;s by design. The Great Work Studio cadence works for single sprints AND long-term product development.
            </p>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Example journey:</h3>
              <div className="space-y-3 pl-4 border-l-2 border-black/20 dark:border-white/20">
                <div className="space-y-1">
                  <p className="font-medium">Foundation Sprint (Required)</p>
                  <p className="text-sm opacity-70">Brand or Product workshop + core deliverables + source-of-truth documentation</p>
                  <p className="text-xs opacity-60 italic">→ Sets direction once. Every Expansion Sprint references this groundwork.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Sprint 1: Brand Identity</p>
                  <p className="text-sm opacity-70">Logo, colors, typography, brand guidelines</p>
                  <p className="text-xs opacity-60 italic">→ Rest: 2 weeks. Test brand with early users, finalize messaging.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Sprint 2: Landing Page</p>
                  <p className="text-sm opacity-70">Marketing site design + Webflow build</p>
                  <p className="text-xs opacity-60 italic">→ Rest: 3 weeks. Launch landing page, collect signups, validate demand.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Sprint 3: MVP Prototype</p>
                  <p className="text-sm opacity-70">Core user flows, clickable prototype</p>
                  <p className="text-xs opacity-60 italic">→ Rest: 4 weeks. Test prototype with users, secure seed funding.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Sprint 4: Production Build</p>
                  <p className="text-sm opacity-70">Development, polish, launch prep</p>
                  <p className="text-xs opacity-60 italic">→ You&apos;re live. 8 weeks of work, spread over 3-4 months at your pace.</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-black/10 dark:border-white/15">
              <p className="text-sm opacity-70">
                <span className="font-medium">This is how great products get built:</span> focused bursts with time to breathe, test, and learn. Not endless agency cycles. Not rushed freelancer chaos. Start with a Foundation Sprint, then layer in Expansion Sprints whenever you need another leap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Foundation previews */}
      <FoundationPackagesPreview
        heading="Foundation sprint previews"
        description="Start with one of these preset, fixed-scope sprints. Once delivered you can unlock Expansion Sprint work using the same cadence —"
        ctaLabel="view all foundation packages"
        limit={2}
      />

      {/* CTA */}
      <section className="container max-w-4xl py-16 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to start your sprint?</h2>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Kick off with a Brand or Product Foundation Sprint, then plug in deliverables and Expansion Sprints whenever you need more momentum.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/packages"
            className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            View Foundation Packages →
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
            Plan Expansion Sprint
          </Link>
        </div>
        <p className="text-sm opacity-60">Questions? Reach out to discuss your next sprint</p>
      </section>
    </main>
  );
}
