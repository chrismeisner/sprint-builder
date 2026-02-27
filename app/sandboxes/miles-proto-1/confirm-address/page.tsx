"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useState } from "react";

export default function ConfirmAddressPage() {
  const [address, setAddress] = useState("742 Evergreen Terrace");
  const [city, setCity] = useState("Springfield");
  const [state, setState] = useState("IL");
  const [zip, setZip] = useState("62704");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (address && city && state && zip) {
      setSaved(true);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/getting-online"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <p className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Optional
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Confirm your home address
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            This helps label trips like &ldquo;Home&rdquo; automatically so your
            trip log is easier to read.
          </p>
        </div>

        {saved ? (
          /* Success state */
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-3">
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
                <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
                  Address saved
                </span>
              </div>
              <p className="text-sm font-normal leading-normal text-green-700 dark:text-green-400">
                {address}, {city}, {state} {zip}
              </p>
            </div>
            <Link
              href="/device-detected"
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Continue
            </Link>
          </div>
        ) : (
          /* Form state */
          <div className="flex flex-col gap-6">
            {/* Prefilled hint */}
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
                We&rsquo;ve prefilled this from your account. Update it if
                needed.
              </span>
            </div>

            {/* Address form */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="address"
                  className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
                >
                  Street address
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-12 rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-normal text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="city"
                  className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
                >
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-12 rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-normal text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex w-24 flex-col gap-2">
                  <label
                    htmlFor="state"
                    className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
                  >
                    State
                  </label>
                  <input
                    id="state"
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="h-12 rounded-md border border-neutral-300 bg-white px-4 text-center text-base font-normal leading-normal text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <label
                    htmlFor="zip"
                    className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
                  >
                    ZIP
                  </label>
                  <input
                    id="zip"
                    type="text"
                    maxLength={5}
                    value={zip}
                    onChange={(e) =>
                      setZip(e.target.value.replace(/\D/g, ""))
                    }
                    className="h-12 rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-normal tabular-nums text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
              >
                Save address
              </button>
              <Link
                href="/device-detected"
                className="flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Skip for now
              </Link>
            </div>

            {/* Reassurance */}
            <p className="text-center text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              You can add or change saved locations anytime in Settings.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
