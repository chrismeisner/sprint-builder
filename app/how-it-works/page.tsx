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
            Get an instant AI-powered sprint plan, then we execute M/W/F over 2 weeks—no endless meetings, no scope creep, just results.
          </p>
        </div>
      </section>

      {/* The Process */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="text-lg opacity-70">
            Six simple steps from intake to delivery
          </p>
        </div>

        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
              1
            </div>
            <h3 className="text-2xl font-semibold">Fill out the intake form</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Tell us about your project, goals, and constraints in a quick 5-minute form. No sales calls, no back-and-forth emails.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="font-medium">What we ask:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>What are you building and why?</li>
                <li>Who is it for?</li>
                <li>What&apos;s your timeline and budget?</li>
                <li>What deliverables do you need? (branding, web design, MVP, etc.)</li>
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
            <h3 className="text-2xl font-semibold">Receive your draft sprint plan instantly</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              As soon as you submit the intake form, our AI generates a complete sprint plan and sends it to your email. We review and refine it within 24 hours.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="font-medium">Your sprint plan includes:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li><span className="font-medium">Clear goals</span> — what we&apos;ll accomplish</li>
                <li><span className="font-medium">1-3 specific deliverables</span> — exactly what you&apos;ll receive</li>
                <li><span className="font-medium">Detailed backlog</span> — every task broken down</li>
                <li><span className="font-medium">6-day working timeline</span> — Monday, Wednesday, Friday over 2 weeks</li>
                <li><span className="font-medium">Assumptions & risks</span> — what could go wrong and how we&apos;ll handle it</li>
                <li><span className="font-medium">Fixed price</span> — no surprises</li>
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
            <h3 className="text-2xl font-semibold">Confirm and schedule</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Review the sprint plan, ask questions, and lock in your start date. If we need to clarify anything, we&apos;ll hop on a quick discovery call.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="font-medium">What happens here:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Review deliverables and timeline</li>
                <li>Request changes if needed (we&apos;ll revise)</li>
                <li>Optional discovery call (15-30 min) to align on details</li>
                <li>Accept terms and pay to lock in your spot</li>
                <li>Choose your start date</li>
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
            <h3 className="text-2xl font-semibold">Kick off your sprint</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              Day 1 arrives, and we hit the ground running. You&apos;ll get access to your client portal to track progress in real-time.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="font-medium">What you get:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Welcome email with portal access</li>
                <li>Live progress dashboard (see what&apos;s happening today)</li>
                <li>Async messaging (ask questions anytime, no meetings required)</li>
                <li>Your dedicated designer starts executing</li>
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
            <h3 className="text-2xl font-semibold">The 2-week sprint process</h3>
          </div>
          <div className="pl-16 space-y-4">
            <p className="text-base opacity-80">
              We work <span className="font-semibold">Monday, Wednesday, Friday</span> over 2 weeks (6 working days total). 
              We follow the Shape Up methodology: <span className="font-semibold">uphill</span> (exploration & iteration) 
              then <span className="font-semibold">downhill</span> (refinement & delivery).
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⛰️</span>
                  <h4 className="font-semibold">Week 1: Uphill (M/W/F)</h4>
                </div>
                <p className="text-sm opacity-80">
                  Exploration and figuring things out. We iterate quickly, share work-in-progress, and incorporate your feedback.
                </p>
                <ul className="text-sm space-y-1 opacity-80">
                  <li>• <span className="font-medium">Monday:</span> Kickoff, initial exploration</li>
                  <li>• <span className="font-medium">Wednesday:</span> First concepts shared</li>
                  <li>• <span className="font-medium">Friday:</span> Feedback incorporated, direction locked in</li>
                </ul>
              </div>

              <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏁</span>
                  <h4 className="font-semibold">Week 2: Downhill (M/W/F)</h4>
                </div>
                <p className="text-sm opacity-80">
                  Refinement and finishing. We know exactly what we&apos;re building and polish everything to completion.
                </p>
                <ul className="text-sm space-y-1 opacity-80">
                  <li>• <span className="font-medium">Monday:</span> Refinement and polish</li>
                  <li>• <span className="font-medium">Wednesday:</span> Final revisions, near complete</li>
                  <li>• <span className="font-medium">Friday:</span> Delivery ready, all files finalized</li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
              <p className="font-medium">Throughout the sprint:</p>
              <ul className="list-disc pl-5 space-y-1 opacity-80">
                <li>Progress updates after each working day (M/W/F)</li>
                <li>See exactly what&apos;s being worked on in real-time</li>
                <li>Access to work-in-progress files</li>
                <li>Async Q&A (we respond within 24 hours)</li>
                <li>No meetings required—everything happens in your portal</li>
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
            <h3 className="text-2xl font-semibold">Delivery + 2 weeks free support</h3>
          </div>
          <div className="pl-16 space-y-2">
            <p className="text-base opacity-80">
              At the end of Week 2 Friday, you receive all final deliverables with source files. Plus, you get 2 weeks of free support for fixes and small iterations.
            </p>
            <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-3">
              <div>
                <p className="font-medium mb-1">What&apos;s included:</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li>All final files (Figma, code repos, design assets, etc.)</li>
                  <li>Source files and exports</li>
                  <li>Documentation and handoff notes</li>
                  <li>Lifetime access to download your files</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">2-week support package (free):</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li>Up to 5 support requests</li>
                  <li>Bug fixes and small corrections</li>
                  <li>Minor iterations on delivered work</li>
                  <li>No new deliverables (those need a new sprint)</li>
                </ul>
              </div>
              <p className="text-xs opacity-60 pt-2 border-t border-black/10 dark:border-white/15">
                Need more support? Extended support packages available for $1,500 (10 additional requests, 2 more weeks).
              </p>
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
              <h3 className="font-semibold text-lg">Fast</h3>
              <p className="text-sm opacity-80">
                Draft plan generated instantly. Sprint starts within a week. Results delivered after 6 working days (M/W/F over 2 weeks).
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl">🎯</div>
              <h3 className="font-semibold text-lg">Fixed scope</h3>
              <p className="text-sm opacity-80">
                1-3 specific deliverables, clear timeline, fixed price. No scope creep, no surprise bills.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-3xl">🧘</div>
              <h3 className="font-semibold text-lg">Low effort</h3>
              <p className="text-sm opacity-80">
                No daily standups or Slack babysitting. Check your portal when convenient. We handle the rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <h2 className="text-3xl font-bold">Ready to start your sprint?</h2>
        <p className="text-lg opacity-80 max-w-2xl mx-auto">
          Fill out the intake form and get your custom sprint plan instantly. No commitment required until you approve the plan.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="https://form.typeform.com/to/eEiCy7Xj"
            target="_blank"
            className="inline-flex items-center rounded-full bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            Start your intake form →
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


