"use client";

import Link from "next/link";
import { useState } from "react";

type DeviceStatus = "online" | "offline";

interface StatusRow {
  label: string;
  value: string;
  status: "good" | "warn" | "error";
}

const onlineStatuses: StatusRow[] = [
  { label: "Power", value: "Connected via OBD-II", status: "good" },
  { label: "Cellular", value: "Connected", status: "good" },
  { label: "GPS", value: "Strong signal", status: "good" },
  { label: "Firmware", value: "v2.1.4 — up to date", status: "good" },
  { label: "Last sync", value: "2 minutes ago", status: "good" },
];

const offlineStatuses: StatusRow[] = [
  { label: "Power", value: "Not detected", status: "error" },
  { label: "Cellular", value: "No connection", status: "error" },
  { label: "GPS", value: "Unavailable", status: "warn" },
  { label: "Firmware", value: "v2.1.4", status: "good" },
  { label: "Last sync", value: "3 hours ago", status: "warn" },
];

const troubleshootingSteps = [
  {
    title: "Unplug and re-seat the device",
    description: "Remove Miles from the OBD-II port, wait 10 seconds, and firmly plug it back in until you hear a click.",
  },
  {
    title: "Start the vehicle",
    description: "The device draws power from the car battery. Make sure the engine is running or the ignition is on.",
  },
  {
    title: "Drive for a few minutes",
    description: "Sometimes the device needs a short drive to establish GPS and cellular connections.",
  },
  {
    title: "Check for obstructions",
    description: "Metal garages or underground parking can block GPS and cellular signals. Try moving to an open area.",
  },
];

function statusColor(status: "good" | "warn" | "error") {
  if (status === "good") return "text-green-600 dark:text-green-400";
  if (status === "warn") return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function statusBg(status: "good" | "warn" | "error") {
  if (status === "good") return "bg-green-50 dark:bg-green-950";
  if (status === "warn") return "bg-amber-50 dark:bg-amber-950";
  return "bg-red-50 dark:bg-red-950";
}

function StatusIcon({ status }: { status: "good" | "warn" | "error" }) {
  if (status === "good") {
    return (
      <svg className={`size-4 ${statusColor(status)}`} aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }
  if (status === "warn") {
    return (
      <svg className={`size-4 ${statusColor(status)}`} aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    );
  }
  return (
    <svg className={`size-4 ${statusColor(status)}`} aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export default function DeviceHealthPage() {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>("online");
  const statuses = deviceStatus === "online" ? onlineStatuses : offlineStatuses;

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Back */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Home
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Device Health
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Check on your Miles device and troubleshoot any connection issues.
          </p>
        </div>

        {/* Overall status banner */}
        {deviceStatus === "online" ? (
          <div className="flex items-center gap-3 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
                Device is online
              </span>
              <span className="text-xs font-normal leading-normal text-green-700 dark:text-green-400">
                CR-V &middot; Everything looks good
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <svg className="size-5 text-red-600 dark:text-red-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-red-700 dark:text-red-400">
                Device is offline
              </span>
              <span className="text-xs font-normal leading-normal text-red-700 dark:text-red-400">
                CR-V &middot; Last seen 3 hours ago
              </span>
            </div>
          </div>
        )}

        {/* Status rows */}
        <div className="flex flex-col gap-1">
          {statuses.map((row) => (
            <div
              key={row.label}
              className={`flex items-center justify-between rounded-md p-3 ${statusBg(row.status)}`}
            >
              <div className="flex items-center gap-3">
                <StatusIcon status={row.status} />
                <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                  {row.label}
                </span>
              </div>
              <span className={`text-sm font-medium leading-none ${statusColor(row.status)}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Troubleshooting (shown when offline) */}
        {deviceStatus === "offline" && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
              Try these steps
            </h2>
            <div className="flex flex-col gap-1">
              {troubleshootingSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium tabular-nums leading-none text-white dark:bg-blue-500">
                    {i + 1}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                      {step.title}
                    </span>
                    <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                      {step.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support entry */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            Need more help?
          </h2>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              className="flex items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-left motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Chat with support
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Talk to a real person — typically responds in under 5 minutes
                </span>
              </div>
              <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <button
              type="button"
              className="flex items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-left motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                <svg className="size-5 text-neutral-600 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Help articles
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Browse common questions and setup guides
                </span>
              </div>
              <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          Back to Home
        </Link>

        {/* Demo cheat link */}
        <button
          type="button"
          onClick={() => setDeviceStatus((s) => (s === "online" ? "offline" : "online"))}
          className="text-xs font-normal leading-normal text-neutral-400 underline underline-offset-2 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
        >
          Demo: switch to {deviceStatus === "online" ? "offline" : "online"} state
        </button>
      </div>
    </main>
  );
}
