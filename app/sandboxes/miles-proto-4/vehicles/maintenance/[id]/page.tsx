"use client";

import { useParams } from "next/navigation";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";

const TITLE_BY_ID: Record<string, string> = {
  "oil-change": "Oil change",
  "tire-rotation": "Tire rotation",
  "front-brake-pads": "Front brake pads",
  "battery-replacement": "Battery replacement",
};

export default function MaintenanceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const title = TITLE_BY_ID[id] ?? "Maintenance record";

  return (
    <VehicleDetailShell eyebrow="2015 RAM 2500" title={title}>
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-neutral-900">Maintenance record detail</span>
          <span className="max-w-xs text-xs text-neutral-500">
            Detail surface shell. Receipt image, vendor, line items, and edit/delete actions land here in a later iteration.
          </span>
        </div>
      </div>
    </VehicleDetailShell>
  );
}
