import Link from "next/link";

export default function Home() {
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
          {/* Sprint 1: Brand Identity */}
          <Link 
            href="/packages/brand-identity-sprint"
            className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4 hover:border-black/20 dark:hover:border-white/25 hover:shadow-lg transition"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Brand Identity Sprint</h3>
              <p className="text-sm opacity-70">
                Complete brand foundation for new ventures
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="font-medium opacity-90">Includes:</div>
              <div className="space-y-1 opacity-80">
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">🎯</span>
                  <span>Sprint Kickoff Workshop</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">✏️</span>
                  <span>Wordmark Logo</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">📋</span>
                  <span>Brand Style Guide</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/15">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">$3,500</span>
                <span className="text-xs opacity-60">fixed</span>
              </div>
              <div className="text-xs opacity-60 mt-1">22 hours · 2 weeks</div>
            </div>
          </Link>

          {/* Sprint 2: MVP Launch */}
          <Link 
            href="/packages/mvp-launch-sprint"
            className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4 hover:border-black/20 dark:hover:border-white/25 hover:shadow-lg transition"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">MVP Launch Sprint</h3>
              <p className="text-sm opacity-70">
                Validate your idea with a landing page & prototype
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="font-medium opacity-90">Includes:</div>
              <div className="space-y-1 opacity-80">
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">🎯</span>
                  <span>Sprint Kickoff Workshop</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">🚀</span>
                  <span>Landing Page</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">💻</span>
                  <span>Working Prototype</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/15">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">$5,800</span>
                <span className="text-xs opacity-60">fixed</span>
              </div>
              <div className="text-xs opacity-60 mt-1">36 hours · 2 weeks</div>
            </div>
          </Link>

          {/* Sprint 3: Startup Branding */}
          <Link 
            href="/packages/startup-branding-sprint"
            className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4 hover:border-black/20 dark:hover:border-white/25 hover:shadow-lg transition"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Startup Branding Sprint</h3>
              <p className="text-sm opacity-70">
                Launch-ready brand + pitch materials
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="font-medium opacity-90">Includes:</div>
              <div className="space-y-1 opacity-80">
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">🎯</span>
                  <span>Sprint Kickoff Workshop</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">✏️</span>
                  <span>Wordmark Logo</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">📱</span>
                  <span>Social Media Kit</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">📊</span>
                  <span>Pitch Deck</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-black/10 dark:border-white/15">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">$4,100</span>
                <span className="text-xs opacity-60">fixed</span>
              </div>
              <div className="text-xs opacity-60 mt-1">26 hours · 2 weeks</div>
            </div>
          </Link>
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
