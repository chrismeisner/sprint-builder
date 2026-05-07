"use client";

import { Suspense, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { AskMilesBadge } from "@/app/sandboxes/miles-proto-5/_components/ask-miles-badge";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-5/_components/vehicle-detail-shell";
import { SymbolIcon } from "@/app/sandboxes/miles-proto-5/_components/symbol-icon";

/**
 * Trip-scoped stat detail. Mirrors the vehicle metric-detail shape
 * (VehicleDetailShell + hero + 7-trip trend + About) so the iOS port can
 * reuse the same `MetricDetailView` with a different fetch source.
 *
 * `[metric]` matches the `id` of a tile rendered on `/trip-detail`.
 */

interface TripMetric {
  id: string;
  label: string;
  value: string;
  /** Material Symbols name — see `SymbolIcon`. */
  icon: string;
  /** Bar dot color matches the bento tile so the detail feels continuous. */
  dot: string;
  /** Plain-language explanation shown below the About card. */
  description: string;
  /** Last 7 trips, normalized to 0–100 for the placeholder bar chart. */
  trend: number[];
  /** Optional second line under the hero value (e.g. "9:58 AM → 10:13 AM"). */
  subValue?: string;
  /** Optional segmented breakdown rendered as a stacked bar + rows. */
  breakdown?: { id: string; label: string; value: string; share: number; tone: "primary" | "muted" | "warn" }[];
  /** Optional comparison line shown in the About card (e.g. usual time on this route). */
  comparison?: string;
  /** Override for the About > Source row. Defaults to "Miles Plug". */
  source?: string;
}

const BREAKDOWN_TONES = {
  primary: "bg-blue-500",
  muted:   "bg-neutral-300",
  warn:    "bg-amber-500",
} as const;

const TRIP_METRICS: TripMetric[] = [
  {
    id: "distance",
    label: "Distance",
    value: "11.0 km",
    icon: "straighten",
    dot: "bg-blue-500",
    description:
      "Distance driven during this trip, measured from the vehicle's GPS track.",
    trend: [12, 78, 100, 44, 66, 90, 100],
  },
  {
    id: "duration",
    label: "Duration",
    value: "13 min",
    subValue: "9:58 AM → 10:13 AM",
    icon: "schedule",
    dot: "bg-blue-500",
    description:
      "Elapsed time from the moment your engine started moving until it stopped at your destination — including time at stoplights, drive-thru queues, and any idle stops along the way.",
    trend: [22, 70, 76, 40, 58, 92, 76],
    breakdown: [
      { id: "moving",  label: "Moving",  value: "11 min", share: 85, tone: "primary" },
      { id: "idle",    label: "Idle",    value: "1 min",  share: 8,  tone: "warn"    },
      { id: "stopped", label: "Stopped", value: "1 min",  share: 7,  tone: "muted"   },
    ],
    comparison: "About 1 min slower than your usual New Hope → Lambertville trip.",
    source: "Vehicle GPS",
  },
  {
    id: "cost",
    label: "Cost",
    value: "—",
    icon: "attach_money",
    dot: "bg-neutral-400",
    description:
      "Estimated fuel + wear cost for this trip. Connect a fuel price source to enable cost estimates.",
    trend: [0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "avg",
    label: "Avg speed",
    value: "60 km/h",
    icon: "speed",
    dot: "bg-emerald-500",
    description:
      "Average speed during this trip. Useful for comparing route choices and traffic conditions.",
    trend: [55, 62, 60, 58, 65, 67, 60],
  },
  {
    id: "max",
    label: "Max speed",
    value: "104 km/h",
    icon: "speed",
    dot: "bg-amber-500",
    description:
      "Highest instantaneous speed recorded. Brief peaks above the posted limit may also count toward Excess speed events.",
    trend: [62, 88, 100, 80, 90, 96, 100],
  },
  {
    id: "idle",
    label: "Idle",
    value: "1 min",
    icon: "pause",
    dot: "bg-neutral-400",
    description:
      "Total time the engine was running while the vehicle was stationary (e.g., traffic, drive-thrus).",
    trend: [0, 33, 33, 66, 33, 100, 33],
  },
  {
    id: "hard-brakes",
    label: "Hard brakes",
    value: "0",
    icon: "warning",
    dot: "bg-amber-500",
    description:
      "Decelerations exceeding 0.4 g. More following distance and earlier braking can reduce these.",
    trend: [0, 50, 50, 0, 100, 50, 0],
  },
  {
    id: "rapid-accel",
    label: "Rapid accel",
    value: "0",
    icon: "trending_up",
    dot: "bg-amber-500",
    description:
      "Accelerations exceeding 0.4 g. Smoother throttle inputs save fuel and brake wear.",
    trend: [0, 0, 50, 0, 50, 0, 0],
  },
  {
    id: "excess-speed",
    label: "Excess speed",
    value: "0",
    icon: "speed",
    dot: "bg-rose-500",
    description:
      "Time spent more than 8 km/h over the posted limit. Sourced from map limits + GPS speed.",
    trend: [0, 50, 0, 0, 100, 50, 0],
  },
];

const TREND_LABELS = ["−6", "−5", "−4", "−3", "−2", "−1", "Now"];

/** Trip name (the date title from trip-detail). Wired manually in the
 *  prototype; the iOS port should derive this from the parent trip's
 *  formatted start date. */
const TRIP_NAME = "Wednesday, May 6, 2026";

function MetricDetailContent() {
  const params = useParams<{ metric: string }>();
  const metricId = params?.metric ?? "";
  const metric = TRIP_METRICS.find((m) => m.id === metricId);

  if (!metric) {
    return (
      <VehicleDetailShell eyebrow={TRIP_NAME} title="Metric">
        <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
          Metric not found.
        </div>
      </VehicleDetailShell>
    );
  }

  return (
    <VehicleDetailShell
      eyebrow={TRIP_NAME}
      title={metric.label}
      trailing={
        <AskMilesBadge
          context={`trip-metric-${metric.id}`}
          ariaLabel={`Ask Miles about ${metric.label.toLowerCase()}`}
        />
      }
    >
      <div className="flex flex-col gap-6">
        {/* Hero */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-neutral-100">
            <SymbolIcon name={metric.icon} size="md" className="text-neutral-700" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-500">
            {metric.label}
          </span>
          <span className="text-5xl font-semibold leading-none tabular-nums text-neutral-900">
            {metric.value}
          </span>
          {metric.subValue && (
            <span className="mt-1 text-xs tabular-nums text-neutral-500">
              {metric.subValue}
            </span>
          )}
          <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
            <span className={`size-1.5 rounded-full ${metric.dot}`} />
            This trip
          </div>
        </div>

        {/* Optional breakdown — shown for metrics that decompose into segments. */}
        {metric.breakdown && metric.breakdown.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Breakdown
            </h2>
            <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
              {/* Stacked share bar */}
              <div className="flex h-2 overflow-hidden rounded-full bg-neutral-100">
                {metric.breakdown.map((seg) => (
                  <div
                    key={seg.id}
                    className={BREAKDOWN_TONES[seg.tone]}
                    style={{ width: `${seg.share}%` }}
                  />
                ))}
              </div>
              {/* Per-segment rows */}
              <div className="flex flex-col gap-2">
                {metric.breakdown.map((seg) => (
                  <div key={seg.id} className="flex items-center gap-3 text-sm">
                    <span className={`size-2 shrink-0 rounded-full ${BREAKDOWN_TONES[seg.tone]}`} />
                    <span className="flex-1 text-neutral-900">{seg.label}</span>
                    <span className="tabular-nums text-neutral-500">{seg.value}</span>
                    <span className="w-10 text-right tabular-nums text-neutral-400">{seg.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trend across last 7 trips */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Last 7 trips
          </h2>
          <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex h-32 items-end gap-1.5">
              {metric.trend.map((h, i) => {
                const isCurrent = i === metric.trend.length - 1;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${metric.dot} ${isCurrent ? "" : "opacity-30"}`}
                    style={{ height: `${Math.max(h, 4)}%` }}
                  />
                );
              })}
            </div>
            <div className="flex gap-1.5">
              {TREND_LABELS.map((l, i) => (
                <span
                  key={i}
                  className="flex-1 text-center text-[10px] font-medium tabular-nums text-neutral-400"
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
              <ReadRow label="Source" value={metric.source ?? "Miles Plug"} />
              <ReadRow label="Trip" value={TRIP_NAME} />
              {metric.comparison && (
                <ReadRow label="Compared to usual">
                  <span className="text-right text-base text-neutral-500">
                    {metric.comparison}
                  </span>
                </ReadRow>
              )}
            </div>
          </div>
          <p className="px-1 text-xs leading-relaxed text-neutral-500">
            {metric.description}
          </p>
        </section>
      </div>
    </VehicleDetailShell>
  );
}

export default function TripMetricDetailPage() {
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
