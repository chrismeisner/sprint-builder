import Link from "@/app/sandboxes/miles-proto-1/_components/link";

export default function ReadyToDrivePage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Hero */}
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Big check icon */}
          <div className="flex size-24 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
            <svg
              className="size-12 text-green-600 dark:text-green-400"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              You&rsquo;re all set
            </h1>
            <p className="text-lg font-normal leading-relaxed text-pretty text-neutral-600 dark:text-neutral-400">
              Miles will record your trips automatically. No buttons to press, nothing to remember.
            </p>
          </div>
        </div>

        {/* Key points */}
        <div className="flex flex-col gap-3">
          {/* Auto logging */}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.808 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Automatic trip logging
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Every drive is recorded. Just get in your car and go.
              </span>
            </div>
          </div>

          {/* Safety note */}
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                No phone needed while driving
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Miles works in the background. No need to look at your phone
                while driving.
              </span>
            </div>
          </div>

          {/* Trip review teaser */}
          <div className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
              <svg
                className="size-5 text-neutral-600 dark:text-neutral-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                View trips when parked
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                After your first drive, check back to see your trip summary,
                route, and score.
              </span>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="flex flex-col gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
            What happens next?
          </span>
          <ol className="flex flex-col gap-2">
            <li className="flex items-start gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium leading-none tabular-nums text-white dark:bg-blue-500">
                1
              </span>
              <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
                Take your first drive
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium leading-none tabular-nums text-white dark:bg-blue-500">
                2
              </span>
              <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
                Park and check your trip summary
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium leading-none tabular-nums text-white dark:bg-blue-500">
                3
              </span>
              <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
                See your driving score improve over time
              </span>
            </li>
          </ol>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/trip-indicator"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Done &mdash; go to Trips
          </Link>
          <p className="text-center text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
            Setup complete. Welcome to Miles.
          </p>
        </div>
      </div>
    </main>
  );
}
