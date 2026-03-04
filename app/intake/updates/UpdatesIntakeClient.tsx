"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { typography } from "../../components/typography";

type Project = {
  id: string;
  name: string;
  emoji: string | null;
  status: string;
};

type Sprint = {
  id: string;
  title: string;
  status: string;
  projectId: string;
  startDate: string | null;
  dueDate: string | null;
  deliverableCount: number;
};

type IntakeContext = {
  authenticated: boolean;
  user?: { name: string | null; email: string };
  projects: Project[];
  sprints: Sprint[];
};

function RequiredMark() {
  return (
    <span className="text-semantic-danger ml-0.5" aria-hidden="true">
      *
    </span>
  );
}

function OptionalTag() {
  return <span className={`${typography.bodyXs} ml-1.5`}>Optional</span>;
}

const focusOutline =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2";

const buttonBase = `inline-flex items-center justify-center rounded-md font-semibold transition ${focusOutline}`;

const primaryButton = `${buttonBase} bg-brand-primary text-brand-inverse border border-brand-primary hover:opacity-90 px-6 py-3`;

const secondaryButton = `${buttonBase} border border-stroke-muted text-text-primary bg-surface-subtle hover:bg-surface-strong px-6 py-3`;

const STATUS_LABELS: Record<string, string> = {
  complete: "Completed",
  in_progress: "In Progress",
  scheduled: "Scheduled",
};

export default function UpdatesIntakeClient() {
  const [ctx, setCtx] = useState<IntakeContext | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedSprintIds, setSelectedSprintIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/intake-context")
      .then((r) => r.json())
      .then((data: IntakeContext) => {
        setCtx(data);
        if (data.authenticated && data.user) {
          if (data.user.name) setName(data.user.name);
          setEmail(data.user.email);
        }
      })
      .catch(() => setCtx({ authenticated: false, projects: [], sprints: [] }))
      .finally(() => setLoading(false));
  }, []);

  function toggleSprint(id: string) {
    setSelectedSprintIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        source: "update-cycle-intake",
        name,
        email,
        description,
        notes,
        selectedSprintIds,
        selectedSprints: selectedSprintIds.map((id) => {
          const sprint = ctx?.sprints.find((s) => s.id === id);
          return sprint ? { id: sprint.id, title: sprint.title } : { id };
        }),
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

  const inputFocus =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary";

  const inputClasses = `h-10 w-full px-3 rounded-md border border-stroke-muted bg-surface-card text-text-primary placeholder:text-text-muted ${inputFocus} transition-colors duration-150 ${typography.bodySm}`;

  const textareaClasses = `w-full px-3 py-2 rounded-md border border-stroke-muted bg-surface-card text-text-primary placeholder:text-text-muted ${inputFocus} transition-colors duration-150 resize-none ${typography.bodySm}`;

  const labelClasses = "text-sm font-medium leading-none text-text-primary";

  const cardBase =
    "rounded-xl border p-4 cursor-pointer transition-all duration-150";
  const cardSelected = "border-brand-primary bg-surface-subtle shadow-sm";
  const cardUnselected =
    "border-stroke-muted bg-surface-card hover:border-stroke-strong shadow-sm";

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className={`${typography.headingSection} text-balance`}>
            Update request received.
          </h1>
          <p className={`${typography.bodyBase} text-pretty`}>
            I&apos;ll review what you&apos;ve shared and follow up within 24
            hours to kick off your update cycle.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/" className={secondaryButton}>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-16 text-center">
        <p className={typography.bodySm}>Loading…</p>
      </div>
    );
  }

  const sprintsByProject = ctx?.sprints.reduce(
    (acc, sprint) => {
      if (!acc[sprint.projectId]) acc[sprint.projectId] = [];
      acc[sprint.projectId].push(sprint);
      return acc;
    },
    {} as Record<string, Sprint[]>
  );

  const hasSprintsToShow =
    ctx?.authenticated && ctx.sprints.length > 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10 mt-8">
      <p className={typography.bodyXs}>
        <span className="text-semantic-danger" aria-hidden="true">
          *
        </span>{" "}
        Required
      </p>

      {/* About You — prefilled if logged in */}
      <section className="space-y-5">
        <h2 className={`${typography.headingCard} text-balance`}>
          {ctx?.authenticated ? "Confirm your info." : "First, a little about you."}
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className={labelClasses}>
              Name
              <RequiredMark />
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
              <RequiredMark />
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
      </section>

      <hr className="border-stroke-muted" />

      {/* Sprint Selection — only if logged in with sprints */}
      {hasSprintsToShow && (
        <>
          <section className="space-y-5">
            <div>
              <h2 className={`${typography.headingCard} text-balance mb-2`}>
                Which sprints do you want to iterate on?
              </h2>
              <p className={typography.bodySm}>
                Select one or more completed sprints. I&apos;ll focus the update
                cycle on the deliverables from those sprints.
              </p>
            </div>

            <div className="space-y-6">
              {ctx?.projects
                .filter((p) => sprintsByProject?.[p.id]?.length)
                .map((project) => (
                  <fieldset key={project.id} className="space-y-3">
                    <legend className="text-sm font-medium leading-none text-text-primary mb-3">
                      {project.emoji ? `${project.emoji} ` : ""}
                      {project.name}
                    </legend>
                    {sprintsByProject?.[project.id]?.map((sprint) => (
                      <label
                        key={sprint.id}
                        className={`flex items-start gap-3 ${cardBase} ${
                          selectedSprintIds.includes(sprint.id)
                            ? cardSelected
                            : cardUnselected
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSprintIds.includes(sprint.id)}
                          onChange={() => toggleSprint(sprint.id)}
                          className="mt-0.5 accent-brand-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium leading-none text-text-primary">
                            {sprint.title}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className={typography.bodyXs}>
                              {STATUS_LABELS[sprint.status] || sprint.status}
                            </span>
                            {sprint.startDate && (
                              <>
                                <span className="text-text-muted">·</span>
                                <span className={typography.bodyXs}>
                                  {new Date(
                                    sprint.startDate + "T00:00:00"
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </>
                            )}
                            {sprint.deliverableCount > 0 && (
                              <>
                                <span className="text-text-muted">·</span>
                                <span className={typography.bodyXs}>
                                  {sprint.deliverableCount} deliverable
                                  {sprint.deliverableCount !== 1 ? "s" : ""}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </fieldset>
                ))}
            </div>
          </section>

          <hr className="border-stroke-muted" />
        </>
      )}

      {/* Not logged in nudge */}
      {ctx && !ctx.authenticated && (
        <>
          <section className="space-y-4">
            <div className={`${cardBase} border-stroke-muted bg-surface-subtle`} style={{ cursor: "default" }}>
              <p className="text-sm font-medium text-text-primary mb-1">
                Already a client?
              </p>
              <p className={typography.bodySm}>
                <Link
                  href="/login"
                  className="underline text-text-primary hover:text-text-secondary transition-colors"
                >
                  Log in
                </Link>{" "}
                to see your projects and past sprints, so you can select which
                ones to iterate on.
              </p>
            </div>
          </section>

          <hr className="border-stroke-muted" />
        </>
      )}

      {/* What to iterate on */}
      <section className="space-y-4">
        <div>
          <label
            htmlFor="description"
            className={`${typography.headingCard} text-balance block mb-2`}
          >
            What do you want to iterate on this week?
            <RequiredMark />
          </label>
          <p className={typography.bodySm}>
            What&apos;s changed since the sprint? What feedback have you
            received? What needs refining?
          </p>
        </div>
        <textarea
          id="description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={textareaClasses}
        />
      </section>

      <hr className="border-stroke-muted" />

      {/* Anything else */}
      <section className="space-y-4">
        <div>
          <label
            htmlFor="notes"
            className={`${typography.headingCard} text-balance block mb-2`}
          >
            Anything else I should know?
            <OptionalTag />
          </label>
          <p className={typography.bodySm}>
            Deadlines, stakeholder feedback, files to reference, etc.
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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <button
            type="submit"
            disabled={submitting || !name || !email || !description}
            className={`${primaryButton} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {submitting ? "Submitting…" : "Submit update request"}
          </button>

          {error && (
            <p className="text-semantic-danger self-center">
              <span className={typography.bodySm}>{error}</span>
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
