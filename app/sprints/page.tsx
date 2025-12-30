import Link from "next/link";
import HeroSection from "@/app/components/HeroSection";
import SectionIntro from "@/app/components/SectionIntro";
import SectionHeader from "@/app/components/SectionHeader";
import GettingStartedStep, { getGettingStartedStackClassName } from "@/app/components/GettingStartedStep";
import { SPRINT_WEEKS } from "@/lib/sprintProcess";

export const dynamic = "force-static";

const methodologyPillars = [
  {
    title: "Foundation sprint first",
    description:
      "Every client starts with a Brand or Product Foundation Sprint. We run the 3-hour kickoff workshop, capture strategy, and ship a source-of-truth that every Expansion Sprint references.",
    meta: "Required before any Expansion Sprint",
  },
  {
    title: "Uphill → downhill cadence",
    description:
      "Week 1 is exploration and alignment. Week 2 is execution and delivery. The cadence never changes, so you always know what happens on each day of the 10-day arc.",
    meta: "Same rhythm for brand, product, or marketing work",
  },
  {
    title: "Modular, stackable momentum",
    description:
      "Sprint, rest, then stack the next sprint when you are ready. The shared groundwork means we can move fast without redoing discovery or spinning up a new team every time.",
    meta: "Predictable scope + price every two weeks",
  },
] as const;

const methodologySteps = [
  {
    number: "01",
    title: "Lock kickoff + prep",
    body: "Pick a Monday start, sign the sprint agreement, and pay 50% to reserve the two-week window. We open your client portal with onboarding, file uploads, and schedule the kickoff workshop.",
  },
  {
    number: "02",
    title: "Week 1 · Go uphill",
    body: "Day 1 is the workshop, Days 2–3 are divergence, Day 4 is Ingredient Review where you shape grouped solutions into a direction, and Day 5 locks the direction with an async outline. You get updates and Looms the entire week.",
  },
  {
    number: "03",
    title: "Week 2 · Go downhill",
    body: "Day 6 is a quick direction check—last questions answered, then no more changes. Days 7–9 are building, reviewing, and polishing. Day 8 hosts Work-in-Progress Wednesday where you see it coming together and do early testing before final delivery.",
  },
  {
    number: "04",
    title: "Deliver, rest, repeat",
    body: "Day 10 includes final files, Loom walkthrough, optional live demo, and next-sprint recommendations. Test, gather feedback, then schedule the next sprint when you’re ready.",
  },
] as const;

const methodologyStepsLayoutClass = getGettingStartedStackClassName(methodologySteps.length);

export default function SprintsPage() {
  return (
    <main className="min-h-screen">
      <HeroSection
        eyebrow="Sprint methodology"
        title="Two-week sprints with uphill → downhill discipline"
        subtitle="A 10-day arc that starts with alignment, locks decisions mid-sprint, and ships premium deliverables every other Friday."
        body={
          <>
            <span className="block">
              Every engagement begins with a Foundation Sprint so we can capture strategy once. After that you can stack Expansion Sprints that reuse the same cadence without repeating discovery.
            </span>
            <span className="block mt-4">
              The result: predictable progress, clear touchpoints, and space between sprints to test, reflect, and choose the next climb.
            </span>
          </>
        }
        primaryCta={{ label: "Plan a sprint", href: "/intake" }}
        secondaryCta={{ label: "View packages", href: "/packages" }}
      />

      <section className="py-16 bg-white dark:bg-black border-y border-black/10 dark:border-white/10">
        <div className="container space-y-10">
          <SectionIntro text="Why this works" />
          <SectionHeader
            heading="Groundwork, cadence, and calm momentum"
            description="We remove agency chaos by pairing a required Foundation Sprint with a repeatable Uphill → Downhill system. Here’s what never changes."
            maxWidth="lg"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {methodologyPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{pillar.meta}</p>
                <h3 className="text-xl font-semibold text-black dark:text-white">{pillar.title}</h3>
                <p className="text-sm opacity-80">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-black/5 dark:bg-white/5">
        <div className="container space-y-10">
          <SectionIntro text="Ten working days" />
          <SectionHeader
            heading="Uphill Week 1, Downhill Week 2"
            description="Same flow for brand, product, or marketing deliverables. The timeline below comes straight from the sprint portal you’ll use during your engagement."
            maxWidth="lg"
          />

          <div className="grid gap-8 md:grid-cols-2">
            {SPRINT_WEEKS.map((week) => (
              <article
                key={week.id}
                className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl" aria-hidden>
                    {week.icon}
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide opacity-60">{week.title}</p>
                    <p className="text-sm opacity-75">{week.summary}</p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {week.days.map((day) => (
                    <li key={day.day} className="rounded-lg border border-black/5 dark:border-white/10 p-4 bg-black/5 dark:bg-white/5">
                      <p className="text-sm font-semibold text-black dark:text-white">{day.day}</p>
                      <p className="text-base font-medium text-black dark:text-white mt-1">{day.title}</p>
                      <p className="text-sm opacity-75 mt-1">{day.detail}</p>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-black">
        <div className="container space-y-10">
          <SectionIntro text="Four-move playbook" />
          <SectionHeader
            heading="Same moves for every sprint"
            description="No matter which deliverables you choose, the four steps below stay constant so you always know what happens next."
          />

          <div className={methodologyStepsLayoutClass}>
            {methodologySteps.map((step) => (
              <GettingStartedStep key={step.number} number={step.number} title={step.title} body={step.body} variant="card" />
            ))}
          </div>
        </div>
      </section>

      <section className="container max-w-4xl py-16 text-center space-y-6">
        <SectionIntro text="Ready to climb?" />
        <SectionHeader
          heading="Kick off your next sprint"
          description="Start with a Foundation Sprint, then stack Expansion Sprints whenever you need more momentum. Same team, same cadence, every time."
        />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/intake"
            className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            Start intake
          </Link>
          <Link
            href="/packages"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            View sprint packages
          </Link>
          <Link
            href="https://cal.com/chrismeisner/sprint-planner"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Book a sprint call
          </Link>
        </div>
        <p className="text-sm opacity-60">Questions? Email hello@greatwork.studio and we’ll map the next climb together.</p>
      </section>
    </main>
  );
}

