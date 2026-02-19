"use client";

import Link from "next/link";
import { useState } from "react";

interface SetupItem {
  id: string;
  label: string;
  description: string;
  href: string;
  required: boolean;
}

const setupItems: SetupItem[] = [
  {
    id: "account",
    label: "Create account",
    description: "Email and password",
    href: "/signup",
    required: true,
  },
  {
    id: "billing",
    label: "Payment method",
    description: "Activate your 21-day trial",
    href: "/billing",
    required: true,
  },
  {
    id: "device",
    label: "Install device",
    description: "Plug Miles into your OBD-II port",
    href: "/install",
    required: true,
  },
  {
    id: "primary-driver",
    label: "Primary driver",
    description: "Name and photo for trip attribution",
    href: "/primary-driver",
    required: true,
  },
  {
    id: "home-address",
    label: "Home address",
    description: "Auto-label trips that start or end at home",
    href: "/confirm-address",
    required: false,
  },
  {
    id: "secondary-drivers",
    label: "Other drivers",
    description: "Add people who share this vehicle",
    href: "/household",
    required: false,
  },
  {
    id: "locations",
    label: "Name your places",
    description: "Label work, school, or other frequent spots",
    href: "/locations",
    required: false,
  },
  {
    id: "notifications",
    label: "Notification preferences",
    description: "Choose how often Miles updates you",
    href: "/notifications",
    required: false,
  },
];

const initialComplete = new Set(["account", "billing", "device", "primary-driver", "home-address"]);

export default function SetupProgressPage() {
  const [completed, setCompleted] = useState<Set<string>>(initialComplete);

  const requiredItems = setupItems.filter((item) => item.required);
  const optionalItems = setupItems.filter((item) => !item.required);
  const totalDone = setupItems.filter((item) => completed.has(item.id)).length;
  const progress = Math.round((totalDone / setupItems.length) * 100);

  function toggleItem(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
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
            Setup progress
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            You&rsquo;re off to a great start. Finish the rest whenever
            it&rsquo;s convenient &mdash; no rush.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div
              className="h-full rounded-full bg-blue-600 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out dark:bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
              {totalDone} of {setupItems.length} complete
            </span>
            <span className="text-sm font-normal leading-none tabular-nums text-neutral-500 dark:text-neutral-500">
              {progress}%
            </span>
          </div>
        </div>

        {/* Required section */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Required
          </span>
          <div className="flex flex-col gap-1">
            {requiredItems.map((item) => {
              const done = completed.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-center gap-4 rounded-md p-4 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                    done
                      ? "bg-green-50 dark:bg-green-950"
                      : "border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
                  }`}
                >
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                      done
                        ? "bg-green-600 dark:bg-green-500"
                        : "border-2 border-neutral-300 dark:border-neutral-600"
                    }`}
                  >
                    {done && (
                      <svg className="size-3.5 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span
                      className={`text-sm font-medium leading-none ${
                        done
                          ? "text-green-700 line-through dark:text-green-400"
                          : "text-neutral-900 dark:text-neutral-100"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-xs font-normal leading-normal ${
                        done
                          ? "text-green-600 dark:text-green-500"
                          : "text-neutral-500 dark:text-neutral-500"
                      }`}
                    >
                      {done ? "Done" : item.description}
                    </span>
                  </div>
                  {!done && (
                    <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional section */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Optional &mdash; finish anytime
          </span>
          <div className="flex flex-col gap-1">
            {optionalItems.map((item) => {
              const done = completed.has(item.id);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-4 rounded-md p-4 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                    done
                      ? "bg-green-50 dark:bg-green-950"
                      : "border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  }`}
                >
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                      done
                        ? "bg-green-600 dark:bg-green-500"
                        : "border-2 border-neutral-300 dark:border-neutral-600"
                    }`}
                  >
                    {done && (
                      <svg className="size-3.5 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span
                      className={`text-sm font-medium leading-none ${
                        done
                          ? "text-green-700 line-through dark:text-green-400"
                          : "text-neutral-900 dark:text-neutral-100"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-xs font-normal leading-normal ${
                        done
                          ? "text-green-600 dark:text-green-500"
                          : "text-neutral-500 dark:text-neutral-500"
                      }`}
                    >
                      {done ? "Done" : item.description}
                    </span>
                  </div>
                  {!done && (
                    <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Reassurance */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg
            className="size-5 shrink-0 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              Miles is fully functional
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              Optional items make the experience better but aren&rsquo;t
              blocking anything. Your trips are recording normally.
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
