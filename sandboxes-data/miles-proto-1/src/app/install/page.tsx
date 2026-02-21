"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const preInstallSteps = [
  {
    id: "account",
    label: "Account created",
    description: "Email and password",
    href: "/signup",
    done: true,
  },
  {
    id: "permissions",
    label: "Permissions granted",
    description: "Bluetooth and notifications",
    href: "/permissions",
    done: false,
  },
  {
    id: "billing",
    label: "Payment method",
    description: "Activate your 21-day trial",
    href: "/billing",
    done: false,
  },
  {
    id: "primary-driver",
    label: "Primary driver set",
    description: "Name and photo for trip attribution",
    href: "/primary-driver",
    done: false,
  },
];

const completedSteps = [
  {
    label: "Account created",
    icon: (
      <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    label: "Permissions granted",
    icon: (
      <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    label: "Billing confirmed",
    icon: (
      <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
  {
    label: "Primary driver set",
    icon: (
      <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
];

function InstallContent() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state") === "empty" ? "empty" : "filled";

  const firstIncomplete = preInstallSteps.find((s) => !s.done);
  const doneCount = preInstallSteps.filter((s) => s.done).length;

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {state === "empty" ? (
          <>
            {/* Header */}
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard?state=empty"
                className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
              >
                &larr; Back
              </Link>
              <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
                Before you install
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
                A few things first
              </h1>
              <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
                Complete these steps, then we&rsquo;ll walk you through plugging
                in your Miles device.
              </p>
            </div>

            {/* Progress indicator */}
            <div className="flex flex-col gap-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div
                  className="h-full rounded-full bg-blue-600 motion-safe:transition-all motion-safe:duration-500 dark:bg-blue-500"
                  style={{ width: `${(doneCount / preInstallSteps.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                {doneCount} of {preInstallSteps.length} complete
              </span>
            </div>

            {/* Steps checklist */}
            <div className="flex flex-col gap-2">
              {preInstallSteps.map((step, i) => {
                const isNext = !step.done && preInstallSteps.slice(0, i).every((s) => s.done);
                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className={`flex items-center gap-4 rounded-md p-4 motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                      step.done
                        ? "bg-green-50 dark:bg-green-950"
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

            {/* Install step preview — locked */}
            <div className="flex items-center gap-4 rounded-md border border-dashed border-neutral-200 p-4 opacity-40 dark:border-neutral-700">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 dark:border-neutral-600" />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Install device in your car
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Plug Miles into your OBD-II port
                </span>
              </div>
              <svg className="size-4 shrink-0 text-neutral-300 dark:text-neutral-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>

            {/* CTA */}
            {firstIncomplete && (
              <Link
                href={firstIncomplete.href}
                className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
              >
                Continue &rarr; {firstIncomplete.label}
              </Link>
            )}
          </>
        ) : (
          <>
            {/* Header — filled state (original) */}
            <div className="flex flex-col gap-3">
              <Link
                href="/secondary-drivers"
                className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
              >
                &larr; Back
              </Link>
              <p className="text-xs font-medium uppercase tracking-wide leading-none text-blue-600 dark:text-blue-400">
                Before you go to the car
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
                You&rsquo;re almost ready
              </h1>
              <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
                Everything inside is done. Next we&rsquo;ll plug in Miles in your
                car.
              </p>
            </div>

            {/* Completed checklist */}
            <div className="flex flex-col gap-3">
              {completedSteps.map((step) => (
                <div
                  key={step.label}
                  className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                    {step.icon}
                  </div>
                  <span className="flex-1 text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                    {step.label}
                  </span>
                  <svg
                    className="size-5 shrink-0 text-green-600 dark:text-green-400"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              ))}
            </div>

            {/* What to bring */}
            <div className="flex flex-col gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <h2 className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
                Bring with you
              </h2>
              <ul className="flex flex-col gap-2">
                <li className="flex items-center gap-3">
                  <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                  <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
                    Your phone (with this app open)
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                  </svg>
                  <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
                    Your Miles device
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <Link
              href="/find-port"
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              I&rsquo;m at my car
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
