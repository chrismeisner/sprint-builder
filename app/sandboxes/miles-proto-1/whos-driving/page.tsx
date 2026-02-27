"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { SetupProgress } from "@/app/sandboxes/miles-proto-1/_components/setup-progress";
import { StickyFooter } from "@/app/sandboxes/miles-proto-1/_components/sticky-footer";
import { useState } from "react";

type UsageOption = "just-me" | "family" | "business";

const options: {
  id: UsageOption;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "just-me",
    label: "Just me",
    description: "I'm the only one who drives this vehicle",
    icon: (
      <svg className="size-6" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  {
    id: "family",
    label: "My family",
    description: "Multiple people in my household share this vehicle",
    icon: (
      <svg className="size-6" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    id: "business",
    label: "My business",
    description: "This vehicle is used for work or mixed personal and business trips",
    icon: (
      <svg className="size-6" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
];

export default function WhosDrivingPage() {
  const [selected, setSelected] = useState<Set<UsageOption>>(new Set<UsageOption>(["just-me"]));

  function toggle(id: UsageOption) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const hasSelection = selected.size > 0;
  const needsDrivers = selected.has("family") || selected.has("business");
  const nextHref = needsDrivers ? "/add-drivers?from=setup" : "/device-detected";

  return (
    <>
      <main className="flex min-h-dvh flex-col px-6 pb-8 pt-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

          <SetupProgress current={7} backHref="/install?state=partial" />

          {/* Header */}
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              Who&rsquo;s driving?
            </h1>
            <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
              Who&rsquo;s going to be using this vehicle? Select all that apply — Miles will tailor trip tracking and insights accordingly.
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {options.map((option) => {
              const isSelected = selected.has(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggle(option.id)}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-4 rounded-lg border p-4 text-left motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                    isSelected
                      ? "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"
                      : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  }`}
                >
                  {/* Icon */}
                  <div className={`flex size-12 shrink-0 items-center justify-center rounded-full motion-safe:transition-colors motion-safe:duration-150 ${
                    isSelected
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                  }`}>
                    {option.icon}
                  </div>

                  {/* Label + description */}
                  <div className="flex flex-1 flex-col gap-1">
                    <span className={`text-sm font-semibold leading-none ${
                      isSelected
                        ? "text-blue-800 dark:text-blue-300"
                        : "text-neutral-900 dark:text-neutral-100"
                    }`}>
                      {option.label}
                    </span>
                    <span className={`text-xs font-normal leading-normal ${
                      isSelected
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-neutral-500 dark:text-neutral-500"
                    }`}>
                      {option.description}
                    </span>
                  </div>

                  {/* Checkmark */}
                  <div className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 motion-safe:transition-colors motion-safe:duration-150 ${
                    isSelected
                      ? "border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400"
                      : "border-neutral-300 dark:border-neutral-600"
                  }`}>
                    {isSelected && (
                      <svg className="size-3 text-white dark:text-neutral-900" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      </main>

      <StickyFooter>
        {hasSelection ? (
          <Link
            href={nextHref}
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
