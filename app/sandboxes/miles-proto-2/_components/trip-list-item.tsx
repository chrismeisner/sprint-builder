"use client";

import Link from "@/app/sandboxes/miles-proto-2/_components/link";
import type { DemoTrip } from "@/app/sandboxes/miles-proto-2/_lib/demo-trips";

interface TripListItemProps {
  trip: DemoTrip;
  href: string;
  showVehicle?: boolean;
  className?: string;
}

function normalizeTimeRange(timeRange: string): [string, string] {
  const [rawStart = "", rawEnd = ""] = timeRange.split(/\s+[–-]\s+/);
  const startMatch = rawStart.match(/\b(am|pm)\b/i);
  const endMatch = rawEnd.match(/\b(am|pm)\b/i);
  const meridiem = (endMatch?.[1] ?? startMatch?.[1] ?? "").toUpperCase();

  const normalize = (value: string) => value.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase()).trim();

  const start = startMatch ? normalize(rawStart) : meridiem ? `${rawStart} ${meridiem}` : rawStart;
  const end = endMatch ? normalize(rawEnd) : meridiem ? `${rawEnd} ${meridiem}` : rawEnd;

  return [start.trim(), end.trim()];
}

export function TripListItem({
  trip,
  href,
  showVehicle = false,
  className = "",
}: TripListItemProps) {
  const [startTime, endTime] = normalizeTimeRange(trip.timeRange);

  return (
    <Link
      href={href}
      className={`flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`.trim()}
    >
      <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold leading-none text-neutral-700">
        {trip.driverInitials}
        {showVehicle && trip.vehicle && (
          <span
            className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border border-white bg-neutral-900 text-[9px] leading-none text-white"
            aria-hidden="true"
            title={trip.vehicle}
          >
            <svg className="size-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 16.5h9m-11.21-1.35.73-2.9a2.25 2.25 0 0 1 2.18-1.7h7.6a2.25 2.25 0 0 1 2.18 1.7l.73 2.9M6 16.5v.75a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75v-.75m7.5 0v.75a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75v-.75M7.5 16.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
            </svg>
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-16 shrink-0 text-right text-xs leading-none tabular-nums text-neutral-400">
              {startTime}
            </span>
            <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-snug text-neutral-900">
              {trip.from}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-16 shrink-0 text-right text-xs leading-none tabular-nums text-neutral-400">
              {endTime ?? ""}
            </span>
            <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-snug text-neutral-900">
              {trip.to}
            </span>
          </div>
        </div>

      </div>

      <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}
