"use client";

import { useState } from "react";
import Link from "@/app/sandboxes/miles-proto-3/_components/link";
import { AskMilesBadge } from "@/app/sandboxes/miles-proto-3/_components/ask-miles-badge";
import { MapView } from "@/app/sandboxes/miles-proto-3/_components/map-view";
import { TripListItem } from "@/app/sandboxes/miles-proto-3/_components/trip-list-item";
import { DEMO_TRIPS, LIVE_TRIP_CAR, LIVE_TRIP_ROUTE, TRIP_DRIVERS } from "@/app/sandboxes/miles-proto-3/_lib/demo-trips";
import type { DemoTrip } from "@/app/sandboxes/miles-proto-3/_lib/demo-trips";

export default function TripsPage() {
  const [contentView, setContentView] = useState<"trips" | "locations">("trips");
  const [driverFilter, setDriverFilter] = useState("All");

  const filtered =
    driverFilter === "All"
      ? DEMO_TRIPS
      : DEMO_TRIPS.filter((t) => t.driver === driverFilter);

  const grouped = filtered.reduce<Record<string, DemoTrip[]>>((acc, trip) => {
    if (!acc[trip.date]) acc[trip.date] = [];
    acc[trip.date].push(trip);
    return acc;
  }, {});

  const dateOrder = Array.from(new Set(DEMO_TRIPS.map((t) => t.date)));
  const locations = Object.values(
    filtered.reduce<
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
      {/* Header — page-level AskMilesBadge sits to the right of the title.
          Same pattern as /personal-information: badge inline with the page
          title implies the chat is scoped to everything on this page. */}
      <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Trips</h1>
        <AskMilesBadge
          context="trips"
          ariaLabel="Ask Miles about your trips"
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
              {view === "trips" ? "Trips" : "Locations"}
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
          {/* Trip list grouped by date */}
          <div className="flex flex-col gap-5 px-5">
            {/* Live trip — always first */}
            <Link
              href="/dashboard?mode=trip&driver=Jack&vehicleLabel=Toyota+RAV4"
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
                    <span className="text-sm font-medium leading-none text-green-900">Preston Rd → ...</span>
                    <span className="text-xs font-medium leading-none text-green-700">In progress</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-green-700">
                    <span>4.2 mi</span>
                    <span className="text-green-400">&middot;</span>
                    <span>Jack</span>
                    <span className="text-green-400">&middot;</span>
                    <span>RAV4</span>
                  </div>
                </div>
                <svg className="size-4 shrink-0 text-green-500 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>

            {dateOrder.map((date) => {
              const trips = grouped[date];
              if (!trips || trips.length === 0) return null;
              return (
                <div key={date} className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                    {date}
                  </span>
                  <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
                    {trips.map((trip) => (
                      <TripListItem
                        key={trip.id}
                        trip={trip}
                        href="/trip-detail"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
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
                Loading past trips
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
