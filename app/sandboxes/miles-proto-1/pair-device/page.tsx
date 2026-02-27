"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useEffect, useState } from "react";
import { SetupProgress } from "@/app/sandboxes/miles-proto-1/_components/setup-progress";
import { StickyFooter } from "@/app/sandboxes/miles-proto-1/_components/sticky-footer";

type Phase = "scanning" | "found";

export default function PairDevicePage() {
  const [phase, setPhase] = useState<Phase>("scanning");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("found"), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {/* Header */}
        <SetupProgress current={5} />
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            {phase === "scanning" ? "Looking for Miles\u2026" : "Miles found"}
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            {phase === "scanning"
              ? "Make sure Bluetooth is on. We\u2019re scanning for Miles nearby."
              : "We found Miles. Tap Pair to connect it to your phone."}
          </p>
        </div>

        {/* Status card */}
        <div className={`flex flex-col items-center gap-5 rounded-lg border p-8 motion-safe:transition-colors motion-safe:duration-500 ${
          phase === "found"
            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
            : "border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800"
        }`}>
          {/* Icon */}
          <div className={`flex size-20 items-center justify-center rounded-full motion-safe:transition-colors motion-safe:duration-500 ${
            phase === "found"
              ? "bg-green-100 dark:bg-green-900"
              : "bg-blue-50 dark:bg-blue-950"
          }`}>
            {phase === "scanning" ? (
              <svg
                className="size-10 text-blue-600 motion-safe:animate-pulse dark:text-blue-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            ) : (
              <svg
                className="size-10 text-green-600 dark:text-green-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            )}
          </div>

          {/* Device info */}
          <div className="flex flex-col items-center gap-1 text-center">
            <span className={`text-sm font-semibold leading-none ${
              phase === "found"
                ? "text-green-800 dark:text-green-300"
                : "text-neutral-900 dark:text-neutral-100"
            }`}>
              {phase === "scanning" ? "Scanning\u2026" : "Miles A3X9K2"}
            </span>
            <span className={`text-xs font-normal leading-normal ${
              phase === "found"
                ? "text-green-700 dark:text-green-400"
                : "text-neutral-500 dark:text-neutral-500"
            }`}>
              {phase === "scanning"
                ? "Searching for nearby Bluetooth devices"
                : "Ready to pair via Bluetooth"}
            </span>
            {phase === "found" && (
              <span className="mt-1 text-xs font-normal leading-normal text-green-600 dark:text-green-500">
                Detected plugged into 2019 Honda Civic Sport
              </span>
            )}
          </div>

          {/* Scanning indicator */}
          {phase === "scanning" && (
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-blue-500 motion-safe:animate-pulse dark:bg-blue-400" />
              <div className="size-2 rounded-full bg-blue-500 motion-safe:animate-pulse dark:bg-blue-400" style={{ animationDelay: "300ms" }} />
              <div className="size-2 rounded-full bg-blue-500 motion-safe:animate-pulse dark:bg-blue-400" style={{ animationDelay: "600ms" }} />
            </div>
          )}
        </div>

        {/* Bluetooth tip */}
        {phase === "scanning" && (
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
              Make sure you&rsquo;re near your car and Bluetooth is turned on in your phone settings.
            </span>
          </div>
        )}


      </div>
    </main>

    <StickyFooter>
      {phase === "found" ? (
        <Link
          href="/getting-online"
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          Pair
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-blue-300 px-6 text-base font-medium leading-none text-white dark:bg-blue-800 dark:text-blue-400"
        >
          Pair
        </button>
      )}
    </StickyFooter>
    </>
  );
}
