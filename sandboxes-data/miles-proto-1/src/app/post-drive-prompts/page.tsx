"use client";

import Link from "next/link";
import { useState } from "react";

const cadenceOptions = [
  { id: "every", label: "Every trip", description: "Get notified after each drive" },
  { id: "daily", label: "Daily summary", description: "One recap at the end of the day" },
  { id: "weekly", label: "Weekly only", description: "A single weekly report" },
];

export default function PostDrivePromptsPage() {
  const [selectedCadence, setSelectedCadence] = useState("every");
  const [driverConfirmed, setDriverConfirmed] = useState(true);

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {/* Back */}
        <Link
          href="/trip-receipt"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            A few quick things
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Optional — you can always change these later in settings.
          </p>
        </div>

        {/* Notification cadence */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
            Trip notifications
          </h2>
          <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            How often should Miles notify you about trips?
          </p>
          <div className="flex flex-col gap-1">
            {cadenceOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedCadence(option.id)}
                className={`flex items-center gap-4 rounded-md p-4 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                  selectedCadence === option.id
                    ? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                    : "border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                }`}
              >
                <div className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selectedCadence === option.id
                    ? "border-blue-600 dark:border-blue-400"
                    : "border-neutral-300 dark:border-neutral-600"
                }`}>
                  {selectedCadence === option.id && (
                    <div className="size-2.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className={`text-sm font-medium leading-none ${
                    selectedCadence === option.id
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-neutral-900 dark:text-neutral-100"
                  }`}>
                    {option.label}
                  </span>
                  <span className={`text-xs font-normal leading-normal ${
                    selectedCadence === option.id
                      ? "text-blue-600 dark:text-blue-500"
                      : "text-neutral-500 dark:text-neutral-500"
                  }`}>
                    {option.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Driver confirmation */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
            Confirm driver
          </h2>
          <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            Was this your trip?
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setDriverConfirmed(true)}
              className={`flex items-center gap-4 rounded-md p-4 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                driverConfirmed
                  ? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                  : "border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
              }`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-300">
                  C
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-sm font-medium leading-none ${
                  driverConfirmed
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-neutral-900 dark:text-neutral-100"
                }`}>
                  Yes — this was Chris
                </span>
                <span className={`text-xs font-normal leading-normal ${
                  driverConfirmed
                    ? "text-blue-600 dark:text-blue-500"
                    : "text-neutral-500 dark:text-neutral-500"
                }`}>
                  Primary driver
                </span>
              </div>
              {driverConfirmed && (
                <svg className="ml-auto size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setDriverConfirmed(false)}
              className={`flex items-center gap-4 rounded-md p-4 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                !driverConfirmed
                  ? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                  : "border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
              }`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                <svg className="size-5 text-neutral-500 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-sm font-medium leading-none ${
                  !driverConfirmed
                    ? "text-blue-700 dark:text-blue-400"
                    : "text-neutral-900 dark:text-neutral-100"
                }`}>
                  Someone else was driving
                </span>
                <span className={`text-xs font-normal leading-normal ${
                  !driverConfirmed
                    ? "text-blue-600 dark:text-blue-500"
                    : "text-neutral-500 dark:text-neutral-500"
                }`}>
                  Reassign this trip to another driver
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/trips"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Save &amp; continue
          </Link>
          <Link
            href="/trips"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
          >
            Skip for now
          </Link>
        </div>

      </div>
    </main>
  );
}
