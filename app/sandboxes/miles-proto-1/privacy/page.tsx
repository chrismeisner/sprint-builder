"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useState } from "react";

interface ToggleRowProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, description, enabled, onToggle }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-left motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-800 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
          {label}
        </span>
        <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
          {description}
        </span>
      </div>
      <div
        className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 motion-safe:transition-colors motion-safe:duration-200 ${
          enabled
            ? "bg-blue-600 dark:bg-blue-500"
            : "bg-neutral-300 dark:bg-neutral-600"
        }`}
      >
        <div
          className={`size-5 rounded-full bg-white shadow-sm motion-safe:transition-transform motion-safe:duration-200 ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}

const dataCollected = [
  { label: "Location & route", description: "Where the vehicle travels during a trip" },
  { label: "Speed & acceleration", description: "Driving behavior patterns per trip" },
  { label: "Trip timing", description: "Start time, end time, and duration" },
  { label: "Vehicle diagnostics", description: "Fuel, tire pressure, check engine codes (varies by vehicle)" },
];

export default function PrivacyPage() {
  const [locationHistory, setLocationHistory] = useState(true);
  const [speedData, setSpeedData] = useState(true);
  const [shareWithDrivers, setShareWithDrivers] = useState(false);
  const [teenCanSeeOwn, setTeenCanSeeOwn] = useState(true);
  const [teenCanSeeScore, setTeenCanSeeScore] = useState(false);
  const [parentAlerts, setParentAlerts] = useState(true);

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
            Privacy &amp; Controls
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            You&rsquo;re in charge of what Miles tracks and who can see it.
            Adjust these anytime.
          </p>
        </div>

        {/* What we collect */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            What Miles collects
          </h2>
          <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            Miles only collects data while the vehicle is in motion. Nothing is
            recorded when parked.
          </p>
          <div className="flex flex-col gap-1">
            {dataCollected.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                  <svg className="size-4 text-neutral-600 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                    {item.label}
                  </span>
                  <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                    {item.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your data controls */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            Your data
          </h2>
          <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            Control what&rsquo;s stored and visible in your account.
          </p>
          <div className="flex flex-col gap-1">
            <ToggleRow
              label="Location history"
              description="Store full route maps for past trips"
              enabled={locationHistory}
              onToggle={() => setLocationHistory(!locationHistory)}
            />
            <ToggleRow
              label="Speed & behavior data"
              description="Record speed, braking, and acceleration details"
              enabled={speedData}
              onToggle={() => setSpeedData(!speedData)}
            />
          </div>
        </div>

        {/* Visibility rules */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            Visibility
          </h2>
          <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            Choose who can see what. By default, each driver only sees their own
            trips.
          </p>
          <div className="flex flex-col gap-1">
            <ToggleRow
              label="Share trips with other drivers"
              description="Let household members see each other's trip summaries"
              enabled={shareWithDrivers}
              onToggle={() => setShareWithDrivers(!shareWithDrivers)}
            />
          </div>
        </div>

        {/* Teen controls */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
            Teen driver controls
          </h2>
          <p className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
            Balance oversight with trust. These settings apply to any driver
            marked as a teen.
          </p>
          <div className="flex flex-col gap-1">
            <ToggleRow
              label="Teen can view own trips"
              description="Let teen drivers see their trip history and route maps"
              enabled={teenCanSeeOwn}
              onToggle={() => setTeenCanSeeOwn(!teenCanSeeOwn)}
            />
            <ToggleRow
              label="Teen can view driving score"
              description="Show the teen their driving behavior score"
              enabled={teenCanSeeScore}
              onToggle={() => setTeenCanSeeScore(!teenCanSeeScore)}
            />
            <ToggleRow
              label="Parent safety alerts"
              description="Get notified for hard braking, speeding, or late-night driving"
              enabled={parentAlerts}
              onToggle={() => setParentAlerts(!parentAlerts)}
            />
          </div>
        </div>

        {/* Fairness note */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              Built for fairness, not surveillance
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              Miles is designed to build trust between drivers and families.
              We&rsquo;ll never sell your data, and you can request a full
              export or deletion at any time.
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Save &amp; return home
          </Link>
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-md text-sm font-medium leading-none text-red-600 motion-safe:transition-colors motion-safe:duration-150 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-red-400 dark:hover:text-red-300 dark:focus-visible:ring-offset-neutral-900"
          >
            Request data export or deletion
          </button>
        </div>
      </div>
    </main>
  );
}
