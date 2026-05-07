"use client";

import { useState, type ReactNode } from "react";
import Link from "@/app/sandboxes/miles-proto-5/_components/link";
import { AskMilesBadge } from "@/app/sandboxes/miles-proto-5/_components/ask-miles-badge";
import { BottomSheet } from "@/app/sandboxes/miles-proto-5/_components/bottom-sheet";
import { MapView } from "@/app/sandboxes/miles-proto-5/_components/map-view";
import { TripListItem } from "@/app/sandboxes/miles-proto-5/_components/trip-list-item";
import {
  LIVE_TRIP_CAR,
  LIVE_TRIP_ROUTE,
  TRIP_DRIVERS,
  TRIP_VEHICLES,
  TRIP_TYPES,
  TRIP_DATE_RANGES,
} from "@/app/sandboxes/miles-proto-5/_lib/demo-trips";
import {
  ACTIVITY_ITEMS,
  LIVE_ACTIVITY,
  groupActivityByDate,
  getEntryTime,
  getEntryDate,
  getEntryDriver,
  getEntryVehicle,
  type ActivityEntry,
  type EventItem,
} from "@/app/sandboxes/miles-proto-5/_lib/demo-activity";
import { vehicleAccentByName } from "@/app/sandboxes/miles-proto-5/_lib/vehicle-tokens";

/**
 * Returns true when the entry's date label falls inside the selected
 * preset range. Demo data only spans "Today" / "Yesterday", so the
 * `This week` preset matches both — the iOS port should swap this out
 * for real `Date`-aware logic against `Calendar.current`. `Custom`
 * is a demo stub: the picker UI is wired up but filtering is no-op.
 */
function matchesDateRange(dateLabel: string, range: string): boolean {
  if (range === "All") return true;
  if (range === "Today") return dateLabel === "Today";
  if (range === "Yesterday") return dateLabel === "Yesterday";
  if (range === "This week") return dateLabel === "Today" || dateLabel === "Yesterday";
  if (range === "Custom") return true;
  return true;
}

export default function TripsPage() {
  const [driverFilter, setDriverFilter] = useState("All");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Custom range — demo stub: the picker UI is wired up, but filtering is
  // no-op since the demo data uses string labels rather than real Dates.
  // Stored as `datetime-local` strings ("YYYY-MM-DDTHH:MM").
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  /** Inline When row tap — selecting Custom also opens the sheet so the
   * range picker is reachable. Other presets just set the filter. */
  function handleInlineDateChange(value: string) {
    setDateFilter(value);
    if (value === "Custom") setFiltersOpen(true);
  }

  const hasActiveFilters =
    driverFilter !== "All" || vehicleFilter !== "All" || typeFilter !== "All";

  function clearSheetFilters() {
    setDriverFilter("All");
    setVehicleFilter("All");
    setTypeFilter("All");
  }

  // Activity feed — all entry kinds except the live trip (rendered separately on top).
  const feedEntries = ACTIVITY_ITEMS.filter((e) => e.kind !== "live");
  const filteredFeed = feedEntries.filter((entry) => {
    if (typeFilter === "Trips"  && entry.kind !== "trip")  return false;
    if (typeFilter === "Events" && entry.kind !== "event") return false;

    if (!matchesDateRange(getEntryDate(entry), dateFilter)) return false;

    if (driverFilter !== "All") {
      const driver = getEntryDriver(entry);
      if (!driver || driver !== driverFilter) return false;
    }

    if (vehicleFilter !== "All") {
      const vehicle = getEntryVehicle(entry);
      if (!vehicle || vehicle !== vehicleFilter) return false;
    }

    return true;
  });
  const feedGroups = groupActivityByDate(filteredFeed);

  const showLiveCard =
    (driverFilter === "All" || LIVE_ACTIVITY.driver === driverFilter) &&
    (vehicleFilter === "All" || LIVE_ACTIVITY.vehicleLabel === vehicleFilter) &&
    matchesDateRange(LIVE_ACTIVITY.date, dateFilter);

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

      {/* When — segmented date scope (left) + More filters button (right).
          Pills always stay on one line: overflow → horizontal scroll, never wrap.
          Maps to SwiftUI Picker(.segmented) + a toolbar filter button on iOS. */}
      <div className="flex items-center gap-3 px-5 pb-3">
        <div className="flex min-w-0 flex-1 flex-nowrap gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TRIP_DATE_RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleInlineDateChange(d)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium leading-none transition-colors ${
                dateFilter === d
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-label="More filters"
          className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-medium leading-none text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6 12h12M10 19.5h4" />
          </svg>
          Filters
        </button>
      </div>

      {/* Active-filters summary — visible only when a sheet filter is set.
          Mirrors Mail's "Filtered by:" status row. */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-5 pb-3 text-[11px] text-neutral-500">
          <span className="shrink-0">Filtered by</span>
          <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {driverFilter !== "All" && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                {driverFilter}
              </span>
            )}
            {vehicleFilter !== "All" && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                {vehicleFilter}
              </span>
            )}
            {typeFilter !== "All" && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                {typeFilter}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={clearSheetFilters}
            className="shrink-0 font-medium text-semantic-info active:opacity-60"
          >
            Clear
          </button>
        </div>
      )}

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
              <div className="absolute left-3 top-3">
                <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-green-900 shadow-sm ring-1 ring-green-200">
                  <span className="relative flex size-1.5" aria-label="Live">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-green-600" />
                  </span>
                  <span className="tabular-nums">{LIVE_ACTIVITY.mph}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-green-700">mph</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="relative shrink-0">
                <div
                  className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-green-600 text-xs font-semibold text-white shadow-sm"
                  aria-hidden="true"
                >
                  {LIVE_ACTIVITY.driver[0]}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold leading-none text-white shadow-sm"
                  style={{ backgroundColor: vehicleAccentByName(LIVE_ACTIVITY.vehicleLabel) }}
                  title={LIVE_ACTIVITY.vehicleLabel}
                >
                  {LIVE_ACTIVITY.vehicleLabel[0]}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium leading-none text-green-900">
                    {LIVE_ACTIVITY.driver} is driving
                  </span>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-800 ring-1 ring-green-200">
                    In progress
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-green-700">
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

      <BottomSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        confirmLabel="Done"
        onConfirm={() => setFiltersOpen(false)}
      >
        <div className="flex flex-col gap-6 pt-2">
          <div className="flex flex-col gap-2">
            <FilterSection
              label="When"
              options={TRIP_DATE_RANGES}
              value={dateFilter}
              onChange={setDateFilter}
            />
            {dateFilter === "Custom" && (
              <CustomDateRange
                start={customStart}
                end={customEnd}
                onStartChange={setCustomStart}
                onEndChange={setCustomEnd}
              />
            )}
          </div>
          <FilterSection
            label="Driver"
            options={TRIP_DRIVERS}
            value={driverFilter}
            onChange={setDriverFilter}
            renderLeading={renderDriverAvatar}
          />
          <FilterSection
            label="Vehicle"
            options={TRIP_VEHICLES}
            value={vehicleFilter}
            onChange={setVehicleFilter}
            renderLeading={renderVehicleBadge}
          />
          <FilterSection
            label="Type"
            options={TRIP_TYPES}
            value={typeFilter}
            onChange={setTypeFilter}
          />
          <button
            type="button"
            onClick={clearSheetFilters}
            disabled={!hasActiveFilters}
            className="self-start text-sm font-medium text-semantic-info transition-opacity active:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Reset filters
          </button>
        </div>
      </BottomSheet>
    </main>
  );
}

function FilterSection({
  label,
  options,
  value,
  onChange,
  renderLeading,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  renderLeading?: (option: string) => ReactNode | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </span>
      <div className="flex flex-nowrap gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {options.map((o) => {
          const leading = renderLeading?.(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full text-[13px] font-medium leading-none transition-colors ${
                leading ? "py-1 pl-1 pr-3" : "px-3 py-1.5"
              } ${
                value === o
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {leading}
              <span>{o}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const DRIVER_AVATARS: Record<string, string> = {
  Christina: "/miles-proto-5/images/mom.jpg",
  Emma: "/miles-proto-5/images/teen.jpg",
};

function renderDriverAvatar(driver: string): ReactNode | null {
  const src = DRIVER_AVATARS[driver];
  if (!src) return null;
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt=""
      aria-hidden
      className="size-6 rounded-full object-cover ring-1 ring-white/40"
    />
  );
}

function CustomDateRange({
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}) {
  /* Single `datetime-local` input per side — combines date + time into one
     control, so the row never has to host two side-by-side native pickers
     (which would force wrapping at narrow widths).
     iOS mapping: `DatePicker(selection:, displayedComponents: [.date, .hourAndMinute])`
     with `.compact` style. */
  const inputCls =
    "w-full min-w-0 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-[13px] tabular-nums text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="mt-1 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">
          Start
        </span>
        <input
          type="datetime-local"
          aria-label="Start date and time"
          value={start}
          max={end || undefined}
          onChange={(e) => onStartChange(e.target.value)}
          className={inputCls}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">
          End
        </span>
        <input
          type="datetime-local"
          aria-label="End date and time"
          value={end}
          min={start || undefined}
          onChange={(e) => onEndChange(e.target.value)}
          className={inputCls}
        />
      </div>
    </div>
  );
}

function renderVehicleBadge(vehicle: string): ReactNode | null {
  if (vehicle === "All") return null;
  return (
    <span
      style={{ backgroundColor: vehicleAccentByName(vehicle) }}
      aria-hidden
      className="flex size-6 items-center justify-center rounded-full text-[10px] font-bold leading-none text-white ring-1 ring-white/40"
    >
      {vehicle[0]}
    </span>
  );
}

function entryKey(entry: ActivityEntry): string {
  if (entry.kind === "trip")  return entry.trip.id;
  if (entry.kind === "event") return entry.event.id;
  return entry.live.id;
}

function FeedRow({ entry }: { entry: ActivityEntry }) {
  if (entry.kind === "trip") {
    return <TripListItem trip={entry.trip} href="/trip-detail" />;
  }
  if (entry.kind === "event") {
    return <EventRow event={entry.event} time={getEntryTime(entry)} />;
  }
  // "live" never lands in the grouped feed — rendered separately on top.
  return null;
}

function EventRow({ event, time }: { event: EventItem; time: string }) {
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
          <span className="shrink-0 text-xs text-neutral-400 tabular-nums">{time}</span>
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
