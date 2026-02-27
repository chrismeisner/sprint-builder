import Link from "@/app/sandboxes/miles-proto-1/_components/link";

export default function NextTripHeadsupPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Back */}
        <Link
          href="/add-drivers"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg
            className="size-4"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Before your next&nbsp;drive
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            A few things that might be helpful. Nothing urgent &mdash; just
            keeping you in the loop.
          </p>
        </div>

        {/* Nudge cards */}
        <div className="flex flex-col gap-3">
          {/* Fuel */}
          <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950">
              <svg
                className="size-5 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Fuel level looks low
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Based on your recent driving, you might want to fill up before a
                longer trip.
              </span>
            </div>
          </div>

          {/* Maintenance */}
          <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <svg
                className="size-5 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Oil change coming up
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                You&rsquo;re approaching 5,000 miles since your last service.
                Just a gentle heads-up.
              </span>
            </div>
          </div>

          {/* Device health */}
          <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
              <svg
                className="size-5 text-green-600 dark:text-green-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Device is good to go
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Plugged in, connected, and ready for your next trip.
              </span>
            </div>
          </div>
        </div>

        {/* Supportive note */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg
            className="size-5 shrink-0 text-blue-600 dark:text-blue-400"
            aria-hidden="true"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              These are just suggestions
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              Miles surfaces helpful info when it&rsquo;s relevant. You
              won&rsquo;t see this screen every time &mdash; only when there&rsquo;s
              something worth mentioning.
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/trips"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Done &mdash; go to Trips
          </Link>
          <Link
            href="/trips"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-neutral-500 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-neutral-400 dark:hover:text-neutral-300 dark:focus-visible:ring-offset-neutral-900"
          >
            Dismiss
          </Link>
        </div>
      </div>
    </main>
  );
}
