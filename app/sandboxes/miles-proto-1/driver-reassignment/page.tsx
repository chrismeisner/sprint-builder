"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useState } from "react";

const drivers = [
  { id: "chris", name: "Chris", initials: "C", role: "Primary driver" },
  { id: "other", name: "Someone else", initials: null, role: "Assign to another driver" },
];

export default function DriverReassignmentPage() {
  const [selected, setSelected] = useState("chris");
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Back */}
        <Link
          href="/trip-detail"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg
            className="size-4"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Trip detail
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Who was driving?
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Confirm or change the driver for this trip. This helps Miles track
            driving patterns per person.
          </p>
        </div>

        {/* Trip context */}
        <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <svg
            className="size-5 shrink-0 text-neutral-400 dark:text-neutral-500"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
              Home &rarr; Downtown
            </span>
            <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500">
              Today, 3:42&ndash;3:54 PM &middot; 4.2 mi
            </span>
          </div>
        </div>

        {/* Driver options */}
        <div className="flex flex-col gap-1">
          {drivers.map((driver) => (
            <button
              key={driver.id}
              type="button"
              onClick={() => {
                setSelected(driver.id);
                setShowConfirm(false);
              }}
              className={`flex items-center gap-4 rounded-md p-4 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                selected === driver.id
                  ? "border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
                  : "border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
              }`}
            >
              {driver.initials ? (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-300">
                    {driver.initials}
                  </span>
                </div>
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                  <svg
                    className="size-5 text-neutral-500 dark:text-neutral-400"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                  </svg>
                </div>
              )}
              <div className="flex flex-1 flex-col gap-0.5">
                <span
                  className={`text-sm font-medium leading-none ${
                    selected === driver.id
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-neutral-900 dark:text-neutral-100"
                  }`}
                >
                  {driver.name}
                </span>
                <span
                  className={`text-xs font-normal leading-normal ${
                    selected === driver.id
                      ? "text-blue-600 dark:text-blue-500"
                      : "text-neutral-500 dark:text-neutral-500"
                  }`}
                >
                  {driver.role}
                </span>
              </div>
              {selected === driver.id && (
                <svg
                  className="ml-auto size-5 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* "Someone else" expanded state */}
        {selected === "other" && !showConfirm && (
          <div className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
              You don&rsquo;t have other drivers set up yet. Add a driver
              to assign this trip to them.
            </p>
            <Link
              href="/add-drivers"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium leading-none text-neutral-900 motion-safe:transition-colors motion-safe:duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
            >
              <svg
                className="size-4 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add a driver
            </Link>
          </div>
        )}

        {/* Confirmation toast */}
        {showConfirm && (
          <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <svg
              className="size-5 shrink-0 text-green-600 dark:text-green-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
              Driver updated to Chris
            </span>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            {showConfirm ? "Confirmed" : "Confirm driver"}
          </button>
          {showConfirm && (
            <Link
              href="/add-drivers"
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Continue
            </Link>
          )}
          <Link
            href="/add-drivers"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
          >
            Skip for now
          </Link>
        </div>
      </div>
    </main>
  );
}
