"use client";

import Link from "@/app/sandboxes/miles-proto-3/_components/link";
import { AskMilesBadge } from "@/app/sandboxes/miles-proto-3/_components/ask-miles-badge";

const fields = [
  { label: "Full name", value: "Chris Meisner" },
  { label: "Email", value: "chris@example.com" },
  { label: "Phone", value: "(555) 123-4567" },
  { label: "Date of birth", value: "Jan 1, 1990" },
];

export default function PersonalInformationPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 pb-16 pt-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Back */}
        <Link
          href="/profile"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Account
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              Personal information
            </h1>
            <AskMilesBadge
              context="personal-information"
              ariaLabel="Ask Miles about your personal information"
              className="mt-1"
            />
          </div>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Your contact details. We use these to keep your account secure and reach you when something needs your attention.
          </p>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-1">
          {fields.map((field) => (
            <div
              key={field.label}
              className="flex items-center justify-between rounded-md p-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
                  {field.label}
                </span>
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  {field.value}
                </span>
              </div>
              <button
                type="button"
                className="text-sm font-medium leading-none text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Edit
              </button>
            </div>
          ))}
        </div>

        {/* Placeholder note */}
        <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <p className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
            Placeholder — editing flows are not wired up yet.
          </p>
        </div>
      </div>
    </main>
  );
}
