"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useRouter } from "next/navigation";
import { p } from "@/app/sandboxes/miles-proto-1/_lib/nav";
import { Suspense, useState } from "react";
import { StickyFooter } from "@/app/sandboxes/miles-proto-1/_components/sticky-footer";

function ScanDeviceContent() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSimulateScan() {
    setCode("A3X9K2");
  }

  function handleSubmit() {
    if (code.length >= 6) {
      router.push(p("/billing"));
    }
  }

  return (
    <>
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Register Miles
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Enter the code on the back of Miles to link it to your account. You can also scan the QR code to fill it in automatically.
          </p>
        </div>

        {/* QR scanner — always visible, tap to fill code */}
        <div
          className="relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-900 dark:border-neutral-700"
          onClick={handleSimulateScan}
        >
          {/* Corner brackets */}
          <div className="absolute inset-8">
            <div className="absolute left-0 top-0 size-8 rounded-tl-sm border-l-2 border-t-2 border-white" />
            <div className="absolute right-0 top-0 size-8 rounded-tr-sm border-r-2 border-t-2 border-white" />
            <div className="absolute bottom-0 left-0 size-8 rounded-bl-sm border-b-2 border-l-2 border-white" />
            <div className="absolute bottom-0 right-0 size-8 rounded-br-sm border-b-2 border-r-2 border-white" />
          </div>
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
            autoFocus
            className="h-14 rounded-md border border-neutral-300 bg-white px-4 text-center text-2xl font-semibold leading-snug tracking-widest text-neutral-900 placeholder:text-base placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-normal leading-normal tabular-nums text-neutral-500 dark:text-neutral-500">
              {code.length}/6 characters
            </span>
            <span className="text-xs font-normal leading-normal text-neutral-400 dark:text-neutral-500">
              Found on the back of your device
            </span>
          </div>
        </div>

      </div>
    </main>

    <StickyFooter>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={code.length < 6}
        className={`flex h-12 w-full items-center justify-center rounded-md px-6 text-base font-medium leading-none motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
          code.length >= 6
            ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            : "cursor-not-allowed border border-neutral-200 bg-neutral-50 text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500"
        }`}
      >
        Continue
      </button>
      <Link
        href="/billing"
        className="flex h-10 w-full items-center justify-center text-sm font-medium leading-none text-neutral-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
      >
        I&rsquo;ll do this later
      </Link>
    </StickyFooter>
    </>
  );
}

export default function ScanDevicePage() {
  return (
    <Suspense>
      <ScanDeviceContent />
    </Suspense>
  );
}
