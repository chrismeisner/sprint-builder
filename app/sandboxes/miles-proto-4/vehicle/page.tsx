"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";
import { VehicleDetailBody } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-body";

function VehicleContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "civic";

  return (
    <VehicleDetailShell
      trailing={
        <Link
          href={`/vehicles/details?vehicle=${vehicleId}`}
          className="-mr-1 flex h-11 items-center rounded-lg px-2 text-base text-semantic-info active:opacity-60"
        >
          Edit
        </Link>
      }
    >
      <VehicleDetailBody vehicleId={vehicleId} />
    </VehicleDetailShell>
  );
}

export default function VehiclePage() {
  return (
    <Suspense>
      <VehicleContent />
    </Suspense>
  );
}
