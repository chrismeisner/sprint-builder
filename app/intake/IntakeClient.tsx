"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { typography } from "../components/typography";

type EngagementType =
  | "foundation-sprint"
  | "team-player"
  | "";

type BrandDeliverable = "strategy" | "identity" | "launch-assets";
type ProductDeliverable = "journeys" | "ui-screens" | "prototype";

function RequiredMark() {
  return (
    <span className="text-semantic-danger ml-0.5" aria-hidden="true">
      *
    </span>
  );
}

function OptionalTag() {
  return (
    <span className={`${typography.bodyXs} ml-1.5`}>
      Optional
    </span>
  );
}

const focusOutline =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2";

const buttonBase =
  `inline-flex items-center justify-center rounded-md font-semibold transition ${focusOutline}`;

const primaryButton =
  `${buttonBase} bg-brand-primary text-brand-inverse border border-brand-primary hover:opacity-90 px-6 py-3`;

const secondaryButton =
  `${buttonBase} border border-stroke-muted text-text-primary bg-surface-subtle hover:bg-surface-strong px-6 py-3`;

export default function IntakeClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [engagement, setEngagement] = useState<EngagementType>("");
  const [brandDeliverables, setBrandDeliverables] = useState<
    BrandDeliverable[]
  >([]);
  const [productDeliverables, setProductDeliverables] = useState<
    ProductDeliverable[]
  >([]);
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");

  const [bookCall, setBookCall] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("engagement");
    if (e === "foundation-sprint" || e === "team-player") {
      setEngagement(e);
    }
  }, []);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function toggleBrand(d: BrandDeliverable) {
    setBrandDeliverables((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function toggleProduct(d: ProductDeliverable) {
    setProductDeliverables((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        source: "website-intake",
        name,
        email,
        company,
        website,
        description,
        engagement,
        deliverables: {
          brand: brandDeliverables,
          product: productDeliverables,
        },
        start_date: startDate,
        notes,
        book_call: bookCall,
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
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const upcomingMondays = (() => {
    const mondays: { value: string; label: string }[] = [];
    const d = new Date();
    const day = d.getDay();
    const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7;
    d.setDate(d.getDate() + daysUntilMonday);
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 10; i++) {
      const value = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      mondays.push({ value, label });
      d.setDate(d.getDate() + 7);
    }
    return mondays;
  })();

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className={`${typography.headingSection} text-balance`}>
            Got it — thanks.
          </h1>
          <p className={`${typography.bodyBase} text-pretty`}>
            {bookCall
              ? "I'll review your submission before we talk. Pick a time below and we'll go from there."
              : "I'll review your submission and get back to you within 24 hours."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {bookCall && (
              <a
                href="https://cal.com/chrismeisner/sprint-planning"
                target="_blank"
                rel="noopener noreferrer"
                className={primaryButton}
              >
                Book intro call
              </a>
            )}
            <Link href="/" className={secondaryButton}>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputFocus =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary";

  const inputClasses =
    `h-10 w-full px-3 rounded-md border border-stroke-muted bg-surface-card text-text-primary placeholder:text-text-muted ${inputFocus} transition-colors duration-150 ${typography.bodySm}`;

  const textareaClasses =
    `w-full px-3 py-2 rounded-md border border-stroke-muted bg-surface-card text-text-primary placeholder:text-text-muted ${inputFocus} transition-colors duration-150 resize-none ${typography.bodySm}`;

  const labelClasses = "text-sm font-medium leading-none text-text-primary";

  const cardBase =
    "rounded-xl border p-4 cursor-pointer transition-all duration-150";
  const cardSelected =
    "border-brand-primary bg-surface-subtle shadow-sm";
  const cardUnselected =
    "border-stroke-muted bg-surface-card hover:border-stroke-strong shadow-sm";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-10">
      <p className={typography.bodyXs}>
        <span className="text-semantic-danger" aria-hidden="true">*</span>
        {" "}Required
      </p>

      {/* Section: About You */}
      <section className="space-y-5">
        <h2 className={`${typography.headingCard} text-balance`}>
          First, a little about you.
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className={labelClasses}>
              Name<RequiredMark />
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
              Email<RequiredMark />
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
          <div className="space-y-2">
            <label htmlFor="company" className={labelClasses}>
              Company<OptionalTag />
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
          <div className="space-y-2">
            <label htmlFor="website" className={labelClasses}>
              Website or product link<OptionalTag />
            </label>
            <input
              id="website"
              type="text"
              autoComplete="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      <hr className="border-stroke-muted" />

      {/* Section: What are you building */}
      <section className="space-y-4">
        <div>
          <label
            htmlFor="description"
            className={`${typography.headingCard} text-balance block mb-2`}
          >
            What are you building — and what do you need help with right now?<RequiredMark />
          </label>
          <p className={typography.bodySm}>
            2–3 sentences is perfect.
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

      {/* Section: Engagement type */}
      <section className="space-y-4">
        <h2 className={`${typography.headingCard} text-balance`}>
          Which engagement are you looking for?
        </h2>
        <fieldset className="space-y-3">
          <legend className="sr-only">Engagement type</legend>
          {(
            [
              {
                value: "foundation-sprint",
                label: "Foundation Sprint",
                desc: "2-week, outcome-focused engagement",
              },
              {
                value: "team-player",
                label: "Team Player",
                desc: "Embedded design support",
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 ${cardBase} ${
                engagement === option.value ? cardSelected : cardUnselected
              }`}
            >
              <input
                type="radio"
                name="engagement"
                value={option.value}
                checked={engagement === option.value}
                onChange={(e) =>
                  setEngagement(e.target.value as EngagementType)
                }
                className="mt-0.5 accent-brand-primary"
              />
              <div>
                <span className="text-sm font-medium leading-none text-text-primary">
                  {option.label}
                </span>
                <span className={`${typography.bodySm} ml-2`}>
                  ({option.desc})
                </span>
              </div>
            </label>
          ))}
        </fieldset>
      </section>

      {/* Section: Deliverables */}
      <>
        <hr className="border-stroke-muted" />

        <section className="space-y-5">
          <div>
            <h2 className={`${typography.headingCard} text-balance mb-2`}>
              {engagement === "team-player"
                ? "What do you need executed?"
                : "What deliverables do you need?"}
            </h2>
            <p className={typography.bodySm}>
              {engagement === "team-player"
                ? "Select the areas you need covered. I'll plug in directly and ship on your terms."
                : "Select everything that applies. We'll confirm scope and finalize everything before kickoff."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium leading-none text-text-primary mb-3">
                Brand
              </legend>
              {(
                [
                  {
                    value: "strategy",
                    label: "Brand strategy",
                    desc: "positioning + differentiation",
                  },
                  {
                    value: "identity",
                    label: "Visual identity system",
                    desc: "logo, color, type, imagery",
                  },
                  {
                    value: "launch-assets",
                    label: "Launch assets",
                    desc: "landing, deck, marketing basics",
                  },
                ] as const
              ).map((d) => (
                <label
                  key={d.value}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={brandDeliverables.includes(d.value)}
                    onChange={() => toggleBrand(d.value)}
                    className="mt-0.5 accent-brand-primary"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none text-text-primary">
                      {d.label}
                    </span>
                    <span className={typography.bodySm}>
                      {d.desc}
                    </span>
                  </div>
                </label>
              ))}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium leading-none text-text-primary mb-3">
                Product
              </legend>
              {(
                [
                  { value: "journeys", label: "User journeys & flows", desc: "screens, flows, edge cases" },
                  { value: "ui-screens", label: "High-fidelity UI screens", desc: "production-ready visual design" },
                  { value: "prototype", label: "Clickable prototype", desc: "interactive Figma or web demo" },
                ] as const
              ).map((d) => (
                <label
                  key={d.value}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={productDeliverables.includes(d.value)}
                    onChange={() => toggleProduct(d.value)}
                    className="mt-0.5 accent-brand-primary"
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-none text-text-primary">
                      {d.label}
                    </span>
                    <span className={typography.bodySm}>
                      {d.desc}
                    </span>
                  </div>
                </label>
              ))}
            </fieldset>
          </div>
        </section>
      </>

      <hr className="border-stroke-muted" />

      {/* Section: Timing */}
      <section className="space-y-5">
        <h2 className={`${typography.headingCard} text-balance`}>
          Timing
        </h2>
        <div className="space-y-2">
          <label htmlFor="start-date" className={labelClasses}>
            When would you ideally like to start?<OptionalTag />
          </label>
          <select
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClasses}
          >
            <option value="">Select a Monday…</option>
            {upcomingMondays.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <hr className="border-stroke-muted" />

      {/* Section: Anything else */}
      <section className="space-y-4">
        <div>
          <label
            htmlFor="notes"
            className={`${typography.headingCard} text-balance block mb-2`}
          >
            Anything else I should know?<OptionalTag />
          </label>
          <p className={typography.bodySm}>
            Deadlines, context, constraints, stakeholders, success metrics, etc.
          </p>
        </div>
        <textarea
          id="notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={textareaClasses}
        />
      </section>

      <hr className="border-stroke-muted" />

      {/* Book call checkbox + Submit */}
      <div className="space-y-6">
        <label
          className={`flex items-center gap-3 ${cardBase} ${
            bookCall ? cardSelected : cardUnselected
          }`}
        >
          <input
            type="checkbox"
            checked={bookCall}
            onChange={(e) => setBookCall(e.target.checked)}
            className="shrink-0 accent-brand-primary"
          />
          <div>
            <span className="text-sm font-medium leading-none text-text-primary">
              Book an intro call
            </span>
            <p className={`${typography.bodySm} mt-1`}>
              I&apos;ll send you a link to schedule a call after you submit.
            </p>
          </div>
        </label>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          <button
            type="submit"
            disabled={submitting || !name || !email || !description}
            className={`${primaryButton} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {submitting ? "Submitting…" : "Submit"}
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
