import Link from "next/link";

export default function FindPortPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/install"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <p className="text-xs font-medium uppercase tracking-wide leading-none text-blue-600 dark:text-blue-400">
            Step 1 of install
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Find your OBD-II port
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            This is where Miles plugs in. It&rsquo;s usually under the steering
            wheel, below the dashboard.
          </p>
        </div>

        {/* Illustration area */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
            <img
              src="/journey-first-trip-1b.jpg"
              alt="View of car interior showing OBD-II port location under the steering wheel"
              className="w-full"
            />
          </div>

          {/* Hint text */}
          <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
            The port is a 16-pin trapezoid connector. Most cars built after 1996
            have one. It&rsquo;s usually within reach of the driver&rsquo;s seat.
          </p>
        </div>

        {/* Tip callout */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg
            className="size-5 shrink-0 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              Tip
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              Some cars have a plastic cover over the port. It should pop off
              easily with your fingers.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/scan-device"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            I found it
          </Link>
          <Link
            href="/help-port"
            className="flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            Need help finding it?
          </Link>
        </div>
      </div>
    </main>
  );
}
