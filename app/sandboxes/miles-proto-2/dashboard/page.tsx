"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "@/app/sandboxes/miles-proto-2/_components/link";
import { MapView } from "@/app/sandboxes/miles-proto-2/_components/map-view";
import { p } from "@/app/sandboxes/miles-proto-2/_lib/nav";

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

interface Vehicle {
  id: string;
  name: string;
  year: number;
  make: string;
  model: string;
  parkedAt: { lat: number; lng: number };
  locationLabel: string;
  locationType: "saved" | "intersection";
  lastUpdated: string;
  engine: "good" | "attention" | null;
  battery: "good" | "fair" | "low" | null;
  fuelPct: number | null;
  deviceOnline: boolean;
  driverScore: number;
  scoreUpdated: string;
  lastTrip: {
    from: string;
    to: string;
    time: string;
    duration: string;
    distance: string;
    score: number;
    events: number;
  };
}

const VEHICLES: Vehicle[] = [
  {
    id: "civic",
    name: "Civic",
    year: 2019,
    make: "Honda",
    model: "Civic Sport",
    parkedAt: { lat: 33.0152, lng: -96.7108 },
    locationLabel: "Home",
    locationType: "saved",
    lastUpdated: "Just now",
    engine: "good",
    battery: "good",
    fuelPct: 62,
    deviceOnline: true,
    driverScore: 82,
    scoreUpdated: "Updated today",
    lastTrip: {
      from: "Home",
      to: "Target",
      time: "Today, 3:42 PM",
      duration: "12 min",
      distance: "4.2 mi",
      score: 88,
      events: 1,
    },
  },
  {
    id: "rav4",
    name: "RAV4",
    year: 2021,
    make: "Toyota",
    model: "RAV4 XLE",
    parkedAt: { lat: 33.0218, lng: -96.6945 },
    locationLabel: "Elm St & 4th Ave",
    locationType: "intersection",
    lastUpdated: "3 min ago",
    engine: "good",
    battery: "fair",
    fuelPct: 38,
    deviceOnline: true,
    driverScore: 74,
    scoreUpdated: "Updated today",
    lastTrip: {
      from: "Work",
      to: "Elm St & 4th Ave",
      time: "Today, 5:18 PM",
      duration: "24 min",
      distance: "11.3 mi",
      score: 71,
      events: 3,
    },
  },
];

interface CoachingCard {
  id: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  dismissLabel: string;
}

const COACHING: CoachingCard = {
  id: "fuel-reminder",
  message:
    "Your fuel was at 38% after your last trip. Want me to remind you to fill up tomorrow morning?",
  actionLabel: "Remind me",
  actionHref: "/miles?context=fuel",
  dismissLabel: "Dismiss",
};

interface TodoItem {
  id: string;
  title: string;
  subtitle: string;
  type: "setup" | "near-term" | "long-horizon";
}

const TODOS: TodoItem[] = [
  { id: "insurance", title: "Upload insurance card", subtitle: "Needed for roadside assistance", type: "setup" },
  { id: "oil", title: "Oil change due", subtitle: "~800 mi remaining", type: "near-term" },
  { id: "coolant", title: "Coolant flush at 50,000 mi", subtitle: "~12,800 mi away", type: "long-horizon" },
];

const LIVE_ROUTE: [number, number][] = [
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

const TRIP_SUMMARY = {
  from: "Home",
  to: "Target",
  time: "Today, 3:42 – 3:54 PM",
  duration: "12 min",
  distance: "4.2 mi",
  score: 88,
  events: 1,
  driver: "Emma",
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FleetSwitcher({
  vehicles,
  selected,
  onSelect,
  showFleet,
}: {
  vehicles: Vehicle[];
  selected: string;
  onSelect: (id: string) => void;
  showFleet: boolean;
}) {
  const hide = vehicles.length === 1 && !showFleet;

  if (hide) return null;

  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-1 pt-4 scrollbar-none">
      {vehicles.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onSelect(v.id)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium leading-none transition-colors ${
            selected === v.id && !showFleet
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          {v.year} {v.name}
        </button>
      ))}
      {vehicles.length > 1 && (
        <button
          type="button"
          onClick={() => onSelect("fleet")}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium leading-none transition-colors ${
            showFleet
              ? "bg-neutral-900 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          Fleet View
        </button>
      )}
    </div>
  );
}

function VehicleHeader({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="flex flex-col gap-0.5 px-5">
      <h1 className="text-lg font-semibold leading-snug text-neutral-900">
        {vehicle.name}
      </h1>
      <span className="text-xs text-neutral-500">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </span>
    </div>
  );
}

function ParkedMap({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="relative mx-5 overflow-hidden rounded-xl">
      <div className="aspect-[4/3] w-full">
        <MapView
          center={[vehicle.parkedAt.lat, vehicle.parkedAt.lng]}
          zoom={15}
          markers={[{ lat: vehicle.parkedAt.lat, lng: vehicle.parkedAt.lng, type: "end" }]}
          interactive={false}
        />
      </div>
      {/* Location label overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
        <div className="flex items-center gap-2">
          {vehicle.locationType === "saved" ? (
            <svg className="size-4 text-white/90" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          ) : (
            <svg className="size-4 text-white/90" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-snug text-white">
              {vehicle.locationLabel}
            </span>
            <span className="text-[11px] leading-none text-white/70">
              Parked · {vehicle.lastUpdated}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehicleStatusCards({ vehicle }: { vehicle: Vehicle }) {
  const cards: { label: string; value: string; status: "good" | "warn" | "info" }[] = [];

  if (vehicle.engine !== null) {
    cards.push({
      label: "Engine",
      value: vehicle.engine === "good" ? "Good" : "Attention",
      status: vehicle.engine === "good" ? "good" : "warn",
    });
  }
  if (vehicle.battery !== null) {
    cards.push({
      label: "Battery",
      value: vehicle.battery === "good" ? "Good" : vehicle.battery === "fair" ? "Fair" : "Low",
      status: vehicle.battery === "good" ? "good" : "warn",
    });
  }
  if (vehicle.fuelPct !== null) {
    cards.push({
      label: "Fuel",
      value: `${vehicle.fuelPct}%`,
      status: "info",
    });
  }

  if (cards.length === 0) return null;

  const statusDot = {
    good: "bg-green-500",
    warn: "bg-amber-500",
    info: "bg-blue-500",
  };
  const statusText = {
    good: "text-green-700",
    warn: "text-amber-700",
    info: "text-neutral-700",
  };

  return (
    <Link href="/device-health" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl mx-5">
      <div className={`grid gap-3 ${cards.length === 3 ? "grid-cols-3" : cards.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {cards.map((c) => (
          <div
            key={c.label}
            className="flex flex-col gap-1.5 rounded-xl border border-neutral-200 bg-white p-3"
          >
            <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
              {c.label}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${statusDot[c.status]}`} />
              <span className={`text-sm font-semibold leading-none ${statusText[c.status]}`}>
                {c.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}

function DeviceStatus({ online }: { online: boolean }) {
  return (
    <Link
      href="/device-health"
      className="mx-5 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
        <svg className="size-4.5 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium leading-none text-neutral-900">
          Miles IO6
        </span>
        <span className={`text-xs leading-none ${online ? "text-green-600" : "text-amber-600"}`}>
          {online ? "Online" : "Issue detected"}
        </span>
      </div>
      <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

function ScoreAndTrip({ vehicle }: { vehicle: Vehicle }) {
  const t = vehicle.lastTrip;
  return (
    <div className="mx-5 grid grid-cols-2 gap-3">
      {/* Driver Score */}
      <Link
        href="/driver-score"
        className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Driver Score
        </span>
        <span className="text-3xl font-bold leading-none tabular-nums text-neutral-900">
          {vehicle.driverScore}
        </span>
        <span className="text-[11px] text-neutral-400">{vehicle.scoreUpdated}</span>
      </Link>

      {/* Last Trip */}
      <Link
        href="/trip-receipt"
        className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Last Trip
        </span>
        <span className="text-sm font-semibold leading-snug text-neutral-900">
          {t.from} &rarr; {t.to}
        </span>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-neutral-500">
          <span>{t.distance}</span>
          <span className="text-neutral-300">&middot;</span>
          <span>{t.duration}</span>
        </div>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-xs font-semibold tabular-nums text-neutral-700">{t.score}</span>
          {t.events > 0 && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              {t.events} event{t.events !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium text-blue-600">
          View details &rarr;
        </span>
      </Link>
    </div>
  );
}

function AgentCoachingCard({
  card,
  onDismiss,
}: {
  card: CoachingCard;
  onDismiss: () => void;
}) {
  return (
    <div className="mx-5 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
          <svg className="size-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
          </svg>
        </div>
        <p className="flex-1 text-sm leading-relaxed text-blue-800">
          {card.message}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={card.actionHref}
          className="flex h-8 items-center rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
        >
          {card.actionLabel}
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 items-center rounded-lg px-3.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
        >
          {card.dismissLabel}
        </button>
      </div>
    </div>
  );
}

function TodoPreview({ items }: { items: TodoItem[] }) {
  const typeStyles = {
    setup: { dot: "bg-blue-500", text: "text-neutral-900", sub: "text-neutral-500" },
    "near-term": { dot: "bg-amber-500", text: "text-neutral-900", sub: "text-neutral-500" },
    "long-horizon": { dot: "bg-neutral-300", text: "text-neutral-400", sub: "text-neutral-300" },
  };

  return (
    <div className="mx-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          To-Do
        </span>
        <Link
          href="/todos"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          See all
        </Link>
      </div>
      <div className="flex flex-col rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100">
        {items.map((item) => {
          const s = typeStyles[item.type];
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${item.type === "long-horizon" ? "opacity-60" : ""}`}
            >
              <span className={`size-2 shrink-0 rounded-full ${s.dot}`} />
              <div className="flex flex-1 flex-col gap-0.5">
                <span className={`text-sm font-medium leading-none ${s.text}`}>
                  {item.title}
                </span>
                <span className={`text-xs leading-none ${s.sub}`}>
                  {item.subtitle}
                </span>
              </div>
              <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="mx-5 grid grid-cols-2 gap-3">
      <button
        type="button"
        className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:bg-neutral-50"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
          <svg className="size-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-neutral-700">Roadside Assist</span>
      </button>
      <button
        type="button"
        className="flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:bg-neutral-50"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-green-50">
          <svg className="size-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-neutral-700">Log Service</span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  State B: Trip in Progress                                          */
/* ------------------------------------------------------------------ */

function LiveSpeed({ mph }: { mph: number }) {
  return (
    <div className="mx-5 flex items-center justify-between rounded-xl bg-neutral-900 px-5 py-4">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold leading-none tabular-nums text-white">
          {mph}
        </span>
        <span className="text-sm font-medium text-white/50">mph</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-green-500" />
        </span>
        <span className="text-xs font-medium text-green-400">Live</span>
      </div>
    </div>
  );
}

function TripStatusRow() {
  return (
    <div className="mx-5 flex gap-3">
      <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-3">
        <svg className="size-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        <span className="text-sm font-medium text-neutral-700">Vehicle OK</span>
      </div>
      <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-3">
        <svg className="size-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        <span className="text-sm font-medium text-neutral-700">Device streaming</span>
      </div>
    </div>
  );
}

function TripInProgress({
  vehicle,
  driver,
}: {
  vehicle: Vehicle;
  driver: string;
}) {
  const currentPos = LIVE_ROUTE[LIVE_ROUTE.length - 1];
  return (
    <div className="flex flex-col gap-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between px-5">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-lg font-semibold leading-snug text-neutral-900">
            {vehicle.name}
          </h1>
          <span className="text-xs text-neutral-500">
            {driver} is driving
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-600" />
          </span>
          Trip active
        </span>
      </div>

      {/* Live Map */}
      <div className="relative mx-5 overflow-hidden rounded-xl">
        <div className="aspect-[4/3] w-full">
          <MapView
            route={LIVE_ROUTE}
            markers={[
              { lat: LIVE_ROUTE[0][0], lng: LIVE_ROUTE[0][1], type: "start" },
              { lat: currentPos[0], lng: currentPos[1], type: "end" },
            ]}
            interactive={false}
            routeColor="#16a34a"
            routeWeight={4}
          />
        </div>
        {/* Trip stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
          <div className="flex items-center gap-4 text-white/80">
            <span className="text-xs font-medium">4.2 mi</span>
            <span className="text-white/40">&middot;</span>
            <span className="text-xs font-medium">12 min</span>
            <span className="text-white/40">&middot;</span>
            <span className="text-xs font-medium">Home &rarr; ...</span>
          </div>
        </div>
      </div>

      {/* Speed */}
      <LiveSpeed mph={34} />

      {/* Vehicle + Device status */}
      <TripStatusRow />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trip Complete                                                       */
/* ------------------------------------------------------------------ */

function TripComplete({
  vehicle,
  onReturn,
}: {
  vehicle: Vehicle;
  onReturn: () => void;
}) {
  const s = TRIP_SUMMARY;
  return (
    <div className="flex flex-col gap-4 pt-3">
      {/* Header */}
      <div className="flex flex-col gap-0.5 px-5">
        <h1 className="text-lg font-semibold leading-snug text-neutral-900">
          {vehicle.name}
        </h1>
        <span className="text-xs text-neutral-500">Trip complete</span>
      </div>

      {/* Trip summary card */}
      <div className="mx-5 flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4">
        {/* Map thumbnail */}
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg">
          <MapView
            route={LIVE_ROUTE}
            markers={[
              { lat: LIVE_ROUTE[0][0], lng: LIVE_ROUTE[0][1], type: "start" },
              { lat: LIVE_ROUTE[LIVE_ROUTE.length - 1][0], lng: LIVE_ROUTE[LIVE_ROUTE.length - 1][1], type: "end" },
            ]}
            interactive={false}
            routeWeight={3}
          />
        </div>

        {/* Route name */}
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-neutral-900">
            {s.from} &rarr; {s.to}
          </span>
          <span className="text-xs text-neutral-500">{s.time}</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-neutral-400">Distance</span>
            <span className="text-sm font-semibold tabular-nums text-neutral-900">{s.distance}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-neutral-400">Duration</span>
            <span className="text-sm font-semibold tabular-nums text-neutral-900">{s.duration}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-neutral-400">Score</span>
            <span className="text-sm font-semibold tabular-nums text-neutral-900">{s.score}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-neutral-400">Events</span>
            <span className="text-sm font-semibold tabular-nums text-neutral-900">{s.events}</span>
          </div>
        </div>

        {/* Driver */}
        <div className="flex items-center gap-2 border-t border-neutral-100 pt-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-neutral-100">
            <svg className="size-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <span className="text-sm text-neutral-600">{s.driver}</span>
          <button type="button" className="ml-auto text-xs font-medium text-blue-600 hover:text-blue-700">
            Not {s.driver}?
          </button>
        </div>

        {/* CTA */}
        <Link
          href="/trip-detail"
          className="flex h-10 items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          View trip detail
        </Link>
      </div>

      {/* Post-trip coaching opportunity */}
      <div className="mx-5 flex flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg className="size-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
          </div>
          <p className="flex-1 text-sm leading-relaxed text-green-800">
            One hard braking event on Preston Rd. Leaving a little more following distance can help — want tips?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/miles?context=coaching-braking"
            className="flex h-8 items-center rounded-lg bg-green-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
          >
            Show me
          </Link>
          <button
            type="button"
            onClick={onReturn}
            className="flex h-8 items-center rounded-lg px-3.5 text-xs font-semibold text-green-600 transition-colors hover:bg-green-100"
          >
            Done
          </button>
        </div>
      </div>

      {/* Back to dashboard */}
      <button
        type="button"
        onClick={onReturn}
        className="mx-5 flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
      >
        Back to dashboard
      </button>
    </div>
  );
}

function FleetMapView({
  vehicles,
  onSelectVehicle,
}: {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-5 pt-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
        <MapView
          markers={vehicles.map((v) => ({
            lat: v.parkedAt.lat,
            lng: v.parkedAt.lng,
            type: "end" as const,
          }))}
          interactive={false}
        />
      </div>
      <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
        {vehicles.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelectVehicle(v.id)}
            className="flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
          >
            <span className="size-2 shrink-0 rounded-full bg-blue-500" />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium leading-none text-neutral-900">
                {v.year} {v.make} {v.name}
              </span>
              <span className="text-xs text-neutral-500">
                {v.locationLabel} · Parked
              </span>
            </div>
            <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                     */
/* ------------------------------------------------------------------ */

type DashboardMode = "parked" | "trip" | "complete";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [coachingDismissed, setCoachingDismissed] = useState(false);

  const vehicleParam = searchParams.get("vehicle") || VEHICLES[0].id;
  const modeParam = searchParams.get("mode") as DashboardMode | null;
  const mode: DashboardMode =
    modeParam === "trip" || modeParam === "complete" ? modeParam : "parked";

  const isFleet = vehicleParam === "fleet";
  const vehicle = VEHICLES.find((v) => v.id === vehicleParam) ?? VEHICLES[0];

  const navigate = useCallback(
    (params: { vehicle?: string; mode?: string }) => {
      const next = new URLSearchParams();
      const v = params.vehicle ?? vehicleParam;
      const m = params.mode ?? "parked";
      if (v !== VEHICLES[0].id) next.set("vehicle", v);
      if (m !== "parked") next.set("mode", m);
      const qs = next.toString();
      router.push(p(`/dashboard${qs ? `?${qs}` : ""}`));
    },
    [router, vehicleParam]
  );

  function selectVehicle(id: string) {
    setCoachingDismissed(false);
    navigate({ vehicle: id, mode: "parked" });
  }

  function setMode(m: DashboardMode) {
    navigate({ mode: m });
  }

  return (
    <main className="flex min-h-dvh flex-col bg-neutral-50 pb-24">
      {/* Fleet Switcher */}
      <FleetSwitcher
        vehicles={VEHICLES}
        selected={vehicleParam}
        onSelect={selectVehicle}
        showFleet={isFleet}
      />

      {isFleet ? (
        <>
          <div className="flex flex-col gap-0.5 px-5 pt-3 pb-2">
            <h1 className="text-lg font-semibold leading-snug text-neutral-900">
              Fleet View
            </h1>
            <span className="text-xs text-neutral-500">
              {VEHICLES.length} vehicles
            </span>
          </div>
          <FleetMapView
            vehicles={VEHICLES}
            onSelectVehicle={selectVehicle}
          />
        </>
      ) : mode === "trip" ? (
        <TripInProgress vehicle={vehicle} driver="Emma" />
      ) : mode === "complete" ? (
        <TripComplete vehicle={vehicle} onReturn={() => setMode("parked")} />
      ) : (
        <div className="flex flex-col gap-4 pt-3">
          <VehicleHeader vehicle={vehicle} />
          <ParkedMap vehicle={vehicle} />
          <VehicleStatusCards vehicle={vehicle} />
          <DeviceStatus online={vehicle.deviceOnline} />
          <ScoreAndTrip vehicle={vehicle} />
          {!coachingDismissed && (
            <AgentCoachingCard
              card={COACHING}
              onDismiss={() => setCoachingDismissed(true)}
            />
          )}
          <TodoPreview items={TODOS} />
          <QuickActions />
        </div>
      )}

      {/* Proto state toggle */}
      <div className="mx-5 mt-6 flex flex-col items-center gap-3 border-t border-neutral-200 pt-4">
        <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-300">
          Proto controls
        </span>
        <div className="flex items-center gap-1.5">
          {VEHICLES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => selectVehicle(v.id)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                vehicleParam === v.id && !isFleet
                  ? "bg-neutral-200 text-neutral-700"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {v.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => selectVehicle("fleet")}
            className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              isFleet
                ? "bg-neutral-200 text-neutral-700"
                : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            Fleet
          </button>
        </div>
        {!isFleet && (
          <div className="flex items-center gap-1.5">
            {(["parked", "trip", "complete"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                  mode === m
                    ? "bg-neutral-200 text-neutral-700"
                    : "text-neutral-400 hover:text-neutral-600"
                }`}
              >
                {m === "complete" ? "trip complete" : m}
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
