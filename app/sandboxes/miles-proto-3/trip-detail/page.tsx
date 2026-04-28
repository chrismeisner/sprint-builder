"use client";

import Link from "@/app/sandboxes/miles-proto-3/_components/link";
import { MapView } from "@/app/sandboxes/miles-proto-3/_components/map-view";
import { useState } from "react";

const DEMO_ROUTE: [number, number][] = [
  [33.0152, -96.7108], [33.0168, -96.7088], [33.0183, -96.7065],
  [33.0185, -96.7038], [33.0185, -96.7010], [33.0185, -96.6982],
  [33.0198, -96.6960], [33.0218, -96.6945], [33.0240, -96.6932],
];

const timeline = [
  { time: "3:42 PM", label: "Trip started", detail: "Home", type: "start" as const },
  { time: "3:45 PM", label: "Entered Elm St", detail: "Residential zone", type: "waypoint" as const },
  { time: "3:48 PM", label: "Merged onto US-66", detail: "Highway segment", type: "waypoint" as const },
  { time: "3:51 PM", label: "Exited to Main St", detail: "Downtown Springfield", type: "waypoint" as const },
  { time: "3:54 PM", label: "Trip ended", detail: "8472 Maple Ridge Dr", type: "end" as const },
];

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function ExpandableSection({ title, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col rounded-md border border-neutral-200 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
      >
        <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
          {title}
        </span>
        <svg
          className={`size-4 text-neutral-400 motion-safe:transition-transform motion-safe:duration-200 dark:text-neutral-500 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          {children}
        </div>
      )}
    </div>
  );
}

export default function TripDetailPage() {
  const [syncState] = useState<"synced" | "partial">("synced");

  return (
    <main className="min-h-dvh bg-neutral-100 pt-4">
      <div className="relative mx-auto max-w-md">
        <div className="flex min-h-dvh w-full flex-col rounded-t-3xl bg-white px-6 pb-16 pt-6 shadow-xl">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-3xl font-semibold leading-tight text-neutral-900">
                  Trip detail
                </h1>
                <div className="flex items-center gap-2">
                  {syncState === "partial" && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium leading-none text-amber-700">
                      Syncing
                    </span>
                  )}
                  <Link
                    href="/trips"
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
                    aria-label="Close"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </Link>
                </div>
              </div>
              <p className="text-base font-normal leading-normal text-neutral-600">
                Home &rarr; 8472 Maple Ridge Dr &middot; Today, 3:42&ndash;3:54 PM
              </p>
            </div>

            {/* Full route map */}
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

            {/* Driver attribution */}
            <div className="flex items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-300">
                  C
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Chris
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Primary driver
                </span>
              </div>
              <Link
                href="/driver-reassignment"
                className="text-sm font-medium leading-none text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Change
              </Link>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Distance
                </span>
                <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
                  4.2 mi
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Duration
                </span>
                <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
                  12 min
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Avg Speed
                </span>
                <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
                  21 mph
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Max Speed
                </span>
                <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
                  48 mph
                </span>
              </div>
            </div>
        {/* Timeline */}
        <ExpandableSection title="Route timeline" defaultOpen>
          <div className="flex flex-col gap-0">
            {timeline.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`size-3 shrink-0 rounded-full ${
                      entry.type === "start"
                        ? "border-2 border-blue-500 dark:border-blue-400"
                        : entry.type === "end"
                          ? "bg-blue-600 dark:bg-blue-500"
                          : "bg-neutral-300 dark:bg-neutral-600"
                    }`}
                  />
                  {i < timeline.length - 1 && (
                    <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
                  )}
                </div>
                <div className="-mt-1 flex flex-1 flex-col gap-0.5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium tabular-nums leading-none text-neutral-500 dark:text-neutral-500">
                      {entry.time}
                    </span>
                    <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                      {entry.label}
                    </span>
                  </div>
                  <span className="pl-[3.25rem] text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                    {entry.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ExpandableSection>

        {/* Trip highlights */}
        <ExpandableSection title="Trip highlights" defaultOpen>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                <svg className="size-4 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Smooth driving
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  No hard braking or rapid acceleration detected
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                <svg className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Efficient route
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Minimal idle time during the trip
                </span>
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Device & data */}
        <ExpandableSection title="Device &amp; data quality">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">GPS signal</span>
              <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">Strong</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">Cellular</span>
              <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">Data completeness</span>
              <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">100%</span>
            </div>
          </div>
        </ExpandableSection>

          </div>
        </div>
      </div>
    </main>
  );
}
