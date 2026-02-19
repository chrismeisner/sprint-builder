"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ScanDevicePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [code, setCode] = useState("");

  function handleScanSuccess() {
    router.push("/linking-device");
  }

  function handleManualSubmit() {
    if (code.length >= 6) {
      router.push("/linking-device");
    }
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/find-port"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <p className="text-xs font-medium uppercase tracking-wide leading-none text-blue-600 dark:text-blue-400">
            Step 2 of install
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Link your device
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            This connects your Miles device to your account so we can track your
            trips.
          </p>
        </div>

        {/* Scanner mode */}
        {mode === "scan" && (
          <div className="flex flex-col gap-6">
            {/* Simulated QR viewfinder */}
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-900 dark:border-neutral-700">
              {/* Corner brackets */}
              <div className="absolute inset-8">
                {/* Top-left */}
                <div className="absolute left-0 top-0 size-8 border-l-2 border-t-2 border-white rounded-tl-sm" />
                {/* Top-right */}
                <div className="absolute right-0 top-0 size-8 border-r-2 border-t-2 border-white rounded-tr-sm" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 left-0 size-8 border-b-2 border-l-2 border-white rounded-bl-sm" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 right-0 size-8 border-b-2 border-r-2 border-white rounded-br-sm" />
              </div>

              {/* Center content */}
              <div className="flex flex-col items-center gap-4">
                <svg
                  className="size-12 text-white opacity-50"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5Z" />
                </svg>
                <span className="text-sm font-medium leading-none text-white opacity-70">
                  Point camera at QR code on your Miles device
                </span>
              </div>
            </div>

            {/* Simulate scan button */}
            <button
              type="button"
              onClick={handleScanSuccess}
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Simulate scan
            </button>

            {/* Can't scan fallback */}
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Can&rsquo;t scan? Enter code manually
            </button>
          </div>
        )}

        {/* Manual entry mode */}
        {mode === "manual" && (
          <div className="flex flex-col gap-6">
            {/* Info callout */}
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
                  Where to find the code
                </span>
                <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
                  The 6-digit code is printed on the back of your Miles device,
                  below the QR code.
                </span>
              </div>
            </div>

            {/* Code input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="device-code"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                Device code
              </label>
              <input
                id="device-code"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                }
                placeholder="e.g. A3X9K2"
                className="h-12 rounded-md border border-neutral-300 bg-white px-4 text-center text-2xl font-semibold leading-snug tracking-wide text-neutral-900 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
              />
              <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500">
                {code.length}/6 characters
              </span>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleManualSubmit}
              disabled={code.length < 6}
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Link device
            </button>

            {/* Back to scanner */}
            <button
              type="button"
              onClick={() => {
                setMode("scan");
                setCode("");
              }}
              className="flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              Try scanning instead
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
