import Link from "next/link";
import FoundationPackagesPreview from "@/app/components/FoundationPackagesPreview";

export const dynamic = "force-static";

export default function OurApproachPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 text-sm font-medium mb-2">
            The Switchback Method
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            Foundation first. Then extend &amp; iterate with purpose.
          </h1>
          <p className="text-xl sm:text-2xl opacity-80 max-w-3xl mx-auto">
            Big agencies try to take you straight up the mountain: slow at the beginning, frantic at the end, and exhausting for everyone. We take a different approach—one that matches how great products actually get built.
          </p>
          <p className="text-base sm:text-lg opacity-70 max-w-3xl mx-auto">
            Every client starts with a 2-week Brand or Product Foundation Sprint. That sprint gives us the strategic workshop, core deliverables, and shared source of truth we need to move fast. Once it’s locked, you can book Extend &amp; Iterate sprints (also 2 weeks) whenever you need new momentum—no repeat discovery.
          </p>
        </div>
      </section>

      {/* Core Metaphor */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🏔️</div>
          <h2 className="text-4xl font-bold">Your project is a mountain</h2>
          <p className="text-2xl opacity-80">
            We help you climb it one switchback at a time
          </p>
        </div>

        <div className="bg-black/5 dark:bg-white/5 rounded-lg p-8 space-y-4">
          <p className="text-lg opacity-90">
            Each switchback is a focused, 2-week sprint with a clear destination, real deliverables, and zero chaos.
          </p>
          <p className="text-base opacity-70">
            Instead of trying to scale straight up (exhausting, risky, unsustainable), we start with a Foundation Sprint to set direction, then take strategic switchbacks that let you make real progress, catch your breath, and choose your next move.
          </p>
        </div>
      </section>

      {/* Foundation First Explanation */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6 border-y border-black/10 dark:border-white/15">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full bg-white dark:bg-black px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              2-phase engagement model
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Foundation → Extend &amp; Iterate</h2>
            <p className="text-base sm:text-lg opacity-70 max-w-3xl mx-auto">
              The Foundation Sprint is your entry ticket. It captures strategy, brand/product direction, and source-of-truth documentation that every future sprint references. After that, you can stack Extend &amp; Iterate sprints as often as you need without repeating discovery.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3">
              <p className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wide">
                Phase 1
              </p>
              <h3 className="text-2xl font-bold">Brand or Product Foundation</h3>
              <p className="text-sm opacity-80">
                2-week sprint with a strategic workshop, core deliverables, and alignment artifacts. Required for every new client so we never guess in the dark again.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3">
              <p className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wide">
                Phase 1 Output
              </p>
              <h3 className="text-2xl font-bold">Reusable Source of Truth</h3>
              <p className="text-sm opacity-80">
                Workshop recordings, decision logs, brand/product guidelines, and prioritized backlog. These sit inside your client portal for every future sprint.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3">
              <p className="text-sm font-semibold text-black/70 dark:text-white/70 uppercase tracking-wide">
                Phase 2 (repeatable)
              </p>
              <h3 className="text-2xl font-bold">Extend &amp; Iterate Sprints</h3>
              <p className="text-sm opacity-80">
                Additional 2-week sprints you can book on-demand for launches, features, and refreshes. Kick off with a 1-hour Mini Foundation session, then we execute.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Switchbacks Work */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Why switchbacks work</h2>
            <p className="text-lg opacity-70">
              The sustainable way to build ambitious products
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Predictable Progress */}
            <div className="bg-white dark:bg-black rounded-lg p-6 space-y-3">
              <div className="text-4xl">⚡</div>
              <h3 className="text-xl font-semibold">Predictable Progress → Not Burnout</h3>
              <p className="text-sm opacity-80">
                Instead of a huge 12-week agency engagement with hidden timelines and surprise pivots, you get 2 focused weeks, a clear deliverable, a rest point to reflect, and the option to climb again when ready.
              </p>
              <p className="text-sm opacity-70 pt-2 border-t border-black/10 dark:border-white/15">
                Foundation first keeps the plan grounded, then Extend &amp; Iterate sprints add momentum without burning your team out.
              </p>
            </div>

            {/* Clarity at Every Turn */}
            <div className="bg-white dark:bg-black rounded-lg p-6 space-y-3">
              <div className="text-4xl">🎯</div>
              <h3 className="text-xl font-semibold">Clarity at Every Turn</h3>
              <p className="text-sm opacity-80">
                Each switchback starts with alignment, ends with tangible work, and gives you visibility the entire way. You always know where you&apos;re headed, what we&apos;re making, and what&apos;s coming next.
              </p>
              <p className="text-sm opacity-70 pt-2 border-t border-black/10 dark:border-white/15">
                No guessing. No surprises. Just clear progress.
              </p>
            </div>

            {/* Flexibility Without Chaos */}
            <div className="bg-white dark:bg-black rounded-lg p-6 space-y-3">
              <div className="text-4xl">🧘</div>
              <h3 className="text-xl font-semibold">Flexibility Without Chaos</h3>
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

      {/* The Traditional Agency Problem */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-lg border-2 border-black/10 dark:border-white/15 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">The agency problem</h2>
            <p className="text-lg opacity-70">
              Why the traditional approach burns everyone out
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Traditional Agency */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/15">
                <span className="text-2xl">😓</span>
                <h3 className="font-semibold text-lg">Traditional Agency</h3>
              </div>
              <ul className="space-y-2 text-sm opacity-80">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Slow ramp-up (&quot;discovery phase&quot; drags for weeks)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Unclear timeline (&quot;we&apos;ll get back to you&quot;)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Big rush at the end (everything due at once)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Scope creep and budget bloat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>Team exhaustion and quality suffers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  <span>No natural checkpoint to pause or pivot</span>
                </li>
              </ul>
              <p className="text-xs opacity-60 pt-3 italic">
                Like climbing straight up a cliff—theoretically possible, but risky and unsustainable.
              </p>
            </div>

            {/* Switchback Method */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-black/10 dark:border-white/15">
                <span className="text-2xl">🏔️</span>
                <h3 className="font-semibold text-lg">Switchback Method</h3>
              </div>
              <ul className="space-y-2 text-sm opacity-80">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Fast kickoff (1 focused workshop, then we build)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Fixed 2-week timeline (always 10 working days Monday-Friday)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Steady pace throughout (no last-minute chaos)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Fixed scope and price from day one</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>High quality maintained throughout</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  <span>Natural pause after each sprint to reflect</span>
                </li>
              </ul>
              <p className="text-xs opacity-60 pt-3 italic">
                Like switchbacks up a mountain—strategic, sustainable, and you reach the summit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How a Switchback Sprint Works */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">How a switchback sprint works</h2>
          <p className="text-lg opacity-70">
            Six steps from Foundation Sprint kickoff to Extend &amp; Iterate momentum
          </p>
        </div>

        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              1
            </div>
            <h3 className="text-2xl font-semibold">Design your Foundation Sprint</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Start with our quick intake. Tell us your goals, your current stage, and what you&apos;re trying to build. We turn that into a tailored 2-week sprint plan—scope, deliverables, pricing, everything—aligned to either Brand or Product Foundations.
            </p>
            <p className="text-sm opacity-60 italic">
              This is like studying the mountain before you climb. Where do you want to go? What&apos;s the best route?
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              2
            </div>
            <h3 className="text-2xl font-semibold">Book your Foundation Sprint kickoff</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Review your proposed foundation sprint, select your kickoff Monday, and lock in with a 50% deposit. This becomes the first ledge in your climb—a clear, achievable 2-week ascent.
            </p>
            <p className="text-sm opacity-60 italic">
              Once the Foundation Sprint is booked, every future Extend &amp; Iterate sprint references the same plan.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              3
            </div>
            <h3 className="text-2xl font-semibold">Week 1: Find the line up the hill</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              We explore, align, and choose the strongest path forward. Think of this as picking the right switchback to climb—not the steep, impossible straight shot.
            </p>
            <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 text-sm space-y-1">
              <p className="font-medium">Week 1 is divergence + alignment:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Day 1 (Monday): Workshop with you for discovery</li>
                <li>Day 2 (Tuesday): Studio creates direction options</li>
                <li>Day 3 (Wednesday): Studio presents solutions</li>
                <li>Day 4 (Thursday): Collect feedback, refine directions</li>
                <li>Day 5 (Friday): Direction locked and shared</li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 text-sm space-y-2">
              <p className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <span>⭐</span> Week 1 Alignment Guarantee
              </p>
              <p className="text-blue-800 dark:text-blue-200 opacity-90">
                If after Week 1 you feel we haven&apos;t aligned on a clear direction, you can stop the sprint with no additional payments. We keep the 50% deposit to cover the completed Week 1 work, and we both walk away — no hard feelings.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              4
            </div>
            <h3 className="text-2xl font-semibold">Week 2: Make the climb</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Now we execute. Fast, focused, polished. No re-scoping. No swirl. No frantic &quot;big agency energy.&quot;
            </p>
            <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 text-sm space-y-1">
              <p className="font-medium">Week 2 is convergence + execution:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Day 6 (Monday): Revisit deliverables, map solution to execution</li>
                <li>Day 7 (Tuesday): Studio heads down building</li>
                <li>Day 8 (Wednesday): Progress review, Q&A</li>
                <li>Day 9 (Thursday): Final execution and refinement</li>
                <li>Day 10 (Friday): Delivery, demo, handoff</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              5
            </div>
            <h3 className="text-2xl font-semibold">Reach the ledge (delivery day)</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              At the end of every sprint, you land safely on a solid ledge: final deliverables, source files, Loom walkthrough, optional live demo.
            </p>
            <p className="text-base opacity-80 font-medium">
              It&apos;s a real checkpoint in your project—not theoretical progress.
            </p>
            <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 text-sm space-y-1">
              <p className="font-medium">What you receive:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>All final deliverables (design files, code, assets, documentation)</li>
                <li>Source files and exports</li>
                <li>Loom walkthrough video</li>
                <li>Optional live handoff session</li>
                <li>Lifetime access via your client portal</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Step 6 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              6
            </div>
            <h3 className="text-2xl font-semibold">Rest, then Extend &amp; Iterate</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Take as long as you need. Test your deliverables with users. Get team feedback. Secure funding. Plan your next move.
            </p>
            <p className="text-base opacity-80 font-medium">
              When you&apos;re ready for the next part of the mountain, book an Extend &amp; Iterate sprint. We kick off with a 1-hour Mini Foundation session, reference your original strategy, and ship another 2-week climb.
            </p>
            <div className="rounded-lg border-2 border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-2">
              <p className="font-medium">This is the strategic advantage:</p>
              <p className="opacity-80">
                Instead of locking into a 3-month agency contract, you climb in 2-week increments. Foundation → sprint → digest feedback → sprint → test with users → sprint → fundraise → sprint.
              </p>
              <p className="opacity-70 italic">
                You control the pace. We make each climb count.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Sprint Journey */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">One sprint or many—your pace, your mountain</h2>
            <p className="text-lg opacity-70">
              How the switchback method scales with your ambition
            </p>
          </div>

          <div className="bg-white dark:bg-black rounded-lg p-8 space-y-6">
            <p className="text-base opacity-80">
              Most founders have bigger visions than 2 weeks can solve. That&apos;s by design. The switchback method works for single sprints AND long-term product development.
            </p>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Example journey:</h3>
              <div className="space-y-3 pl-4 border-l-2 border-black/20 dark:border-white/20">
                <div className="space-y-1">
                  <p className="font-medium">Foundation Sprint (Required)</p>
                  <p className="text-sm opacity-70">Brand or Product workshop + core deliverables + source-of-truth documentation</p>
                  <p className="text-xs opacity-60 italic">→ Sets direction once. Every Extend &amp; Iterate sprint references this groundwork.</p>
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
                <span className="font-medium">This is how great products get built:</span> in focused bursts with time to breathe, test, and learn. Not endless agency cycles. Not rushed freelancer chaos. Start with a Foundation Sprint, then use Extend &amp; Iterate switchbacks whenever you need another leap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Founders Choose This */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-bold">Why founders choose the switchback method</h2>
          <p className="text-lg opacity-70">
            Built for early-stage teams who need momentum, not meetings
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-6 space-y-2">
            <div className="text-3xl">⚡</div>
            <h3 className="font-semibold text-lg">Fast & Sustainable</h3>
            <p className="text-sm opacity-80">
              Move quickly without setting your team on fire. 2 weeks. Real deliverables. Repeatable process.
            </p>
          </div>

          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-6 space-y-2">
            <div className="text-3xl">🎯</div>
            <h3 className="font-semibold text-lg">Fixed Scope, Fixed Price</h3>
            <p className="text-sm opacity-80">
              Predictable cost. Predictable outcomes. No drama. No surprise invoices at the end.
            </p>
          </div>

          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-6 space-y-2">
            <div className="text-3xl">🏔️</div>
            <h3 className="font-semibold text-lg">Focused 2-Week Climbs</h3>
            <p className="text-sm opacity-80">
              Each sprint moves you meaningfully closer to your summit—without waste or drag.
            </p>
          </div>

          <div className="bg-black/5 dark:bg-white/5 rounded-lg p-6 space-y-2">
            <div className="text-3xl">🚀</div>
            <h3 className="font-semibold text-lg">Designed for Early Teams</h3>
            <p className="text-sm opacity-80">
              You don&apos;t need long agency cycles. You need momentum, clarity, and tangible progress.
            </p>
          </div>
        </div>
      </section>

      <FoundationPackagesPreview
        heading="Foundation sprint previews"
        description="See the two foundation sprint options we use to kick off every engagement before stacking follow-on sprints."
        ctaLabel="view all foundation packages"
        limit={2}
      />

      {/* CTA */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to start your climb?</h2>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Kick off with a Brand or Product Foundation Sprint, then plug in deliverables and Extend &amp; Iterate sprints whenever you need more momentum.
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
          <p className="text-sm opacity-60 pt-4">
            Questions? Email us at hello@sprintbuilder.com
          </p>
        </div>
      </section>
    </main>
  );
}

