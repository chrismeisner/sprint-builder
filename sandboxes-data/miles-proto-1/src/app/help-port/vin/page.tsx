"use client";

import Link from "next/link";
import { useState } from "react";

export default function VinScanPage() {
  const [mode, setMode] = useState<"choice" | "scan" | "manual" | "result">("choice");
  const [vin, setVin] = useState("");

  function handleScan() {
    setMode("result");
  }

  function handleManualSubmit() {
    if (vin.length >= 17) {
      setMode("result");
    }
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/help-port"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Scan your VIN
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Your Vehicle Identification Number helps us pinpoint the exact port
            location.
          </p>
        </div>

        {/* Choice mode */}
        {mode === "choice" && (
          <div className="flex flex-col gap-4">
            {/* Camera scan option */}
            <button
              type="button"
              onClick={handleScan}
              className="flex flex-col items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-6 motion-safe:transition-colors motion-safe:duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              {/* Camera icon */}
              <div className="flex size-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                <svg
                  className="size-8 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1 text-center">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Scan with camera
                </span>
                <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Point your camera at the VIN on your windshield or door jamb
                </span>
              </div>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
              <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
                or
              </span>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
            </div>

            {/* Manual entry option */}
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="flex items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 motion-safe:transition-colors motion-safe:duration-150 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-700">
                <svg
                  className="size-6 text-neutral-600 dark:text-neutral-400"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
              </div>
              <div className="flex flex-col gap-1 text-left">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  Type it in
                </span>
                <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  Enter your 17-character VIN manually
                </span>
              </div>
            </button>

            {/* Where to find VIN */}
            <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <svg
                className="size-5 shrink-0 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
                  Where to find your VIN
                </span>
                <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
                  Look at the bottom-left of your windshield (visible from
                  outside), or on a sticker inside the driver&rsquo;s door jamb.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Manual entry mode */}
        {mode === "manual" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="vin-input"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                Vehicle Identification Number (VIN)
              </label>
              <input
                id="vin-input"
                type="text"
                maxLength={17}
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="e.g. 1HGBH41JXMN109186"
                className="h-12 rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-normal tracking-wide text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
              />
              <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500">
                {vin.length}/17 characters
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={vin.length < 17}
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Look up VIN
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("choice");
                setVin("");
              }}
              className="flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Use camera instead
            </button>
          </div>
        )}

        {/* Scan mode — simulated camera UI */}
        {mode === "scan" && (
          <div className="flex flex-col gap-4">
            {/* Simulated viewfinder */}
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-900 dark:border-neutral-700">
              {/* Scan frame overlay */}
              <div className="absolute inset-6 rounded-md border-2 border-dashed border-white opacity-50" />
              <div className="flex flex-col items-center gap-3">
                <svg
                  className="size-12 text-white opacity-60"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                <span className="text-sm font-medium leading-none text-white opacity-80">
                  Point at VIN on windshield
                </span>
              </div>
            </div>

            {/* Simulated scan action */}
            <button
              type="button"
              onClick={handleScan}
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Simulate scan
            </button>

            <button
              type="button"
              onClick={() => setMode("manual")}
              className="flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Type VIN instead
            </button>
          </div>
        )}

        {/* Result mode */}
        {mode === "result" && (
          <div className="flex flex-col gap-4">
            {/* Identified vehicle */}
            <div className="flex flex-col gap-4 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-3">
                <svg
                  className="size-6 shrink-0 text-green-600 dark:text-green-400"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
                  Vehicle identified
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-lg font-medium leading-snug text-green-700 dark:text-green-400">
                  2022 Honda CR-V
                </span>
                <p className="text-base font-normal leading-normal text-pretty text-green-700 dark:text-green-400">
                  The OBD-II port is located under the dashboard on the
                  driver&rsquo;s side, just above the knee area. Look below the
                  steering column.
                </p>
              </div>
            </div>

            {/* Reference image */}
            <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
              <img
                src="/journey-first-trip-1b.jpg"
                alt="OBD-II port location reference for 2022 Honda CR-V"
                className="w-full"
              />
            </div>

            {/* CTA */}
            <Link
              href="/find-port"
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Got it &mdash; back to install
            </Link>

            {/* Try again */}
            <button
              type="button"
              onClick={() => {
                setMode("choice");
                setVin("");
              }}
              className="flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              That&rsquo;s not my vehicle
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
