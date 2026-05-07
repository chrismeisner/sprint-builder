"use client";

import Link from "@/app/sandboxes/miles-proto-5/_components/link";
import { AskMilesBadge } from "@/app/sandboxes/miles-proto-5/_components/ask-miles-badge";
import { MapView } from "@/app/sandboxes/miles-proto-5/_components/map-view";
import { useState } from "react";

const DEMO_ROUTE: [number, number][] = [
  [33.0152, -96.7108], [33.0168, -96.7088], [33.0183, -96.7065],
  [33.0185, -96.7038], [33.0185, -96.7010], [33.0185, -96.6982],
  [33.0198, -96.6960], [33.0218, -96.6945], [33.0240, -96.6932],
];

const route = {
  start: { label: "New Hope, PA",     time: "9:58 AM"  },
  end:   { label: "Lambertville, NJ", time: "10:13 AM" },
};

/** Trip-scoped events. Same shape as `_lib/demo-activity.ts` `EventItem`,
 *  pared down to the fields the row renders. Mirrors the trips-page pattern. */
interface TripEvent {
  id: string;
  title: string;
  detail: string;
  time: string;
  driver?: string;
}

const tripEvents: TripEvent[] = [
  {
    id: "ev-phone",
    title: "Phone use detected",
    detail: "Notification at 45 km/h on River Rd, Lambertville, NJ",
    time: "10:04 AM",
    driver: "Christina",
  },
  {
    id: "ev-brake",
    title: "Hard braking",
    detail: "Approaching Bridge St, Lambertville, NJ",
    time: "10:09 AM",
    driver: "Christina",
  },
];

/** Mirrors `EventRow` in trips/page.tsx (amber warning circle + title/time
 *  + detail/driver, with disclosure chevron). Kept local so each surface can
 *  tune the row layout. */
function TripEventRow({ event }: { event: TripEvent }) {
  return (
    <Link
      href="/event-detail"
      className="group flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
        <svg
          className="size-4 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium leading-snug text-neutral-900">
            {event.title}
          </span>
          <span className="shrink-0 text-xs text-neutral-400 tabular-nums">{event.time}</span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
          <span className="truncate">{event.detail}</span>
          {event.driver && (
            <>
              <span className="text-neutral-300">&middot;</span>
              <span className="shrink-0">{event.driver}</span>
            </>
          )}
        </div>
      </div>
      <svg className="size-4 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

function StatTile({
  metricId,
  label,
  value,
  leading,
  variant = "value",
}: {
  metricId: string;
  label: string;
  value: string;
  leading?: React.ReactNode;
  /** "value" — measurements like Distance, Avg, Max.
   *  "counter" — driving-event counts (subtle amber tint, icon-in-chip). */
  variant?: "value" | "counter";
}) {
  const isCounter = variant === "counter";
  const isZero = isCounter && value === "0";

  return (
    <Link
      href={`/trip-detail/metrics/${metricId}`}
      className={`flex min-w-0 flex-col gap-1 rounded-xl border p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isCounter
          ? "border-amber-100 bg-amber-50/40 hover:bg-amber-50"
          : "border-neutral-200 bg-white hover:bg-neutral-50"
      }`}
    >
      <span
        className={`truncate text-[11px] font-medium leading-none ${
          isCounter ? "text-amber-700/80" : "text-neutral-500"
        }`}
      >
        {label}
      </span>
      <span
        className={`flex items-center gap-1.5 text-lg font-semibold leading-snug tabular-nums ${
          isCounter && !isZero ? "text-amber-700" : "text-neutral-900"
        }`}
      >
        {isCounter && leading ? (
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-100 [&_svg]:size-3 [&_svg]:text-amber-700"
            aria-hidden="true"
          >
            {leading}
          </span>
        ) : (
          leading
        )}
        <span className="truncate">{value}</span>
      </span>
    </Link>
  );
}

export default function TripDetailPage() {
  const [syncState] = useState<"synced" | "partial">("synced");

  return (
    <main className="flex min-h-dvh flex-col px-6 pb-16 pt-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        {/* Top nav row — back chevron (left) + AskMilesBadge (right). */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/trips"
            className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900"
          >
            <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Trips
          </Link>
          <div className="flex items-center gap-2">
            {syncState === "partial" && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium leading-none text-amber-700">
                Syncing
              </span>
            )}
            <AskMilesBadge
              context="trip-detail"
              ariaLabel="Ask Miles about this trip"
            />
          </div>
        </div>

        {/* Map — primary visual, sits directly under the nav row. */}
        <div className="relative aspect-video overflow-hidden rounded-xl border border-neutral-200">
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

        {/* Header — title + subtitle below the map. */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold leading-tight text-neutral-900">
            Wednesday, May 6, 2026
          </h1>
          <p className="text-base font-normal leading-normal text-neutral-600">
            9:58 AM &ndash; 10:13 AM &middot; 2015 RAM 2500
          </p>
        </div>

        {/* Driver attribution */}
        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-medium leading-none text-blue-700">
              C
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium leading-none text-neutral-900">
              Christina
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

        {/* Stat bento — 3-col tile grid. Each tile pushes to a metric detail
            screen at /trip-detail/metrics/[metric] (mirrors the vehicle
            metric-detail pattern). */}
        <div className="grid grid-cols-3 gap-2">
          <StatTile metricId="distance" label="Distance" value="11.0 km" />
          <StatTile metricId="duration" label="Duration" value="13 min" />
          <StatTile metricId="cost"     label="Cost"     value="—" />

          <StatTile metricId="avg"  label="Avg"  value="60 km/h" />
          <StatTile metricId="max"  label="Max"  value="104 km/h" />
          <StatTile metricId="idle" label="Idle" value="1 min" />

          <StatTile
            metricId="hard-brakes"
            label="Hard brakes"
            value="0"
            variant="counter"
            leading={
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12m0 0V8.25M18 18H7.75" />
              </svg>
            }
          />
          <StatTile
            metricId="rapid-accel"
            label="Rapid accel"
            value="0"
            variant="counter"
            leading={
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6m0 0H8.25M18 6v9.75" />
              </svg>
            }
          />
          <StatTile
            metricId="excess-speed"
            label="Excess speed"
            value="0"
            variant="counter"
            leading={
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3.75 2.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          />
        </div>

        {/* Route — start → end pattern borrowed from trip-receipt. */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Route
          </span>
          <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="size-3 rounded-full border-2 border-blue-500" />
              <div className="h-8 w-px bg-neutral-200" />
              <div className="size-3 rounded-full bg-blue-600" />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-neutral-900">
                  {route.start.label}
                </span>
                <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500">
                  {route.start.time}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-neutral-900">
                  {route.end.label}
                </span>
                <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500">
                  {route.end.time}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Events — same row pattern as the trips activity feed. */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Events
          </span>
          {tripEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500">
              No events on this trip
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
              {tripEvents.map((e) => (
                <TripEventRow key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
