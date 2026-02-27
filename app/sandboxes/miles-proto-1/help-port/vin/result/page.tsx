"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useSearchParams } from "next/navigation";
import { assetPath } from "@/app/sandboxes/miles-proto-1/_lib/asset-path";
import { Suspense } from "react";

function VinResult() {
  const params = useSearchParams();
  const vin = params.get("vin") ?? "";

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/help-port/vin"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Vehicle identified
          </h1>
        </div>

        {/* Identified vehicle card */}
        <div className="flex flex-col gap-4 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-center gap-3">
            <svg
              className="size-6 shrink-0 text-green-600 dark:text-green-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
              VIN {vin}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-lg font-medium leading-snug text-green-700 dark:text-green-400">
              2022 Honda CR-V
            </span>
            <p className="text-base font-normal leading-normal text-pretty text-green-700 dark:text-green-400">
              The OBD-II port is located under the dashboard on the
              driver&rsquo;s side, just above the knee area. Look below the
              steering column.
            </p>
          </div>
        </div>

        {/* Reference image */}
        <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
          <img
            src={assetPath("/images/journey-first-trip-1a.jpg")}
            alt="OBD-II port location reference for 2022 Honda CR-V"
            className="w-full"
          />
        </div>

        {/* CTA */}
        <Link
          href="/find-port"
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          Got it &mdash; back to install
        </Link>

        {/* That's not my vehicle */}
        <Link
          href="/help-port/vin"
          className="flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          That&rsquo;s not my vehicle
        </Link>

        {/* Still stuck */}
        <div className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-3">
            <svg
              className="size-6 shrink-0 text-neutral-500 dark:text-neutral-500"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
            </svg>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Still stuck?
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Our support team can walk you through it.
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium leading-none text-neutral-900 motion-safe:transition-colors motion-safe:duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              Chat
            </button>
            <button
              type="button"
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium leading-none text-neutral-900 motion-safe:transition-colors motion-safe:duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              Email
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VinResultPage() {
  return (
    <Suspense>
      <VinResult />
    </Suspense>
  );
}
