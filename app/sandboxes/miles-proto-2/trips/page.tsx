"use client";

import { useState } from "react";
import Link from "@/app/sandboxes/miles-proto-2/_components/link";

interface Trip {
  id: string;
  from: string;
  to: string;
  date: string;
  timeRange: string;
  distance: string;
  duration: string;
  score: number;
  events: number;
  driver: string;
}

const TRIPS: Trip[] = [
  { id: "t1", from: "Home", to: "Target", date: "Today", timeRange: "3:42 – 3:54 PM", distance: "4.2 mi", duration: "12 min", score: 88, events: 1, driver: "Chris" },
  { id: "t2", from: "Target", to: "Home", date: "Today", timeRange: "4:30 – 4:41 PM", distance: "4.1 mi", duration: "11 min", score: 92, events: 0, driver: "Chris" },
  { id: "t3", from: "Home", to: "Work", date: "Yesterday", timeRange: "8:05 – 8:32 AM", distance: "11.3 mi", duration: "27 min", score: 79, events: 2, driver: "Emma" },
  { id: "t4", from: "Work", to: "Grocery", date: "Yesterday", timeRange: "5:45 – 6:02 PM", distance: "3.8 mi", duration: "17 min", score: 85, events: 0, driver: "Emma" },
  { id: "t5", from: "Grocery", to: "Home", date: "Yesterday", timeRange: "6:15 – 6:38 PM", distance: "8.9 mi", duration: "23 min", score: 81, events: 1, driver: "Emma" },
  { id: "t6", from: "Home", to: "School", date: "Mon, Mar 3", timeRange: "7:30 – 7:48 AM", distance: "5.6 mi", duration: "18 min", score: 90, events: 0, driver: "Chris" },
  { id: "t7", from: "School", to: "Home", date: "Mon, Mar 3", timeRange: "3:15 – 3:35 PM", distance: "5.7 mi", duration: "20 min", score: 87, events: 1, driver: "Chris" },
];

const DRIVERS = ["All", "Chris", "Emma"];

export default function TripsPage() {
  const [driverFilter, setDriverFilter] = useState("All");

  const filtered =
    driverFilter === "All"
      ? TRIPS
      : TRIPS.filter((t) => t.driver === driverFilter);

  const grouped = filtered.reduce<Record<string, Trip[]>>((acc, trip) => {
    if (!acc[trip.date]) acc[trip.date] = [];
    acc[trip.date].push(trip);
    return acc;
  }, {});

  const dateOrder = Array.from(new Set(TRIPS.map((t) => t.date)));

  return (
    <main className="flex min-h-dvh flex-col bg-neutral-50 pb-24">
      {/* Header */}
      <div className="px-5 pb-3 pt-14">
        <h1 className="text-2xl font-semibold text-neutral-900">Trips</h1>
      </div>

      {/* Driver filter */}
      <div className="flex gap-2 px-5 pb-4">
        {DRIVERS.map((d) => (
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

      {/* Trip list grouped by date */}
      <div className="flex flex-col gap-5 px-5">
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
                  <Link
                    key={trip.id}
                    href="/trip-detail"
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium leading-none text-neutral-900">
                          {trip.from} &rarr; {trip.to}
                        </span>
                        {trip.events > 0 && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                            {trip.events}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{trip.timeRange}</span>
                        <span className="text-neutral-300">&middot;</span>
                        <span className="tabular-nums">{trip.distance}</span>
                        <span className="text-neutral-300">&middot;</span>
                        <span className="tabular-nums">{trip.duration}</span>
                        <span className="text-neutral-300">&middot;</span>
                        <span>{trip.driver}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-sm font-semibold tabular-nums text-neutral-700">
                        {trip.score}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ask Miles */}
      <div className="px-5 pt-5">
        <Link
          href="/miles?context=trip-detail"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 transition-colors hover:bg-green-100"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg className="size-4.5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-green-800">Ask Miles about your trips</span>
            <span className="text-xs text-green-600">Get a summary or ask about specific events</span>
          </div>
          <svg className="size-4 shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>
    </main>
  );
}
