"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";
import { getVehicleData } from "@/app/sandboxes/miles-proto-4/_lib/vehicle-data";
import { useLocalStorageState } from "@/app/sandboxes/miles-proto-4/_lib/use-local-storage-state";

function DriverDetailContent() {
  const params = useParams<{ id: string }>();
  const driverId = params?.id ?? "";
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "civic";
  const vehicle = getVehicleData(vehicleId);
  const inferredName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const router = useRouter();

  const [primaryId, setPrimaryId] = useLocalStorageState<string>(
    `miles-proto-4-vehicle-primary-driver-${vehicleId}`,
    vehicle.drivers[0]?.id ?? ""
  );
  const [removedIds, setRemovedIds] = useLocalStorageState<string[]>(
    `miles-proto-4-vehicle-removed-drivers-${vehicleId}`,
    []
  );

  const driver = vehicle.drivers.find((d) => d.id === driverId);
  const isPrimary = driver?.id === primaryId;

  if (!driver) {
    return (
      <VehicleDetailShell eyebrow={inferredName} title="Driver">
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Driver not found.
        </div>
      </VehicleDetailShell>
    );
  }

  const handleRemove = () => {
    if (!removedIds.includes(driver.id)) {
      setRemovedIds([...removedIds, driver.id]);
    }
    if (primaryId === driver.id) setPrimaryId("");
    router.back();
  };

  return (
    <VehicleDetailShell eyebrow={inferredName} title={driver.name}>
      <div className="flex flex-col gap-6">
        {/* Hero */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <span
            className={`flex size-20 items-center justify-center rounded-full text-2xl font-semibold text-white ${driver.color}`}
          >
            {driver.initials}
          </span>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-lg font-semibold text-neutral-900">{driver.name}</span>
            {driver.lastTrip && (
              <span className="text-xs text-neutral-500">Last trip · {driver.lastTrip}</span>
            )}
          </div>
        </div>

        {/* Primary driver row */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <button
            type="button"
            onClick={() => setPrimaryId(isPrimary ? "" : driver.id)}
            aria-pressed={isPrimary}
            className="flex min-h-[48px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors active:bg-neutral-100"
          >
            <span className="flex-1 text-base text-neutral-900">Primary driver</span>
            {isPrimary ? (
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
            ) : (
              <span className="text-base text-semantic-info">Set</span>
            )}
          </button>
        </div>
        <p className="-mt-4 px-4 text-[11px] leading-relaxed text-neutral-500">
          Miles uses the primary driver when a trip starts and we can&rsquo;t tell who&rsquo;s
          behind the wheel.
        </p>

        {/* Destructive action */}
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <button
            type="button"
            onClick={handleRemove}
            className="flex min-h-[48px] w-full items-center justify-center px-4 py-2.5 text-base font-medium text-red-600 transition-colors active:bg-neutral-100"
          >
            Remove driver
          </button>
        </div>
      </div>
    </VehicleDetailShell>
  );
}

export default function DriverDetailPage() {
  return (
    <Suspense>
      <DriverDetailContent />
    </Suspense>
  );
}
