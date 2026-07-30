import Link from "next/link";

export const metadata = {
  title: "The Process — Single Source",
  description:
    "What ten days actually looks like. The Uphill / Downhill arc, what happens each day, what the client is responsible for, and what gets delivered on Day 10.",
};

const JAM_SESSION = "/intake";

const OVERLINE_CLASS =
  "text-xs font-medium uppercase tracking-wide leading-none text-text-muted";
const HEADING_CLASS =
  "text-4xl font-semibold leading-tight text-balance text-text-primary";
const SUBHEADING_CLASS =
  "text-2xl font-semibold leading-snug text-text-primary";
const BODY_CLASS =
  "text-base font-normal leading-relaxed text-pretty text-text-secondary";
const LABEL_CLASS = "text-sm font-semibold text-text-primary";
const META_CLASS = "text-sm font-normal leading-normal text-text-secondary";
const DIVIDER_CLASS = "border-t border-stroke-muted";

type DayEntry = { day: string; label: string; detail: string; client?: string };

const week1: DayEntry[] = [
  {
    day: "Day 1",
    label: "Monday — Kickoff workshop",
    detail:
      "A focused workshop to align on strategy, goals, and vision. We establish the brief, agree on what success looks like, and map the territory before any exploration begins.",
    client:
      "Full participation required. This is the highest-leverage hour of the sprint — come prepared with context, references, and a clear sense of what you're trying to solve.",
  },
  {
    day: "Day 2",
    label: "Tuesday — Exploration begins",
    detail:
      "Studio begins research and generates early options. No client input required today. The dashboard gets its first update by end of day.",
    client: "Review the dashboard update when it arrives. No action needed.",
  },
  {
    day: "Day 3",
    label: "Wednesday — Divergent work continues",
    detail:
      "Exploration continues. Work-in-progress shared in the dashboard — rough, early, directional. The goal is breadth before convergence.",
    client:
      "Optional: leave a comment in the dashboard if something stands out. Not required.",
  },
  {
    day: "Day 4",
    label: "Thursday — Ingredient Review",
    detail:
      "A live session to review grouped solutions together. This is where direction gets shaped — not chosen yet, but narrowed. The studio presents the options; the client reacts honestly.",
    client:
      "Attendance required. This is one of the four live moments. Your reactions here directly determine what Week 2 gets built.",
  },
  {
    day: "Day 5",
    label: "Friday — Direction locked",
    detail:
      "The studio sends an async outline confirming the chosen direction and what gets built in Week 2. No surprises from here.",
    client:
      "Read and confirm the outline. Reply with any last questions before Monday. After this, scope is locked.",
  },
];

const week2: DayEntry[] = [
  {
    day: "Day 6",
    label: "Monday — Direction check",
    detail:
      "A brief sync to confirm alignment before the build begins. Last chance to clarify anything. After this call, no scope changes.",
    client:
      "Attendance required. Come with any final questions. This is the last live touchpoint before delivery.",
  },
  {
    day: "Day 7",
    label: "Tuesday — Heads-down build",
    detail:
      "Studio is in execution mode. No client input needed. Dashboard updated by end of day.",
    client: "No action needed. Review the dashboard update when it arrives.",
  },
  {
    day: "Day 8",
    label: "Wednesday — Work-in-Progress review",
    detail:
      "A live session to see the work coming together. Early enough to request small tweaks; late enough that the direction is clear. This is not a redesign conversation — it's a refinement pass.",
    client:
      "Attendance required. Come ready to give specific, actionable feedback. The studio will implement what's feasible before Friday.",
  },
  {
    day: "Day 9",
    label: "Thursday — Polish and QA",
    detail:
      "Studio refines, polishes, and runs final quality checks. No client input needed.",
    client: "No action needed.",
  },
  {
    day: "Day 10",
    label: "Friday — Delivery",
    detail:
      "Final files delivered. A Loom walkthrough covers everything that was built — what it is, how it works, and how to use it. An optional live demo is available if you want to walk through it together.",
    client:
      "Review the Loom. Download your files from the dashboard. Final payment processes automatically on delivery.",
  },
];

function DayRow({ entry }: { entry: DayEntry }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[5rem_1fr] py-6 border-t border-stroke-muted">
      <p className={`${OVERLINE_CLASS} pt-0.5`}>{entry.day}</p>
      <div className="space-y-2">
        <p className={LABEL_CLASS}>{entry.label}</p>
        <p className={BODY_CLASS}>{entry.detail}</p>
        {entry.client && (
          <p className="text-sm font-normal leading-normal text-text-muted italic">
            Client: {entry.client}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProcessPage() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="container max-w-3xl py-16 md:py-24 space-y-20">

        {/* Header */}
        <div className="space-y-6">
          <p className={OVERLINE_CLASS}>The Process</p>
          <h1 className={HEADING_CLASS}>What ten days actually looks like.</h1>
          <p className={BODY_CLASS}>
            Every sprint runs the same arc. Week 1 is uphill — exploring options, pressure-testing
            direction, arriving at a single clear path. Week 2 is downhill — building that path
            out, reviewing it mid-week, and delivering the finished work on Friday. Four live
            moments. Everything else async. Real files on Day 10.
          </p>
          <p className={BODY_CLASS}>
            The sprint works because both sides show up. The structure below makes clear what the
            studio handles and what the client is responsible for — so there are no surprises
            before you book.
          </p>
        </div>

        {/* Week 1 */}
        <div className="space-y-2">
          <div className="space-y-3">
            <p className={OVERLINE_CLASS}>Week 1 — Days 1–5</p>
            <h2 className={SUBHEADING_CLASS}>Go uphill.</h2>
            <p className={BODY_CLASS}>
              Explore options. Pressure-test direction. Align on a single path forward. The week
              opens with a kickoff workshop and closes with scope locked for Week 2. All async
              updates land in your client dashboard — no chasing threads, no status calls.
            </p>
          </div>
          <div>
            {week1.map((entry) => (
              <DayRow key={entry.day} entry={entry} />
            ))}
          </div>
        </div>

        <div className={DIVIDER_CLASS} />

        {/* Week 2 */}
        <div className="space-y-2">
          <div className="space-y-3">
            <p className={OVERLINE_CLASS}>Week 2 — Days 6–10</p>
            <h2 className={SUBHEADING_CLASS}>Go downhill.</h2>
            <p className={BODY_CLASS}>
              Build. Review. Deliver. Direction is locked coming in — Week 2 is pure execution.
              One mid-week check-in to see the work coming together, then final delivery on
              Friday with a Loom walkthrough and optional live demo.
            </p>
          </div>
          <div>
            {week2.map((entry) => (
              <DayRow key={entry.day} entry={entry} />
            ))}
          </div>
        </div>

        <div className={DIVIDER_CLASS} />

        {/* What you leave with */}
        <div className="space-y-6">
          <div className="space-y-3">
            <p className={OVERLINE_CLASS}>Day 10 — What you leave with</p>
            <h2 className={SUBHEADING_CLASS}>The work. Not a presentation about it.</h2>
          </div>
          <ul className="space-y-3">
            {[
              "Final deliverables and source files — Figma, code, strategy docs, or all three depending on the sprint",
              "A Loom walkthrough covering what was built, how it works, and how to use it",
              "An optional live demo to walk through the deliverable together",
              "Dashboard access for downloads, links, and sprint history — available anytime after delivery",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="shrink-0 mt-1 w-1 h-1 rounded-full bg-text-muted translate-y-2" />
                <p className={META_CLASS}>{item}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={DIVIDER_CLASS} />

        {/* What the client is responsible for */}
        <div className="space-y-6">
          <div className="space-y-3">
            <p className={OVERLINE_CLASS}>Your role</p>
            <h2 className={SUBHEADING_CLASS}>What the client is responsible for.</h2>
            <p className={BODY_CLASS}>
              The sprint works because both parties show up. Four live moments require genuine
              client participation — the other six days run async and ask almost nothing of you.
              Here&apos;s what to expect before you book.
            </p>
          </div>
          <ul className="space-y-4">
            {[
              {
                label: "Day 1 — Kickoff workshop",
                detail:
                  "Full participation. Come with context, references, and a clear sense of what you're solving. This is the highest-leverage hour of the sprint.",
              },
              {
                label: "Day 4 — Ingredient Review",
                detail:
                  "Attendance required. Your reactions here directly shape what gets built in Week 2. Honest feedback matters more than polished opinions.",
              },
              {
                label: "Day 6 — Direction check",
                detail:
                  "Brief sync before the build begins. Come with any final questions. After this, scope is locked.",
              },
              {
                label: "Day 8 — Work-in-Progress review",
                detail:
                  "Attendance required. The work is nearly done — this is a refinement pass, not a redesign. Specific, actionable feedback is what moves things forward.",
              },
              {
                label: "Day 5 & Day 10 — Async confirms",
                detail:
                  "Read and reply to the direction outline on Day 5 and the delivery on Day 10. These can happen on your schedule, no sync required.",
              },
            ].map(({ label, detail }) => (
              <li key={label} className="space-y-1">
                <p className={LABEL_CLASS}>{label}</p>
                <p className={META_CLASS}>{detail}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={DIVIDER_CLASS} />

        {/* CTA */}
        <div className="space-y-6">
          <p className={BODY_CLASS}>
            If the structure above makes sense and the sprint feels like the right fit, the next
            step is the intake form — a short set of questions to align on goals and confirm the
            sprint is the right fit. No commitment required.
          </p>
          <Link
            href={JAM_SESSION}
            className="inline-flex h-12 items-center justify-center rounded-md bg-text-primary px-6 text-base font-semibold text-background transition-opacity duration-150 hover:opacity-90"
          >
            Start the intake
          </Link>
        </div>

      </div>
    </main>
  );
}
