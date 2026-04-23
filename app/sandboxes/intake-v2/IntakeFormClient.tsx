"use client";

import { useState } from "react";
import Link from "next/link";

const JAM_SESSION = "/intake";

const STAGE_OPTIONS = [
  "I have an idea but haven't started building",
  "I have early wireframes or a rough prototype",
  "I have a product but need to level up the design",
  "Something else",
] as const;

const GOAL_OPTIONS = [
  "Validate whether this idea holds up",
  "Show something real to investors or stakeholders",
  "Get a brand that looks like a real company",
  "Go from prototype to production-ready UI",
  "Not sure yet — I need help figuring that out",
] as const;

export default function IntakeFormClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [stage, setStage] = useState("");
  const [goal, setGoal] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = name.trim() && email.trim() && stage && goal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        source: "website-intake-v2",
        name,
        email,
        company,
        stage,
        goal,
        timeline,
        notes,
      };

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-2xl font-semibold text-text-primary text-balance">
            Got it — thanks.
          </h1>
          <p className="text-base text-text-secondary text-pretty leading-relaxed">
            We&apos;ll review this and follow up within a day or two with next steps,
            including a link to get a call on the calendar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <a
              href={JAM_SESSION}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-md bg-text-primary px-6 text-base font-semibold text-background transition-opacity duration-150 hover:opacity-90"
            >
              Start the intake
            </a>
            <Link
              href="/sandboxes/landing-v4"
              className="inline-flex h-12 items-center justify-center rounded-md border border-stroke-muted bg-surface-subtle px-6 text-base font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-strong"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputClasses =
    "h-10 w-full px-3 rounded-md border border-stroke-muted bg-surface-card text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary transition-colors duration-150 text-sm";

  const textareaClasses =
    "w-full px-3 py-2.5 rounded-md border border-stroke-muted bg-surface-card text-text-primary placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-text-primary transition-colors duration-150 resize-none text-sm";

  const labelClasses = "text-sm font-medium leading-none text-text-primary";

  const radioCardBase =
    "flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-all duration-150";
  const radioCardSelected =
    "border-text-primary bg-surface-subtle";
  const radioCardUnselected =
    "border-stroke-muted bg-surface-card hover:border-stroke-strong";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10">
      {/* Section 1: About You */}
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            About you
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className={labelClasses}>
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className={labelClasses}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="company" className={labelClasses}>
            Company or project name{" "}
            <span className="text-xs font-normal text-text-muted">optional</span>
          </label>
          <input
            id="company"
            type="text"
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className={inputClasses}
          />
        </div>
      </section>

      <hr className="border-stroke-muted" />

      {/* Section 2: Where are you right now */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">
          Where are you right now?
        </h2>
        <fieldset className="space-y-2">
          <legend className="sr-only">Current stage</legend>
          {STAGE_OPTIONS.map((option) => (
            <label
              key={option}
              className={`${radioCardBase} ${
                stage === option ? radioCardSelected : radioCardUnselected
              }`}
            >
              <input
                type="radio"
                name="stage"
                value={option}
                checked={stage === option}
                onChange={(e) => setStage(e.target.value)}
                className="mt-0.5 accent-current"
              />
              <span className="text-sm text-text-primary">{option}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <hr className="border-stroke-muted" />

      {/* Section 3: What are you trying to do */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">
          What are you trying to do next?
        </h2>
        <fieldset className="space-y-2">
          <legend className="sr-only">Primary goal</legend>
          {GOAL_OPTIONS.map((option) => (
            <label
              key={option}
              className={`${radioCardBase} ${
                goal === option ? radioCardSelected : radioCardUnselected
              }`}
            >
              <input
                type="radio"
                name="goal"
                value={option}
                checked={goal === option}
                onChange={(e) => setGoal(e.target.value)}
                className="mt-0.5 accent-current"
              />
              <span className="text-sm text-text-primary">{option}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <hr className="border-stroke-muted" />

      {/* Section 4: Timeline */}
      <section className="space-y-4">
        <div>
          <label
            htmlFor="timeline"
            className="text-lg font-semibold text-text-primary block mb-1"
          >
            Is anything driving your timeline?{" "}
            <span className="text-xs font-normal text-text-muted">optional</span>
          </label>
          <p className="text-sm text-text-secondary">
            Investor meeting, launch date, hire starting — whatever&apos;s creating urgency.
          </p>
        </div>
        <input
          id="timeline"
          type="text"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
          placeholder="e.g. Raising in 6 weeks, need a deck and prototype"
          className={inputClasses}
        />
      </section>

      <hr className="border-stroke-muted" />

      {/* Section 5: Anything else */}
      <section className="space-y-4">
        <div>
          <label
            htmlFor="notes"
            className="text-lg font-semibold text-text-primary block mb-1"
          >
            Anything else?{" "}
            <span className="text-xs font-normal text-text-muted">optional</span>
          </label>
          <p className="text-sm text-text-secondary">
            Link to a deck, landing page, or just context.
          </p>
        </div>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={textareaClasses}
        />
      </section>

      <hr className="border-stroke-muted" />

      {/* Submit */}
      <div className="space-y-4">
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="inline-flex h-12 items-center justify-center rounded-md bg-text-primary px-8 text-base font-semibold text-background transition-opacity duration-150 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </form>
  );
}
