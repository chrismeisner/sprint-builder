"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { MapView } from "@/app/sandboxes/miles-proto-1/_components/map-view";
import { useEffect, useState } from "react";

const DEMO_ROUTE: [number, number][] = [
  [33.0152, -96.7108], [33.0168, -96.7088], [33.0183, -96.7065],
  [33.0185, -96.7038], [33.0185, -96.7010], [33.0185, -96.6982],
  [33.0198, -96.6960], [33.0218, -96.6945], [33.0240, -96.6932],
];

export default function LiveTripPage() {
  const [speed, setSpeed] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(25, Math.min(55, prev + delta));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Back + recording badge */}
        <div className="flex items-center justify-between">
          <Link
            href="/trip-indicator"
            className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <svg
              className="size-4"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 dark:bg-green-950">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-green-500 opacity-75 motion-safe:animate-ping dark:bg-green-400" />
              <span className="relative inline-flex size-2 rounded-full bg-green-600 dark:bg-green-400" />
            </span>
            <span className="text-xs font-medium leading-none text-green-700 dark:text-green-400">
              Recording
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Live trip
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Verify Miles is tracking. No need to watch&nbsp;&mdash; this is just for peace of mind.
          </p>
        </div>

        {/* Map with route */}
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

        {/* Speed display */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-5xl font-bold leading-tight tabular-nums text-neutral-900 dark:text-neutral-100">
              {speed}
            </span>
            <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              mph
            </span>
          </div>
        </div>

        {/* Trip stats row */}
        <div className="grid grid-cols-3 gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Distance
            </span>
            <span className="text-base font-medium leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
              4.2 mi
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-neutral-200 dark:border-neutral-700">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Duration
            </span>
            <span className="text-base font-medium leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
              12 min
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Started
            </span>
            <span className="text-base font-medium leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
              3:42 PM
            </span>
          </div>
        </div>

        {/* Device status */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3 dark:bg-neutral-800">
            <div className="flex items-center gap-3">
              <svg
                className="size-4 text-green-600 dark:text-green-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                GPS signal
              </span>
            </div>
            <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
              Strong
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3 dark:bg-neutral-800">
            <div className="flex items-center gap-3">
              <svg
                className="size-4 text-green-600 dark:text-green-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Cellular
              </span>
            </div>
            <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
              Connected
            </span>
          </div>
        </div>

        {/* Reassurance */}
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
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              Hands-free &mdash; no action needed
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              Miles records everything in the background. Only check this while
              parked.
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
