"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const allSteps = [
  {
    id: "permissions",
    label: "Grant permissions",
    description: "Bluetooth and notifications",
    href: "/permissions",
    done: false,
  },
  {
    id: "billing",
    label: "Add payment method",
    description: "Activate your 21-day trial",
    href: "/billing",
    done: false,
  },
  {
    id: "install",
    label: "Install device in your car",
    description: "Plug Miles into your OBD-II port",
    href: "/find-port",
    done: false,
  },
  {
    id: "pair",
    label: "Pair device",
    description: "Link to your account via Bluetooth and cloud",
    href: "/getting-online",
    done: false,
  },
  {
    id: "first-drive",
    label: "Go on your first drive",
    description: "Miles will log it automatically",
    href: "/trips",
    done: false,
  },
];

const allStepsFilled = allSteps.map((s) => ({ ...s, done: true }));

function InstallContent() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state") === "empty" ? "empty" : "filled";

  const firstIncomplete = allSteps.find((s) => !s.done);
  const doneCount = allSteps.filter((s) => s.done).length;

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {state === "empty" ? (
          <>
            {/* Back link */}
            <Link
              href="/dashboard?state=empty"
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
                Complete these steps to start tracking trips automatically. Most people finish in under 5 minutes.
              </p>
            </div>

            {/* Progress indicator */}
            <div className="flex flex-col gap-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-blue-600 motion-safe:transition-all motion-safe:duration-500 dark:bg-blue-500"
                  style={{ width: `${(doneCount / allSteps.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                {doneCount} of {allSteps.length} complete
              </span>
            </div>

            {/* Steps checklist */}
            <div className="flex flex-col gap-2">
              {allSteps.map((step, i) => {
                const isNext = !step.done && allSteps.slice(0, i).every((s) => s.done);
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
                    {/* Circle indicator */}
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

                    {/* Label */}
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

                    {/* Chevron or badge */}
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

            {/* CTA */}
            {firstIncomplete && (
              <Link
                href={firstIncomplete.href}
                className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
              >
                Continue
              </Link>
            )}
          </>
        ) : (
          <>
            {/* Back link */}
            <Link
              href="/dashboard"
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
                You&rsquo;re all set. Miles is installed and ready to track your trips automatically.
              </p>
            </div>

            {/* Progress indicator — all done */}
            <div className="flex flex-col gap-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div className="h-full w-full rounded-full bg-green-500 dark:bg-green-400" />
              </div>
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                {allStepsFilled.length} of {allStepsFilled.length} complete
              </span>
            </div>

            {/* Steps checklist — all done, same cell structure as empty state */}
            <div className="flex flex-col gap-2">
              {allStepsFilled.map((step, i) => {
                const isNext = !step.done && allStepsFilled.slice(0, i).every((s) => s.done);
                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className="flex items-center gap-4 rounded-md border border-green-200 bg-green-50 p-4 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-green-900 dark:bg-green-950 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
                  >
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-600 dark:bg-green-500">
                      <svg className="size-3.5 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
                        {step.label}
                      </span>
                      <span className="text-xs font-normal leading-normal text-green-600 dark:text-green-500">
                        Done
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* CTA */}
            <Link
              href="/find-port"
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Continue
            </Link>
          </>
        )}

        {/* Proto state toggle */}
        <Link
          href={state === "filled" ? "/install?state=empty" : "/install?state=filled"}
          className="text-center text-xs font-normal leading-normal text-neutral-400 underline underline-offset-2 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
        >
          Proto: switch to {state === "filled" ? "empty" : "filled"} state
        </Link>

      </div>
    </main>
  );
}

export default function InstallPage() {
  return (
    <Suspense>
      <InstallContent />
    </Suspense>
  );
}
