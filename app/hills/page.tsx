import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "How we work: Hills — Chris Meisner Studio",
  description:
    "The studio runs on one idea: a hill. A unit of focused work with three phases — scope the climb, do the climb, observe and descend. Here's the philosophy, and how it works at every scale from a single day to a whole year.",
};

const PHASES = [
  {
    n: "01",
    name: "Scope the climb",
    sub: "Look at the hill",
    body: "Before any work, we size it up. How far is this climb? What are we actually trying to figure out or decide? We name the open questions and rough out the plan — a bet on what matters, not a checklist to grind through.",
  },
  {
    n: "02",
    name: "The climb",
    sub: "Do the work",
    body: "The uphill stretch — problem-finding, exploring, resolving — until we reach clarity on what we set out to. Success isn't “all the tasks done.” It's “we understand this now.” If an unexpected blocker shows up, we name it out loud instead of hiding it.",
  },
  {
    n: "03",
    name: "Observe & descend",
    sub: "Wrap up and hand off",
    body: "We recognize when we've reached the peak of clarity for this go. We look at what we can now see, and come down the other side — wrapping up, communicating, and handing off the progress. Then rest, and line up the next hill.",
  },
];

const PRINCIPLES = [
  {
    t: "Capture first, organize later",
    b: "A stray idea, a link, a task — jot it now, decide where it belongs later. Nothing needs a home to exist. You promote things upward as they earn it.",
  },
  {
    t: "Clarity over completion",
    b: "A hill is done when we've reached clarity, not when every task is checked. Unfinished pieces simply carry forward to the next climb.",
  },
  {
    t: "Name the blockers",
    b: "The surprise you didn't see coming gets said plainly and written down — not buried. A clearly-documented dead end is a good outcome.",
  },
  {
    t: "One shape, any size",
    b: "A hill can span a single morning or a whole year. The three phases are the same either way — only the distance changes.",
  },
];

const SCALES = [
  {
    span: "A day",
    title: "The morning hill",
    body: "Coffee first. Look at today, shape it — confirm what matters, add anything new, let the rest go. Then a deliberate “start the climb,” and the day is underway. Evening is the descent.",
    tone: "day",
  },
  {
    span: "A week or two",
    title: "A sprint",
    body: "A focused client engagement. Week one is uphill — explore and decide. Week two is downhill — build and deliver. A classic hill with a hard shape.",
    tone: "sprint",
  },
  {
    span: "A day, tightly",
    title: "A refinement cycle",
    body: "One small, sharp climb — push a single feature across the hill and blaze down the other side. Scoped, delivered, done.",
    tone: "refine",
  },
  {
    span: "A quarter",
    title: "A big move",
    body: "A launch, a rebrand, a new product line. Wide at the base, many smaller climbs nested inside it, but still one hill with one summit of clarity.",
    tone: "quarter",
  },
  {
    span: "A year — or a life",
    title: "A long climb",
    body: "Grow the studio. Get healthier. Learn a craft. The same shape holds: scope the year, climb it, and look back from the top to see how far you came. Studio work and life sit side by side.",
    tone: "year",
  },
];

export default function HillsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-black/[0.02] dark:bg-white/[0.02] py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-block px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 text-sm font-medium">
            The philosophy
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">Everything we do is a hill.</h1>
          <p className="text-xl sm:text-2xl opacity-80 max-w-3xl mx-auto">
            A hill is a unit of focused work with three phases: scope the climb, do the climb, then observe and descend. It&apos;s how we run a client sprint, a single day, and a year-long goal — the same shape at every scale.
          </p>
          <p className="text-base sm:text-lg opacity-70 max-w-3xl mx-auto">
            Uphill is where you figure things out. Downhill is where you execute what you now understand. The top of the hill is the moment it gets clear.
          </p>
        </div>
      </section>

      {/* The three phases */}
      <section className="py-16 px-6 border-y border-black/10 dark:border-white/15">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              Three phases, always
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Scope it. Climb it. Come down clear.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PHASES.map((p) => (
              <div key={p.n} className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-mono opacity-40">{p.n}</span>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{p.sub}</p>
                </div>
                <h3 className="text-2xl font-bold">{p.name}</h3>
                <p className="text-sm opacity-80 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6 border-b border-black/10 dark:border-white/15">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full bg-white dark:bg-black px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              What we believe
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">The rules under the shape</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {PRINCIPLES.map((p) => (
              <div key={p.t} className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-2">
                <h3 className="text-xl font-bold">{p.t}</h3>
                <p className="text-sm opacity-80 leading-relaxed">{p.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hills at every scale */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full bg-black/5 dark:bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              Same shape, any size
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Hills at every scale</h2>
            <p className="text-base sm:text-lg opacity-70 max-w-3xl mx-auto">
              A morning and a decade are both hills. Only the distance changes — the three phases don&apos;t.
            </p>
          </div>
          <div className="space-y-4">
            {SCALES.map((s) => (
              <div key={s.title} className="rounded-2xl border border-black/10 dark:border-white/15 p-6 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="sm:w-40 flex-none">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-50">{s.span}</p>
                  <h3 className="text-xl font-bold mt-1">{s.title}</h3>
                </div>
                <p className="text-sm opacity-80 leading-relaxed flex-1">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What lives on a hill */}
      <section className="bg-black/5 dark:bg-white/5 py-16 px-6 border-y border-black/10 dark:border-white/15">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center rounded-full bg-white dark:bg-black px-4 py-1 text-xs font-semibold uppercase tracking-wide">
              What&apos;s on a hill
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">Ideas and deliverables — with tasks underneath</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Uphill</p>
              <h3 className="text-2xl font-bold">Ideas</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                Open-ended things to figure out or decide — “clarify the pricing,” “explore the nav.” The exploring part of the climb.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Downhill</p>
              <h3 className="text-2xl font-bold">Deliverables</h3>
              <p className="text-sm opacity-80 leading-relaxed">
                Concrete things to make and hand off — a logo, a screen, a system. The shipping part of the climb.
              </p>
            </div>
          </div>
          <p className="text-center text-sm opacity-70 max-w-2xl mx-auto">
            Tasks (and subtasks) live under either one — or float free until you decide where they belong. A personal hill leans on ideas; a client hill leans on deliverables. Same structure, either way.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Have a hill in mind?</h2>
          <p className="text-lg opacity-80">
            Tell us what you&apos;re trying to reach and we&apos;ll help you scope the climb.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/scope" className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition">
              Scope a project
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition">
              See how a sprint runs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
