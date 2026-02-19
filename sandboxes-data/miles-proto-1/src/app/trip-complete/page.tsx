"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function TripCompletePage() {
  const [time, setTime] = useState("3:58");
  const [date, setDate] = useState("Monday, February 17");

  useEffect(() => {
    function update() {
      const now = new Date();
      const h = now.getHours() % 12 || 12;
      const m = now.getMinutes().toString().padStart(2, "0");
      setTime(`${h}:${m}`);
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    }
    update();
    const interval = setInterval(update, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col bg-neutral-200">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">

        {/* Push notification — top */}
        <div className="px-4 pt-14">
          <Link
            href="/trip-receipt"
            className="flex gap-3 rounded-lg bg-white/80 p-3 shadow-sm motion-safe:transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-200"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-600">
              <svg
                className="size-4 text-white"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium leading-none text-neutral-900">
                  Miles
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500">
                  now
                </span>
              </div>
              <span className="text-xs font-normal leading-normal text-neutral-600">
                Trip complete &mdash; 4.2 mi in 12 min. Tap to view summary.
              </span>
            </div>
          </Link>
        </div>

        {/* Lock screen clock */}
        <div className="flex flex-col items-center gap-2 px-6 pt-10">
          <span className="text-5xl font-bold leading-tight text-balance tabular-nums text-neutral-900">
            {time}
          </span>
          <span className="text-sm font-normal leading-normal text-neutral-600">
            {date}
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Live Activity — trip ended state, anchored to bottom */}
        <div className="flex flex-col gap-2 px-4 pb-[33%]">
          <Link
            href="/trip-receipt"
            className="flex flex-col gap-3 rounded-lg bg-white/80 p-4 shadow-sm motion-safe:transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-200"
          >
            {/* Header: app icon + name + complete badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-blue-600">
                  <svg
                    className="size-4 text-white"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                  </svg>
                </div>
                <span className="text-sm font-medium leading-none text-neutral-900">
                  Miles
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-1">
                <svg className="size-4 text-blue-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span className="text-xs font-medium leading-none text-blue-700">
                  Trip complete
                </span>
              </div>
            </div>

            {/* Final stats */}
            <div className="flex items-baseline gap-4">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium leading-snug tabular-nums text-neutral-900">
                  12
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500">
                  min
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-medium leading-snug tabular-nums text-neutral-900">
                  4.2
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500">
                  mi
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-normal leading-normal text-neutral-500">
                  3:42 &ndash; 3:54 PM
                </span>
              </div>
            </div>

            {/* Attribution + chevron */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal leading-normal text-neutral-500">
                Chris &middot; 2022 Honda CR-V
              </span>
              <svg
                className="size-4 text-neutral-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Link>
        </div>

      </div>
    </main>
  );
}
