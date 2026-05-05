"use client";

import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import type { DemoTrip } from "@/app/sandboxes/miles-proto-4/_lib/demo-trips";
import { normalizeTimeRange } from "@/app/sandboxes/miles-proto-4/_lib/format-time";

interface TripListItemProps {
  trip: DemoTrip;
  href: string;
  className?: string;
  /** Driver photo URL — shown as the main avatar circle */
  driverImageSrc?: string;
  /** Vehicle initial letter shown as the overlay badge (e.g. "R" for RAV4) */
  vehicleInitial?: string;
  /** Background color for the vehicle initial badge */
  vehicleColor?: string;
}

export function TripListItem({
  trip,
  href,
  className = "",
  driverImageSrc,
  vehicleInitial,
  vehicleColor = "#2563eb",
}: TripListItemProps) {
  const [startTime, endTime] = normalizeTimeRange(trip.timeRange);

  return (
    <Link
      href={href}
      className={`flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${className}`.trim()}
    >
      <div className="relative shrink-0">
        {driverImageSrc ? (
          /* Driver photo as main, vehicle initial as overlay badge */
          <>
            <img
              src={driverImageSrc}
              alt={trip.driver}
              className="size-9 rounded-full border-2 border-background object-cover shadow-sm"
            />
            {vehicleInitial && (
              <span
                className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-background text-[9px] font-bold leading-none text-white shadow-sm"
                style={{ backgroundColor: vehicleColor }}
                title={trip.vehicle ?? vehicleInitial}
              >
                {vehicleInitial}
              </span>
            )}
          </>
        ) : (
          /* Fallback: plain car icon circle */
          <div className="flex size-9 items-center justify-center rounded-full bg-surface-subtle">
            <svg className="size-4 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            {trip.driverInitials && (
              <span
                className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border border-background bg-stroke-strong text-[8px] font-semibold leading-none text-text-primary"
                title={trip.driverInitials}
              >
                {trip.driverInitials[0]}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 text-left text-xs leading-none tabular-nums text-text-muted">
              {startTime}
            </span>
            <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-snug text-text-primary">
              {trip.from}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 text-left text-xs leading-none tabular-nums text-text-muted">
              {endTime ?? ""}
            </span>
            <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-snug text-text-primary">
              {trip.to}
            </span>
          </div>
        </div>

      </div>

      <svg className="size-4 shrink-0 text-stroke-strong" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}
