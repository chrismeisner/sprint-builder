"use client";

import Link from "next/link";
import { useState } from "react";

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
  return (
    `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ")
  );
}

type NextAction =
  | "add-drivers"
  | "name-locations"
  | "weekly-recap"
  | null;

const nextActions: { id: NextAction; label: string; description: string; href: string; icon: "drivers" | "location" | "recap" }[] = [
  {
    id: "add-drivers",
    label: "Add other drivers",
    description: "Improve trip attribution by adding people who share this vehicle.",
    href: "/household",
    icon: "drivers",
  },
  {
    id: "name-locations",
    label: "Name your frequent places",
    description: "Label locations like work or school for better trip insights.",
    href: "/locations",
    icon: "location",
  },
  {
    id: "weekly-recap",
    label: "Check your weekly recap",
    description: "See how your driving week shaped up.",
    href: "/weekly-recap",
    icon: "recap",
  },
];

function ActionIcon({ type }: { type: "drivers" | "location" | "recap" }) {
  if (type === "drivers") {
    return (
      <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    );
  }
  if (type === "location") {
    return (
      <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    );
  }
  return (
    <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

export default function DashboardPage() {
  const [actionDismissed, setActionDismissed] = useState(false);
  const currentAction = nextActions[0];

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Greeting header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Good afternoon
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-neutral-900 dark:text-neutral-100">
              Chris
            </h1>
          </div>
          <Link
            href="/setup-progress"
            className="flex size-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            aria-label="Settings"
          >
            <svg className="size-5 text-neutral-500 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </Link>
        </div>

        {/* Device health strip */}
        <Link
          href="/device-health"
          className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
            <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
              CR-V &middot; Device online
            </span>
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              GPS strong &middot; Cellular connected &middot; Last sync 2 min ago
            </span>
          </div>
          <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        {/* Next best action */}
        {!actionDismissed && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
              Suggested next step
            </span>
            <div className="flex flex-col gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <ActionIcon type={currentAction.icon} />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
                    {currentAction.label}
                  </span>
                  <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
                    {currentAction.description}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  href={currentAction.href}
                  className="flex h-10 flex-1 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-150 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {currentAction.label}
                </Link>
                <button
                  type="button"
                  onClick={() => setActionDismissed(true)}
                  className="flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium leading-none text-blue-600 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent trips */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
              Recent trips
            </span>
            <Link
              href="/trips"
              className="text-xs font-medium leading-none text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all
            </Link>
          </div>

          {/* Trip card */}
          <Link
            href="/trip-receipt"
            className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
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
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Home &rarr; Downtown
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Today, 3:42 &ndash; 3:54 PM
                </span>
              </div>
              <svg className="size-4 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
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

        {/* This week summary */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            This week
          </span>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                Trips
              </span>
              <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
                1
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                Miles
              </span>
              <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
                4.2
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                Time
              </span>
              <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-900 dark:text-neutral-100">
                12m
              </span>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-col gap-1">
          <Link
            href="/insights"
            className="flex items-center gap-4 rounded-md p-3 motion-safe:transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg className="size-5 text-neutral-600 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Insights &amp; Trends
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                Patterns, comparisons, and labeled trips
              </span>
            </div>
            <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          <Link
            href="/household"
            className="flex items-center gap-4 rounded-md p-3 motion-safe:transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg className="size-5 text-neutral-600 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Household &amp; Drivers
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                Manage drivers and invitations
              </span>
            </div>
            <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          <Link
            href="/locations"
            className="flex items-center gap-4 rounded-md p-3 motion-safe:transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg className="size-5 text-neutral-600 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Locations
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                Name places for auto-labeling
              </span>
            </div>
            <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          <Link
            href="/notifications"
            className="flex items-center gap-4 rounded-md p-3 motion-safe:transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg className="size-5 text-neutral-600 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Notifications
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                Cadence, recaps, and quiet hours
              </span>
            </div>
            <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          <Link
            href="/privacy"
            className="flex items-center gap-4 rounded-md p-3 motion-safe:transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
              <svg className="size-5 text-neutral-600 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Privacy &amp; Controls
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                What&rsquo;s tracked and who can see it
              </span>
            </div>
            <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
