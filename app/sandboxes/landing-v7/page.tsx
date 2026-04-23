import Link from "next/link";
import type { ReactNode } from "react";
import FadeInSection from "@/app/components/FadeInSection";
import SelectedWorkCarousel from "@/app/sandboxes/landing-v7/_components/SelectedWorkCarousel";

const JAM_SESSION = "/intake";
const OVERLINE_CLASS = "text-xs font-medium uppercase tracking-wide leading-none text-text-muted";
const HEADING_CLASS = "text-4xl font-semibold leading-tight text-balance text-text-primary";
const SUBHEADING_CLASS = "text-2xl font-semibold leading-snug text-balance text-text-primary";
const SECTION_INTRO_CLASS = "text-lg font-normal leading-relaxed text-pretty text-text-secondary";
const BODY_CLASS = "text-base font-normal leading-normal text-pretty text-text-secondary";
const CARD_TITLE_CLASS = "text-lg font-medium leading-snug text-balance text-text-primary";
const CARD_BODY_CLASS = "text-sm font-normal leading-normal text-pretty text-text-secondary";
const CARD_META_CLASS = "text-sm font-medium leading-normal text-text-primary";
const CARD_PRICE_CLASS = "text-lg font-semibold leading-snug tabular-nums text-text-primary";
const SECTION_SPACING = "py-20";
const PRIMARY_CTA_CLASS =
  "inline-flex h-12 items-center justify-center rounded-md bg-text-primary px-6 text-base font-semibold text-background transition-opacity duration-150 hover:opacity-90";
const KICKOFF_MIN_LEAD_DAYS = 10;
const BACKEND_KICKOFF_DATE = process.env.NEXT_AVAILABLE_KICKOFF_DATE;

type SprintOption = {
  name: string;
  description: string;
  price: string;
  dependency?: string;
  note?: string;
};

const sprints: SprintOption[] = [
  {
    name: "Foundation: Core User, Journey & Competitive Positioning",
    description:
      "Who your core user is, what they're carrying, and what motivates them. The story of where your product enters their life. A competitive landscape map showing where you fit.",
    price: "$12,000",
    note: "This sprint unlocks Brand Foundations and Prototype Sprint.",
  },
  {
    name: "Foundation: Brand",
    description:
      "Color palette, typography system, wordmark logo, image direction, and color primitive tokens — the complete visual foundation delivered as a Figma file with style guide.",
    price: "$15,000",
    dependency:
      "Requires Core User, Journey & Competitive Positioning — or equivalent existing strategy work.",
  },
  {
    name: "Prototype Sprint",
    description:
      "A working interactive prototype built in Next.js / Tailwind or Figma — enough to validate direction, test with users, or present to stakeholders before committing to a full build.",
    price: "$15,000",
    dependency:
      "Requires Core User, Journey & Competitive Positioning — or equivalent existing strategy work.",
  },
  {
    name: "UI Build",
    description:
      "A production-ready Figma file with a complete component library, token architecture, style guide, and symbols — built to hand directly to an engineering team and start building from.",
    price: "$20,000",
    dependency: "Requires Prototype Sprint — or equivalent existing prototype.",
  },
];

type ExpansionOption = {
  name: string;
  description: string;
  buildsOn: string;
  price: string;
};

const expansions: ExpansionOption[] = [
  {
    name: "Strategy Expansion",
    description:
      "Deeper user research, additional personas, refined positioning, or a second competitive pass.",
    buildsOn: "Builds on the Core User, Journey & Competitive Positioning sprint.",
    price: "$5,000",
  },
  {
    name: "Brand Expansion",
    description:
      "Logo exploration, iconography, motion identity, extended collateral, or a deeper type system.",
    buildsOn: "Builds on the Brand Foundations sprint.",
    price: "$6,000",
  },
  {
    name: "Prototype Expansion",
    description:
      "Additional flows, edge cases, interaction states, or a second prototype direction.",
    buildsOn: "Builds on the Prototype Sprint.",
    price: "$6,000",
  },
  {
    name: "UI Expansion",
    description:
      "Additional components, extended token system, additional screen states, or platform variants.",
    buildsOn: "Builds on the UI Build sprint.",
    price: "$8,000",
  },
];

const milesSlides = [
  {
    id: "miles-1",
    title: "Dashboard UI — fleet map, light mode",
    caption: "Miles dashboard — light mode. Production-ready UI delivered Day 10.",
  },
  {
    id: "miles-2",
    title: "Dashboard UI — dark mode",
    caption: "Dark mode — same component system, full token architecture.",
  },
  {
    id: "miles-3",
    title: "Figma component library — handoff file",
    caption: "Engineering handoff — Figma file with tokens, style guide, and symbols.",
  },
  {
    id: "miles-4",
    title: "UX flow — prototype",
    caption: "UX flow — Week 1 deliverable that locked direction before the build began.",
  },
];

const comparisonColumns = [
  { label: "Design Agency" },
  { label: "Full-Time Hire" },
  { label: "Freelancer" },
  { label: "Single Source", highlight: true },
] as const;

const comparisonRows = [
  {
    label: "Time to start",
    values: ["4–8 weeks", "2–3 months", "1–2 weeks", "This week"],
  },
  {
    label: "Flexibility",
    values: [
      "Low — minimum commitments, hard to pause or stop",
      "None — permanent headcount",
      "Medium — easy to stop, hard to restart well",
      "High — sprint by sprint, start and stop as needed",
    ],
  },
  {
    label: "Price range",
    values: [
      "$50,000–$250,000+ per project",
      "$120,000–$180,000+/yr fully loaded",
      "$5,000–$30,000 — varies widely",
      "$12,000–$20,000 per sprint",
    ],
  },
  {
    label: "Skill depth",
    values: [
      "Specialists siloed by discipline",
      "One skill set",
      "One skill set, variable quality",
      "Strategy, design, and build — one person, full stack",
    ],
  },
  {
    label: "Who's involved",
    values: [
      "Account manager, creative director, junior team — 4–8 people",
      "One employee",
      "One freelancer",
      "Single Source — one senior practitioner, start to finish",
    ],
  },
  {
    label: "Process",
    values: [
      "Structured but slow — layers of approval, multiple handoffs",
      "Unstructured — depends on internal systems",
      "Rarely structured — you manage the project",
      "Structured sprint cadence — defined scope, fixed timeline, client dashboard, Day 10 delivery",
    ],
  },
  {
    label: "Pricing type",
    values: [
      "Hourly or retainer — open-ended",
      "Fixed salary",
      "Hourly or project — often vague",
      "Fixed price per sprint — defined before work begins",
    ],
  },
];

function parseIsoDate(value: string | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed;
}

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatKickoffDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getNextAvailableKickoffLabel(): string {
  const minDate = addDaysUtc(startOfTodayUtc(), KICKOFF_MIN_LEAD_DAYS);
  const configured = parseIsoDate(BACKEND_KICKOFF_DATE);
  const finalDate = configured && configured >= minDate ? configured : minDate;
  return formatKickoffDate(finalDate);
}

function SectionOverline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`${OVERLINE_CLASS}${className ? ` ${className}` : ""}`}>{children}</p>;
}

function PlaceholderPanel({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center rounded-md bg-neutral-200 dark:bg-neutral-800 ${className}`}>
      <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-400 text-center px-4">
        {label}
      </p>
    </div>
  );
}

function PrimaryCta({ className = "" }: { className?: string }) {
  return (
    <Link href={JAM_SESSION} className={`${PRIMARY_CTA_CLASS} ${className}`}>
      Start the intake
    </Link>
  );
}

function SprintCard({ sprint }: { sprint: SprintOption }) {
  return (
    <div className="rounded-md border border-stroke-muted bg-surface-subtle p-6 space-y-4">
      <div className="space-y-2">
        <h3 className={CARD_TITLE_CLASS}>{sprint.name}</h3>
        <p className={CARD_BODY_CLASS}>{sprint.description}</p>
        {sprint.dependency ? <p className={CARD_META_CLASS}>{sprint.dependency}</p> : null}
        {sprint.note ? <p className={CARD_META_CLASS}>{sprint.note}</p> : null}
      </div>
      <div className="flex items-end justify-between gap-4 border-t border-stroke-muted pt-4">
        <p className={OVERLINE_CLASS}>2-week sprint</p>
        <p className={CARD_PRICE_CLASS}>{sprint.price}</p>
      </div>
    </div>
  );
}

function ExpansionCard({ expansion }: { expansion: ExpansionOption }) {
  return (
    <div className="rounded-md border border-stroke-muted bg-surface-subtle p-6 space-y-4">
      <div className="space-y-2">
        <h3 className={CARD_TITLE_CLASS}>{expansion.name}</h3>
        <p className={CARD_BODY_CLASS}>{expansion.description}</p>
        <p className={CARD_META_CLASS}>{expansion.buildsOn}</p>
      </div>
      <div className="flex items-end justify-between gap-4 border-t border-stroke-muted pt-4">
        <p className={OVERLINE_CLASS}>1-week expansion</p>
        <p className={CARD_PRICE_CLASS}>{expansion.price}</p>
      </div>
    </div>
  );
}

export default function LandingV7() {
  const nextAvailableKickoff = getNextAvailableKickoffLabel();

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-stroke-muted bg-background/90 backdrop-blur-sm">
        <div className="container max-w-6xl flex h-14 items-center justify-between">
          <p className="text-sm font-semibold text-text-primary">Single Source</p>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary">
              Client Login
            </Link>
          </div>
        </div>
      </header>

      <main>
      {/* Above the Fold */}
      <FadeInSection triggerOnMount>
        <section className="container max-w-6xl py-16 md:py-20 space-y-10">
          <div className="max-w-4xl space-y-8">
            <h1 className="text-5xl font-bold leading-tight text-balance text-text-primary">
              From direction to deliverable in ten days.
            </h1>
            <p className={`${SECTION_INTRO_CLASS} max-w-3xl`}>
              Two-week sprints for teams that need to move fast without sacrificing quality. Defined
              scope. Fixed price. One senior practitioner start to finish — no handoffs, no account
              managers, no surprises.
            </p>

            <PrimaryCta />
          </div>
        </section>
      </FadeInSection>

      {/* Section 2 — How It Works */}
      <FadeInSection>
        <section className={`bg-surface-subtle ${SECTION_SPACING}`}>
          <div className="container max-w-6xl space-y-10">
            <div className="max-w-3xl space-y-4">
              <SectionOverline>How It Works</SectionOverline>
              <h2 className={HEADING_CLASS}>
                Three steps. Ten days. Real files at the end.
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-3 sm:items-stretch">
              {/* Step 1 */}
              <div className="flex flex-col rounded-md border border-stroke-muted bg-background p-6 gap-4">
                <p className={OVERLINE_CLASS}>Step 1 — Before kickoff</p>
                <h3 className={SUBHEADING_CLASS}>Align.</h3>
                <p className={`${CARD_BODY_CLASS} flex-1`}>
                  A 30-minute call to scope the work, answer questions, and make sure the sprint
                  format is the right fit. We&apos;ll align on goals, confirm the deliverables, and
                  lock a kickoff date. No commitment required — just a conversation.
                </p>
                <div className="pt-2">
                  <PrimaryCta className="w-full sm:w-auto" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col rounded-md border border-stroke-muted bg-background p-6 gap-4">
                <p className={OVERLINE_CLASS}>Step 2 — Monday, Week 1</p>
                <h3 className={SUBHEADING_CLASS}>Kickoff.</h3>
                <p className={`${CARD_BODY_CLASS} flex-1`}>
                  Week 1 is uphill — exploring options, pressure-testing direction, and aligning on
                  a single path forward. It opens with a kickoff workshop on Day 1 and closes on
                  Friday with direction locked. From Day 1 you get a private client dashboard —
                  daily updates, working links, Loom walkthroughs, invoices, and deliverables. All
                  in one place.
                </p>
                <div className="pt-2">
                  <Link href="/process" className={`${PRIMARY_CTA_CLASS} w-full sm:w-auto`}>
                    See how the two weeks work
                  </Link>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col rounded-md border border-stroke-muted bg-background p-6 gap-4">
                <p className={OVERLINE_CLASS}>Step 3 — Friday, Week 2</p>
                <h3 className={SUBHEADING_CLASS}>Delivery.</h3>
                <p className={`${CARD_BODY_CLASS} flex-1`}>
                  Week 2 is downhill — heads-down build with one mid-week check-in, then final
                  delivery on Day 10. You get the real files: Figma components, working code,
                  strategy docs — whatever the sprint called for — plus a Loom walkthrough and
                  optional live demo.
                </p>
                <div className="pt-2">
                  <Link
                    href="https://www.loom.com/share/miles-sprint-delivery"
                    target="_blank"
                    rel="noreferrer"
                    className={`${PRIMARY_CTA_CLASS} w-full sm:w-auto`}
                  >
                    Watch a real sprint delivery
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* Section 3 — How It Compares */}
      <FadeInSection>
        <section className={`container max-w-6xl ${SECTION_SPACING}`}>
          <div className="space-y-10">
            <div className="max-w-3xl space-y-4">
              <SectionOverline>How It Compares</SectionOverline>
              <h2 className={HEADING_CLASS}>
                Where it fits — and where it doesn&apos;t.
              </h2>
              <p className={SECTION_INTRO_CLASS}>
                The sprint model isn&apos;t for every situation. Here&apos;s an honest look at where
                it fits.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr>
                    <th className="py-3 pr-4" />
                    {comparisonColumns.map((col) => (
                      <th
                        key={col.label}
                        className={`py-3 px-4 text-left text-xs font-medium uppercase tracking-wide leading-none ${
                          "highlight" in col && col.highlight
                            ? "text-text-primary"
                            : "text-text-muted"
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke-muted">
                  {comparisonRows.map((row) => (
                    <tr key={row.label}>
                      <td className="py-4 pr-4 text-sm font-semibold text-text-primary align-top whitespace-nowrap">
                        {row.label}
                      </td>
                      {row.values.map((value, i) => (
                        <td
                          key={i}
                          className={`py-4 px-4 text-sm font-normal leading-normal align-top ${
                            "highlight" in comparisonColumns[i] && comparisonColumns[i].highlight
                              ? "text-text-primary font-medium"
                              : "text-text-secondary"
                          }`}
                        >
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* Section 4 — Sprint Types */}
      <FadeInSection>
        <section className={`bg-surface-subtle ${SECTION_SPACING}`}>
          <div className="container max-w-6xl space-y-10">
            <div className="max-w-3xl space-y-4">
              <SectionOverline>Sprint Types</SectionOverline>
              <h2 className={HEADING_CLASS}>
                Sprints are designed to stack. Each one builds on what came before.
              </h2>
              <p className="w-full border-t border-stroke-muted pt-4 text-sm font-normal leading-normal text-text-muted">
                <span className="font-medium text-text-primary">Next available kickoff:</span> Week of{" "}
                {nextAvailableKickoff}.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {sprints.map((sprint) => (
                <SprintCard key={sprint.name} sprint={sprint} />
              ))}
            </div>

          </div>
        </section>
      </FadeInSection>

      {/* Section 6 — Post Sprint */}
      <FadeInSection>
        <section className={`container max-w-6xl ${SECTION_SPACING}`}>
          <div className="space-y-14">

            {/* Parent header */}
            <div className="max-w-3xl space-y-4">
              <SectionOverline>Post Sprint</SectionOverline>
              <h2 className={HEADING_CLASS}>
                The sprint delivers a functional v1 on Day 10. What comes next depends on where you want to go.
              </h2>
            </div>

            {/* Subsection A — Go Deeper */}
            <div className="space-y-8 border-t border-stroke-muted pt-10">
              <div className="max-w-3xl space-y-3">
                <h3 className={SUBHEADING_CLASS}>Go Deeper — Expansion Weeks</h3>
                <p className={BODY_CLASS}>
                  Want to take something further? Expansion weeks build directly on the sprint that
                  came before. One week, one focus — deeper research, more components, additional
                  flows, or a second direction entirely. No re-onboarding, no spin-up. Just more of
                  the work, done well.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-md border border-stroke-muted bg-surface-subtle p-6 space-y-4">
                  <p className={OVERLINE_CLASS}>Step 1 — From your dashboard</p>
                  <p className={CARD_BODY_CLASS}>
                    Request an expansion week directly from your client dashboard. Select the sprint
                    you want to build on and describe what you want to go deeper on.
                  </p>
                </div>
                <div className="rounded-md border border-stroke-muted bg-surface-subtle p-6 space-y-4">
                  <p className={OVERLINE_CLASS}>Step 2 — Monday</p>
                  <p className={CARD_BODY_CLASS}>
                    Kickoff call to confirm scope for the week. One focused direction locked before
                    any work begins.
                  </p>
                </div>
                <div className="rounded-md border border-stroke-muted bg-surface-subtle p-6 space-y-4">
                  <p className={OVERLINE_CLASS}>Step 3 — Friday</p>
                  <p className={CARD_BODY_CLASS}>
                    Expansion delivered. Same Loom walkthrough, same dashboard update, same handoff
                    standard as the original sprint.
                  </p>
                </div>
              </div>

              <p className={CARD_META_CLASS}>Starting at $5,000 per week.</p>
            </div>

            {/* Subsection B — Stay on Track */}
            <div className="space-y-4 border-t border-stroke-muted pt-10">
              <h3 className={SUBHEADING_CLASS}>Stay on Track — Sprint Support</h3>
              <p className={`${BODY_CLASS} max-w-2xl`}>
                Implementing what was built and want someone in your corner while you do it? Sprint
                Support is a light monthly engagement — biweekly check-ins and 24-hour email access
                to keep momentum alive and questions answered.
              </p>
              <p className={CARD_META_CLASS}>
                $2,000 / month. Available for up to three months after any sprint.
              </p>
            </div>

          </div>
        </section>
      </FadeInSection>

      {/* Section 7 — Selected Work */}
      <FadeInSection>
        <section className={`container max-w-6xl ${SECTION_SPACING} space-y-10`}>
          <SectionOverline>Selected Work</SectionOverline>

          <SelectedWorkCarousel slides={milesSlides} />

          <div className="space-y-4">
            <h2 className={SUBHEADING_CLASS}>
              Miles — AI-powered fleet intelligence platform
            </h2>
            <SectionOverline>UI Build Sprint</SectionOverline>
            <p className={BODY_CLASS}>
              Miles needed a complete mobile dashboard UI before their next investor conversation.
              Starting from wireframes, the sprint delivered a production-ready iOS design system —
              full Figma component library, token architecture, dark mode, and engineering handoff
              documentation — in ten days. The team had something they could build directly from on
              Day 10.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PlaceholderPanel label="Prototype Sprint example" className="h-32" />
            <PlaceholderPanel label="Foundation Sprint example" className="h-32" />
          </div>
        </section>
      </FadeInSection>

      {/* Section 8 — Single Source, and How to Start */}
      <FadeInSection>
        <section className={`bg-surface-subtle ${SECTION_SPACING}`}>
          <div className="container max-w-6xl grid gap-10 lg:grid-cols-2 lg:items-start">
            <PlaceholderPanel
              label="Photo — Chris Meisner"
              className="h-96 lg:order-2"
            />

            <div className="space-y-4 lg:order-1">
              <SectionOverline>Single Source, and How to Start</SectionOverline>
              <p className={BODY_CLASS}>
                Single Source is run by Chris Meisner. Chris has led sprints for pre-seed teams and
                public companies alike — in-house design teams, new ventures inside enterprise orgs,
                founders sharpening the story behind their next raise.
              </p>
              <p className={BODY_CLASS}>
                The sprint model is how those experiences became something repeatable, honest, and
                actually useful — instead of open-ended and hard to measure.
              </p>
              <p className={BODY_CLASS}>
                Chris is also available directly — embedded with your team on an ad hoc basis for
                work that falls outside the sprint model. More at{" "}
                <Link href="https://chrismeisner.com" target="_blank" rel="noreferrer" className="underline">
                  chrismeisner.com
                </Link>
                .
              </p>

            </div>
          </div>
        </section>
      </FadeInSection>

      {/* Footer */}
      <footer className="border-t border-stroke-muted">
        <div className="container max-w-6xl flex items-center justify-between py-8">
          <p className="text-sm font-medium text-text-primary">Single Source</p>
          <p className="text-sm text-text-muted">© {new Date().getFullYear()}</p>
        </div>
      </footer>
      </main>
    </div>
  );
}
