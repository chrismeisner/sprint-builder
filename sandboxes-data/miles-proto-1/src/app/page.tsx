import Link from "next/link";

export default function WelcomePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/api/sandbox-files/styleguide/images/miles-logos/miles-badge-green.svg"
          alt="Miles"
          className="size-20"
          aria-hidden="true"
        />

        {/* Value promise */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Miles
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Miles logs trips automatically and helps you stay on top of driving
            and vehicle health.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/signup"
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
