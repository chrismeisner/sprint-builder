"use client";

import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";

export default function NewMaintenanceTodoPage() {
  return (
    <VehicleDetailShell eyebrow="2015 RAM 2500" title="New To-Do">
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-neutral-900">New maintenance to-do</span>
          <span className="max-w-xs text-xs text-neutral-500">
            Placeholder. Form for task name, due date or mileage, reminder, and notes lands here in
            a later iteration.
          </span>
        </div>
      </div>
    </VehicleDetailShell>
  );
}
