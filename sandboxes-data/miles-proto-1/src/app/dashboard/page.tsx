"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapView } from "@/components/map-view";

// Suburban Plano, TX: neighborhood streets heading toward a retail area
const DEMO_ROUTE: [number, number][] = [
  [33.0152, -96.7108],
  [33.0168, -96.7088],
  [33.0183, -96.7065],
  [33.0185, -96.7038],
  [33.0185, -96.7010],
  [33.0185, -96.6982],
  [33.0198, -96.6960],
  [33.0218, -96.6945],
  [33.0240, -96.6932],
];

interface MilesInsight {
  id: string;
  emoji: string;
  title: string;
  body: string;
  cta?: string;
  href: string;
  accent: "blue" | "amber" | "green" | "purple";
}

const insightCards: MilesInsight[] = [
  {
    id: "fuel",
    emoji: "⛽",
    title: "Fuel getting low",
    body: "Your Civic is around 18% fuel. There's a Shell station 0.4 mi from your usual route home.",
    cta: "See nearby stations",
    href: "/next-trip-headsup",
    accent: "amber",
  },
  {
    id: "drivers",
    emoji: "👥",
    title: "Who else drives the Civic?",
    body: "Adding drivers helps Miles assign trips correctly so your mileage and insights stay accurate.",
    cta: "Add a driver",
    href: "/household",
    accent: "blue",
  },
  {
    id: "recap",
    emoji: "📊",
    title: "Your week in review",
    body: "4 trips · 38.6 mi · Tuesday was your busiest day. You drove 12% less than last week.",
    cta: "See full recap",
    href: "/weekly-recap",
    accent: "purple",
  },
  {
    id: "locations",
    emoji: "📍",
    title: "Name your frequent spots",
    body: "You've visited the same place 6 times this week. Label it so Miles can auto-tag future trips.",
    cta: "Name locations",
    href: "/locations",
    accent: "blue",
  },
  {
    id: "smooth",
    emoji: "🌟",
    title: "Smooth driving streak",
    body: "3 trips in a row with no hard braking or rapid acceleration. Nice work, Chris.",
    href: "/insights",
    accent: "green",
  },
  {
    id: "oil",
    emoji: "🔧",
    title: "Oil change coming up",
    body: "Based on your mileage, you're about 400 mi from your next recommended oil change.",
    href: "/device-health",
    accent: "amber",
  },
];

const accentStyles = {
  blue: {
    card: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/60",
    title: "text-blue-800 dark:text-blue-300",
    body: "text-blue-700/80 dark:text-blue-400/80",
    cta: "text-blue-700 dark:text-blue-300",
  },
  amber: {
    card: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/60",
    title: "text-amber-800 dark:text-amber-300",
    body: "text-amber-700/80 dark:text-amber-400/80",
    cta: "text-amber-700 dark:text-amber-300",
  },
  green: {
    card: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/60",
    title: "text-green-800 dark:text-green-300",
    body: "text-green-700/80 dark:text-green-400/80",
    cta: "text-green-700 dark:text-green-300",
  },
  purple: {
    card: "border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-950/60",
    title: "text-purple-800 dark:text-purple-300",
    body: "text-purple-700/80 dark:text-purple-400/80",
    cta: "text-purple-700 dark:text-purple-300",
  },
};

function FromMiles() {
  const [index, setIndex] = useState(0);
  const total = insightCards.length;
  const card = insightCards[index];
  const s = accentStyles[card.accent];

  function prev() {
    setIndex((i) => (i - 1 + total) % total);
  }
  function next() {
    setIndex((i) => (i + 1) % total);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
          From Miles
        </span>
        <div className="flex items-center gap-2">
          {/* Dot indicators */}
          <div className="flex items-center gap-1">
            {insightCards.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to card ${i + 1}`}
                className={`size-1.5 rounded-full transition-all motion-safe:duration-200 focus-visible:outline-none ${
                  i === index
                    ? "bg-neutral-500 dark:bg-neutral-400 w-3"
                    : "bg-neutral-300 dark:bg-neutral-600"
                }`}
              />
            ))}
          </div>
          {/* Prev / Next */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous"
            className="flex size-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 focus-visible:outline-none"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next"
            className="flex size-6 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 focus-visible:outline-none"
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Card */}
      <Link
        key={card.id}
        href={card.href}
        className={`flex flex-col gap-3 rounded-lg border p-4 motion-safe:transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${s.card}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none" aria-hidden="true">{card.emoji}</span>
          <span className={`text-sm font-semibold leading-snug ${s.title}`}>
            {card.title}
          </span>
        </div>
        <span className={`text-sm font-normal leading-relaxed ${s.body}`}>
          {card.body}
        </span>
        {card.cta && (
          <span className={`text-xs font-semibold leading-none ${s.cta}`}>
            {card.cta} &rarr;
          </span>
        )}
      </Link>
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg className="size-5 text-neutral-500 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function QuickLinks() {
  return (
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
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state") === "empty" ? "empty" : "filled";
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const showWelcome = searchParams.get("welcome") === "1" && !welcomeDismissed;

  return (
    <>
    {showWelcome && (
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-neutral-900/60 px-8 pb-6 dark:bg-neutral-950/75 sm:items-center sm:pb-0"
        onClick={() => setWelcomeDismissed(true)}
      >
        <div
          className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-6">
            {/* Icon */}
            <div className="flex size-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
              <svg
                className="size-7 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
            </div>

            {/* Copy */}
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold leading-snug text-neutral-900 dark:text-neutral-100">
                Install Miles in your car
              </h2>
              <p className="text-sm font-normal leading-relaxed text-neutral-600 dark:text-neutral-400">
                Plug the Miles device into your car&rsquo;s OBD-II port and every drive will be tracked automatically. Takes about 5 minutes.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link
                href="/install?state=empty"
                className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
              >
                Start setup
              </Link>
              <button
                type="button"
                onClick={() => setWelcomeDismissed(true)}
                className="flex h-12 w-full items-center justify-center rounded-md border border-neutral-200 bg-white px-6 text-base font-medium leading-none text-neutral-600 motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
              >
                I&rsquo;ll do this later
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
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
            <SettingsIcon />
          </Link>
        </div>

        {state === "filled" ? (
          <>
            {/* Vehicle card */}
            <Link
              href="/device-health"
              className="flex flex-col rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              {/* Car image */}
              <div className="relative w-full aspect-[3/2] bg-white dark:bg-neutral-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/api/sandbox-files/styleguide/images/civic.png"
                  alt="2019 Honda Civic Sport"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
              {/* Details */}
              <div className="flex items-center gap-3 px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-semibold leading-none text-neutral-900 dark:text-neutral-100">
                    2019 Honda Civic Sport
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium leading-none text-green-600 dark:text-green-400">
                      <span className="size-1.5 rounded-full bg-green-500" />
                      Online
                    </span>
                    <span className="text-xs text-neutral-300 dark:text-neutral-600">&middot;</span>
                    <span className="text-xs font-normal leading-none text-neutral-500 dark:text-neutral-500">
                      62,340 mi
                    </span>
                    <span className="text-xs text-neutral-300 dark:text-neutral-600">&middot;</span>
                    <span className="text-xs font-normal leading-none text-neutral-500 dark:text-neutral-500">
                      Synced 2m ago
                    </span>
                  </div>
                </div>
                <svg className="size-4 shrink-0 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>

            {/* From Miles — contextual insights carousel */}
            <FromMiles />

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
              <Link
                href="/trip-receipt"
                className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md">
                  <MapView
                    route={DEMO_ROUTE}
                    markers={[
                      { lat: DEMO_ROUTE[0][0], lng: DEMO_ROUTE[0][1], type: "start" },
                      { lat: DEMO_ROUTE[DEMO_ROUTE.length - 1][0], lng: DEMO_ROUTE[DEMO_ROUTE.length - 1][1], type: "end" },
                    ]}
                    interactive={false}
                    routeWeight={3}
                  />
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

            {/* Drivers — filled state */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
                  Drivers
                </span>
                <Link
                  href="/household"
                  className="text-xs font-medium leading-none text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Manage
                </Link>
              </div>
              {/* Primary driver row */}
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
              {/* Add another driver */}
              <Link
                href="/add-drivers"
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
          </>
        ) : (
          <>
            {/* Setup incomplete banner */}
            <Link
              href="/install?state=empty"
              className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 motion-safe:transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-amber-800 dark:bg-amber-950 dark:hover:bg-amber-900 dark:focus-visible:ring-amber-400 dark:focus-visible:ring-offset-neutral-900"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                <svg className="size-5 text-amber-600 dark:text-amber-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-amber-800 dark:text-amber-300">
                  Finish setting up Miles
                </span>
                <span className="text-xs font-normal leading-normal text-amber-700 dark:text-amber-400">
                  A few steps left before your trips are tracked
                </span>
              </div>
              <svg className="size-4 shrink-0 text-amber-500 dark:text-amber-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>

            {/* No device connected */}
            <div className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                <svg className="size-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-neutral-500 dark:text-neutral-400">
                  No device connected
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-400 dark:text-neutral-500">
                  Install your Miles device to start tracking
                </span>
              </div>
            </div>

            {/* Recent trips — empty state */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
                  Recent trips
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center dark:border-neutral-700 dark:bg-neutral-800/50">
                <svg className="size-8 text-neutral-300 dark:text-neutral-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <p className="text-sm font-normal leading-normal text-neutral-400 dark:text-neutral-500">
                  Your trips will appear here once your device is installed and you&rsquo;ve taken your first drive.
                </p>
              </div>
            </div>

            {/* Drivers — empty state with account owner pre-populated */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
                  Drivers
                </span>
                <Link
                  href="/household"
                  className="text-xs font-medium leading-none text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Manage
                </Link>
              </div>
              {/* Primary driver — from account creation */}
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
              {/* Add a secondary driver */}
              <Link
                href="/add-drivers"
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

            {/* This week — zeroed */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
                This week
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                    Trips
                  </span>
                  <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-300 dark:text-neutral-600">
                    0
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                    Miles
                  </span>
                  <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-300 dark:text-neutral-600">
                    0
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                    Time
                  </span>
                  <span className="text-xl font-semibold leading-snug tabular-nums text-neutral-300 dark:text-neutral-600">
                    0m
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Quick links — same for both states */}
        <QuickLinks />

        {/* Proto state toggle */}
        <Link
          href={state === "filled" ? "/dashboard?state=empty" : "/dashboard?state=filled"}
          className="text-center text-xs font-normal leading-normal text-neutral-400 underline underline-offset-2 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-600 dark:hover:text-neutral-400"
        >
          Proto: switch to {state === "filled" ? "empty" : "filled"} state
        </Link>

      </div>
    </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
