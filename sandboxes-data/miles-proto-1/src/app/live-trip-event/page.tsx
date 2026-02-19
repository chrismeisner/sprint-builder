"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const routePoints = [
  { x: 15, y: 78 },
  { x: 22, y: 65 },
  { x: 30, y: 58 },
  { x: 40, y: 52 },
  { x: 50, y: 45 },
  { x: 58, y: 38 },
  { x: 65, y: 42 },
  { x: 72, y: 35 },
  { x: 78, y: 30 },
  { x: 82, y: 25 },
];

const eventPoint = routePoints[7];

function buildPathD(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ");
}

export default function LiveTripEventPage() {
  const [speed, setSpeed] = useState(42);
  const [showEvent, setShowEvent] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(25, Math.min(55, prev + delta));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Back + recording badge */}
        <div className="flex items-center justify-between">
          <Link
            href="/live-trip"
            className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <svg
              className="size-4"
              aria-hidden="true"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 dark:bg-green-950">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-green-500 opacity-75 motion-safe:animate-ping dark:bg-green-400" />
              <span className="relative inline-flex size-2 rounded-full bg-green-600 dark:bg-green-400" />
            </span>
            <span className="text-xs font-medium leading-none text-green-700 dark:text-green-400">
              Recording
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Live trip
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Verify Miles is tracking. No need to watch&nbsp;&mdash; this is just for peace of mind.
          </p>
        </div>

        {/* Map with route + event marker */}
        <div className="relative flex aspect-video items-end justify-end overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="absolute inset-0 opacity-10">
            <div className="grid h-full w-full grid-cols-8 grid-rows-5">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="border border-neutral-400 dark:border-neutral-500" />
              ))}
            </div>
          </div>

          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d={buildPathD(routePoints)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-neutral-400 dark:text-neutral-500"
            />
          </svg>

          {/* Event marker on route */}
          {showEvent && (
            <div
              className="absolute flex size-6 items-center justify-center rounded-full border-2 border-white bg-amber-500 shadow-sm dark:border-neutral-900 dark:bg-amber-400"
              style={{
                left: `${eventPoint.x}%`,
                top: `${eventPoint.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <svg className="size-4 text-white dark:text-neutral-900" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          )}

          {/* Current position dot */}
          <div
            className="absolute flex size-8 items-center justify-center rounded-full bg-blue-600 shadow-md dark:bg-blue-500"
            style={{
              right: `${100 - routePoints[routePoints.length - 1].x}%`,
              top: `${routePoints[routePoints.length - 1].y}%`,
              transform: "translate(50%, -50%)",
            }}
          >
            <svg className="size-4 text-white" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Start marker */}
          <div
            className="absolute flex size-4 items-center justify-center rounded-full border-2 border-neutral-400 bg-white dark:border-neutral-500 dark:bg-neutral-900"
            style={{
              left: `${routePoints[0].x}%`,
              top: `${routePoints[0].y}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>

        {/* Event callout card — appears after delay */}
        {showEvent && (
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <svg className="size-4 text-amber-600 dark:text-amber-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium leading-none text-amber-700 dark:text-amber-400">
                Hard braking detected
              </span>
              <span className="text-xs font-normal leading-normal text-amber-700 dark:text-amber-400">
                3:47 PM &middot; Elm St &amp; 4th Ave
              </span>
              <span className="text-sm font-normal leading-normal text-amber-700 dark:text-amber-400">
                This will be included in the trip summary. No action needed.
              </span>
            </div>
          </div>
        )}

        {/* Speed display */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-5xl font-bold leading-tight tabular-nums text-neutral-900 dark:text-neutral-100">
              {speed}
            </span>
            <span className="text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              mph
            </span>
          </div>
        </div>

        {/* Trip stats row */}
        <div className="grid grid-cols-3 gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Distance
            </span>
            <span className="text-base font-medium leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
              4.2 mi
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 border-x border-neutral-200 dark:border-neutral-700">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Duration
            </span>
            <span className="text-base font-medium leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
              12 min
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Started
            </span>
            <span className="text-base font-medium leading-none tabular-nums text-neutral-900 dark:text-neutral-100">
              3:42 PM
            </span>
          </div>
        </div>

        {/* Device status — all good */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3 dark:bg-neutral-800">
            <div className="flex items-center gap-3">
              <svg className="size-4 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                GPS signal
              </span>
            </div>
            <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
              Strong
            </span>
          </div>
          <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3 dark:bg-neutral-800">
            <div className="flex items-center gap-3">
              <svg className="size-4 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-sm font-normal leading-normal text-neutral-600 dark:text-neutral-400">
                Cellular
              </span>
            </div>
            <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
              Connected
            </span>
          </div>
        </div>

        {/* Reassurance */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              Hands-free &mdash; no action needed
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              Miles records everything in the background. Only check this while
              parked.
            </span>
          </div>
        </div>

        {/* Demo cheat link */}
        <button
          type="button"
          onClick={() => setShowEvent((e) => !e)}
          className="text-xs font-normal leading-normal text-neutral-400 underline underline-offset-2 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
        >
          {showEvent
            ? "Test: simulate \u201Cno events\u201D"
            : "Test: simulate \u201Chard braking event\u201D"}
        </button>
      </div>
    </main>
  );
}
