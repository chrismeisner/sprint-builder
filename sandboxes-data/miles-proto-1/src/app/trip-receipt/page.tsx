import Link from "next/link";

const routePoints = [
  { x: 15, y: 78 },
  { x: 22, y: 65 },
  { x: 30, y: 58 },
  { x: 40, y: 52 },
  { x: 50, y: 45 },
  { x: 58, y: 38 },
  { x: 65, y: 42 },
  { x: 72, y: 35 },
  { x: 78, y: 30 },
  { x: 82, y: 25 },
];

function buildPathD(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ");
}

export default function TripReceiptPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {/* Back */}
        <Link
          href="/trips"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Trips
        </Link>

        {/* Success header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
            <svg
              className="size-8 text-green-600 dark:text-green-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              Trip recorded
            </h1>
            <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
              Here&rsquo;s your quick summary.
            </p>
          </div>
        </div>

        {/* Route map */}
        <div className="relative flex aspect-video items-end justify-end overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="absolute inset-0 opacity-10">
            <div className="grid h-full w-full grid-cols-8 grid-rows-5">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="border border-neutral-400 dark:border-neutral-500" />
              ))}
            </div>
          </div>
          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d={buildPathD(routePoints)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-500 dark:text-blue-400"
            />
          </svg>
          {/* Start dot */}
          <div
            className="absolute flex size-4 items-center justify-center rounded-full border-2 border-blue-500 bg-white dark:border-blue-400 dark:bg-neutral-900"
            style={{ left: `${routePoints[0].x}%`, top: `${routePoints[0].y}%`, transform: "translate(-50%, -50%)" }}
          />
          {/* End dot */}
          <div
            className="absolute flex size-4 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500"
            style={{ left: `${routePoints[routePoints.length - 1].x}%`, top: `${routePoints[routePoints.length - 1].y}%`, transform: "translate(-50%, -50%)" }}
          />
        </div>

        {/* Start → End */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="size-3 rounded-full border-2 border-blue-500 dark:border-blue-400" />
            <div className="h-8 w-px bg-neutral-200 dark:bg-neutral-700" />
            <div className="size-3 rounded-full bg-blue-600 dark:bg-blue-500" />
          </div>
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Home
              </span>
              <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500">
                3:42 PM &middot; 123 Oak St, Springfield
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Downtown
              </span>
              <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500">
                3:54 PM &middot; 456 Main St, Springfield
              </span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Distance
            </span>
            <span className="text-xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
              4.2 mi
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Duration
            </span>
            <span className="text-xl font-semibold leading-snug text-balance tabular-nums text-neutral-900 dark:text-neutral-100">
              12 min
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Driver
            </span>
            <span className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
              Chris
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Vehicle
            </span>
            <span className="text-xl font-semibold leading-snug text-balance text-neutral-900 dark:text-neutral-100">
              CR-V
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/post-drive-prompts"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            View full trip
          </Link>
          <Link
            href="/trips"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
          >
            Back to Trips
          </Link>
        </div>

      </div>
    </main>
  );
}
