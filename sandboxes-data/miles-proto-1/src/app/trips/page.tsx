import Link from "next/link";

const routePoints = [
  { x: 10, y: 80 },
  { x: 25, y: 60 },
  { x: 40, y: 50 },
  { x: 55, y: 40 },
  { x: 70, y: 35 },
  { x: 85, y: 25 },
];

function buildPathD(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ");
}

export default function TripsPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Trips
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Your recent driving history.
          </p>
        </div>

        {/* Today section */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Today
          </span>

          {/* New trip card */}
          <Link
            href="/trip-receipt"
            className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            {/* Mini route preview */}
            <div className="relative h-20 w-full overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-700">
              <div className="absolute inset-0 opacity-10">
                <div className="grid h-full w-full grid-cols-6 grid-rows-3">
                  {Array.from({ length: 18 }).map((_, i) => (
                    <div key={i} className="border border-neutral-400 dark:border-neutral-500" />
                  ))}
                </div>
              </div>
              <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d={buildPathD(routePoints)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-500 dark:text-blue-400"
                />
              </svg>
            </div>

            {/* Trip info */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Home &rarr; Downtown
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  3:42 &ndash; 3:54 PM
                </span>
              </div>
              <svg
                className="size-4 text-neutral-400 dark:text-neutral-500"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-normal leading-normal tabular-nums text-neutral-600 dark:text-neutral-400">
                4.2 mi
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-300 dark:text-neutral-600">
                &middot;
              </span>
              <span className="text-xs font-normal leading-normal tabular-nums text-neutral-600 dark:text-neutral-400">
                12 min
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-300 dark:text-neutral-600">
                &middot;
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Chris
              </span>
            </div>
          </Link>
        </div>

        {/* Empty earlier section */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Earlier
          </span>
          <div className="flex flex-col items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-800">
            <svg
              className="size-8 text-neutral-300 dark:text-neutral-600"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              More trips will appear here as you drive.
            </span>
          </div>
        </div>

      </div>
    </main>
  );
}
