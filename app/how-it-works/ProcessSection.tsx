"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProcessSection() {
  const [isProcessExpanded, setIsProcessExpanded] = useState(false);

  return (
    <section className="container max-w-4xl py-16 space-y-12">
      <div className="text-center space-y-2">
        <button
          onClick={() => setIsProcessExpanded(!isProcessExpanded)}
          className="w-full group"
          aria-expanded={isProcessExpanded}
        >
          <div className="flex items-center justify-center gap-3 hover:opacity-80 transition">
            <h2 className="text-3xl font-bold">A Great Work Studio 2-week sprint in 4 moves</h2>
            <svg
              className={`w-6 h-6 transition-transform duration-300 ${isProcessExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <p className="text-lg opacity-70 mt-2">Same cadence for Foundations and every Expansion Sprint</p>
        </button>
      </div>

      {isProcessExpanded && (
        <>
          {/* Step 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h3 className="text-2xl font-semibold">Book your Foundation Sprint → pay 50% to lock the week</h3>
            </div>
            <div className="pl-16 space-y-2">
              <p className="text-base opacity-80">
                Choose Brand or Product Foundations, review the preset deliverables, tell us your preferred kickoff Monday, and sign + pay 50% via Stripe to reserve the 2-week slot. You&apos;ll get a client portal with onboarding tasks, file uploads, and calendar invites before Day 1.
              </p>
              <p className="text-sm opacity-60 italic">
                Need help choosing?{' '}
                <Link
                  href="https://cal.com/chrismeisner/sprint-planner"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline hover:opacity-80 transition"
                >
                  Book a sprint-planning call
                </Link>{' '}
                and we&apos;ll point you in the right direction.
              </p>
              <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 p-4 text-sm space-y-1">
                <p className="font-medium">Step 1 checklist:</p>
                <ul className="list-disc pl-5 space-y-1 opacity-80">
                  <li>Pick Brand or Product Foundation sprint</li>
                  <li>Share goals, links, and preferred kickoff Mondays</li>
                  <li>Sign digital agreement + pay 50% deposit via Stripe</li>
                  <li>Complete the 5-step onboarding checklist in your portal</li>
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
              <h3 className="text-2xl font-semibold">Week 1: Kickoff Monday → go uphill (diverge + align)</h3>
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
              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 text-sm space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <span>⭐</span> Week 1 Alignment Guarantee
                </p>
                <p className="text-blue-800 dark:text-blue-200 opacity-90">
                  If after Week 1 you feel we haven&apos;t aligned on a clear direction, you can stop the sprint with no additional payments. We keep the 50% deposit to cover the completed Week 1 work, and we both walk away—no hard feelings.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h3 className="text-2xl font-semibold">Week 2: Down the hill — execute & deliver</h3>
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
                  <li>• Day 10 (Friday): Final delivery, Loom walkthrough, and optional live demo</li>
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
              <h3 className="text-2xl font-semibold">Ship, test, and book the next sprint when ready</h3>
            </div>
            <div className="pl-16 space-y-3">
              <p className="text-base opacity-80">
                Week 2 Friday — sprint complete. You receive final deliverables with source files, a Loom walkthrough, and an optional live demo. Test with customers, gather feedback, then pick new deliverables and schedule another Expansion Sprint whenever you need more momentum.
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
        </>
      )}
    </section>
  );
}

