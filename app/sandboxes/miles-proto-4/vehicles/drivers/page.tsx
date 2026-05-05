"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";
import { getVehicleData } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-body";
import { useLocalStorageState } from "@/app/sandboxes/miles-proto-4/_lib/use-local-storage-state";

function VehicleDriversContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "civic";
  const vehicle = getVehicleData(vehicleId);
  const inferredName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  /* Per-vehicle primary driver + removed-driver ids, persisted via
     localStorage so the detail screen and the list stay in sync. */
  const [primaryId] = useLocalStorageState<string>(
    `miles-proto-4-vehicle-primary-driver-${vehicleId}`,
    vehicle.drivers[0]?.id ?? ""
  );
  const [removedIds] = useLocalStorageState<string[]>(
    `miles-proto-4-vehicle-removed-drivers-${vehicleId}`,
    []
  );
  const drivers = vehicle.drivers.filter((d) => !removedIds.includes(d.id));

  return (
    <VehicleDetailShell
      eyebrow={inferredName}
      title="Drivers"
      trailing={
        <button
          type="button"
          aria-label="Add driver"
          className="-mr-1 flex size-11 items-center justify-center rounded-lg text-semantic-info active:opacity-60"
        >
          <svg
            className="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="divide-y divide-neutral-100">
            {drivers.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-neutral-500">
                No drivers assigned to this vehicle yet.
              </div>
            ) : (
              drivers.map((driver) => {
                const isPrimary = driver.id === primaryId;
                return (
                  <Link
                    key={driver.id}
                    href={`/vehicles/drivers/${driver.id}?vehicle=${vehicleId}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-neutral-100"
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${driver.color}`}
                    >
                      {driver.initials}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-sm font-medium text-neutral-900">
                        {driver.name}
                      </span>
                      <span className="truncate text-xs text-neutral-500">
                        {isPrimary
                          ? "Primary driver"
                          : driver.lastTrip
                            ? `Last trip · ${driver.lastTrip}`
                            : "Driver"}
                      </span>
                    </div>
                    {isPrimary && (
                      <svg
                        className="size-5 shrink-0 text-semantic-info"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-label="Primary"
                      >
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <svg
                      className="size-3.5 shrink-0 text-neutral-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      aria-hidden
                    >
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <p className="px-4 text-[11px] leading-relaxed text-neutral-500">
          Tap a driver to view details, change the primary driver, or remove access.
        </p>
      </div>
    </VehicleDetailShell>
  );
}

export default function VehicleDriversPage() {
  return (
    <Suspense>
      <VehicleDriversContent />
    </Suspense>
  );
}
