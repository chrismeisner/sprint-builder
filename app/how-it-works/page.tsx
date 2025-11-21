import Link from "next/link";

export const dynamic = "force-static";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-16 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            From idea to execution in 2 weeks
          </h1>
          <p className="text-lg sm:text-xl opacity-80 max-w-2xl mx-auto">
            Design your sprint, confirm your deliverables, then we execute—no endless meetings, no scope creep, just results.
          </p>
        </div>
      </section>

      {/* The Process */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="text-lg opacity-70">
            Six clear steps from sprint design to final delivery
          </p>
        </div>

        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              1
            </div>
            <h3 className="text-2xl font-semibold">Complete the intake form</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Fill out our quick{" "}
              <Link href="https://form.typeform.com/to/eEiCy7Xj" target="_blank" className="font-medium underline hover:opacity-80 transition">
                Typeform intake
              </Link>
              . Answer a few questions about your project, goals, and timeline. We&apos;ll generate a tailored 2-week sprint proposal with specific deliverables, fixed pricing, and a clear scope.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              2
            </div>
            <h3 className="text-2xl font-semibold">Review your draft sprint & Book kickoff</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Receive your personalized sprint draft with specific deliverables and fixed pricing. Review the proposal, book an optional{" "}
              <Link href="https://cal.com/chrismeisner/sprint-planner" target="_blank" className="font-medium underline hover:opacity-80 transition">
                discovery call
              </Link>
              {" "}to discuss details, select your kickoff Monday from available dates, and pay a 50% deposit to lock in your spot. This anchors your commitment and gives us time to prepare.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="font-medium">What happens here:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Review deliverable scope and fixed pricing</li>
                <li>See available kickoff dates (real-time calendar)</li>
                <li>Optional{" "}
                  <Link href="https://cal.com/chrismeisner/sprint-planner" target="_blank" className="font-medium underline hover:opacity-80 transition">
                    pre-sprint discovery call
                  </Link>
                  {" "}(15-30 min)
                </li>
                <li>Pay 50% deposit to reserve your 2-week sprint slot</li>
                <li>Receive automated onboarding email with timeline, expectations, and file upload link</li>
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
            <h3 className="text-2xl font-semibold">Monday kickoff workshop</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Sprint Week 1, Day 1 — We start with alignment. Depending on your sprint type (brand or product), we run a focused workshop to capture your vision, review intake insights, and finalize direction before exploration begins.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-3">
              <div>
                <p className="font-medium mb-1">Kickoff goals:</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li>Align on the core problem and desired outcomes</li>
                  <li>Review your intake form and any uploaded assets</li>
                  <li>Capture founder preferences and brand instincts</li>
                  <li>Set the direction before we start exploration</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Workshop format varies by sprint type:</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li><span className="font-medium">Brand Sprint:</span> Brand Calibration Workshop</li>
                  <li><span className="font-medium">Product Sprint:</span> User & Value Mapping Workshop</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              4
            </div>
            <h3 className="text-2xl font-semibold">Week 1: Up the hill — Direction setting</h3>
          </div>
          <div className="pl-16 space-y-4">
            <p className="text-base opacity-80">
              The first half of the sprint is <span className="font-semibold">divergence + alignment</span>. We explore concepts, share work-in-progress, and iterate with your feedback. By the end of Week 1, we lock in one clear direction to execute.
            </p>
            
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⛰️</span>
                <h4 className="font-semibold">Week 1 Arc: Direction & Alignment</h4>
              </div>
              <ul className="text-sm space-y-1.5 opacity-80">
                <li>• <span className="font-medium">Day 1 (Monday):</span> Workshop with you for discovery and alignment</li>
                <li>• <span className="font-medium">Day 2 (Tuesday):</span> Studio creates direction options for you to choose from</li>
                <li>• <span className="font-medium">Day 3 (Wednesday):</span> Studio presents direction solutions for your review</li>
                <li>• <span className="font-medium">Day 4 (Thursday):</span> Collect your feedback, refine directions based on input</li>
                <li>• <span className="font-medium">Day 5 (Friday):</span> Direction locked and shared with you for weekend review</li>
              </ul>
              <p className="text-sm opacity-70 pt-2 border-t border-black/10 dark:border-white/15">
                This &quot;uphill&quot; phase is about figuring things out—exploring options, testing ideas, and aligning on the best path forward before we commit to building.
              </p>
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

        {/* Step 5 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              5
            </div>
            <h3 className="text-2xl font-semibold">Week 2: Down the hill — Execution & Delivery</h3>
          </div>
          <div className="pl-16 space-y-4">
            <p className="text-base opacity-80">
              The second half is <span className="font-semibold">convergence + build</span>. We implement the chosen direction, design final assets, build prototypes or visuals, and refine based on your feedback. No re-scoping—just focused execution and delivery.
            </p>
            
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏁</span>
                <h4 className="font-semibold">Week 2 Arc: Build & Delivery</h4>
              </div>
              <ul className="text-sm space-y-1.5 opacity-80">
                <li>• <span className="font-medium">Day 6 (Monday):</span> Revisit deliverables from Day 1, map agreed solution to deliverables, align on execution path</li>
                <li>• <span className="font-medium">Day 7 (Tuesday):</span> Studio heads down crafting the solution</li>
                <li>• <span className="font-medium">Day 8 (Wednesday):</span> Progress review with you, all deliverables outlined, Q&A</li>
                <li>• <span className="font-medium">Day 9 (Thursday):</span> Heads down refining assets and deliverables</li>
                <li>• <span className="font-medium">Day 10 (Friday):</span> Final delivery, demo walkthrough, handoff complete</li>
              </ul>
              <p className="text-sm opacity-70 pt-2 border-t border-black/10 dark:border-white/15">
                This &quot;downhill&quot; phase is about building, not re-thinking. We know what we&apos;re making and we execute with speed and polish.
              </p>
            </div>

            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 text-sm space-y-2">
              <p className="font-medium text-blue-900 dark:text-blue-100">💡 Why Day 6 matters:</p>
              <p className="text-blue-800 dark:text-blue-200 opacity-90">
                After the weekend, we reconnect the abstract solution direction (locked on Day 5) back to the concrete deliverables we scoped on Day 1. This ensures the path forward is crystal clear—no ambiguity, just focused execution.
              </p>
            </div>

            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="font-medium">Throughout the sprint:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Regular progress check-ins (Days 3, 4, 5, 6, 8, 10)</li>
                <li>Real-time access to work-in-progress via your client portal</li>
                <li>Async communication—we respond within 24 hours</li>
                <li>No daily standups or Slack babysitting required</li>
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
            <h3 className="text-2xl font-semibold">Final delivery & Handoff</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Week 2 Friday — Sprint complete. You receive all final deliverables with source files, a Loom walkthrough explaining everything, and an optional live demo session. Pay the remaining 50% and you&apos;re done.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-3">
              <div>
                <p className="font-medium mb-1">What you receive:</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li>All final deliverables (Figma files, code repos, design assets, documentation)</li>
                  <li>Loom walkthrough video for asynchronous clarity</li>
                  <li>Optional live review session (if you prefer real-time Q&A)</li>
                  <li>Source files, exports, and handoff notes</li>
                  <li>Lifetime access to download your files via client dashboard</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Post-delivery:</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li>Pay remaining 50% final payment</li>
                  <li>Keep access to your client portal</li>
                  <li>Optional: Extended support packages available</li>
                </ul>
              </div>
            </div>
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
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-bold">Example packages</h2>
          <p className="text-lg opacity-70 max-w-2xl mx-auto">
            Ready-to-go sprint packages you can take off the shelf, or use our{" "}
            <Link href="https://form.typeform.com/to/eEiCy7Xj" target="_blank" className="font-medium underline hover:opacity-80 transition">
              intake form
            </Link>
            {" "}to get a custom package tailored to your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Package 1: Brand Identity Sprint */}
          <Link 
            href="/packages/brand-identity-sprint"
            className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4 hover:border-black/20 dark:hover:border-white/25 hover:shadow-lg transition"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Brand Identity Sprint</h3>
              <p className="text-sm opacity-70">
                Perfect for startups and new ventures needing a complete brand foundation
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="font-medium opacity-90">Includes:</div>
              <div className="space-y-1 opacity-80">
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">🎯</span>
                  <span>Sprint Kickoff Workshop - Branding</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">✏️</span>
                  <span>Typography Scale + Wordmark Logo</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">📋</span>
                  <span>Brand Style Guide</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/15">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$3,500</span>
                <span className="text-sm opacity-60">fixed price</span>
              </div>
              <div className="text-sm opacity-60 mt-1">22 hours · 2 weeks</div>
            </div>
          </Link>

          {/* Package 2: MVP Launch Sprint */}
          <Link 
            href="/packages/mvp-launch-sprint"
            className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4 hover:border-black/20 dark:hover:border-white/25 hover:shadow-lg transition"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">MVP Launch Sprint</h3>
              <p className="text-sm opacity-70">
                Validate your product idea with a landing page and working prototype
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="font-medium opacity-90">Includes:</div>
              <div className="space-y-1 opacity-80">
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">🎯</span>
                  <span>Sprint Kickoff Workshop - Product</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">🚀</span>
                  <span>Landing Page (Marketing)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">💻</span>
                  <span>Prototype - Level 1 (Basic)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/15">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$5,800</span>
                <span className="text-sm opacity-60">fixed price</span>
              </div>
              <div className="text-sm opacity-60 mt-1">36 hours · 2 weeks</div>
            </div>
          </Link>

          {/* Package 3: Startup Branding Sprint */}
          <Link 
            href="/packages/startup-branding-sprint"
            className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4 hover:border-black/20 dark:hover:border-white/25 hover:shadow-lg transition"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Startup Branding Sprint</h3>
              <p className="text-sm opacity-70">
                Launch-ready branding with logo, social presence, and pitch materials
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="font-medium opacity-90">Includes:</div>
              <div className="space-y-1 opacity-80">
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">🎯</span>
                  <span>Sprint Kickoff Workshop - Startup</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">✏️</span>
                  <span>Typography Scale + Wordmark Logo</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">📱</span>
                  <span>Social Media Template Kit</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">📊</span>
                  <span>Pitch Deck Template (Branded)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/15">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">$4,100</span>
                <span className="text-sm opacity-60">fixed price</span>
              </div>
              <div className="text-sm opacity-60 mt-1">26 hours · 2 weeks</div>
            </div>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm opacity-70">
            These are examples. Every sprint includes 1 workshop + 1-3 deliverables.{" "}
            <Link href="https://form.typeform.com/to/eEiCy7Xj" target="_blank" className="font-medium underline hover:opacity-80 transition">
              Get a custom package
            </Link>
            {" "}based on your specific needs.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to design your sprint?</h2>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Browse pre-packaged sprint bundles, build a custom sprint, or fill out our intake form. No commitment required until you book your kickoff Monday.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/packages"
            className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            Browse sprint packages →
          </Link>
          <Link
            href="https://form.typeform.com/to/eEiCy7Xj"
            target="_blank"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Start intake form
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Client login
          </Link>
        </div>
        <p className="text-sm opacity-60">
          Questions? Email us at hello@sprintbuilder.com
        </p>
      </section>
    </main>
  );
}


