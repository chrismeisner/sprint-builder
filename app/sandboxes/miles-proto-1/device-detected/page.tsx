"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { assetPath } from "@/app/sandboxes/miles-proto-1/_lib/asset-path";
import { StickyFooter } from "@/app/sandboxes/miles-proto-1/_components/sticky-footer";
import { useState } from "react";

const capabilities = [
  {
    label: "Trip logging",
    description: "Automatic start/stop detection",
    icon: (
      <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
      </svg>
    ),
  },
  {
    label: "Mileage tracking",
    description: "Odometer readings via OBD-II",
    icon: (
      <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
  },
  {
    label: "Engine health",
    description: "Check engine codes and diagnostics",
    icon: (
      <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
  {
    label: "Fuel level",
    description: "Approximate fuel percentage",
    icon: (
      <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    ),
  },
  {
    label: "Battery voltage",
    description: "12V battery monitoring",
    icon: (
      <svg className="size-5 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
  },
];

const colorOptions = [
  { label: "White",  bg: "bg-white",      border: "border-neutral-300 dark:border-neutral-500", hex: "#ffffff" },
  { label: "Silver", bg: "bg-neutral-400", border: "border-neutral-400", hex: "#9ca3af" },
  { label: "Black",  bg: "bg-neutral-900", border: "border-neutral-900 dark:border-neutral-600", hex: "#111827" },
  { label: "Blue",   bg: "bg-blue-600",    border: "border-blue-600",    hex: "#2563eb" },
  { label: "Red",    bg: "bg-red-600",     border: "border-red-600",     hex: "#dc2626" },
  { label: "Green",  bg: "bg-green-600",   border: "border-green-600",   hex: "#16a34a" },
  { label: "Orange", bg: "bg-orange-400",  border: "border-orange-400",  hex: "#fb923c" },
];

const DEFAULT_COLOR = "#ffffff";

export default function DeviceDetectedPage() {
  const [nickname, setNickname] = useState("");
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);

  const activeColor = colorOptions.find((c) => c.hex === selectedColor);

  return (
    <>
    <main className="flex min-h-dvh flex-col px-6 pb-8 pt-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {/* Hero */}
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700">
            <img
              src={assetPath("/images/civic.png")}
              alt="2022 Honda Civic Sport"
              className="w-full object-cover"
            />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1.5 shadow-lg">
                <svg className="size-3.5 text-white" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-xs font-semibold leading-none text-white">Miles connected</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              You&rsquo;re all set
            </h1>
            <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
              Miles is installed and connected to your 2022 Honda Civic Sport. Every drive will be logged automatically.
            </p>
          </div>
        </div>

        {/* Vehicle specs */}
        <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide leading-none text-neutral-400 dark:text-neutral-500">
            Vehicle
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              { label: "Year",     value: "2022" },
              { label: "Make",     value: "Honda" },
              { label: "Model",    value: "Civic Sport" },
              { label: "Odometer", value: "21,504 mi" },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium leading-none text-neutral-400 dark:text-neutral-500">{label}</span>
                <span className="text-sm font-semibold leading-none text-neutral-900 dark:text-neutral-100">{value}</span>
              </div>
            ))}
            <div className="col-span-2 flex flex-col gap-0.5">
              <span className="text-xs font-medium leading-none text-neutral-400 dark:text-neutral-500">VIN</span>
              <span className="font-mono text-sm font-semibold leading-none tracking-wide text-neutral-900 dark:text-neutral-100">
                2HGFE2F59NH034712
              </span>
            </div>
          </div>
        </div>

        {/* Personalize */}
        <div className="flex flex-col gap-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="text-xs font-semibold uppercase tracking-wide leading-none text-neutral-400 dark:text-neutral-500">
            Personalize
          </span>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="vehicle-nickname" className="text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
              Nickname
            </label>
            <input
              id="vehicle-nickname"
              type="text"
              placeholder="e.g. Daily driver, Work car…"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm font-normal leading-normal text-neutral-900 outline-none placeholder:text-neutral-400 motion-safe:transition-shadow motion-safe:duration-200 focus:ring-2 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:ring-blue-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium leading-none text-neutral-700 dark:text-neutral-300">
              Color
            </span>
            <div className="flex items-center gap-2">
              {colorOptions.map((color) => {
                const isSelected = selectedColor === color.hex;
                return (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setSelectedColor(color.hex)}
                    aria-label={color.label}
                    aria-pressed={isSelected}
                    className={`relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 motion-safe:transition-all motion-safe:duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-offset-neutral-800 ${color.bg} ${isSelected ? "border-blue-500 ring-2 ring-blue-500/30 dark:border-blue-400 dark:ring-blue-400/30" : color.border}`}
                  >
                    {isSelected && (
                      <svg className={`size-3.5 ${color.hex === "#ffffff" ? "text-neutral-600" : "text-white"}`} aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-normal leading-none text-neutral-500 dark:text-neutral-400">
              {activeColor?.label ?? "Select a color"}
            </span>
          </div>
        </div>

        {/* Drivers */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide leading-none text-neutral-400 dark:text-neutral-500">
            Drivers
          </span>
          <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Chris
              </span>
              <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                Primary driver
              </span>
            </div>
          </div>
          <Link
            href="/add-drivers?from=setup"
            className="flex items-center gap-3 rounded-md border border-dashed border-neutral-200 bg-neutral-50 p-4 motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800/50 dark:hover:bg-neutral-800"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
              <svg className="size-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-sm font-medium leading-none text-neutral-600 dark:text-neutral-400">
              Add another driver
            </span>
          </Link>
        </div>

        {/* What your car supports */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide leading-none text-neutral-400 dark:text-neutral-500">
            What Miles can read from this car
          </span>
          <div className="grid grid-cols-1 gap-1">
            {capabilities.map((cap) => (
              <div
                key={cap.label}
                className="flex items-center gap-3 rounded-md bg-green-50 px-3 py-2.5 dark:bg-green-950"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-neutral-900">
                  {cap.icon}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                    {cap.label}
                  </span>
                  <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-400">
                    {cap.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What happens next */}
        <div className="flex flex-col gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <span className="text-sm font-semibold leading-none text-blue-700 dark:text-blue-400">
            What happens next
          </span>
          <ol className="flex flex-col gap-2">
            {[
              "Take your first drive — Miles logs it automatically",
              "Park and check your trip summary and route",
              "See your driving score improve over time",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold leading-none text-white dark:bg-blue-500">
                  {i + 1}
                </span>
                <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
                  {text}
                </span>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </main>

    <StickyFooter>
      <Link
        href="/dashboard?state=no-trips"
        className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
      >
        Complete setup
      </Link>
    </StickyFooter>
    </>
  );
}
