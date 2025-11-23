import Link from "next/link";
import FoundationPackagesPreview from "@/app/components/FoundationPackagesPreview";

export const dynamic = "force-static";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-black/70 dark:text-white/70">
            Same 2-week playbook for every sprint
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            One process powers Foundations + Extend &amp; Iterate
          </h1>
          <p className="text-lg sm:text-xl opacity-80 max-w-2xl mx-auto">
            Every sprint we run—whether it&apos;s your first Brand/Product Foundation or a follow-on Extend &amp; Iterate sprint—follows the exact same cadence: Monday kickoff, Week 1 up the hill, Week 2 down the hill, handoff on Friday.
          </p>
          <p className="text-base sm:text-lg opacity-70 max-w-2xl mx-auto">
            Foundations give us the shared source of truth. After that, you can keep stacking 2-week sprints using the identical playbook so there&apos;s never a question about how we work together.
          </p>
        </div>
      </section>

      {/* The Process */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="text-lg opacity-70">
            Four simple moves that never change
          </p>
        </div>

        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              1
            </div>
            <h3 className="text-2xl font-semibold">Select or draft sprint → schedule kickoff → pay 50%</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Decide whether you need a Brand/Product Foundation Sprint (required for new clients) or an Extend &amp; Iterate sprint (available once your foundation is complete). Head to{" "}
              <Link href="/packages" className="font-medium underline hover:opacity-80 transition">
                Foundation Packages
              </Link>{" "}
              or the{" "}
              <Link href="/deliverables" className="font-medium underline hover:opacity-80 transition">
                Deliverables Library
              </Link>{" "}
              to compare options, submit your request with preferred kickoff Mondays, and we&apos;ll confirm availability. Once the agreement is signed and the 50% deposit is paid, your 2-week sprint slot is locked.
            </p>
            <p className="text-sm opacity-60 italic">
              Need help choosing?{" "}
              <Link
                href="https://cal.com/chrismeisner/sprint-planner"
                target="_blank"
                className="font-medium underline hover:opacity-80 transition"
              >
                Book a quick sprint-planning call
              </Link>{" "}
              and we&apos;ll point you in the right direction.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="font-medium">Step 1 checklist:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Pick Brand/Product Foundations or Extend &amp; Iterate sprint</li>
                <li>Request your kickoff Monday + share context</li>
                <li>Sign digital agreement + pay 50% deposit via Stripe</li>
                <li>Receive onboarding checklist, file uploads, and calendar invites</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              2
            </div>
            <h3 className="text-2xl font-semibold">Week 1: Kickoff Monday + up the hill (5 days)</h3>
          </div>
          <div className="pl-16 space-y-4">
            <p className="text-base opacity-80">
              Monday starts with a 3-hour Google-inspired workshop. The rest of the week is divergence + alignment—exploring options, sharing WIP, and locking one solution on <span className="font-semibold">Decision Day Thursday</span>.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⛰️</span>
                <h4 className="font-semibold">Week 1 cadence</h4>
              </div>
              <ul className="text-sm space-y-1.5 opacity-80">
                <li>• Day 1 (Monday): Kickoff workshop (Brand/Product)</li>
                <li>• Day 2–3: Studio explores and shares WIP</li>
                <li>• Day 4 (Thursday): Decision Day — options presented, solution selected</li>
                <li>• Day 5 (Friday): Execution plan locked for Week 2</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              3
            </div>
            <h3 className="text-2xl font-semibold">Week 2: Down the hill — execution &amp; delivery</h3>
          </div>
          <div className="pl-16 space-y-4">
            <p className="text-base opacity-80">
              Week 2 is <span className="font-semibold">convergence + build</span>. We implement the chosen direction, run a <span className="font-semibold">Work-in-Progress Wednesday</span> session for live feedback, and deliver everything on Friday—no re-scoping, just execution.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏁</span>
                <h4 className="font-semibold">Week 2 cadence</h4>
              </div>
              <ul className="text-sm space-y-1.5 opacity-80">
                <li>• Day 6 (Monday): Align execution plan to deliverables</li>
                <li>• Day 7 (Tuesday): Studio heads down building</li>
                <li>• Day 8 (Wednesday): Work-in-Progress review, live feedback</li>
                <li>• Day 9 (Thursday): Refinement + polish</li>
                <li>• Day 10 (Friday): Final delivery, Loom walkthrough, optional live demo</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              4
            </div>
            <h3 className="text-2xl font-semibold">Test deliverables → book the next sprint when needed</h3>
          </div>
          <div className="pl-16 space-y-3">
            <p className="text-base opacity-80">
              Week 2 Friday — sprint complete. You receive final deliverables with source files, a Loom walkthrough, and an optional live demo. Test with customers, gather feedback, then pick new deliverables and schedule another Extend &amp; Iterate sprint whenever you need more momentum.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-3">
              <div>
                <p className="font-medium mb-1">What you leave with:</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li>Final deliverables + source files + exports</li>
                  <li>Loom walkthrough and optional live review</li>
                  <li>Decision log, workshop notes, execution plan</li>
                  <li>Client portal access for downloads anytime</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">When you&apos;re ready for more:</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li>Test deliverables with users or your team</li>
                  <li>Pick new deliverables from the library</li>
                  <li>Book another 2-week sprint (same kickoff → Decision Day → WIP Wednesday → delivery cadence)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Extend & Iterate explainer */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16 px-6 border-y border-black/10 dark:border-white/15">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full bg-white dark:bg-black px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              After your foundation
            </div>
            <h2 className="text-3xl font-bold">Extend &amp; Iterate sprints on demand</h2>
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
              <h3 className="text-xl font-semibold">Alignment Workshop Kickoff</h3>
              <p className="text-sm opacity-80">
                We run a focused 1-hour alignment workshop to realign on goals, confirm deliverables, and plug new insights into your existing strategy doc—no full workshop required.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 space-y-2">
              <p className="text-xs uppercase tracking-wide opacity-60">Same 2-week arc</p>
              <h3 className="text-xl font-semibold">Uphill → Downhill cadence</h3>
              <p className="text-sm opacity-80">
                Diverge Week 1, converge Week 2, ship on Friday. Pause as long as you need between sprints and pick back up when ready.
              </p>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm opacity-70">
              Ready for your next sprint?{" "}
              <Link href="/intake" className="font-medium underline hover:opacity-100">
                Submit a follow-on intake →
              </Link>
            </p>
            <p className="text-xs opacity-60">
              These sprints are available only after completing a Brand or Product Foundation Sprint.
            </p>
          </div>
        </div>
      </section>

      {/* Why This Works */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold text-center">Why early-stage founders love this</h2>
          
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-3xl">⚡</div>
              <h3 className="font-semibold text-lg">Fast & Predictable</h3>
              <p className="text-sm opacity-80">
                Pick your deliverables, book your kickoff Monday, and you&apos;re done in 2 weeks. 10 working days, fixed timeline, no delays.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl">🎯</div>
              <h3 className="font-semibold text-lg">Fixed Scope & Price</h3>
              <p className="text-sm opacity-80">
                Menu-based deliverables with clear scope. You know exactly what you&apos;re getting and what it costs—no estimates, no surprises.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl">🧘</div>
              <h3 className="font-semibold text-lg">Low Effort for You</h3>
              <p className="text-sm opacity-80">
                One kickoff workshop, async collaboration with regular check-ins. No daily standups, no Slack babysitting. Check your portal when convenient.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example Packages */}
      <FoundationPackagesPreview />

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to design your foundation?</h2>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Pick your Brand or Product Foundation Sprint, explore available deliverables, and plan your next Extend &amp; Iterate sprint when you need it.
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
            Plan Extend &amp; Iterate sprint
          </Link>
        </div>
        <p className="text-sm opacity-60">
          Questions? Email us at hello@sprintbuilder.com
        </p>
      </section>
    </main>
  );
}


