"use client";

import Link from "@/app/sandboxes/miles-proto-2/_components/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BASE, p } from "@/app/sandboxes/miles-proto-2/_lib/nav";
import { Suspense } from "react";

const HIDDEN_ON = new Set([
  BASE, BASE + "/",
  ...(["/signup", "/signup-name", "/scan-device", "/permissions",
  "/billing", "/install", "/find-port", "/plug-in-device",
  "/pair-device", "/getting-online", "/help-port", "/help-port/vehicle",
  "/help-port/vehicle/result", "/help-port/vin", "/help-port/vin/result",
  "/device-detected",
  "/whos-driving", "/add-drivers", "/trip-indicator", "/settings",
  "/index", "/home-screen", "/notification"].flatMap((r) => [p(r), p(r) + "/"])),
]);

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-6 transition-colors ${active ? "text-blue-600" : "text-neutral-400"}`}
      aria-hidden="true"
      fill={active ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={active ? 0 : 1.5}
      stroke="currentColor"
    >
      {active ? (
        <>
          <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a.112.112 0 0 0 .091-.086L12 5.432Z" />
        </>
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      )}
    </svg>
  );
}

function TripsIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-6 transition-colors ${active ? "text-blue-600" : "text-neutral-400"}`}
      aria-hidden="true"
      fill={active ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={active ? 0 : 1.5}
      stroke="currentColor"
    >
      {active ? (
        <path
          fillRule="evenodd"
          d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.827 3.024ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          clipRule="evenodd"
        />
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </>
      )}
    </svg>
  );
}

function MilesIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-6 transition-colors ${active ? "text-green-600" : "text-neutral-400"}`}
      aria-hidden="true"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function DriversIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-6 transition-colors ${active ? "text-blue-600" : "text-neutral-400"}`}
      aria-hidden="true"
      fill={active ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={active ? 0 : 1.5}
      stroke="currentColor"
    >
      {active ? (
        <path
          fillRule="evenodd"
          d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 15.117A6.745 6.745 0 0 1 12 12a6.745 6.745 0 0 1 6.709 7.498.75.75 0 0 1-.372.568A12.696 12.696 0 0 1 12 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 0 1-.372-.568 6.787 6.787 0 0 1 1.019-4.38Z"
          clipRule="evenodd"
        />
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </>
      )}
    </svg>
  );
}

function AccountIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`size-6 transition-colors ${active ? "text-blue-600" : "text-neutral-400"}`}
      aria-hidden="true"
      fill={active ? "currentColor" : "none"}
      viewBox="0 0 24 24"
      strokeWidth={active ? 0 : 1.5}
      stroke="currentColor"
    >
      {active ? (
        <path
          fillRule="evenodd"
          d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
          clipRule="evenodd"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
        />
      )}
    </svg>
  );
}

interface TabDef {
  href: string;
  label: string;
  icon: (props: { active: boolean }) => React.ReactNode;
  match: (pathname: string) => boolean;
  badge?: boolean;
}

const TABS: TabDef[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: DashboardIcon,
    match: (pn) =>
      pn === `${BASE}/dashboard` ||
      pn === `${BASE}/dashboard/` ||
      pn.startsWith(`${BASE}/dashboard?`),
  },
  {
    href: "/trips",
    label: "Trips",
    icon: TripsIcon,
    match: (pn) =>
      pn.startsWith(`${BASE}/trips`) ||
      pn.startsWith(`${BASE}/trip-`),
  },
  {
    href: "/miles",
    label: "Miles",
    icon: MilesIcon,
    match: (pn) =>
      pn === `${BASE}/miles` ||
      pn === `${BASE}/miles/`,
    badge: true,
  },
  {
    href: "/drivers",
    label: "Drivers",
    icon: DriversIcon,
    match: (pn) => pn.startsWith(`${BASE}/drivers`),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: AccountIcon,
    match: (pn) =>
      pn === `${BASE}/profile` ||
      pn === `${BASE}/profile/` ||
      pn.startsWith(`${BASE}/profile?`),
  },
];

function BottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (HIDDEN_ON.has(pathname)) return null;

  // When viewing a family member's live trip from the dashboard,
  // treat it as belonging to the Trips tab.
  const isFamilyLiveTrip =
    (pathname === `${BASE}/dashboard` || pathname === `${BASE}/dashboard/`) &&
    !!searchParams.get("vehicleLabel");

  // When on /vehicle or /device-health, retain the tab the user came from.
  const isVehicleModal =
    pathname === `${BASE}/vehicle` || pathname === `${BASE}/vehicle/` ||
    pathname === `${BASE}/device-health` || pathname === `${BASE}/device-health/`;
  const fromTab = isVehicleModal ? (searchParams.get("from") ?? "dashboard") : null;

  return (
    <nav
      className="shrink-0 z-30 border-t border-neutral-200/80 bg-white/95 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex items-center justify-around px-2 py-2">
        {TABS.map((tab) => {
          const active = isVehicleModal
            ? tab.href === `/${fromTab}`
            : isFamilyLiveTrip
            ? tab.label === "Trips"
            : tab.match(pathname);
          const Icon = tab.icon;
          const isMiles = tab.label === "Miles";
          const linkContent = (
            <>
              <span className="relative flex items-center justify-center">
                {isMiles ? (
                  <span
                    className={`flex items-center justify-center rounded-2xl px-4 py-2 transition-all ${
                      active
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 [&_svg]:stroke-white [&_svg]:!text-white"
                        : "bg-gradient-to-br from-green-100 to-emerald-100 text-green-700"
                    }`}
                  >
                    <Icon active={active} />
                  </span>
                ) : (
                  <Icon active={active} />
                )}
                {tab.badge && !active && (
                  <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-green-500 ring-2 ring-white" />
                )}
              </span>
              <span
                className={`text-[10px] font-medium leading-none transition-colors ${
                  active
                    ? tab.label === "Miles"
                      ? "text-green-600"
                      : "text-blue-600"
                    : "text-neutral-400"
                }`}
              >
                {tab.label}
              </span>
            </>
          );
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
            >
              {linkContent}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense>
      <BottomNavInner />
    </Suspense>
  );
}
