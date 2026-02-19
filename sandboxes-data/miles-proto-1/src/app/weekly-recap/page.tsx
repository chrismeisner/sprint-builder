import Link from "next/link";

const dailyBreakdown = [
  { day: "Mon", miles: 8.1, trips: 2 },
  { day: "Tue", miles: 12.4, trips: 3 },
  { day: "Wed", miles: 4.2, trips: 1 },
  { day: "Thu", miles: 15.8, trips: 4 },
  { day: "Fri", miles: 9.6, trips: 2 },
  { day: "Sat", miles: 22.3, trips: 3 },
  { day: "Sun", miles: 6.0, trips: 1 },
];

const maxMiles = Math.max(...dailyBreakdown.map((d) => d.miles));

export default function WeeklyRecapPage() {
  const totalMiles = dailyBreakdown.reduce((sum, d) => sum + d.miles, 0);
  const totalTrips = dailyBreakdown.reduce((sum, d) => sum + d.trips, 0);
  const avgPerTrip = totalMiles / totalTrips;

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
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-blue-600 dark:text-blue-400">
            Weekly Recap
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Your week in review
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Feb 10 &ndash; Feb 16, 2026
          </p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Trips
            </span>
            <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
              {totalTrips}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Miles
            </span>
            <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
              {totalMiles.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Avg / trip
            </span>
            <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
              {avgPerTrip.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Daily bar chart */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Daily breakdown
          </span>
          <div className="flex items-end gap-2">
            {dailyBreakdown.map((day) => (
              <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-28 w-full items-end">
                  <div
                    className="w-full rounded-t-sm bg-blue-500 motion-safe:transition-all motion-safe:duration-500 dark:bg-blue-400"
                    style={{
                      height: `${(day.miles / maxMiles) * 100}%`,
                      minHeight: "4px",
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium leading-none text-neutral-500 dark:text-neutral-500">
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Insights
          </span>

          <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
              <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Saturday was your busiest day
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                3 trips covering 22.3 miles. That&rsquo;s the most driving you
                did all week.
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
                Most trips were under 15 minutes
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Short, local drives make up the majority of your week. This is
                typical for the first week with Miles.
              </span>
            </div>
          </div>
        </div>

        {/* Drivers this week */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Drivers this week
          </span>
          <div className="flex items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-300">
                C
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Chris
              </span>
              <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500">
                {totalTrips} trips &middot; {totalMiles.toFixed(1)} mi
              </span>
            </div>
          </div>
        </div>

        {/* Encouragement */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              Recaps get better over time
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              As Miles learns your patterns, these summaries will include
              comparisons, trends, and personalized insights.
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/insights"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            View full insights
          </Link>
          <Link
            href="/dashboard"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
