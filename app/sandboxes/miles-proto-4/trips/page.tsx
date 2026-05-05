"use client";

import { useState } from "react";
import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import { AskMilesBadge } from "@/app/sandboxes/miles-proto-4/_components/ask-miles-badge";
import { MapView } from "@/app/sandboxes/miles-proto-4/_components/map-view";
import { TripListItem } from "@/app/sandboxes/miles-proto-4/_components/trip-list-item";
import {
  DEMO_TRIPS,
  LIVE_TRIP_CAR,
  LIVE_TRIP_ROUTE,
  TRIP_DRIVERS,
} from "@/app/sandboxes/miles-proto-4/_lib/demo-trips";
import type { DemoTrip } from "@/app/sandboxes/miles-proto-4/_lib/demo-trips";
import {
  ACTIVITY_ITEMS,
  LIVE_ACTIVITY,
  groupActivityByDate,
  getEntryTime,
  getEntryDriver,
  type ActivityEntry,
  type ScoreUpdateItem,
  type EventItem,
} from "@/app/sandboxes/miles-proto-4/_lib/demo-activity";

export default function TripsPage() {
  const [contentView, setContentView] = useState<"trips" | "locations">("trips");
  const [driverFilter, setDriverFilter] = useState("All");

  // Activity feed — all entry kinds except the live trip (rendered separately on top).
  const feedEntries = ACTIVITY_ITEMS.filter((e) => e.kind !== "live");
  const filteredFeed = feedEntries.filter((entry) => {
    if (driverFilter === "All") return true;
    const driver = getEntryDriver(entry);
    // Score updates have no driver — hide them when filtering by a specific driver
    // so the feed stays coherent ("what did Emma do today?").
    if (!driver) return false;
    return driver === driverFilter;
  });
  const feedGroups = groupActivityByDate(filteredFeed);

  const showLiveCard =
    driverFilter === "All" || LIVE_ACTIVITY.driver === driverFilter;

  // Locations view still derives only from trips.
  const tripsForLocations =
    driverFilter === "All"
      ? DEMO_TRIPS
      : DEMO_TRIPS.filter((t) => t.driver === driverFilter);
  const locations = Object.values(
    tripsForLocations.reduce<
      Record<
        string,
        {
          name: string;
          tripCount: number;
          lastTrip: DemoTrip;
          drivers: Set<string>;
          vehicles: Set<string>;
        }
      >
    >((acc, trip) => {
      for (const name of [trip.from, trip.to]) {
        if (!acc[name]) {
          acc[name] = {
            name,
            tripCount: 0,
            lastTrip: trip,
            drivers: new Set<string>(),
            vehicles: new Set<string>(),
          };
        }

        acc[name].tripCount += 1;
        acc[name].drivers.add(trip.driver);
        if (trip.vehicle) acc[name].vehicles.add(trip.vehicle);
      }

      return acc;
    }, {})
  ).sort((a, b) => b.tripCount - a.tripCount || a.name.localeCompare(b.name));

  return (
    <main className="flex min-h-dvh flex-col bg-neutral-50 pb-24">
      {/* Header — page-level AskMilesBadge sits to the right of the title. */}
      <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-6">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Activity</h1>
        <AskMilesBadge
          context="trips"
          ariaLabel="Ask Miles about your activity"
        />
      </div>

      {/* Top-level content nav */}
      <div className="px-5 pb-3">
        <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
          {(["trips", "locations"] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setContentView(view)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                contentView === view
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              {view === "trips" ? "Feed" : "Locations"}
            </button>
          ))}
        </div>
      </div>

      {/* Driver filter */}
      <div className="flex gap-2 px-5 pb-4">
        {TRIP_DRIVERS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDriverFilter(d)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium leading-none transition-colors ${
              driverFilter === d
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {contentView === "trips" ? (
        <>
          <div className="flex flex-col gap-5 px-5">
            {/* Live trip — always pinned on top when not filtered out */}
            {showLiveCard && (
              <Link
                href={`/dashboard?mode=trip&driver=${encodeURIComponent(
                  LIVE_ACTIVITY.driver
                )}&vehicleLabel=${encodeURIComponent(LIVE_ACTIVITY.vehicleLabel)}`}
                className="group overflow-hidden rounded-xl border border-green-200 bg-green-50 transition-colors hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                <div className="relative h-24 overflow-hidden border-b border-green-200 bg-white/70">
                  <MapView
                    route={LIVE_TRIP_ROUTE}
                    markers={[
                      { lat: LIVE_TRIP_CAR[0], lng: LIVE_TRIP_CAR[1], type: "vehicle" },
                    ]}
                    interactive={false}
                    routeColor="#16a34a"
                    routeWeight={4}
                  />
                  <div className="absolute right-3 top-3">
                    <span className="flex items-center gap-1 rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                      <span className="relative flex size-1.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                      </span>
                      Live
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium leading-none text-green-900">
                        {LIVE_ACTIVITY.driver} is driving
                      </span>
                      <span className="text-xs font-medium leading-none text-green-700">In progress</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-green-700">
                      <span className="tabular-nums">{LIVE_ACTIVITY.mph} mph</span>
                      <span className="text-green-400">&middot;</span>
                      <span>{LIVE_ACTIVITY.vehicleLabel}</span>
                      <span className="text-green-400">&middot;</span>
                      <span>{LIVE_ACTIVITY.startedAgo}</span>
                    </div>
                  </div>
                  <svg className="size-4 shrink-0 text-green-500 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            )}

            {feedGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-500">
                No activity for {driverFilter} yet.
              </div>
            ) : (
              feedGroups.map((group) => (
                <div key={group.date} className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    {group.label}
                  </span>
                  <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
                    {group.entries.map((entry) => (
                      <FeedRow key={entryKey(entry)} entry={entry} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Faux infinite scroll loading */}
          <div className="px-5 pt-5">
            <div className="flex items-center justify-center gap-2 py-3">
              <svg
                className="size-4 animate-spin text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M8.757 8.757 6.636 6.636m11.728 0-2.121 2.121M8.757 15.243l-2.121 2.121" />
              </svg>
              <span className="text-xs font-medium text-neutral-500">
                Loading more activity
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 px-5">
          <Link
            href="/locations"
            className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 transition-colors hover:bg-blue-100"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg className="size-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold text-blue-900">Review named locations</span>
              <span className="text-xs text-blue-700">Manage home, work, school, and frequent places</span>
            </div>
            <svg className="size-4 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          {locations.map((location) => {
            const drivers = Array.from(location.drivers);
            const vehicles = Array.from(location.vehicles);

            return (
              <div
                key={location.name}
                className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <svg className="size-4 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 13.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                  </svg>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-neutral-900">{location.name}</span>
                    <span className="text-xs font-medium tabular-nums text-neutral-400">
                      {location.tripCount} {location.tripCount === 1 ? "trip" : "trips"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                    <span>{drivers.join(", ")}</span>
                    {vehicles.length > 0 && (
                      <>
                        <span>&middot;</span>
                        <span>{vehicles.join(", ")}</span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400">
                    Last seen {location.lastTrip.date} at {location.lastTrip.timeRange}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function entryKey(entry: ActivityEntry): string {
  if (entry.kind === "trip")  return entry.trip.id;
  if (entry.kind === "score") return entry.item.id;
  if (entry.kind === "event") return entry.event.id;
  return entry.live.id;
}

function FeedRow({ entry }: { entry: ActivityEntry }) {
  if (entry.kind === "trip") {
    return <TripListItem trip={entry.trip} href="/trip-detail" />;
  }
  if (entry.kind === "score") {
    return <ScoreUpdateRow item={entry.item} time={getEntryTime(entry)} />;
  }
  if (entry.kind === "event") {
    return <EventRow event={entry.event} time={getEntryTime(entry)} />;
  }
  // "live" never lands in the grouped feed — rendered separately on top.
  return null;
}

function ScoreUpdateRow({ item, time }: { item: ScoreUpdateItem; time: string }) {
  const isUp = item.delta >= 0;
  const deltaClass = isUp ? "text-emerald-600" : "text-amber-600";
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
        <svg className="size-4 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium leading-snug text-neutral-900">
            Miles Score updated
          </span>
          <span className="shrink-0 text-xs text-neutral-400 tabular-nums">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span>{item.vehicle}</span>
          <span className="text-neutral-300">&middot;</span>
          <span className="tabular-nums text-neutral-700">{item.score}</span>
          <span className={`tabular-nums font-medium ${deltaClass}`}>
            {isUp ? "+" : ""}{item.delta}
          </span>
        </div>
      </div>
    </div>
  );
}

function EventRow({ event, time }: { event: EventItem; time: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
        <svg className="size-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium leading-snug text-neutral-900">
            {event.title}
          </span>
          <span className="shrink-0 text-xs text-neutral-400 tabular-nums">{time}</span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
          <span className="truncate">{event.detail}</span>
          <span className="text-neutral-300">&middot;</span>
          <span className="shrink-0">{event.driver}</span>
        </div>
      </div>
    </div>
  );
}
