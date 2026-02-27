"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { StickyFooter } from "@/app/sandboxes/miles-proto-1/_components/sticky-footer";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface SetupStep {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

const steps: SetupStep[] = [
  {
    id: "permissions",
    label: "Grant permissions",
    description: "Bluetooth and notifications",
    href: "/permissions",
    done: false,
  },
  {
    id: "install",
    label: "Install Miles in your car",
    description: "Find your OBD-II port and plug in Miles",
    href: "/find-port",
    done: false,
  },
  {
    id: "pair",
    label: "Pair Miles with your phone",
    description: "Connect via Bluetooth",
    href: "/pair-device",
    done: false,
  },
  {
    id: "drivers",
    label: "Assign drivers",
    description: "Tell us who drives this vehicle",
    href: "/whos-driving",
    done: false,
  },
];

function getStepsForState(state: string): SetupStep[] {
  if (state === "filled") return steps.map((s) => ({ ...s, done: true }));
  if (state === "partial") return steps.map((s, i) => ({ ...s, done: i < 3 }));
  return steps;
}

function InstallContent() {
  const searchParams = useSearchParams();
  const stateParam = searchParams.get("state") ?? "empty";
  const currentSteps = getStepsForState(stateParam);
  const doneCount = currentSteps.filter((s) => s.done).length;
  const firstIncomplete = currentSteps.find((s) => !s.done);
  const allDone = doneCount === currentSteps.length;

  const backHref = stateParam === "empty" ? "/dashboard?state=empty" : "/dashboard";
  const subhead = allDone
    ? "You\u2019re all set. Miles is installed and ready to track your trips automatically."
    : "Complete these steps to start tracking trips automatically. Most people finish in under 5 minutes.";

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col px-6 pb-8 pt-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

          {/* Back link */}
          <Link
            href={backHref}
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>

          {/* Header */}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
              Set up Miles
            </h1>
            <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
              {subhead}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex flex-col gap-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                className={`h-full rounded-full motion-safe:transition-all motion-safe:duration-500 ${allDone ? "bg-green-500 dark:bg-green-400" : "bg-blue-600 dark:bg-blue-500"}`}
                style={{ width: `${(doneCount / currentSteps.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              {doneCount} of {currentSteps.length} complete
            </span>
          </div>

          {/* Steps checklist */}
          <div className="flex flex-col gap-2">
            {currentSteps.map((step, i) => {
              const isNext = !step.done && currentSteps.slice(0, i).every((s) => s.done);
              return (
                <Link
                  key={step.id}
                  href={step.href}
                  className={`flex items-center gap-4 rounded-md p-4 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                    step.done
                      ? "border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                      : isNext
                        ? "border border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:hover:bg-blue-900"
                        : "border border-neutral-200 bg-neutral-50 opacity-50 dark:border-neutral-700 dark:bg-neutral-800"
                  }`}
                >
                  <div
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
                      step.done
                        ? "bg-green-600 dark:bg-green-500"
                        : isNext
                          ? "border-2 border-blue-500 dark:border-blue-400"
                          : "border-2 border-neutral-300 dark:border-neutral-600"
                    }`}
                  >
                    {step.done && (
                      <svg className="size-3.5 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-0.5">
                    <span
                      className={`text-sm font-medium leading-none ${
                        step.done
                          ? "text-green-700 dark:text-green-400"
                          : isNext
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-neutral-900 dark:text-neutral-100"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span
                      className={`text-xs font-normal leading-normal ${
                        step.done
                          ? "text-green-600 dark:text-green-500"
                          : isNext
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-neutral-500 dark:text-neutral-500"
                      }`}
                    >
                      {step.done ? "Done" : step.description}
                    </span>
                  </div>

                  {!step.done && (
                    isNext ? (
                      <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium leading-none text-white dark:bg-blue-500">
                        Up next
                      </span>
                    ) : (
                      <svg className="size-4 shrink-0 text-neutral-300 dark:text-neutral-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    )
                  )}
                </Link>
              );
            })}
          </div>

          {/* Proto state toggles */}
          <div className="flex flex-col items-center gap-1">
            {stateParam !== "empty" && (
              <Link href="/install?state=empty" className="text-xs font-normal leading-normal text-neutral-400 underline underline-offset-2 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400">
                Proto: empty (nothing done)
              </Link>
            )}
            {stateParam !== "partial" && (
              <Link href="/install?state=partial" className="text-xs font-normal leading-normal text-neutral-400 underline underline-offset-2 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400">
                Proto: partial (3 of 4 done)
              </Link>
            )}
            {stateParam !== "filled" && (
              <Link href="/install?state=filled" className="text-xs font-normal leading-normal text-neutral-400 underline underline-offset-2 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400">
                Proto: filled (all done)
              </Link>
            )}
          </div>

        </div>
      </main>

      <StickyFooter>
        {firstIncomplete ? (
          <Link
            href={firstIncomplete.href}
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Continue
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Go to dashboard
          </Link>
        )}
      </StickyFooter>
    </div>
  );
}

export default function InstallPage() {
  return (
    <Suspense>
      <InstallContent />
    </Suspense>
  );
}
