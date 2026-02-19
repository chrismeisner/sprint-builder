"use client";

import Link from "next/link";
import { useState } from "react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: "locked" | "unlocked" | "active";
  requirement: string;
}

const milestones: Milestone[] = [
  {
    id: "first-month",
    title: "First month complete",
    description: "30 days of driving with Miles installed.",
    status: "unlocked",
    requirement: "30 days active",
  },
  {
    id: "night-driving",
    title: "Night driving",
    description: "Demonstrated safe driving after 9 PM on at least 5 occasions.",
    status: "active",
    requirement: "5 safe night trips",
  },
  {
    id: "highway",
    title: "Highway driving",
    description: "Completed 10 highway trips with no hard-braking events.",
    status: "locked",
    requirement: "10 clean highway trips",
  },
  {
    id: "long-distance",
    title: "Long-distance trips",
    description: "Successfully completed 3 trips over 50 miles each.",
    status: "locked",
    requirement: "3 trips over 50 mi",
  },
  {
    id: "independence",
    title: "Independence mode",
    description: "Reduced parental oversight based on a strong track record.",
    status: "locked",
    requirement: "All milestones complete",
  },
];

function MilestoneIcon({ status }: { status: "locked" | "unlocked" | "active" }) {
  if (status === "unlocked") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-600 dark:bg-green-500">
        <svg className="size-4 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-blue-500 dark:border-blue-400">
        <div className="size-3 rounded-full bg-blue-600 dark:bg-blue-400" />
      </div>
    );
  }
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-600">
      <svg className="size-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    </div>
  );
}

export default function TeenIndependencePage() {
  const [requestSent, setRequestSent] = useState(false);

  const completedCount = milestones.filter((m) => m.status === "unlocked").length;
  const progress = Math.round((completedCount / milestones.length) * 100);

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Back */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Home
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-blue-600 dark:text-blue-400">
            Teen Driver
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Independence Path
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Build a track record of safe driving to unlock more freedom over
            time.
          </p>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div
              className="h-full rounded-full bg-blue-600 motion-safe:transition-all motion-safe:duration-500 dark:bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
              {completedCount} of {milestones.length} milestones
            </span>
            <span className="text-sm font-normal leading-none tabular-nums text-neutral-500 dark:text-neutral-500">
              {progress}%
            </span>
          </div>
        </div>

        {/* Milestones */}
        <div className="flex flex-col gap-1">
          {milestones.map((milestone, i) => (
            <div key={milestone.id} className="flex gap-3">
              {/* Vertical connector */}
              <div className="flex flex-col items-center">
                <MilestoneIcon status={milestone.status} />
                {i < milestones.length - 1 && (
                  <div
                    className={`h-full w-px ${
                      milestone.status === "unlocked"
                        ? "bg-green-300 dark:bg-green-700"
                        : "bg-neutral-200 dark:bg-neutral-700"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div
                className={`mb-2 flex flex-1 flex-col gap-1 rounded-md p-4 ${
                  milestone.status === "unlocked"
                    ? "bg-green-50 dark:bg-green-950"
                    : milestone.status === "active"
                      ? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                      : "border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                }`}
              >
                <span
                  className={`text-sm font-medium leading-none ${
                    milestone.status === "unlocked"
                      ? "text-green-700 dark:text-green-400"
                      : milestone.status === "active"
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-neutral-500 dark:text-neutral-500"
                  }`}
                >
                  {milestone.title}
                </span>
                <span
                  className={`text-xs font-normal leading-normal ${
                    milestone.status === "unlocked"
                      ? "text-green-600 dark:text-green-500"
                      : milestone.status === "active"
                        ? "text-blue-600 dark:text-blue-500"
                        : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  {milestone.status === "unlocked"
                    ? "Complete"
                    : milestone.status === "active"
                      ? `In progress — ${milestone.requirement}`
                      : milestone.requirement}
                </span>
                {milestone.status === "active" && (
                  <span className="mt-1 text-xs font-normal leading-normal text-blue-600 dark:text-blue-500">
                    {milestone.description}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Request independence mode */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            Request independence mode
          </h2>
          <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            Once all milestones are complete, you can ask to reduce parental
            oversight. Your parent or guardian will review and approve the
            request.
          </p>

          {requestSent ? (
            <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <svg className="size-5 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
                  Request sent
                </span>
                <span className="text-xs font-normal leading-normal text-green-700 dark:text-green-400">
                  Your parent will be notified. You&rsquo;ll hear back soon.
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRequestSent(true)}
              disabled={completedCount < milestones.length}
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Request independence mode
            </button>
          )}

          {completedCount < milestones.length && !requestSent && (
            <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Complete all milestones to unlock this request.
            </p>
          )}
        </div>

        {/* Supportive note */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              This is about building trust
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              Independence mode isn&rsquo;t about removing safety &mdash;
              it&rsquo;s about recognizing good driving habits and earning more
              freedom gradually.
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
