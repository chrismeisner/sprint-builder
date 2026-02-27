"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { MapView } from "@/app/sandboxes/miles-proto-1/_components/map-view";

const DEMO_ROUTE: [number, number][] = [
  [33.0152, -96.7108], [33.0168, -96.7088], [33.0183, -96.7065],
  [33.0185, -96.7038], [33.0185, -96.7010], [33.0185, -96.6982],
  [33.0198, -96.6960], [33.0218, -96.6945], [33.0240, -96.6932],
];

export default function TripReceiptPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {/* Back */}
        <Link
          href="/trips"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Trips
        </Link>

        {/* Success header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
            <svg
              className="size-8 text-green-600 dark:text-green-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              Trip recorded
            </h1>
            <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
              Here&rsquo;s your quick summary.
            </p>
          </div>
        </div>

        {/* Route map */}
        <div className="relative aspect-video overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
          <MapView
            route={DEMO_ROUTE}
            markers={[
              { lat: DEMO_ROUTE[0][0], lng: DEMO_ROUTE[0][1], type: "start" },
              { lat: DEMO_ROUTE[DEMO_ROUTE.length - 1][0], lng: DEMO_ROUTE[DEMO_ROUTE.length - 1][1], type: "end" },
            ]}
            interactive={false}
            routeWeight={3}
          />
        </div>

        {/* Start → End */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="size-3 rounded-full border-2 border-blue-500 dark:border-blue-400" />
            <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div className="size-3 rounded-full bg-blue-600 dark:bg-blue-500" />
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Home
              </span>
              <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500">
                3:42 PM &middot; 123 Oak St, Springfield
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Downtown
              </span>
              <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500">
                3:54 PM &middot; 456 Main St, Springfield
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Distance
            </span>
            <span className="text-xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
              4.2 mi
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Duration
            </span>
            <span className="text-xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
              12 min
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Driver
            </span>
            <span className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
              Chris
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Vehicle
            </span>
            <span className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
              CR-V
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/post-drive-prompts"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            View full trip
          </Link>
          <Link
            href="/trips"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
          >
            Back to Trips
          </Link>
        </div>

      </div>
    </main>
  );
}
