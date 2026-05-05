"use client";

import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import { AskMilesBadge } from "@/app/sandboxes/miles-proto-4/_components/ask-miles-badge";

interface Driver {
  id: string;
  name: string;
  initials: string;
  color: string;
  relation: string;
  score: number;
  scoreDelta: number;
  tripsThisWeek: number;
  distanceThisWeek: string;
  events: number;
  lastTrip: string;
  milesContext: string;
}

const DRIVERS: Driver[] = [
  {
    id: "christina",
    name: "Christina Meisner",
    initials: "CM",
    color: "bg-green-600",
    relation: "You",
    score: 82,
    scoreDelta: 4,
    tripsThisWeek: 6,
    distanceThisWeek: "38.4 mi",
    events: 1,
    lastTrip: "Home → Target, today",
    milesContext: "driver-score",
  },
  {
    id: "emma",
    name: "Emma Meisner",
    initials: "EM",
    color: "bg-purple-500",
    relation: "Spouse",
    score: 79,
    scoreDelta: -2,
    tripsThisWeek: 9,
    distanceThisWeek: "52.1 mi",
    events: 3,
    lastTrip: "Home → Work, yesterday",
    milesContext: "driver-score",
  },
  {
    id: "jack",
    name: "Jack Meisner",
    initials: "JM",
    color: "bg-blue-500",
    relation: "Child",
    score: 74,
    scoreDelta: 6,
    tripsThisWeek: 4,
    distanceThisWeek: "21.8 mi",
    events: 2,
    lastTrip: "School → Home, today",
    milesContext: "kid-trip",
  },
];

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 85 ? "#16a34a" : score >= 70 ? "#2563eb" : "#d97706";

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0 -rotate-90">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function DriversPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-neutral-50 pb-24">
      {/* Page header — flat layout matching /trips for consistent height
          across the Trips / Drivers / Profile tabs. */}
      <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-6">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Drivers
        </h1>
        <AskMilesBadge
          context="drivers"
          ariaLabel="Ask Miles about your drivers"
        />
      </div>

      <div className="flex flex-col gap-6 px-5">
        {/* Driver cards */}
        <div className="flex flex-col gap-3">
          {DRIVERS.map((d) => (
            <Link
              key={d.id}
              href="/driver-score"
              className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:bg-neutral-50"
            >
              {/* Top row: avatar + name + score ring */}
              <div className="flex items-center gap-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${d.color} text-sm font-semibold text-white`}>
                  {d.initials}
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-semibold leading-none text-neutral-900">{d.name}</span>
                  <span className="text-xs text-neutral-400">{d.relation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <ScoreRing score={d.score} />
                    <span className="absolute text-sm font-bold leading-none text-neutral-900">{d.score}</span>
                  </div>
                  <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-0.5 rounded-lg bg-neutral-50 px-3 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Trips</span>
                  <span className="text-sm font-semibold text-neutral-900">{d.tripsThisWeek}</span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-lg bg-neutral-50 px-3 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Distance</span>
                  <span className="text-sm font-semibold text-neutral-900">{d.distanceThisWeek}</span>
                </div>
                <div className="flex flex-col gap-0.5 rounded-lg bg-neutral-50 px-3 py-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Events</span>
                  <span className={`text-sm font-semibold ${d.events > 0 ? "text-amber-600" : "text-neutral-900"}`}>
                    {d.events}
                  </span>
                </div>
              </div>

              {/* Last trip + score delta */}
              <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                <span className="text-xs text-neutral-400">{d.lastTrip}</span>
                <span className={`text-xs font-semibold ${d.scoreDelta > 0 ? "text-green-600" : "text-red-500"}`}>
                  {d.scoreDelta > 0 ? "+" : ""}{d.scoreDelta} pts this week
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Add driver */}
        <Link
          href="/add-drivers"
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 py-4 text-sm font-medium text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add a driver
        </Link>

      </div>
    </main>
  );
}
