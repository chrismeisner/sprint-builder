"use client";

import { useState } from "react";

type SpanOption = "" | "day" | "week" | "month" | "quarter" | "year";

export default function ScopePage() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"sprint" | "refinement_cycle">("sprint");
  const [span, setSpan] = useState<SpanOption>("");
  const [summary, setSummary] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [tasks, setTasks] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ deliverables: number; tasks: number } | null>(null);

  const toLines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !email.trim()) return;
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/hills/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          span_granularity: span || undefined,
          summary: summary.trim() || undefined,
          deliverables: toLines(deliverables),
          tasks: toLines(tasks),
          email: email.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data.suggested ?? null);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">⛰️</div>
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Your climb is scoped</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Thanks — we&apos;ve captured your scope
          {result ? ` with ${result.deliverables} outcome${result.deliverables === 1 ? "" : "s"} and ${result.tasks} thing${result.tasks === 1 ? "" : "s"} to resolve` : ""}.
          The studio will review it and follow up at <span className="font-medium text-neutral-700 dark:text-neutral-300">{email}</span>.
        </p>
      </div>
    );
  }

  const label = "block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5";
  const field =
    "w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40";

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <header className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Scope a climb</p>
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100 mt-1">Tell us what you&apos;re trying to reach</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          A few questions to size the hill. We&apos;ll turn your answers into a draft scope and follow up.
        </p>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-5">
        <div>
          <label className={label} htmlFor="title">What are you looking to accomplish?</label>
          <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Redesign the vehicle details experience" className={field} />
        </div>

        <div>
          <span className={label}>What kind of work is this?</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "sprint", t: "A new project or sprint", d: "Bigger, multi-outcome build" },
              { v: "refinement_cycle", t: "A focused refinement", d: "One tight, fast improvement" },
            ].map((o) => (
              <button
                type="button"
                key={o.v}
                onClick={() => setType(o.v as typeof type)}
                className={`text-left rounded-lg border p-3 transition ${
                  type === o.v
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-400"
                }`}
              >
                <span className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">{o.t}</span>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{o.d}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={label} htmlFor="span">Rough timeline</label>
          <select id="span" value={span} onChange={(e) => setSpan(e.target.value as SpanOption)} className={field}>
            <option value="">Not sure yet</option>
            <option value="day">About a day</option>
            <option value="week">About a week</option>
            <option value="month">About a month</option>
            <option value="quarter">A quarter</option>
            <option value="year">Longer / ongoing</option>
          </select>
        </div>

        <div>
          <label className={label} htmlFor="summary">Any context? <span className="font-normal text-neutral-400">(optional)</span></label>
          <textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="What's the situation, and what does success look like?" className={field} />
        </div>

        <div>
          <label className={label} htmlFor="deliverables">What outcomes or deliverables do you have in mind?</label>
          <textarea id="deliverables" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} rows={4} placeholder="One per line — e.g.&#10;Styled Trips list&#10;Filter controls&#10;Trip detail screen" className={field} />
          <p className="text-xs text-neutral-400 mt-1">One per line. Each becomes a suggested deliverable you can adjust.</p>
        </div>

        <div>
          <label className={label} htmlFor="tasks">Anything specific to figure out or resolve? <span className="font-normal text-neutral-400">(optional)</span></label>
          <textarea id="tasks" value={tasks} onChange={(e) => setTasks(e.target.value)} rows={3} placeholder="One per line — open questions, unknowns, decisions" className={field} />
        </div>

        <div>
          <label className={label} htmlFor="email">Your email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={field} />
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={state === "saving" || !title.trim() || !email.trim()}
          className="mt-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-40 transition"
        >
          {state === "saving" ? "Submitting…" : "Submit scope"}
        </button>
      </form>
    </div>
  );
}
