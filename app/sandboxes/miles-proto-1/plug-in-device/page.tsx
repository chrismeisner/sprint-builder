import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { SetupProgress } from "@/app/sandboxes/miles-proto-1/_components/setup-progress";
import { StickyFooter } from "@/app/sandboxes/miles-proto-1/_components/sticky-footer";
import { assetPath } from "@/app/sandboxes/miles-proto-1/_lib/asset-path";

export default function PlugInDevicePage() {
  return (
    <>
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <SetupProgress current={4} />
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Plug in Miles
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Push Miles firmly into the OBD-II port until it clicks, then turn on your car to power it on.
          </p>
        </div>

        {/* Illustration */}
        <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
          <img
            src={assetPath("/images/journey-first-trip-1b.jpg")}
            alt="Locating the OBD-II port under the dashboard"
            className="w-full"
          />
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-3">
          {[
            { num: "1", text: "Locate the OBD-II port you found in the previous step" },
            { num: "2", text: "Align Miles with the port pins" },
            { num: "3", text: "Push firmly until it clicks into place" },
            { num: "4", text: "Turn on your car — Miles will power on automatically" },
          ].map((step) => (
            <div key={step.num} className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold leading-none text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                {step.num}
              </span>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                {step.text}
              </span>
            </div>
          ))}
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
              Miles should sit flush and the LED will light up once you start the car. If it feels loose, try adjusting the angle slightly and pushing again.
            </span>
          </div>
        </div>

      </div>
    </main>

    <StickyFooter>
      <Link
        href="/pair-device"
        className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
      >
        It&rsquo;s plugged in
      </Link>
    </StickyFooter>
    </>
  );
}
