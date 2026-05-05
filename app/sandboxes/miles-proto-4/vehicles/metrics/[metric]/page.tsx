"use client";

import { Suspense, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";
import { SymbolIcon } from "@/app/sandboxes/miles-proto-4/_components/symbol-icon";
import {
  METRIC_ICONS,
  getVehicleData,
} from "@/app/sandboxes/miles-proto-4/_lib/vehicle-data";

const METRIC_DESCRIPTIONS: Record<string, string> = {
  fuel: "Fuel level reported by the vehicle's OBD port. Updated whenever the engine starts or the dongle reports.",
  battery:
    "Battery voltage measured at the OBD port. Healthy ranges are 12.4–13.0V at rest and over 13.5V while running.",
  diagnostics:
    "Active Diagnostic Trouble Codes (DTCs) reported by the vehicle's ECU. Zero codes means no faults are stored right now.",
  odometer: "Total miles read directly from the vehicle's ECU.",
  status:
    "What the vehicle is doing right now — parked, driving, idling, or pending an update.",
  "connected-via":
    "How Miles is reading data from this vehicle. Most vehicles connect via the Miles Plug OBD dongle.",
};

/* Mock 7-day trend used for the placeholder bar chart. Real data plugs in
   later — same shape would feed a SwiftUI Chart view. */
const TREND_BARS_BY_METRIC: Record<string, number[]> = {
  fuel: [82, 78, 70, 64, 58, 52, 50],
  battery: [92, 91, 93, 92, 90, 92, 93],
  diagnostics: [10, 10, 10, 10, 10, 10, 10],
  odometer: [40, 50, 55, 65, 75, 85, 100],
  status: [60, 60, 60, 60, 60, 60, 60],
  "connected-via": [80, 80, 80, 80, 80, 80, 80],
};

const TREND_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function MetricDetailContent() {
  const params = useParams<{ metric: string }>();
  const metricId = params?.metric ?? "";
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "civic";
  const vehicle = getVehicleData(vehicleId);
  const inferredName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  const allMetrics = [...vehicle.primaryMetrics, ...vehicle.extendedMetrics];
  const metric = allMetrics.find((m) => m.id === metricId);

  if (!metric) {
    return (
      <VehicleDetailShell eyebrow={inferredName} title="Metric">
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Metric not found.
        </div>
      </VehicleDetailShell>
    );
  }

  const iconName = METRIC_ICONS[metric.id] ?? "circle";
  const description = METRIC_DESCRIPTIONS[metric.id];
  const bars = TREND_BARS_BY_METRIC[metric.id] ?? [60, 60, 60, 60, 60, 60, 60];

  return (
    <VehicleDetailShell eyebrow={inferredName} title={metric.label}>
      <div className="flex flex-col gap-6">
        {/* Hero */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-neutral-100">
            <SymbolIcon name={iconName} size="md" className="text-neutral-700" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-500">
            {metric.label}
          </span>
          <span
            className={`text-5xl font-semibold tabular-nums leading-none ${metric.text ?? "text-neutral-900"}`}
          >
            {metric.value}
          </span>
          {metric.lastUpdated && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
              <span className={`size-1.5 rounded-full ${metric.dot}`} />
              Updated {metric.lastUpdated}
            </div>
          )}
        </div>

        {/* Trend chart placeholder */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Last 7 days
          </h2>
          <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex h-32 items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${metric.dot} opacity-30`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              {TREND_LABELS.map((l, i) => (
                <span
                  key={i}
                  className="flex-1 text-center text-[10px] font-medium text-neutral-400"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            About
          </h2>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="divide-y divide-neutral-200">
              <ReadRow label="Source" value="Miles Plug" />
              <ReadRow label="Last reading" value={metric.lastUpdated ?? "—"} />
            </div>
          </div>
          {description && (
            <p className="px-1 text-xs leading-relaxed text-neutral-500">{description}</p>
          )}
        </section>
      </div>
    </VehicleDetailShell>
  );
}

export default function MetricDetailPage() {
  return (
    <Suspense>
      <MetricDetailContent />
    </Suspense>
  );
}

function ReadRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[48px] items-center gap-3 px-4 py-2.5">
      <span className="shrink-0 text-base text-neutral-900">{label}</span>
      <div className="flex min-w-0 flex-1 justify-end">
        {children ?? (
          <span className="truncate text-base text-neutral-500">{value}</span>
        )}
      </div>
    </div>
  );
}
