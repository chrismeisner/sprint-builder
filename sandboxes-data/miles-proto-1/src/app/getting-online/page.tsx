"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type StepStatus = "pending" | "active" | "done";

interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  delay: number;
  duration: number;
}

const checklist: ChecklistStep[] = [
  {
    id: "power",
    label: "Device power",
    description: "Drawing power from OBD-II port",
    delay: 0,
    duration: 1500,
  },
  {
    id: "network",
    label: "Connecting to network",
    description: "Establishing cellular connection",
    delay: 1500,
    duration: 3000,
  },
  {
    id: "gps",
    label: "Getting GPS fix",
    description: "Locking onto satellites",
    delay: 4500,
    duration: 4000,
  },
  {
    id: "firmware",
    label: "Checking firmware",
    description: "Making sure everything is up to date",
    delay: 8500,
    duration: 2000,
  },
];

function CheckIcon() {
  return (
    <svg
      className="size-5 text-green-600 dark:text-green-400"
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="size-5 text-blue-600 motion-safe:animate-spin dark:text-blue-400"
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
  );
}

function PendingDot() {
  return (
    <div className="flex size-5 items-center justify-center">
      <div className="size-2 rounded-full bg-neutral-300 dark:bg-neutral-600" />
    </div>
  );
}

export default function GettingOnlinePage() {
  const [statuses, setStatuses] = useState<Record<string, StepStatus>>(() => {
    const initial: Record<string, StepStatus> = {};
    checklist.forEach((step) => {
      initial[step.id] = "pending";
    });
    return initial;
  });
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    checklist.forEach((step) => {
      // Start step
      timers.push(
        setTimeout(() => {
          setStatuses((prev) => ({ ...prev, [step.id]: "active" }));
        }, step.delay)
      );

      // Complete step
      timers.push(
        setTimeout(() => {
          setStatuses((prev) => ({ ...prev, [step.id]: "done" }));
        }, step.delay + step.duration)
      );
    });

    // All done
    const lastStep = checklist[checklist.length - 1];
    timers.push(
      setTimeout(() => {
        setAllDone(true);
      }, lastStep.delay + lastStep.duration + 500)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const completedCount = Object.values(statuses).filter((s) => s === "done").length;

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide leading-none text-blue-600 dark:text-blue-400">
            Step 3 of install
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            {allDone ? "Miles is ready" : "Miles is getting online"}
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            {allDone
              ? "Everything looks good. You\u2019re all set to start driving."
              : "Your device is powering up and connecting. This usually takes a minute or two."}
          </p>
        </div>

        {/* Status checklist */}
        <div className="flex flex-col gap-1">
          {checklist.map((step) => {
            const status = statuses[step.id];
            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 rounded-md p-4 motion-safe:transition-colors motion-safe:duration-300 ${
                  status === "done"
                    ? "bg-green-50 dark:bg-green-950"
                    : status === "active"
                      ? "bg-blue-50 dark:bg-blue-950"
                      : "bg-neutral-50 dark:bg-neutral-800"
                }`}
              >
                {/* Status icon */}
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white dark:bg-neutral-900">
                  {status === "done" && <CheckIcon />}
                  {status === "active" && <Spinner />}
                  {status === "pending" && <PendingDot />}
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1">
                  <span
                    className={`text-sm font-medium leading-none ${
                      status === "done"
                        ? "text-green-700 dark:text-green-400"
                        : status === "active"
                          ? "text-blue-700 dark:text-blue-400"
                          : "text-neutral-500 dark:text-neutral-500"
                    }`}
                  >
                    {step.label}
                  </span>
                  <span
                    className={`text-xs font-normal leading-normal ${
                      status === "done"
                        ? "text-green-600 dark:text-green-500"
                        : status === "active"
                          ? "text-blue-600 dark:text-blue-500"
                          : "text-neutral-400 dark:text-neutral-600"
                    }`}
                  >
                    {status === "done" ? "Complete" : step.description}
                  </span>
                </div>

                {/* Badge for done */}
                {status === "done" && (
                  <span className="ml-auto text-xs font-medium leading-none text-green-600 dark:text-green-400">
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress summary */}
        <div className="flex flex-col gap-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div
              className="h-full rounded-full bg-blue-600 motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-out dark:bg-blue-500"
              style={{
                width: `${(completedCount / checklist.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-center text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
            {allDone
              ? "All systems go"
              : `${completedCount} of ${checklist.length} complete`}
          </p>
        </div>

        {/* Ready state callout */}
        {allDone && (
          <div className="flex gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
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
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
                Ready to drive
              </span>
              <span className="text-sm font-normal leading-normal text-green-700 dark:text-green-400">
                Miles will automatically log your trips from here on out.
              </span>
            </div>
          </div>
        )}

        {/* Driving hint — shown while not done */}
        {!allDone && (
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
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              You can start driving as soon as it says Ready.
            </span>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          {allDone ? (
            <Link
              href="/device-detected"
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Continue
            </Link>
          ) : (
            <Link
              href="/confirm-address"
              className="flex h-12 w-full items-center justify-center rounded-md border border-neutral-300 bg-white px-6 text-base font-medium leading-none text-neutral-900 motion-safe:transition-colors motion-safe:duration-200 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Continue while this finishes
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
