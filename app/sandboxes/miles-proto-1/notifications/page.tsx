"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useState } from "react";

const cadenceOptions = [
  { id: "every", label: "Every trip", description: "Get notified after each drive" },
  { id: "daily", label: "Daily summary", description: "One recap at the end of the day" },
  { id: "weekly", label: "Weekly only", description: "A single weekly report" },
  { id: "off", label: "Off", description: "No trip notifications" },
];

const recapOptions = [
  { id: "weekly", label: "Weekly recap" },
  { id: "monthly", label: "Monthly recap" },
];

export default function NotificationsPage() {
  const [cadence, setCadence] = useState("every");
  const [recaps, setRecaps] = useState<Set<string>>(new Set(["weekly"]));
  const [quietEnabled, setQuietEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  function toggleRecap(id: string) {
    setRecaps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Notifications
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Control how and when Miles reaches out. You can change these anytime.
          </p>
        </div>

        {/* Trip notification cadence */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            Trip notifications
          </h2>
          <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            How often should Miles notify you about completed trips?
          </p>
          <div className="flex flex-col gap-1">
            {cadenceOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCadence(option.id)}
                className={`flex items-center gap-4 rounded-md p-4 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                  cadence === option.id
                    ? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                    : "border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                }`}
              >
                <div
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    cadence === option.id
                      ? "border-blue-600 dark:border-blue-400"
                      : "border-neutral-300 dark:border-neutral-600"
                  }`}
                >
                  {cadence === option.id && (
                    <div className="size-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-sm font-medium leading-none ${
                      cadence === option.id
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-neutral-900 dark:text-neutral-100"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span
                    className={`text-xs font-normal leading-normal ${
                      cadence === option.id
                        ? "text-blue-600 dark:text-blue-500"
                        : "text-neutral-500 dark:text-neutral-500"
                    }`}
                  >
                    {option.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recaps */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            Recaps
          </h2>
          <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            Periodic summaries of your driving activity and insights.
          </p>
          <div className="flex flex-col gap-1">
            {recapOptions.map((option) => {
              const active = recaps.has(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleRecap(option.id)}
                  className={`flex items-center gap-4 rounded-md p-4 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                    active
                      ? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                      : "border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                  }`}
                >
                  <div
                    className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      active
                        ? "border-blue-600 bg-blue-600 dark:border-blue-400 dark:bg-blue-400"
                        : "border-neutral-300 dark:border-neutral-600"
                    }`}
                  >
                    {active && (
                      <svg className="size-3 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium leading-none ${
                      active
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-neutral-900 dark:text-neutral-100"
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quiet hours */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            Quiet hours
          </h2>
          <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            Silence all notifications during a set window. Trips still record
            normally.
          </p>

          <button
            type="button"
            onClick={() => setQuietEnabled(!quietEnabled)}
            className={`flex items-center gap-4 rounded-md p-4 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
              quietEnabled
                ? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                : "border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
            }`}
          >
            <div
              className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 motion-safe:transition-colors motion-safe:duration-200 ${
                quietEnabled
                  ? "bg-blue-600 dark:bg-blue-500"
                  : "bg-neutral-300 dark:bg-neutral-600"
              }`}
            >
              <div
                className={`size-5 rounded-full bg-white shadow-sm motion-safe:transition-transform motion-safe:duration-200 ${
                  quietEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span
                className={`text-sm font-medium leading-none ${
                  quietEnabled
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-neutral-900 dark:text-neutral-100"
                }`}
              >
                Enable quiet hours
              </span>
              <span
                className={`text-xs font-normal leading-normal ${
                  quietEnabled
                    ? "text-blue-600 dark:text-blue-500"
                    : "text-neutral-500 dark:text-neutral-500"
                }`}
              >
                Do not disturb during set times
              </span>
            </div>
          </button>

          {quietEnabled && (
            <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex flex-1 flex-col gap-2">
                <label htmlFor="quiet-start" className="text-xs font-medium leading-none text-neutral-500 dark:text-neutral-500">
                  From
                </label>
                <input
                  id="quiet-start"
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium tabular-nums text-neutral-900 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
                />
              </div>
              <span className="mt-5 text-sm font-normal text-neutral-400 dark:text-neutral-500">
                &ndash;
              </span>
              <div className="flex flex-1 flex-col gap-2">
                <label htmlFor="quiet-end" className="text-xs font-medium leading-none text-neutral-500 dark:text-neutral-500">
                  Until
                </label>
                <input
                  id="quiet-end"
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium tabular-nums text-neutral-900 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Save preferences
          </Link>
        </div>
      </div>
    </main>
  );
}
