"use client";

import Link from "next/link";
import { useState } from "react";

type TimeRange = "week" | "month" | "all";

const weeklyData = [
  { label: "Mon", value: 8.1 },
  { label: "Tue", value: 12.4 },
  { label: "Wed", value: 4.2 },
  { label: "Thu", value: 15.8 },
  { label: "Fri", value: 9.6 },
  { label: "Sat", value: 22.3 },
  { label: "Sun", value: 6.0 },
];

const monthlyData = [
  { label: "Wk 1", value: 42.5 },
  { label: "Wk 2", value: 78.4 },
  { label: "Wk 3", value: 61.2 },
  { label: "Wk 4", value: 53.8 },
];

const allTimeData = [
  { label: "Jan", value: 0 },
  { label: "Feb", value: 235.9 },
];

const tripCategories = [
  { label: "Home → Work", trips: 8, miles: 46.2, color: "bg-blue-500 dark:bg-blue-400" },
  { label: "Home → School", trips: 5, miles: 18.4, color: "bg-emerald-500 dark:bg-emerald-400" },
  { label: "Errands", trips: 6, miles: 24.1, color: "bg-amber-500 dark:bg-amber-400" },
  { label: "Other", trips: 3, miles: 12.7, color: "bg-neutral-400 dark:bg-neutral-500" },
];

const totalCatMiles = tripCategories.reduce((s, c) => s + c.miles, 0);

export default function InsightsPage() {
  const [range, setRange] = useState<TimeRange>("week");

  const chartData =
    range === "week"
      ? weeklyData
      : range === "month"
        ? monthlyData
        : allTimeData;

  const maxVal = Math.max(...chartData.map((d) => d.value));
  const totalMiles = chartData.reduce((s, d) => s + d.value, 0);
  const totalTrips = range === "week" ? 16 : range === "month" ? 48 : 48;

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Back */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Home
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Insights &amp; Trends
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Patterns from your driving over time. The more you drive, the richer
            this gets.
          </p>
        </div>

        {/* Time range picker */}
        <div className="flex gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-700 dark:bg-neutral-800">
          {(["week", "month", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`flex h-8 flex-1 items-center justify-center rounded text-xs font-medium leading-none motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                range === r
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
            >
              {r === "week" ? "This week" : r === "month" ? "This month" : "All time"}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Total miles
            </span>
            <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
              {totalMiles.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Total trips
            </span>
            <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
              {totalTrips}
            </span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Miles driven
          </span>
          <div className="flex items-end gap-2">
            {chartData.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end">
                  <div
                    className="w-full rounded-t-sm bg-blue-500 motion-safe:transition-all motion-safe:duration-500 dark:bg-blue-400"
                    style={{
                      height: maxVal > 0 ? `${(d.value / maxVal) * 100}%` : "0%",
                      minHeight: d.value > 0 ? "4px" : "0px",
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium leading-none text-neutral-500 dark:text-neutral-500">
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trip categories */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Trip categories
          </span>

          {/* Stacked bar */}
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {tripCategories.map((cat) => (
              <div
                key={cat.label}
                className={`${cat.color} motion-safe:transition-all motion-safe:duration-500`}
                style={{ width: `${(cat.miles / totalCatMiles) * 100}%` }}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2">
            {tripCategories.map((cat) => (
              <div key={cat.label} className="flex items-center gap-3">
                <div className={`size-3 shrink-0 rounded-full ${cat.color}`} />
                <span className="flex-1 text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  {cat.label}
                </span>
                <span className="text-xs font-normal tabular-nums leading-none text-neutral-500 dark:text-neutral-500">
                  {cat.trips} trips &middot; {cat.miles} mi
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparisons */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Comparisons
          </span>

          <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
              <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Driving 12% less than last week
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                You drove 78.4 miles this week vs 89.1 last week. Fewer errands
                on weekdays made the difference.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Commute time is consistent
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Your Home &rarr; Work trips average 14 minutes. That&rsquo;s
                held steady for the past two weeks.
              </span>
            </div>
          </div>
        </div>

        {/* Early-days note */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              Still early days
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              You&rsquo;re building a solid baseline. After a few more weeks,
              Miles will surface more detailed trends and per-driver comparisons.
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
