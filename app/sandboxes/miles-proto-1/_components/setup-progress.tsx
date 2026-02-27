import Link from "@/app/sandboxes/miles-proto-1/_components/link";

const SETUP_SCREENS = [
  { label: "Permissions", href: "/permissions" },
  { label: "Register Miles", href: "/scan-device" },
  { label: "Start trial", href: "/billing" },
  { label: "Find OBD-II port", href: "/find-port" },
  { label: "Plug in Miles", href: "/plug-in-device" },
  { label: "Pair with phone", href: "/pair-device" },
  { label: "Connect to cloud", href: "/getting-online" },
  { label: "Assign drivers", href: "/whos-driving" },
] as const;

const TOTAL = SETUP_SCREENS.length;

interface SetupProgressProps {
  /** Zero-based index of the current screen in SETUP_SCREENS */
  current: number;
  backHref?: string;
  /** Optional override for the progress bar fill (0–100). Defaults to step-based calculation. */
  progress?: number;
}

export function SetupProgress({ current, backHref = "/install?state=empty", progress }: SetupProgressProps) {
  const pct = progress !== undefined ? progress : Math.round(((current + 1) / TOTAL) * 100);
  const screen = SETUP_SCREENS[current];

  return (
    <div className="flex flex-col gap-3">
      <Link
        href={backHref}
        className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
      >
        &larr; Back
      </Link>
      <div className="flex flex-col gap-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div
            className="h-full rounded-full bg-blue-600 motion-safe:transition-all motion-safe:duration-500 dark:bg-blue-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium leading-none text-neutral-400 dark:text-neutral-500">
          {screen?.label}
        </span>
      </div>
    </div>
  );
}

export { SETUP_SCREENS };
