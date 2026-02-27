"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useEffect, useState } from "react";
import { SetupProgress } from "@/app/sandboxes/miles-proto-1/_components/setup-progress";
import { StickyFooter } from "@/app/sandboxes/miles-proto-1/_components/sticky-footer";

type StepStatus = "pending" | "active" | "done";

type StepId = "vehicle" | "network" | "firmware";

interface ChecklistStep {
  id: StepId;
  label: string;
  activeDescription: string;
  doneDescription: string;
  delay: number;
  duration: number;
}

const checklist: ChecklistStep[] = [
  {
    id: "vehicle",
    label: "Vehicle info",
    activeDescription: "Reading vehicle data from OBD-II port…",
    doneDescription: "2022 Honda Civic Sport",
    delay: 0,
    duration: 2500,
  },
  {
    id: "network",
    label: "Network & GPS",
    activeDescription: "Establishing cellular connection and locking GPS…",
    doneDescription: "4G LTE — Strong signal",
    delay: 2500,
    duration: 4000,
  },
  {
    id: "firmware",
    label: "Firmware check",
    activeDescription: "Verifying device firmware…",
    doneDescription: "v2.4.1 — Up to date",
    delay: 6500,
    duration: 2000,
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "size-5 text-green-600 dark:text-green-400"}
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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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
  const [statuses, setStatuses] = useState<Record<StepId, StepStatus>>({
    vehicle: "pending",
    network: "pending",
    firmware: "pending",
  });
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    checklist.forEach((step) => {
      if (step.duration === 0) return;

      timers.push(
        setTimeout(() => {
          setStatuses((prev) => ({ ...prev, [step.id]: "active" }));
        }, step.delay)
      );

      timers.push(
        setTimeout(() => {
          setStatuses((prev) => ({ ...prev, [step.id]: "done" }));
        }, step.delay + step.duration)
      );
    });

    const lastStep = checklist[checklist.length - 1];
    timers.push(
      setTimeout(() => {
        setAllDone(true);
      }, lastStep.delay + lastStep.duration + 500)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const completedCount = Object.values(statuses).filter((s) => s === "done").length;
  // Step 6 is index 6 of 7 total screens. Spread that one step across the 3 sub-steps
  // so the bar only reaches 100% once all sub-steps are done.
  const setupProgress = Math.round(((6 + completedCount / checklist.length) / 7) * 100);

  return (
    <>
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {/* Header */}
        <SetupProgress current={6} progress={setupProgress} />
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            {allDone ? "Miles is ready" : "Miles is getting online"}
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            {allDone
              ? "Everything checks out. You\u2019re all set to start driving."
              : "Your device is powering up and connecting. This usually takes under a minute."}
          </p>
        </div>

        {/* Status callout — replaces in place */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          {allDone ? (
            <svg
              className="size-5 shrink-0 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          ) : (
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
          )}
          <div className="flex flex-col gap-1">
            {allDone && (
              <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">Ready to drive</span>
            )}
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              {allDone
                ? "Miles will automatically log your trips from here on out."
                : "Keep the app open while your device connects. You can start driving once it says Ready."}
            </span>
          </div>
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-3">
          {checklist.map((step) => {
            const status = statuses[step.id];
            return (
              <div
                key={step.id}
                className={`flex flex-col gap-0 rounded-md p-4 motion-safe:transition-colors motion-safe:duration-300 ${
                  status === "done"
                    ? "bg-green-50 dark:bg-green-950"
                    : status === "active"
                      ? "bg-blue-50 dark:bg-blue-950"
                      : "bg-neutral-50 dark:bg-neutral-800"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Status icon */}
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                    status === "done"
                      ? "bg-green-100 dark:bg-green-900"
                      : status === "active"
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "bg-neutral-100 dark:bg-neutral-700"
                  }`}>
                    {status === "done" && <CheckIcon />}
                    {status === "active" && <Spinner />}
                    {status === "pending" && <PendingDot />}
                  </div>

                  {/* Label + description */}
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
                      {status === "done"
                        ? step.doneDescription
                        : status === "active"
                          ? step.activeDescription
                          : "Waiting…"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </main>

    <StickyFooter>
      {allDone ? (
        <Link
          href="/whos-driving"
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          Continue
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-blue-300 px-6 text-base font-medium leading-none text-white dark:bg-blue-800 dark:text-blue-400"
        >
          Continue
        </button>
      )}
    </StickyFooter>
    </>
  );
}
