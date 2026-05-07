"use client";

import Link from "@/app/sandboxes/miles-proto-5/_components/link";
import { AskMilesBadge } from "@/app/sandboxes/miles-proto-5/_components/ask-miles-badge";
import { MapView } from "@/app/sandboxes/miles-proto-5/_components/map-view";
import { TripListItem } from "@/app/sandboxes/miles-proto-5/_components/trip-list-item";
import type { DemoTrip } from "@/app/sandboxes/miles-proto-5/_lib/demo-trips";

const EVENT_LOCATION: [number, number] = [33.0218, -96.6945];

const stats = [
  { label: "Speed before", value: "65 km/h" },
  { label: "Speed after",  value: "12 km/h" },
  { label: "Deceleration", value: "0.42 g" },
  { label: "Duration",     value: "1.8 s" },
  { label: "Distance",     value: "6 m" },
  { label: "Severity",     value: "Moderate" },
];

/** Parent trip — rendered with the canonical `TripListItem` (same component
 *  used on the Activity feed and dashboard). */
const PARENT_TRIP: DemoTrip = {
  id: "evt-parent",
  from: "New Hope, PA",
  to: "Lambertville, NJ",
  date: "Today",
  timeRange: "9:58 AM – 10:13 AM",
  distance: "11.0 km",
  duration: "13 min",
  score: 0,
  events: 2,
  driver: "Christina",
  driverInitials: "C",
  vehicle: "Kit's RAM",
};

export default function EventDetailPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 pb-16 pt-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        {/* Top nav row — back chevron (left) + AskMilesBadge (right). */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/trip-detail"
            className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900"
          >
            <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </Link>
          <AskMilesBadge
            context="event-detail"
            ariaLabel="Ask Miles about this event"
          />
        </div>

        {/* Map — event marker at the precise location. */}
        <div className="relative aspect-video overflow-hidden rounded-xl border border-neutral-200">
          <MapView
            markers={[
              { lat: EVENT_LOCATION[0], lng: EVENT_LOCATION[1], type: "event" },
            ]}
            interactive={false}
          />
        </div>

        {/* Header — event title + time/context. */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold leading-tight text-neutral-900">
            Hard braking
          </h1>
          <p className="text-base font-normal leading-normal text-neutral-600">
            10:09 AM &middot; Bridge St, Lambertville, NJ
          </p>
        </div>

        {/* Driver attribution — same pattern as trip-detail. */}
        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-medium leading-none text-blue-700">
              C
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium leading-none text-neutral-900">
              Chris
            </span>
            <span className="text-xs font-normal leading-normal text-neutral-500">
              Primary driver
            </span>
          </div>
          <Link
            href="/driver-reassignment"
            className="text-sm font-medium leading-none text-blue-600 hover:text-blue-700"
          >
            Change
          </Link>
        </div>

        {/* Stat bento — same 3-col tile grid as trip-detail. */}
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex min-w-0 flex-col gap-1 rounded-xl border border-neutral-200 bg-white p-3"
            >
              <span className="truncate text-[11px] font-medium leading-none text-neutral-500">
                {s.label}
              </span>
              <span className="truncate text-lg font-semibold leading-snug tabular-nums text-neutral-900">
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Parent trip — uses the canonical TripListItem from the Activity feed. */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            From this trip
          </span>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <TripListItem trip={PARENT_TRIP} href="/trip-detail" />
          </div>
        </div>
      </div>
    </main>
  );
}
