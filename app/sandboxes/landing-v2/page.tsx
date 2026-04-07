import Link from "next/link";
import type { ReactNode } from "react";
import FadeInSection from "@/app/components/FadeInSection";
import SelectedWorkCarousel from "@/app/sandboxes/landing-v2/_components/SelectedWorkCarousel";

const JAM_SESSION = "https://cal.com/chrismeisner/jam-session";
const INTAKE_FORM = "/intake";
const OVERLINE_CLASS = "text-xs font-medium uppercase tracking-wide leading-none text-text-muted";
const BODY_CLASS = "text-base font-normal leading-normal text-pretty text-text-secondary";
const SECTION_SPACING = "py-20";
const PRIMARY_CTA_CLASS =
  "inline-flex h-12 items-center justify-center rounded-md bg-text-primary px-6 text-base font-semibold text-background transition-opacity duration-150 hover:opacity-90";
const SECONDARY_CTA_CLASS =
  "inline-flex h-12 items-center justify-center rounded-md border border-stroke-muted bg-surface-subtle px-6 text-base font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-strong";

type SprintOption = {
  name: string;
  description: string;
  price: string;
};

const sprints: SprintOption[] = [
  {
    name: "Foundation: Mission & Strategy",
    description: "Core users, competitive landscape, positioning clarity.",
    price: "$12,000",
  },
  {
    name: "Foundation: Brand",
    description: "Color, typography, wordmark, logo, style guide.",
    price: "$15,000",
  },
  {
    name: "Prototype Sprint",
    description:
      "Web app, landing page, or iOS app at prototype fidelity. Built in Next.js / Tailwind.",
    price: "$15,000",
  },
  {
    name: "Build Sprint",
    description:
      "High-fidelity branded UI. Figma file with tokens, style guide, and symbols — ready for engineering.",
    price: "$20,000",
  },
];

const milesSlides = [
  {
    id: "miles-1",
    title: "Dashboard — light mode",
    caption: "Miles dashboard — light mode. Production-ready UI delivered Day 10.",
  },
  {
    id: "miles-2",
    title: "Dashboard — dark mode",
    caption: "Dark mode — same component system, full token architecture.",
  },
  {
    id: "miles-3",
    title: "Component library",
    caption: "Engineering handoff — Figma file with tokens, style guide, and symbols.",
  },
  {
    id: "miles-4",
    title: "UX flow",
    caption: "UX flow — Week 1 deliverable that locked direction before the build began.",
  },
];

const comparisonColumns = [
  { label: "Design Agency" },
  { label: "Full-Time Hire" },
  { label: "Freelancer" },
  { label: "Chris Meisner Studio", highlight: true },
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
      "Chris — one senior practitioner, start to finish",
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
    <Link href={JAM_SESSION} target="_blank" rel="noreferrer" className={`${PRIMARY_CTA_CLASS} ${className}`}>
      Book a Jam Session →
    </Link>
  );
}

function IntakeCta({ className = "" }: { className?: string }) {
  return (
    <Link href={INTAKE_FORM} className={`${SECONDARY_CTA_CLASS} ${className}`}>
      Start with the intake form →
    </Link>
  );
}

function SprintCard({ sprint }: { sprint: SprintOption }) {
  return (
    <div className="rounded-md border border-stroke-muted bg-surface-subtle p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium leading-snug text-balance text-text-primary">{sprint.name}</h3>
        <p className="text-sm font-normal leading-normal text-text-secondary">{sprint.description}</p>
      </div>
      <div className="flex items-end justify-between gap-4 border-t border-stroke-muted pt-4">
        <p className="text-xs font-medium uppercase tracking-wide leading-none text-text-muted">2-week sprint</p>
        <p className="text-lg font-semibold leading-snug tabular-nums text-text-primary">{sprint.price}</p>
      </div>
    </div>
  );
}

export default function LandingV2() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="border-b border-amber-200 bg-amber-50 py-2 text-center dark:border-amber-800 dark:bg-amber-950">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          Sandbox draft —{" "}
          <Link href="/" className="underline">
            back to live site
          </Link>
        </p>
      </div>

      {/* Above the Fold */}
      <FadeInSection triggerOnMount>
        <section className="container max-w-6xl py-16 md:py-20 space-y-10">
          <div className="max-w-4xl space-y-8">
            <SectionOverline>Chris Meisner Studio</SectionOverline>
            <h1 className="text-5xl font-bold leading-tight text-balance text-text-primary">
              From direction to deliverable in ten days.
            </h1>
            <p className="text-lg font-normal leading-relaxed text-pretty text-text-secondary max-w-3xl">
              Two-week sprints for teams that need to move from direction to something buildable.
              Every sprint is run by Chris directly. No handoffs. No account managers. The person
              you talk to is the person who builds.
            </p>

            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <PrimaryCta />
                <IntakeCta />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-normal leading-normal text-text-muted">
                  45 minutes. Come as you are. We&apos;ll figure out the fit together.
                </p>
                <p className="text-sm font-normal leading-normal text-text-muted">
                  Five minutes. Tell us what you&apos;re building. We&apos;ll come prepared.
                </p>
              </div>
            </div>
          </div>

          <PlaceholderPanel label="Looping animation — 10-day sprint timeline" className="h-24" />
        </section>
      </FadeInSection>

      {/* Section 1 — The Problem */}
      <FadeInSection>
        <section className={`container max-w-6xl ${SECTION_SPACING}`}>
          <div className="max-w-3xl space-y-6">
            <SectionOverline>The Problem</SectionOverline>
            <p className="text-4xl font-semibold leading-tight text-balance text-text-primary">
              Most design engagements are slow, open-ended, and misaligned.
            </p>
            <p className="text-lg font-normal leading-relaxed text-pretty text-text-secondary">
              You&apos;re paying for exploration with no guarantee of direction. By the time
              something buildable exists, the moment has passed.
            </p>
            <p className="text-2xl font-semibold leading-snug text-balance text-text-primary">
              There&apos;s a better cadence.
            </p>
          </div>
        </section>
      </FadeInSection>

      {/* Section 2 — The Sprint Model */}
      <FadeInSection>
        <section className={`bg-surface-subtle ${SECTION_SPACING}`}>
          <div className="container max-w-6xl grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-5">
              <SectionOverline>The Sprint Model</SectionOverline>
              <h2 className="text-4xl font-semibold leading-tight text-balance text-text-primary">
                Every engagement runs the same 10-day arc.
              </h2>
              <div className="space-y-4">
                <p className={BODY_CLASS}>
                  <span className="font-semibold text-text-primary">Week 1 — Uphill</span>
                  <br />
                  Explore options, pressure-test direction, align on a single path forward.
                </p>
                <p className={BODY_CLASS}>
                  <span className="font-semibold text-text-primary">Week 2 — Downhill</span>
                  <br />
                  Build. Review. Deliver.
                </p>
                <p className={BODY_CLASS}>
                  Four live moments. Everything else async. You walk away with real files on Day 10.
                  Not a presentation about the work. The work.
                </p>
                <p className={BODY_CLASS}>
                  Every sprint is run by Chris directly. No handoffs. No account managers. The person
                  you talk to is the person who builds. Because of that the studio runs a small number
                  of sprints at a time — if you have something coming up it&apos;s worth getting a Jam
                  Session on the calendar early.
                </p>
              </div>
            </div>

            <PlaceholderPanel label="Static graphic — two-column Uphill / Downhill sprint arc" className="h-72" />
          </div>
        </section>
      </FadeInSection>

      {/* Section 3 — How It Compares */}
      <FadeInSection>
        <section className={`container max-w-6xl ${SECTION_SPACING}`}>
          <div className="space-y-10">
            <div className="max-w-3xl space-y-4">
              <SectionOverline>How It Compares</SectionOverline>
              <h2 className="text-4xl font-semibold leading-tight text-balance text-text-primary">
                How it compares.
              </h2>
              <p className="text-lg font-normal leading-relaxed text-pretty text-text-secondary">
                The sprint model isn&apos;t for every situation. Here&apos;s an honest look at where
                it fits.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-3 pr-4 text-xs font-medium uppercase tracking-wide leading-none text-text-muted" />
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

      {/* Section 4 — Your Project Has a Home */}
      <FadeInSection>
        <section className={`container max-w-6xl ${SECTION_SPACING}`}>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <SectionOverline>Your Project Has a Home</SectionOverline>
              <p className="text-lg font-normal leading-relaxed text-pretty text-text-secondary">
                From Day 1 you get a private client dashboard — daily updates, working links, Loom
                walkthroughs, invoices, and deliverables. Everything in one place. Nothing lost in
                email threads.
              </p>
            </div>

            <PlaceholderPanel label="Motion asset — looping screen recording of client dashboard" className="h-72" />
          </div>
        </section>
      </FadeInSection>

      {/* Section 5 — Sprint Types */}
      <FadeInSection>
        <section className={`bg-surface-subtle ${SECTION_SPACING}`}>
          <div className="container max-w-6xl space-y-10">
            <div className="max-w-3xl space-y-4">
              <SectionOverline>Sprint Types</SectionOverline>
              <h2 className="text-4xl font-semibold leading-tight text-balance text-text-primary">
                Choose where to start based on where you are.
              </h2>
              <p className="text-lg font-normal leading-relaxed text-pretty text-text-secondary">
                Nothing is required in order.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {sprints.map((sprint) => (
                <SprintCard key={sprint.name} sprint={sprint} />
              ))}
            </div>

            <p className="border-t border-stroke-muted pt-6 text-sm font-normal leading-normal text-text-muted">
              Ongoing support available at $5,000 per week after your sprint wraps.
            </p>
          </div>
        </section>
      </FadeInSection>

      {/* Section 6 — Selected Work */}
      <FadeInSection>
        <section className={`container max-w-6xl ${SECTION_SPACING} space-y-10`}>
          <SectionOverline>Selected Work</SectionOverline>

          <SelectedWorkCarousel slides={milesSlides} />

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold leading-snug text-balance text-text-primary">
              Miles — AI-powered fleet intelligence platform
            </h2>
            <SectionOverline>Build Sprint</SectionOverline>
            <p className={BODY_CLASS}>
              Miles needed a complete mobile dashboard UI before their next investor conversation.
              Starting from wireframes, the sprint delivered a production-ready iOS design system —
              full Figma component library, token architecture, dark mode, and engineering handoff
              documentation — in ten days. The team had something they could build directly from on
              Day 10.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PlaceholderPanel label="Placeholder — Prototype Sprint example" className="h-32" />
            <PlaceholderPanel label="Placeholder — Foundation Sprint example" className="h-32" />
          </div>
        </section>
      </FadeInSection>

      {/* Section 7 — Chris, The Studio, and How to Start */}
      <FadeInSection>
        <section className={`bg-surface-subtle ${SECTION_SPACING}`}>
          <div className="container max-w-6xl grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="space-y-5">
              <SectionOverline>Chris, The Studio, and How to Start</SectionOverline>
              <p className={BODY_CLASS}>
                I&apos;ve led sprints for pre-seed teams and public companies alike. In past lives —
                in-house design teams, new ventures inside enterprise orgs, founders sharpening the
                story behind their next raise.
              </p>
              <p className={BODY_CLASS}>
                The sprint model is how I took the best of those experiences and built something
                repeatable, honest, and actually useful — instead of open-ended and hard to measure.
              </p>
              <p className={BODY_CLASS}>
                Also available directly — embedded with your team on an ad hoc basis for work that
                falls outside the sprint model. More at{" "}
                <Link href="https://chrismeisner.com" target="_blank" rel="noreferrer" className="underline">
                  chrismeisner.com
                </Link>
                .
              </p>

              <div className="space-y-3 border-t border-stroke-muted pt-6">
                <p className="text-lg font-normal leading-relaxed text-pretty text-text-secondary">
                  Book a Jam Session. Bring what you&apos;re building. We&apos;ll map where a sprint
                  fits and what you&apos;d walk away with. One conversation — then a proposal if it
                  makes sense.
                </p>
                <p className="text-base font-normal leading-normal text-pretty text-text-muted">
                  Or start with the intake form if you&apos;d rather come prepared.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <PrimaryCta />
                  <IntakeCta />
                </div>
              </div>
            </div>

            <PlaceholderPanel label="Photo — Chris at work, natural and unstaged" className="h-96" />
          </div>
        </section>
      </FadeInSection>
    </main>
  );
}
