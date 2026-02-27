"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import {
  useForceLightMode,
  setForceLightMode,
} from "@/app/sandboxes/miles-proto-1/_components/force-light-mode";

export default function SettingsPage() {
  const forceLight = useForceLightMode();

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900"
        >
          <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold leading-tight text-neutral-900">
            Prototype settings
          </h1>
          <p className="text-sm font-normal leading-normal text-neutral-500">
            These preferences are saved locally in your browser.
          </p>
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900">
                Force light mode
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-500">
                Override system theme and always display the prototype in light mode.
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={forceLight}
              onClick={() => setForceLightMode(!forceLight)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                forceLight ? "bg-blue-600" : "bg-neutral-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
                  forceLight ? "translate-x-[22px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </div>
        </div>

        <p className="text-xs font-normal leading-normal text-neutral-400">
          Changes take effect immediately. This page is unlisted — only people with the direct link can access it.
        </p>
      </div>
    </main>
  );
}
