import Link from "@/app/sandboxes/miles-proto-1/_components/link";

interface PageEntry {
  href: string;
  label: string;
  note?: string;
}

interface Section {
  title: string;
  pages: PageEntry[];
}

const sections: Section[] = [
  {
    title: "Auth & Onboarding",
    pages: [
      { href: "/", label: "Welcome", note: "Landing / sign-up" },
      { href: "/signup", label: "Sign up" },
      { href: "/signup-name", label: "Sign up — name" },
    ],
  },
  {
    title: "Setup & Installation",
    pages: [
      { href: "/install?state=empty", label: "Install checklist", note: "empty" },
      { href: "/install?state=partial", label: "Install checklist", note: "partial" },
      { href: "/install?state=filled", label: "Install checklist", note: "filled" },
      { href: "/scan-device", label: "Scan device" },
      { href: "/billing", label: "Billing / start trial" },
      { href: "/permissions", label: "Permissions" },
      { href: "/find-port", label: "Find OBD-II port" },
      { href: "/help-port", label: "Help — find port" },
      { href: "/help-port/vin", label: "Help — enter VIN" },
      { href: "/help-port/vin/result", label: "Help — VIN result" },
      { href: "/help-port/vehicle", label: "Help — select vehicle" },
      { href: "/help-port/vehicle/result", label: "Help — vehicle result" },
      { href: "/plug-in-device", label: "Plug in device" },
      { href: "/pair-device", label: "Pair device" },
      { href: "/linking-device", label: "Linking device" },
      { href: "/getting-online", label: "Getting online" },
      { href: "/device-detected", label: "Device detected" },
      { href: "/whos-driving", label: "Who's driving" },
      { href: "/setup-progress", label: "Setup progress" },
    ],
  },
  {
    title: "Dashboard",
    pages: [
      { href: "/dashboard?state=empty", label: "Dashboard", note: "empty / no device" },
      { href: "/dashboard?state=no-trips", label: "Dashboard", note: "no trips yet" },
      { href: "/dashboard?state=filled", label: "Dashboard", note: "filled" },
      { href: "/ready-to-drive", label: "Ready to drive" },
    ],
  },
  {
    title: "Trips",
    pages: [
      { href: "/trips", label: "Trips list" },
      { href: "/trip-receipt", label: "Trip receipt" },
      { href: "/trip-detail", label: "Trip detail" },
      { href: "/trip-complete", label: "Trip complete" },
      { href: "/trip-indicator", label: "Trip indicator" },
      { href: "/trip-finalizing", label: "Trip finalizing" },
      { href: "/first-trip-ready", label: "First trip — ready" },
      { href: "/first-trip-summary", label: "First trip — summary" },
      { href: "/post-drive-prompts", label: "Post-drive prompts" },
    ],
  },
  {
    title: "Live Trip",
    pages: [
      { href: "/live-trip", label: "Live trip" },
      { href: "/live-trip-event", label: "Live trip — event" },
      { href: "/live-trip-degraded", label: "Live trip — degraded signal" },
    ],
  },
  {
    title: "Drivers & Household",
    pages: [
      { href: "/household", label: "Household" },
      { href: "/add-drivers", label: "Add drivers" },
      { href: "/primary-driver", label: "Primary driver" },
      { href: "/secondary-drivers", label: "Secondary drivers" },
      { href: "/driver-reassignment", label: "Driver reassignment" },
      { href: "/teen-independence", label: "Teen independence" },
      { href: "/confirm-address", label: "Confirm address" },
    ],
  },
  {
    title: "Insights & Data",
    pages: [
      { href: "/insights", label: "Insights" },
      { href: "/weekly-recap", label: "Weekly recap" },
      { href: "/next-trip-headsup", label: "Next trip heads-up" },
      { href: "/locations", label: "Locations" },
    ],
  },
  {
    title: "Settings & Account",
    pages: [
      { href: "/profile", label: "Profile" },
      { href: "/device-health", label: "Device health" },
      { href: "/notifications", label: "Notifications" },
      { href: "/privacy", label: "Privacy & controls" },
    ],
  },
];

const totalPages = sections.reduce((sum, s) => sum + s.pages.length, 0);

export default function IndexPage() {
  return (
    <main className="flex min-h-dvh flex-col px-6 pb-16 pt-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10">

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
            Miles Proto 1 — Page Index
          </h1>
          <p className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-400">
            {totalPages} screens across {sections.length} sections.{" "}
            <Link
              href="/"
              className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Start from the beginning &rarr;
            </Link>
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide leading-none text-neutral-400 dark:text-neutral-500">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-700">
              {section.pages.map((page, i) => (
                <Link
                  key={`${page.href}-${i}`}
                  href={page.href}
                  className="flex items-center justify-between gap-3 bg-white px-4 py-3 motion-safe:transition-colors hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                      {page.label}
                    </span>
                    {page.note && (
                      <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                        {page.note}
                      </span>
                    )}
                  </div>
                  <svg className="size-3.5 shrink-0 text-neutral-300 dark:text-neutral-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}

      </div>
    </main>
  );
}
