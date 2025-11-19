import Link from "next/link";

export const dynamic = "force-static";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-black/5 to-transparent dark:from-white/5 py-16 px-6">
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
            <h3 className="text-2xl font-semibold">Design your sprint blueprint</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Start by telling us what you need. Choose from pre-packaged sprint templates or build a custom sprint by selecting specific deliverables. Fill out our quick intake form, and AI will generate a tailored 2-week sprint proposal.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-3">
              <div>
                <p className="font-medium mb-1">Three ways to start:</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li>
                    <Link href="/packages" className="font-medium underline hover:opacity-80 transition">
                      Browse sprint packages
                    </Link> — Pre-built bundles (MVP Launch, Brand Identity, etc.)
                  </li>
                  <li>
                    <Link href="/dashboard/sprint-builder" className="font-medium underline hover:opacity-80 transition">
                      Custom sprint builder
                    </Link> — Pick individual deliverables from our menu
                  </li>
                  <li>
                    <Link href="https://form.typeform.com/to/eEiCy7Xj" target="_blank" className="font-medium underline hover:opacity-80 transition">
                      AI-powered intake
                    </Link> — Answer 5 questions, get instant recommendation
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">You&apos;ll see upfront:</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li>Fixed price (no surprises)</li>
                  <li>1-3 specific deliverables with clear scope</li>
                  <li>Total hours and complexity estimate</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              2
            </div>
            <h3 className="text-2xl font-semibold">Confirm sprint + Book your kickoff Monday</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Review your sprint proposal, select your kickoff Monday from available dates, and pay a 50% deposit to lock in your spot. This anchors your commitment and gives us time to prepare.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="font-medium">What happens here:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Review deliverable scope and fixed pricing</li>
                <li>See available kickoff dates (real-time calendar)</li>
                <li>Optional pre-sprint discovery call (15-30 min)</li>
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
                <h4 className="font-semibold">Week 1 Arc (M/W/F)</h4>
              </div>
              <ul className="text-sm space-y-1 opacity-80">
                <li>• <span className="font-medium">Monday:</span> Kickoff workshop + initial exploration begins</li>
                <li>• <span className="font-medium">Wednesday:</span> First concepts shared, gather feedback</li>
                <li>• <span className="font-medium">Friday:</span> Mid-week feedback incorporated, direction locked in</li>
              </ul>
              <p className="text-sm opacity-70 pt-2 border-t border-black/10 dark:border-white/15">
                This &quot;uphill&quot; phase is about figuring things out—exploring options, testing ideas, and aligning on the best path forward before we commit.
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
            <h3 className="text-2xl font-semibold">Week 2: Down the hill — Execution</h3>
          </div>
          <div className="pl-16 space-y-4">
            <p className="text-base opacity-80">
              The second half is <span className="font-semibold">convergence + build</span>. We implement the chosen direction, design final assets, build prototypes or visuals, and iterate tightly with your feedback. No re-scoping—just focused execution.
            </p>
            
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏁</span>
                <h4 className="font-semibold">Week 2 Arc (M/W/F)</h4>
              </div>
              <ul className="text-sm space-y-1 opacity-80">
                <li>• <span className="font-medium">Monday:</span> Implement chosen direction, refinement begins</li>
                <li>• <span className="font-medium">Wednesday:</span> Final revisions, on-track checks</li>
                <li>• <span className="font-medium">Friday:</span> Delivery ready—all files finalized and packaged</li>
              </ul>
              <p className="text-sm opacity-70 pt-2 border-t border-black/10 dark:border-white/15">
                This &quot;downhill&quot; phase is about building, not re-thinking. We know what we&apos;re making and we execute with speed and polish.
              </p>
            </div>

            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="font-medium">Throughout the sprint:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Progress updates after each working day (M/W/F)</li>
                <li>Real-time access to work-in-progress via your client portal</li>
                <li>Async Q&A (we respond within 24 hours)</li>
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
            <h3 className="text-2xl font-semibold">Final delivery + Handoff</h3>
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
                Pick your deliverables, book your kickoff Monday, and you&apos;re done in 2 weeks. 6 working days (M/W/F), fixed timeline, no delays.
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
                One kickoff workshop, async updates M/W/F. No daily standups, no Slack babysitting. Check your portal when convenient.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to design your sprint?</h2>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Browse pre-packaged sprint bundles, build a custom sprint, or fill out our AI-powered intake form. No commitment required until you book your kickoff Monday.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/packages"
            className="inline-flex items-center rounded-full bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            Browse sprint packages →
          </Link>
          <Link
            href="https://form.typeform.com/to/eEiCy7Xj"
            target="_blank"
            className="inline-flex items-center rounded-full border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            AI intake form
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-full border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
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


