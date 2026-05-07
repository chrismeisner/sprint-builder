"use client";

import Link from "@/app/sandboxes/miles-proto-5/_components/link";
import { AskMilesBadge } from "@/app/sandboxes/miles-proto-5/_components/ask-miles-badge";
import { MapView } from "@/app/sandboxes/miles-proto-5/_components/map-view";
import { TripListItem } from "@/app/sandboxes/miles-proto-5/_components/trip-list-item";
import type { DemoTrip } from "@/app/sandboxes/miles-proto-5/_lib/demo-trips";
import { useState } from "react";

const DEMO_ROUTE: [number, number][] = [
  [33.0152, -96.7108], [33.0168, -96.7088], [33.0183, -96.7065],
  [33.0185, -96.7038], [33.0185, -96.7010], [33.0185, -96.6982],
  [33.0198, -96.6960], [33.0218, -96.6945], [33.0240, -96.6932],
];

const drivers = [
  { id: "christina", name: "Christina", photo: "/miles-proto-5/images/mom.jpg",  role: "Primary driver" },
  { id: "emma",      name: "Emma",      photo: "/miles-proto-5/images/teen.jpg", role: "Teen driver"    },
];

/** The driver originally assigned to this trip on load — kept as the
 *  starting baseline for `currentDriverId`. */
const INITIAL_DRIVER_ID = "christina";

interface HistoryEntry {
  id: string;
  title: string;
  actor: string;
  time: string;
}

/** Parent trip — rendered with the canonical `TripListItem` (same component
 *  used on the Activity feed, dashboard, and event-detail). */
const PARENT_TRIP: DemoTrip = {
  id: "rea-parent",
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

/** Newest-first audit log of driver assignments for this trip — used as
 *  the initial value of the `history` state. New rows are prepended on
 *  Confirm. */
const INITIAL_HISTORY: HistoryEntry[] = [
  { id: "h1", title: "Auto-assigned to Christina", actor: "Miles", time: "Today, 10:13 AM" },
];

export default function DriverReassignmentPage() {
  const [currentDriverId, setCurrentDriverId] = useState(INITIAL_DRIVER_ID);
  const [selected, setSelected] = useState(INITIAL_DRIVER_ID);
  const [showConfirm, setShowConfirm] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);
  const selectedDriver = drivers.find((d) => d.id === selected);
  const hasChange = selected !== currentDriverId;
  const confirmDisabled = !hasChange || showConfirm;

  function handleConfirm() {
    if (!selectedDriver) return;
    setHistory((h) => [
      {
        id: `h-${Date.now()}`,
        title: `Reassigned to ${selectedDriver.name}`,
        actor: "You",
        time: "Just now",
      },
      ...h,
    ]);
    setCurrentDriverId(selected);
    setShowConfirm(true);
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 pb-16 pt-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Top nav row — back chevron (left) + AskMilesBadge (right). */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/trip-detail"
            className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900"
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
          <AskMilesBadge
            context="driver-reassignment"
            ariaLabel="Ask Miles about driver reassignment"
          />
        </div>

        {/* Map — same primary visual as trip-detail / event-detail. */}
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

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Who was driving?
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Confirm or change the driver for this trip. This helps Miles track
            driving patterns per person.
          </p>
        </div>

        {/* Trip context — uses the canonical TripListItem (same row component
            used on the Activity feed, dashboard, and event-detail). */}
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <TripListItem trip={PARENT_TRIP} href="/trip-detail" />
        </div>

        {/* Driver options — single-select rows. iOS mapping: Form { Picker } with
            `.pickerStyle(.inline)`, or a List of Buttons with a trailing checkmark. */}
        <div
          role="radiogroup"
          aria-label="Driver"
          className="flex flex-col divide-y divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200 bg-white"
        >
          {drivers.map((driver) => {
            const isSelected = selected === driver.id;
            return (
              <button
                key={driver.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setSelected(driver.id);
                  setShowConfirm(false);
                }}
                className={`flex items-center gap-4 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSelected ? "bg-blue-50/60" : "hover:bg-neutral-50"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={driver.photo}
                  alt=""
                  aria-hidden
                  className="size-10 shrink-0 rounded-full object-cover"
                />
                <div className="flex flex-1 flex-col gap-0.5">
                  <span
                    className={`text-sm font-medium leading-none ${
                      isSelected ? "text-blue-700" : "text-neutral-900"
                    }`}
                  >
                    {driver.name}
                  </span>
                  <span
                    className={`text-xs font-normal leading-normal ${
                      isSelected ? "text-blue-600" : "text-neutral-500"
                    }`}
                  >
                    {driver.role}
                  </span>
                </div>
                {isSelected && (
                  <svg
                    className="ml-auto size-5 text-blue-600"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* CTA — single button. After a successful confirm, the new row in
            the Reassignment history communicates the change and the button
            stays disabled until the user picks a different driver again. */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirmDisabled}
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:hover:bg-neutral-200"
        >
          Confirm driver
        </button>

        {/* Reassignment history — read-only audit log for this trip. */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Reassignment history
          </span>
          <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {history.map((entry) => (
              <div key={entry.id} className="flex min-w-0 items-center gap-3 px-4 py-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <svg
                    className="size-4 text-neutral-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-medium leading-snug text-neutral-900">
                    {entry.title}
                  </span>
                  <div className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
                    <span className="shrink-0">by {entry.actor}</span>
                    <span className="text-neutral-300">&middot;</span>
                    <span className="truncate tabular-nums">{entry.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
