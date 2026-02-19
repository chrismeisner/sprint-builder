"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function FirstTripReadyPage() {
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSyncing(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Hero */}
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex size-24 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
            <svg
              className="size-12 text-green-600 dark:text-green-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              Your first trip is&nbsp;in
            </h1>
            <p className="text-lg font-normal leading-relaxed text-pretty text-neutral-600 dark:text-neutral-400">
              Miles captured your drive automatically. Everything worked exactly
              as it should.
            </p>
          </div>
        </div>

        {/* Sync banner */}
        {syncing ? (
          <div className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
            <svg
              className="size-5 shrink-0 text-amber-600 motion-safe:animate-spin dark:text-amber-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-amber-700 dark:text-amber-400">
                Still finishing up a few details
              </span>
              <span className="text-sm font-normal leading-normal text-amber-700 dark:text-amber-400">
                Some data is still syncing &mdash; your summary may update
                slightly.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <svg
              className="size-5 shrink-0 text-green-600 dark:text-green-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
                Fully synced
              </span>
              <span className="text-sm font-normal leading-normal text-green-700 dark:text-green-400">
                All trip data is in. Your summary is complete.
              </span>
            </div>
          </div>
        )}

        {/* Quick stats preview */}
        <div className="grid grid-cols-3 gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Distance
            </span>
            <span className="text-base font-medium leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
              4.2 mi
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-neutral-200 dark:border-neutral-700">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Duration
            </span>
            <span className="text-base font-medium leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
              12 min
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Driver
            </span>
            <span className="text-base font-medium leading-none text-neutral-900 dark:text-neutral-100">
              Chris
            </span>
          </div>
        </div>

        {/* What this means */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
            What this means
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                <svg
                  className="size-5 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.808 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Everything is automatic
                </span>
                <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                  Every future drive gets logged the same way &mdash; no buttons
                  to press.
                </span>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                <svg
                  className="size-5 text-green-600 dark:text-green-400"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Insights build over time
                </span>
                <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                  The more you drive, the more useful your data becomes. No
                  pressure on day one.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/first-trip-summary"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            See your trip summary
          </Link>
          <Link
            href="/trips"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
          >
            Go to Trips
          </Link>
        </div>
      </div>
    </main>
  );
}
