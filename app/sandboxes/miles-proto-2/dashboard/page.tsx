"use client";

import { Suspense, useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "@/app/sandboxes/miles-proto-2/_components/link";
import { MapView } from "@/app/sandboxes/miles-proto-2/_components/map-view";
import { TodoPreview } from "@/app/sandboxes/miles-proto-2/_components/todo-preview";
import { useForceLightMode, setForceLightMode } from "@/app/sandboxes/miles-proto-2/_components/force-light-mode";
import { DEMO_TODOS } from "@/app/sandboxes/miles-proto-2/_lib/demo-todos";
import { DEMO_TRIPS } from "@/app/sandboxes/miles-proto-2/_lib/demo-trips";
import { p } from "@/app/sandboxes/miles-proto-2/_lib/nav";

const FOOTER_NAV_MODE_STORAGE_KEY = "miles-proto-2-footer-nav-mode";
type FooterNavMode = "full" | "compact";

const MAPBOX_STYLES = [
  { value: "mapbox://styles/mapbox/light-v11", label: "Light" },
  { value: "mapbox://styles/mapbox/dark-v11", label: "Dark" },
  { value: "mapbox://styles/mapbox/streets-v12", label: "Streets" },
  { value: "mapbox://styles/mapbox/outdoors-v12", label: "Outdoors" },
  { value: "mapbox://styles/mapbox/satellite-v9", label: "Satellite" },
  { value: "mapbox://styles/mapbox/satellite-streets-v12", label: "Satellite Streets" },
] as const;

const AVATAR_MOM = "/miles-proto-2/images/mom.jpg";
const AVATAR_TEEN = "/miles-proto-2/images/teen.jpg";

/* ------------------------------------------------------------------ */
/*  iOS Type Scale Reference                                           */
/*  Maps Tailwind classes to Apple HIG Dynamic Type styles.            */
/*  Use this as a guide when translating to SwiftUI / UIKit.           */
/*                                                                     */
/*  Role              iOS name        Tailwind                         */
/*  ────────────────  ──────────────  ──────────────────────────────── */
/*  Large Title       34pt bold       text-3xl  font-bold              */
/*  Display / Hero    —               text-2xl   font-semibold uppercase */
/*  Title 3           20pt regular    text-lg   font-semibold          */
/*  Headline          17pt semibold   text-base font-semibold          */
/*  Body              17pt regular    text-base font-normal            */
/*  Subheadline       15pt regular    text-sm   font-normal            */
/*  Footnote          13pt regular    text-xs   font-normal            */
/*  Caption 1         12pt regular    text-xs   font-medium            */
/*  Caption 2         11pt regular    text-[11px]                      */
/*  Section Header    13pt semibold   text-[11px] font-semibold        */
/*                    (uppercased)    uppercase tracking-wide           */
/*  Stat Value        15pt semibold   text-sm   font-semibold          */
/*  Tint Button       15pt semibold   text-sm   font-semibold          */
/*                    (system blue)   text-semantic-info                */
/*                                                                     */
/* ------------------------------------------------------------------ */
/*  iOS Corner Radius Reference                                        */
/*                                                                     */
/*  Token             Tailwind         iOS (SwiftUI)                   */
/*  ────────────────  ──────────────── ──────────────────────────────  */
/*  Card    16px      rounded-card     .cornerRadius(16)               */
/*  Panel   12px      rounded-panel    .cornerRadius(12)               */
/*  Control  8px      rounded-control  .cornerRadius(8)                */
/*  Pill              rounded-pill     .clipShape(Capsule())           */
/*  Circle            rounded-full     .clipShape(Circle())            */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

interface Vehicle {
  id: string;
  name: string;
  imageSrc: string;
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
  scoreDelta: number;
  scoreUpdated: string;
  /** When the engine/health check was last run (e.g. "Checked 2h ago", "Today, 9:02 AM") */
  engineCheckedAt: string;
  fuelRange: string;
  liveTrip?: { driver: string; vehicleLabel: string; mph: number; startedAgo: string };
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
    imageSrc: "/api/sandbox-files/miles-proto-2/public/images/civic.jpg",
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
    scoreDelta: 3,
    scoreUpdated: "Updated today",
    engineCheckedAt: "10m ago",
    fuelRange: "~230 mi range",
    lastTrip: {
      from: "Preston Rd & Belt Line",
      to: "4521 Main St",
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
    imageSrc: "/api/sandbox-files/miles-proto-2/public/images/rav4.jpg",
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
    scoreDelta: -2,
    scoreUpdated: "Updated today",
    engineCheckedAt: "Just now",
    fuelRange: "~120 mi range",
    liveTrip: { driver: "Jack", vehicleLabel: "Toyota RAV4", mph: 34, startedAgo: "12 mins ago" },
    lastTrip: {
      from: "Preston Rd & Belt Line",
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

const COACHING_CARDS: CoachingCard[] = [
  {
    id: "fuel-reminder",
    message:
      "Your fuel was at 38% after your last trip. Want me to remind you to fill up tomorrow morning?",
    actionLabel: "Chat with Miles",
    actionHref: "/miles?context=fuel",
    dismissLabel: "Dismiss",
  },
  {
    id: "oil-reminder",
    message:
      "Your next oil change is due by May 12 or in about 800 miles, whichever comes first. I can help you schedule it or set a reminder.",
    actionLabel: "Chat with Miles",
    actionHref: "/miles?context=oil",
    dismissLabel: "Dismiss",
  },
  {
    id: "score-tip",
    message:
      "One hard braking event on your last trip. I can share tips to smooth out your driving.",
    actionLabel: "Chat with Miles",
    actionHref: "/miles?context=fuel",
    dismissLabel: "Dismiss",
  },
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
  from: "Preston Rd & Belt Line",
  to: "4521 Main St",
  time: "Today, 3:42 – 3:54 PM",
  duration: "12 min",
  distance: "4.2 mi",
  score: 88,
  events: 1,
  driver: "Emma",
};


/* ------------------------------------------------------------------ */
/*  Shared vehicle content (no map) — used by both list and card view  */
/* ------------------------------------------------------------------ */

const LOCATION_ICON = (
  <svg className="size-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const CHEVRON = (
  <svg className="size-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

function StatusBadge({ live }: { live: Vehicle["liveTrip"] }) {
  if (live) {
    return (
      <span className="flex w-fit items-center gap-1.5 rounded-full bg-semantic-success px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-background opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-background" />
        </span>
        Driving
      </span>
    );
  }
  return (
    <span className="w-fit rounded-full bg-semantic-info px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
      Parked
    </span>
  );
}

function StatsBento({ v, engineLabel, engineDot, engineText, fuelDot, fuelText, compact = false }: {
  v: Vehicle;
  engineLabel: string;
  engineDot: string;
  engineText: string;
  fuelDot: string;
  fuelText: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center divide-x divide-stroke-muted rounded-control bg-surface-subtle overflow-hidden">
        {/* Score */}
        <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
          <span className="text-sm leading-none">🚘</span>
          <span className="text-sm font-semibold leading-none text-semantic-success">{v.driverScore}</span>
        </div>
        {/* Engine */}
        <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
          <span className="text-sm leading-none">🛠️</span>
          <span className={`text-sm font-semibold leading-none ${engineText}`}>{engineLabel}</span>
        </div>
        {/* Fuel */}
        <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
          <span className="text-sm leading-none">⛽️</span>
          <span className={`text-sm font-semibold leading-none tabular-nums ${fuelText}`}>{(v.fuelPct ?? 0)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Score */}
      <div className="flex flex-col gap-1 rounded-control bg-surface-subtle px-3 py-2.5">
        <span className="text-[11px] font-medium text-text-muted">Score</span>
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-semantic-success" />
          <span className="text-sm font-semibold leading-none text-semantic-success">{v.driverScore}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {v.scoreDelta >= 0 ? (
            <svg className="size-2.5 shrink-0 text-semantic-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
          ) : (
            <svg className="size-2.5 shrink-0 text-semantic-warning" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
          )}
          <span className={`text-[10px] font-medium leading-none tabular-nums ${v.scoreDelta >= 0 ? "text-semantic-success" : "text-semantic-warning"}`}>
            {v.scoreDelta >= 0 ? "+" : ""}{v.scoreDelta}
          </span>
        </div>
      </div>
      {/* Engine */}
      <div className="flex flex-col gap-1 rounded-control bg-surface-subtle px-3 py-2.5">
        <span className="text-[11px] font-medium text-text-muted">Engine</span>
        <div className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${engineDot}`} />
          <span className={`text-sm font-semibold leading-none ${engineText}`}>{engineLabel}</span>
        </div>
        <span className="text-[10px] font-medium leading-none text-text-muted">{v.engineCheckedAt}</span>
      </div>
      {/* Fuel */}
      <div className="flex flex-col gap-1 rounded-control bg-surface-subtle px-3 py-2.5">
        <span className="text-[11px] font-medium text-text-muted">Fuel</span>
        <div className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${fuelDot}`} />
          <span className={`text-sm font-semibold leading-none ${fuelText}`}>{(v.fuelPct ?? 0)}%</span>
        </div>
        <span className="text-[10px] font-medium leading-none text-text-muted">{v.fuelRange}</span>
      </div>
    </div>
  );
}

function DriverStrip({ live, tripHref, showAvatars }: {
  live: NonNullable<Vehicle["liveTrip"]>;
  tripHref: string;
  showAvatars: boolean;
}) {
  return (
    <Link
      href={tripHref}
      className="mx-4 mb-4 flex min-h-11 items-center justify-between rounded-panel border border-stroke-muted bg-surface-subtle px-3 py-2.5 transition-colors hover:bg-surface-strong"
    >
      <div className="flex items-center gap-2.5">
        {showAvatars ? (
          <img src={AVATAR_TEEN} alt={live.driver} className="size-7 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-semantic-success text-[11px] font-medium text-background">
            {live.driver[0]}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-semantic-success">{live.driver} is driving</span>
          <span className="text-xs text-semantic-success">{live.startedAgo}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="flex items-baseline gap-0.5">
          <span className="text-lg font-bold tabular-nums text-semantic-success">{live.mph}</span>
          <span className="text-[11px] font-medium text-semantic-success">mph</span>
        </div>
        <svg className="size-3.5 text-semantic-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}

function VehicleCardContent({ v, showAvatars = false, compact = false }: { v: Vehicle; showAvatars?: boolean; compact?: boolean }) {
  const live = v.liveTrip;
  const vehicleHref = `/vehicle?from=dashboard&vehicle=${v.id}`;
  const tripHref = live
    ? `/dashboard?mode=trip&driver=${encodeURIComponent(live.driver)}&vehicleLabel=${encodeURIComponent(live.vehicleLabel)}`
    : null;

  const engineLabel = v.engine === "good" ? "Good" : v.engine === "attention" ? "Attention" : "—";
  const engineDot = v.engine === "good" ? "bg-semantic-success" : "bg-semantic-warning";
  const engineText = v.engine === "good" ? "text-semantic-success" : "text-semantic-warning";
  const fuelPct = v.fuelPct ?? 0;
  const fuelDot = fuelPct > 30 ? "bg-semantic-success" : "bg-semantic-warning";
  const fuelText = fuelPct > 30 ? "text-text-secondary" : "text-semantic-warning";

  const parkedAddress =
    v.locationType === "saved" && v.locationLabel === "Home"
      ? "4521 Main St"
      : v.locationLabel;
  const locationLine = live ? "Plano, TX" : parkedAddress;

  if (compact) {
    return (
      <>
        {/* Compact header: name (left) | chevron (right); status + location share second line */}
        <Link href={vehicleHref} className="flex flex-col gap-1.5 px-4 pt-3.5 pb-3 transition-colors hover:bg-background/80">
          <div className="flex items-center justify-between gap-2">
            <span className="text-base font-semibold uppercase leading-tight text-text-primary">{v.name}</span>
            {CHEVRON}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <StatusBadge live={live} />
            <span className="flex min-w-0 items-center gap-1 text-xs text-text-muted">
              {LOCATION_ICON}
              <span className="truncate">{locationLine}</span>
            </span>
          </div>
        </Link>

        {/* Stats bento */}
        <Link href={vehicleHref} className="px-4 pb-3 transition-colors hover:bg-background/60 block">
          <StatsBento v={v} engineLabel={engineLabel} engineDot={engineDot} engineText={engineText} fuelDot={fuelDot} fuelText={fuelText} compact />
        </Link>

        {/* Driver strip — live trip only */}
        {live && tripHref && <DriverStrip live={live} tripHref={tripHref} showAvatars={showAvatars} />}
      </>
    );
  }

  return (
    <>
      {/* Default header: name + status + location (left) | car image + chevron (right) */}
      <Link href={vehicleHref} className="flex flex-col gap-2 px-4 pt-3.5 pb-2 transition-colors hover:bg-background/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-2xl font-semibold uppercase leading-tight text-text-primary">{v.name}</span>
            <StatusBadge live={live} />
            <span className="flex min-w-0 items-center gap-1.5 text-sm text-text-muted">
              {LOCATION_ICON}
              <span className="truncate">{locationLine}</span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <img src={v.imageSrc} alt={v.name} className="w-24 object-contain opacity-90" />
            {CHEVRON}
          </div>
        </div>
      </Link>

      {/* Stats bento */}
      <Link href={vehicleHref} className="flex flex-col gap-2 px-4 pb-3 transition-colors hover:bg-background/60">
        <StatsBento v={v} engineLabel={engineLabel} engineDot={engineDot} engineText={engineText} fuelDot={fuelDot} fuelText={fuelText} />
      </Link>

      {/* Driver strip — live trip only */}
      {live && tripHref && <DriverStrip live={live} tripHref={tripHref} showAvatars={showAvatars} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Fleet view with list / card toggle                                 */
/* ------------------------------------------------------------------ */

function HeaderAction({
  headerAction,
  size = "default",
}: {
  headerAction: "profile" | "roadside";
  size?: "default" | "compact";
}) {
  if (headerAction === "roadside") {
    return (
      <button
        type="button"
        aria-label="Roadside Assist"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-stroke-muted bg-surface-card transition-colors hover:bg-surface-subtle ${
          size === "compact" ? "size-9" : "size-11"
        }`}
      >
        <svg
          className={`text-semantic-danger ${size === "compact" ? "size-4" : "size-5"}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </button>
    );
  }
  return (
    <Link
      href="/account"
      className={`flex items-center gap-2 rounded-full transition-colors hover:bg-surface-strong ${
        size === "compact" ? "py-0.5 pl-2 pr-0.5 min-h-9" : "py-1 pl-3 pr-1 min-h-11"
      }`}
    >
      {size !== "compact" && (
        <span className="text-sm font-medium text-text-secondary">Christina M.</span>
      )}
      <img
        src={AVATAR_MOM}
        alt="Christina M."
        className={`shrink-0 rounded-full object-cover ${size === "compact" ? "size-7" : "size-8"}`}
      />
    </Link>
  );
}

function FleetView({
  vehicles,
  headerAction,
  showAvatars,
  mapStyle,
  titleRef,
  compactCards,
  setCompactCards,
}: {
  vehicles: Vehicle[];
  headerAction: "profile" | "roadside";
  showAvatars: boolean;
  mapStyle: string;
  titleRef?: React.RefObject<HTMLHeadingElement>;
  compactCards: boolean;
  setCompactCards: (v: boolean) => void;
}) {
  const liveVehicle = vehicles.find((v) => v.liveTrip);

  const allMarkers = [
    ...vehicles
      .filter((v) => !v.liveTrip)
      .map((v) => ({
        lat: v.parkedAt.lat,
        lng: v.parkedAt.lng,
        type: "end" as const,
        color: VEHICLE_COLOR_MAP[v.name] ?? "#6b7280",
        labelColor: "#2563eb",
        label: "Parked",
        initial: v.name[0],
      })),
    ...(liveVehicle
      ? [{
          lat: LIVE_ROUTE[LIVE_ROUTE.length - 1][0],
          lng: LIVE_ROUTE[LIVE_ROUTE.length - 1][1],
          type: "end" as const,
          color: VEHICLE_COLOR_MAP[liveVehicle.name] ?? "#6b7280",
          labelColor: "#16a34a",
          label: "Driving",
          imageSrc: AVATAR_TEEN,
          overlayInitial: liveVehicle.name[0],
          overlayColor: VEHICLE_COLOR_MAP[liveVehicle.name] ?? "#6b7280",
        }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Dashboard header */}
      <div className="flex items-center justify-between px-5 pt-2">
        <h1
          ref={titleRef}
          className="text-3xl font-bold leading-tight text-text-primary"
        >
          Miles
        </h1>
        <HeaderAction headerAction={headerAction} />
      </div>

      {/* Fleet map — always shown; fitBounds so both parked and trip-active markers are visible. padding-bottom gives the wrapper a definite height so Mapbox inits with non-zero size. */}
      <div className="mx-5 overflow-hidden rounded-card border border-stroke-muted shadow-card">
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: "66.667%" }}>
          <MapView key={`fleet-${showAvatars}-${mapStyle}-${liveVehicle ? "live" : "parked"}`} markers={allMarkers} mapStyle={mapStyle} />
        </div>
      </div>

      {/* Vehicles section header with layout toggle */}
      <div className="flex items-center justify-between px-5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Vehicles</span>
        <button
          type="button"
          onClick={() => setCompactCards(!compactCards)}
          className="text-[11px] font-medium text-semantic-info transition-colors hover:text-semantic-info/80"
        >
          {compactCards ? "Expand" : "Collapse"}
        </button>
      </div>

      {/* One card per vehicle; gap between cards for iOS-style grouped list appearance */}
      <div className="mx-5 flex flex-col gap-3">
        {[...vehicles].sort((a, b) => (b.liveTrip ? 1 : 0) - (a.liveTrip ? 1 : 0)).map((v) => (
          <div
            key={v.id}
            className="overflow-hidden rounded-card border border-stroke-muted bg-surface-card"
          >
            <VehicleCardContent v={v} showAvatars={showAvatars} compact={compactCards} />
          </div>
        ))}
      </div>
    </div>
  );
}

const DRIVER_AVATAR_MAP: Record<string, string> = {
  Christina: AVATAR_MOM,
  Emma: AVATAR_TEEN,
};

const VEHICLE_COLOR_MAP: Record<string, string> = {
  Civic: "#9b1c1c",
  RAV4: "#6b8cae",
};

function TripActivityItem({
  trip,
  href,
  showAvatars,
  driverImageSrc,
  vehicleColor = "#2563eb",
  timelineMode = false,
}: {
  trip: (typeof DEMO_TRIPS)[number];
  href: string;
  showAvatars: boolean;
  driverImageSrc?: string;
  vehicleColor?: string;
  timelineMode?: boolean;
}) {
  const card = (
    <div className="relative flex items-start gap-3 rounded-panel border border-stroke-muted bg-surface-card p-4 transition-colors hover:bg-surface-subtle">
      <button
        type="button"
        className="absolute right-3 top-3 shrink-0 rounded-full border border-stroke-muted bg-surface-subtle px-2.5 py-0.5 text-[10px] font-semibold text-text-muted transition-colors hover:bg-surface-strong hover:text-text-secondary"
      >
        Ask Miles
      </button>

      {/* Avatar */}
      <div className="relative mt-0.5 shrink-0">
        {showAvatars && driverImageSrc ? (
          <>
            <img
              src={driverImageSrc}
              alt={trip.driver}
              className="size-9 rounded-full border-2 border-background object-cover shadow-sm"
            />
            {trip.vehicle && (
              <span
                className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-background text-[9px] font-bold leading-none text-white shadow-sm"
                style={{ backgroundColor: vehicleColor }}
              >
                {trip.vehicle[0]}
              </span>
            )}
          </>
        ) : (
          <div className="flex size-9 items-center justify-center rounded-full bg-surface-subtle">
            <svg className="size-4 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-20">
        {/* Driver · vehicle */}
        <span className="text-xs font-medium text-text-muted">
          {trip.driver}{trip.vehicle ? ` · ${trip.vehicle}` : ""}
        </span>

        {/* Route */}
        <Link href={href} className="block overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-snug text-text-primary hover:underline">
          {trip.from} → {trip.to}
        </Link>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted tabular-nums">{trip.duration}</span>
          <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-text-muted">{trip.distance}</span>
        </div>
      </div>
    </div>
  );

  if (timelineMode) return card;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-1 text-[11px] tabular-nums text-text-muted">
        {trip.date} · {trip.timeRange.split(/\s*[–-]\s*/).pop()}
      </span>
      {card}
    </div>
  );
}

interface ScoreUpdateItem {
  id: string;
  vehicle: string;
  score: number;
  delta: number;
  date: string;
  time: string;
}

const DEMO_SCORE_UPDATES: ScoreUpdateItem[] = [
  { id: "su-today-civic",  vehicle: "Civic", score: 82, delta:  3, date: "Today",     time: "11:30 PM" },
  { id: "su-today-rav4",   vehicle: "RAV4",  score: 74, delta: -2, date: "Today",     time: "11:30 PM" },
  { id: "su-yest-civic",   vehicle: "Civic", score: 79, delta:  1, date: "Yesterday", time: "11:30 PM" },
  { id: "su-yest-rav4",    vehicle: "RAV4",  score: 76, delta: -1, date: "Yesterday", time: "11:30 PM" },
];

function ScoreUpdateActivityItem({ item, timelineMode = false }: { item: ScoreUpdateItem; timelineMode?: boolean }) {
  const isUp = item.delta >= 0;
  const deltaColor = isUp ? "text-semantic-success" : "text-semantic-warning";

  const card = (
    <div className="relative flex items-start gap-3 rounded-panel border border-stroke-muted bg-surface-card p-4 transition-colors hover:bg-surface-subtle">
        <button
          type="button"
          className="absolute right-3 top-3 shrink-0 rounded-full border border-stroke-muted bg-surface-subtle px-2.5 py-0.5 text-[10px] font-semibold text-text-muted transition-colors hover:bg-surface-strong hover:text-text-secondary"
        >
          Ask Miles
        </button>

        {/* Vehicle initial circle */}
        <div
          className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: VEHICLE_COLOR_MAP[item.vehicle] ?? "#6b7280" }}
        >
          {item.vehicle[0]}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-20">
          <span className="text-xs font-medium text-text-muted">{item.vehicle}</span>
          <span className="text-sm font-semibold leading-snug text-text-primary">Miles Score updated</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-medium tabular-nums text-text-muted">
              {item.score}
            </span>
            <span className={`rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-semibold tabular-nums ${deltaColor}`}>
              {isUp ? "+" : ""}{item.delta}
            </span>
          </div>
        </div>
      </div>
  );

  if (timelineMode) return card;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-1 text-[11px] tabular-nums text-text-muted">
        {item.date} · {item.time}
      </span>
      {card}
    </div>
  );
}

interface LiveTripEntry {
  id: string;
  driver: string;
  vehicleLabel: string;
  mph: number;
  startedAgo: string;
  date: string;
}

const LIVE_ACTIVITY: LiveTripEntry = {
  id: "live-jack",
  driver: "Jack",
  vehicleLabel: "Toyota RAV4",
  mph: 34,
  startedAgo: "12 mins ago",
  date: "Today",
};

type ActivityEntry =
  | { kind: "trip";  trip: (typeof DEMO_TRIPS)[number] }
  | { kind: "score"; item: ScoreUpdateItem }
  | { kind: "live";  live: LiveTripEntry };

function LiveActivityCard({ live, showAvatars }: { live: LiveTripEntry; showAvatars: boolean }) {
  const tripHref = `/dashboard?mode=trip&driver=${encodeURIComponent(live.driver)}&vehicleLabel=${encodeURIComponent(live.vehicleLabel)}`;
  return (
    <Link
      href={tripHref}
      className="flex items-center gap-3 rounded-panel border border-stroke-muted bg-surface-card p-4 transition-colors hover:bg-surface-subtle"
    >
      {showAvatars ? (
        <img src={AVATAR_TEEN} alt={live.driver} className="size-9 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-semantic-success text-[11px] font-semibold text-background">
          {live.driver[0]}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold text-semantic-success">{live.driver} is driving</span>
        <span className="text-xs text-text-muted">{live.vehicleLabel} · {live.startedAgo}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg font-bold tabular-nums text-semantic-success">{live.mph}</span>
        <span className="text-[11px] font-medium text-semantic-success">mph</span>
      </div>
      <svg className="size-3.5 shrink-0 text-semantic-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

// Items ordered newest-first within each day.
// Today:     live now → 4:41 PM trip → 3:54 PM trip
// Yesterday: 11:30 PM scores → 6:02 PM trip → 8:32 AM trip
const ACTIVITY_ITEMS: ActivityEntry[] = [
  { kind: "live",  live: LIVE_ACTIVITY },         // Today — Now (live)
  { kind: "trip",  trip: DEMO_TRIPS[1] },         // Today 4:41 PM
  { kind: "trip",  trip: DEMO_TRIPS[0] },         // Today 3:54 PM
  { kind: "score", item: DEMO_SCORE_UPDATES[2] }, // Yesterday 11:30 PM — Civic
  { kind: "score", item: DEMO_SCORE_UPDATES[3] }, // Yesterday 11:30 PM — RAV4
  { kind: "trip",  trip: DEMO_TRIPS[3] },         // Yesterday 6:02 PM
  { kind: "trip",  trip: DEMO_TRIPS[2] },         // Yesterday 8:32 AM
];

/* ------------------------------------------------------------------ */
/*  Activity timeline helpers                                          */
/* ------------------------------------------------------------------ */

const ACTIVITY_DATE_LABELS: Record<string, string> = {
  "Today":     "Today, March 20, 2026",
  "Yesterday": "Yesterday, March 19, 2026",
};

function getEntryDate(entry: ActivityEntry): string {
  if (entry.kind === "trip")   return entry.trip.date;
  if (entry.kind === "score")  return entry.item.date;
  return entry.live.date;
}

function getEntryTime(entry: ActivityEntry): string {
  if (entry.kind === "trip")  return entry.trip.timeRange.split(/\s*[–-]\s*/).pop() ?? entry.trip.timeRange;
  if (entry.kind === "score") return entry.item.time;
  return "Now";
}

function groupActivityByDate(items: ActivityEntry[]) {
  const order: string[] = [];
  const map: Record<string, ActivityEntry[]> = {};
  for (const item of items) {
    const d = getEntryDate(item);
    if (!map[d]) { order.push(d); map[d] = []; }
    map[d].push(item);
  }
  return order.map((d) => ({
    date: d,
    label: ACTIVITY_DATE_LABELS[d] ?? d,
    entries: map[d],
  }));
}

interface ConversationStarter {
  id: string;
  label: string;
  context: string;
  icon: React.ReactNode;
}

const CONVERSATION_STARTERS: ConversationStarter[] = [
  {
    id: "score-trend",
    label: "How's my driving score trending?",
    context: "score-trend",
    icon: (
      <svg className="size-4 shrink-0 text-semantic-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    id: "maintenance",
    label: "When is the Civic due for service?",
    context: "maintenance-civic",
    icon: (
      <svg className="size-4 shrink-0 text-semantic-warning" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
      </svg>
    ),
  },
  {
    id: "fuel-tip",
    label: "Tips to stretch my fuel further",
    context: "fuel-efficiency",
    icon: (
      <svg className="size-4 shrink-0 text-semantic-info" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
  },
  {
    id: "braking",
    label: "Why did my score dip on the RAV4?",
    context: "score-rav4",
    icon: (
      <svg className="size-4 shrink-0 text-semantic-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    id: "monthly-summary",
    label: "Summarize my driving this month",
    context: "monthly-summary",
    icon: (
      <svg className="size-4 shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    id: "reminder",
    label: "Remind me to fill up tomorrow",
    context: "fuel-reminder",
    icon: (
      <svg className="size-4 shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>
    ),
  },
];

function MilesConversationStarters() {
  const [index, setIndex] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const current = CONVERSATION_STARTERS[index];

  function roll() {
    setSpinning(true);
    setTimeout(() => {
      setIndex((prev) => (prev + 1) % CONVERSATION_STARTERS.length);
      setSpinning(false);
    }, 160);
  }

  return (
    <div className="flex flex-col items-center gap-3 pt-1">
      {/* Divider */}
      <div className="flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-stroke-muted" />
        <span className="text-[11px] font-medium text-text-muted">All caught up · Ask Miles</span>
        <div className="h-px flex-1 bg-stroke-muted" />
      </div>

      {/* Single prompt */}
      <Link
        href={`/miles?context=${current.context}`}
        className={`flex w-full items-center gap-2.5 rounded-panel border border-stroke-muted bg-surface-card px-4 py-3.5 text-sm font-medium text-text-secondary shadow-sm transition-all hover:bg-surface-subtle hover:text-text-primary active:bg-surface-strong ${spinning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        style={{ transition: "opacity 0.12s ease, transform 0.12s ease" }}
      >
        {current.icon}
        <span className="flex-1">{current.label}</span>
        <svg className="size-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      {/* Roll / refresh button */}
      <button
        type="button"
        onClick={roll}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-secondary"
      >
        <svg
          className={`size-3.5 transition-transform duration-300 ${spinning ? "rotate-180" : "rotate-0"}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Try another
      </button>
    </div>
  );
}

function ActivityFeed({ showAvatars = false }: { showAvatars?: boolean }) {
  const groups = groupActivityByDate(ACTIVITY_ITEMS);

  return (
    <div className="mx-5 flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Activity</span>
        <Link href="/trips" className="text-xs font-medium text-semantic-info hover:text-semantic-info/80">
          See all
        </Link>
      </div>

      {/* Day groups */}
      {groups.map((group) => (
        <div key={group.date} className="flex flex-col gap-3">
          {/* Day header */}
          <span className="text-xs font-semibold text-text-secondary">{group.label}</span>

          {/* Timeline entries */}
          <div className="flex flex-col">
            {group.entries.map((entry, i) => {
              const isLast = i === group.entries.length - 1;
              const key = entry.kind === "trip" ? entry.trip.id : entry.kind === "score" ? entry.item.id : entry.live.id;
              const time = getEntryTime(entry);
              const isLive = entry.kind === "live";

              return (
                <div key={key} className="flex gap-3">
                  {/* Left: dot + connecting line */}
                  <div className="flex w-5 shrink-0 flex-col items-center">
                    {isLive ? (
                      <span className="relative mt-[3px] flex size-2 shrink-0">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-semantic-success opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-semantic-success" />
                      </span>
                    ) : (
                      <div className="mt-[3px] size-2 shrink-0 rounded-full bg-stroke-strong" />
                    )}
                    {!isLast && <div className="mt-1 w-px flex-1 bg-stroke-muted" />}
                  </div>

                  {/* Right: timestamp + card */}
                  <div className={`flex min-w-0 flex-1 flex-col gap-2 ${!isLast ? "pb-4" : ""}`}>
                    <span className={`text-[11px] tabular-nums leading-none ${isLive ? "font-semibold text-semantic-success" : "text-text-muted"}`}>{time}</span>
                    {entry.kind === "trip" ? (
                      <TripActivityItem
                        trip={entry.trip}
                        href="/trip-receipt"
                        showAvatars={showAvatars}
                        driverImageSrc={showAvatars ? DRIVER_AVATAR_MAP[entry.trip.driver] : undefined}
                        vehicleColor={showAvatars ? VEHICLE_COLOR_MAP[entry.trip.vehicle ?? ""] : undefined}
                        timelineMode
                      />
                    ) : entry.kind === "score" ? (
                      <ScoreUpdateActivityItem item={entry.item} timelineMode />
                    ) : (
                      <LiveActivityCard live={entry.live} showAvatars={showAvatars} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Conversation starters */}
      <MilesConversationStarters />
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
    <div className="flex h-full w-full flex-col gap-3 rounded-panel border border-stroke-muted bg-surface-card p-4 shadow-card">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-strong">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/miles-proto-2/miles-icon.svg"
              alt="Miles"
              className="size-8 object-contain"
            />
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={card.dismissLabel}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-strong hover:text-text-secondary active:bg-surface-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-strong focus-visible:ring-offset-1"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="font-mono text-sm leading-relaxed text-text-secondary">
          {card.message}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Link
          href={card.actionHref}
          className="flex min-h-11 w-full items-center justify-center rounded-control bg-semantic-success px-4 text-sm font-semibold text-background transition-colors hover:bg-semantic-success/90 active:bg-semantic-success/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-success focus-visible:ring-offset-1"
        >
          {card.actionLabel}
        </Link>
      </div>
    </div>
  );
}

function AgentCoachingCarousel({
  cards,
  onAllDismissed,
}: {
  cards: CoachingCard[];
  onAllDismissed: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  // Stores the target scroll index to apply after the dismissed card is removed from the DOM
  const pendingScrollRef = useRef<number | null>(null);

  const visibleCards = cards.filter((c) => !dismissedIds.has(c.id));

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    const idx = Math.round(el.scrollLeft / width);
    setActiveIndex(Math.max(0, Math.min(idx, visibleCards.length - 1)));
  }, [visibleCards.length]);

  const goTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  }, []);

  const handleDismiss = useCallback(
    (cardId: string) => {
      const currentCard = visibleCards[activeIndex];
      const newVisible = visibleCards.filter((c) => c.id !== cardId);

      // Decide where to land after the card is removed
      let newIndex: number;
      if (currentCard && currentCard.id !== cardId) {
        // User dismissed a different card — stay on the current one
        newIndex = newVisible.findIndex((c) => c.id === currentCard.id);
        if (newIndex === -1) newIndex = 0;
      } else {
        // User dismissed the visible card — advance or clamp to last
        newIndex = Math.min(activeIndex, Math.max(0, newVisible.length - 1));
      }

      pendingScrollRef.current = newIndex;
      setActiveIndex(newIndex);
      setDismissedIds((prev) => new Set([...prev, cardId]));
    },
    [visibleCards, activeIndex]
  );

  // After the DOM updates (dismissed card removed), instantly scroll to the right position
  useLayoutEffect(() => {
    if (pendingScrollRef.current !== null) {
      const idx = pendingScrollRef.current;
      pendingScrollRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ left: idx * el.clientWidth, behavior: "instant" as ScrollBehavior });
    }
  });

  // Notify parent when all cards have been dismissed
  useEffect(() => {
    if (visibleCards.length === 0 && dismissedIds.size > 0) {
      onAllDismissed();
    }
  }, [visibleCards.length, dismissedIds.size, onAllDismissed]);

  if (visibleCards.length === 0) return null;

  return (
    <div className="mx-5 flex flex-col gap-2">
      <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-text-muted">
        From Miles
      </span>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden scrollbar-none"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {visibleCards.map((card) => (
          <div key={card.id} className="w-full min-w-full shrink-0 basis-full snap-start">
            <AgentCoachingCard card={card} onDismiss={() => handleDismiss(card.id)} />
          </div>
        ))}
      </div>
      {visibleCards.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {visibleCards.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to card ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex ? "w-4 bg-foreground" : "w-1.5 bg-stroke-muted hover:bg-stroke-strong"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QuickActions({ showRoadsideAssist }: { showRoadsideAssist: boolean }) {
  if (!showRoadsideAssist) return null;

  return (
    <div className="mx-5 grid grid-cols-1 gap-3">
      <button
        type="button"
        aria-label="Roadside Assist"
        className="inline-flex size-11 items-center justify-center justify-self-start rounded-full border border-stroke-muted bg-surface-card transition-colors hover:bg-background"
      >
        <svg className="size-5 text-semantic-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  State B: Trip in Progress                                          */
/* ------------------------------------------------------------------ */

function LiveSpeed({ mph, maxMph }: { mph: number; maxMph: number }) {
  const protoOffsets = [0, 1, 0, -1, 0, 1, 0, -1] as const;
  const [offsetIndex, setOffsetIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setOffsetIndex((prev) => (prev + 1) % protoOffsets.length);
    }, 1400);

    return () => window.clearInterval(interval);
  }, [protoOffsets.length]);

  const displayMph = mph + protoOffsets[offsetIndex];

  return (
    <div className="mx-5 flex items-start justify-between gap-3 rounded-panel bg-foreground px-5 py-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold leading-none tabular-nums text-background">
            {displayMph}
          </span>
          <span className="text-sm font-medium text-background/50">mph</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tabular-nums text-background">{maxMph} mph</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-background/40">Trip max speed</span>
        </div>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5 pt-1">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-semantic-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-semantic-success" />
          </span>
          <span className="text-xs font-medium text-semantic-success">Live</span>
        </div>
      </div>
    </div>
  );
}

function TripVehicleStatus({ vehicleLabel }: { vehicleLabel?: string }) {
  const STATUSES = [
    { label: "Engine", value: "Good", dot: "bg-semantic-success", text: "text-semantic-success" },
    { label: "Battery", value: "Fair", dot: "bg-semantic-warning", text: "text-semantic-warning" },
    { label: "Fuel", value: "38%", dot: "bg-semantic-info", text: "text-text-secondary" },
  ];
  return (
    <Link
      href={`/vehicle?from=dashboard&vehicle=rav4`}
      className="mx-5 block rounded-panel border border-stroke-muted bg-surface-card p-3 transition-colors hover:bg-background"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          {vehicleLabel ?? "Vehicle"}
        </span>
        <svg className="size-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {STATUSES.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded bg-surface-subtle px-2.5 py-2">
            <span className="text-[11px] font-medium text-text-muted">{s.label}</span>
            <div className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${s.dot}`} />
              <span className={`text-sm font-semibold leading-none ${s.text}`}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}

function TripDriverCard({ driver }: { driver: string }) {
  const DRIVER_DATA: Record<string, { initials: string; color: string; score: number; relation: string }> = {
    Jack:      { initials: "JM", color: "bg-semantic-info", score: 74, relation: "Child" },
    Emma:      { initials: "EM", color: "bg-foreground", score: 79, relation: "Spouse" },
    Christina: { initials: "CM", color: "bg-semantic-success", score: 82, relation: "You" },
  };
  const d = DRIVER_DATA[driver] ?? { initials: driver.slice(0, 2).toUpperCase(), color: "bg-stroke-strong", score: "--", relation: "Driver" };
  return (
    <Link
      href="/drivers"
      className="mx-5 flex items-center gap-3 rounded-panel border border-stroke-muted bg-surface-card p-3.5 transition-colors hover:bg-background"
    >
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${d.color} text-xs font-semibold text-background`}>
        {d.initials}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold leading-none text-text-primary">{driver}</span>
        <span className="text-xs text-text-muted">{d.relation} · Miles Score {d.score}</span>
      </div>
      <svg className="size-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

function TripInProgress({
  driver,
  vehicleLabel,
  mapStyle,
}: {
  vehicle: Vehicle;
  driver: string;
  vehicleLabel?: string;
  mapStyle: string;
}) {
  const currentPos = LIVE_ROUTE[LIVE_ROUTE.length - 1];
  const fromAgent = !!vehicleLabel;
  return (
    <div className="flex flex-col gap-4 pt-3">
      {/* Modal header — Driving left, close right */}
      <div className="flex items-center justify-between px-5 pt-2">
        <span className="flex items-center gap-1.5 rounded-full bg-surface-strong px-3 py-1.5 text-xs font-semibold text-semantic-success">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-semantic-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-semantic-success" />
          </span>
          Driving
        </span>
        {fromAgent && (
          <Link
            href="/miles?context=kid-trip"
            className="inline-flex size-8 items-center justify-center rounded-full bg-black/10 text-text-secondary transition-colors hover:bg-black/15"
            aria-label="Close"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </Link>
        )}
      </div>

      {/* Live Map */}
      <div className="relative mx-5 overflow-hidden rounded-panel">
        <div className="relative aspect-[4/3] w-full">
          <MapView
            key={mapStyle}
            route={LIVE_ROUTE}
            markers={[
              { lat: LIVE_ROUTE[0][0], lng: LIVE_ROUTE[0][1], type: "start" },
              { lat: currentPos[0], lng: currentPos[1], type: "end" },
            ]}
            interactive={false}
            routeColor="#16a34a"
            routeWeight={4}
            mapStyle={mapStyle}
          />
        </div>
        {/* Trip stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
          <div className="flex items-center gap-4 text-background/80">
            <span className="text-xs font-medium">4.2 mi</span>
            <span className="text-background/40">&middot;</span>
            <span className="text-xs font-medium">12 min</span>
            <span className="text-background/40">&middot;</span>
            <span className="text-xs font-medium">Preston Rd & Belt Line &rarr; ...</span>
          </div>
        </div>
      </div>

      {/* Speed */}
      <LiveSpeed mph={34} maxMph={47} />

      {/* Vehicle health bento */}
      <TripVehicleStatus vehicleLabel={vehicleLabel} />

      {/* Driver */}
      <TripDriverCard driver={driver} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trip Complete                                                       */
/* ------------------------------------------------------------------ */

function TripComplete({
  vehicle,
  onReturn,
  mapStyle,
}: {
  vehicle: Vehicle;
  onReturn: () => void;
  mapStyle: string;
}) {
  const s = TRIP_SUMMARY;
  return (
    <div className="flex flex-col gap-4 pt-3">
      {/* Header */}
      <div className="flex flex-col gap-0.5 px-5">
        <h1 className="text-lg font-semibold leading-snug text-text-primary">
          {vehicle.name}
        </h1>
        <span className="text-xs text-text-secondary">Trip complete</span>
      </div>

      {/* Trip summary card */}
      <div className="mx-5 flex flex-col gap-4 rounded-panel border border-stroke-muted bg-surface-card p-4">
        {/* Map thumbnail */}
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-control">
          <MapView
            key={mapStyle}
            route={LIVE_ROUTE}
            markers={[
              { lat: LIVE_ROUTE[0][0], lng: LIVE_ROUTE[0][1], type: "start" },
              { lat: LIVE_ROUTE[LIVE_ROUTE.length - 1][0], lng: LIVE_ROUTE[LIVE_ROUTE.length - 1][1], type: "end" },
            ]}
            interactive={false}
            routeWeight={3}
            mapStyle={mapStyle}
          />
        </div>

        {/* Route name */}
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-text-primary">
            {s.from} &rarr; {s.to}
          </span>
          <span className="text-xs text-text-secondary">{s.time}</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Distance</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">{s.distance}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Duration</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">{s.duration}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Score</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">{s.score}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Events</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">{s.events}</span>
          </div>
        </div>

        {/* Driver */}
        <div className="flex items-center gap-2 border-t border-stroke-muted pt-3">
          <div className="flex size-7 items-center justify-center rounded-full bg-surface-strong">
            <svg className="size-3.5 text-text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-text-primary">{s.driver}</span>
          <button type="button" className="ml-auto text-xs font-medium text-semantic-info hover:text-semantic-info/80">
            Not {s.driver}?
          </button>
        </div>

        {/* CTA */}
        <Link
          href="/trip-detail"
          className="flex h-10 items-center justify-center rounded-control bg-foreground text-sm font-semibold text-background transition-colors hover:bg-foreground/85"
        >
          View trip detail
        </Link>
      </div>

      {/* Post-trip coaching opportunity */}
      <div className="mx-5 flex flex-col gap-3 rounded-panel border border-stroke-muted bg-surface-subtle p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-strong">
            <svg className="size-4 text-semantic-success" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
            </svg>
          </div>
          <p className="flex-1 font-mono text-sm leading-relaxed text-text-secondary">
            One hard braking event on Preston Rd. Leaving a little more following distance can help — want tips?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/miles?context=coaching-braking"
            className="flex h-10 items-center rounded-control px-4 text-sm font-semibold text-semantic-info transition-colors hover:bg-surface-strong"
          >
            Show me
          </Link>
          <button
            type="button"
            onClick={onReturn}
            className="flex h-10 items-center rounded-control px-4 text-sm font-medium text-text-muted transition-colors hover:bg-surface-strong"
          >
            Done
          </button>
        </div>
      </div>

      {/* Back to dashboard */}
      <button
        type="button"
        onClick={onReturn}
        className="mx-5 flex h-10 items-center justify-center rounded-control border border-stroke-muted bg-surface-card text-sm font-medium text-text-secondary transition-colors hover:bg-background"
      >
        Back to dashboard
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                     */
/* ------------------------------------------------------------------ */

type DashboardMode = "parked" | "trip" | "complete";
type FleetMode = "both-parked" | "one-driving";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [coachingDismissed, setCoachingDismissed] = useState(false);
  const [headerAction, setHeaderAction] = useState<"profile" | "roadside">("roadside");
  const [footerNavMode, setFooterNavMode] = useState<FooterNavMode>("full");
  const [showAvatars, setShowAvatars] = useState(true);
  const [fleetMode, setFleetMode] = useState<FleetMode>("one-driving");
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v12");
  const [showTodos, setShowTodos] = useState(false);
  const [compactCards, setCompactCards] = useState(false);

  // iOS large-title → compact nav bar
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [titleHidden, setTitleHidden] = useState(false);

  // Dark mode — reads/writes the shared proto theme preference
  const forceLight = useForceLightMode();
  const isDark = !forceLight;

  const modeParam = searchParams.get("mode") as DashboardMode | null;
  const mode: DashboardMode =
    modeParam === "trip" || modeParam === "complete" ? modeParam : "parked";
  const driverParam = searchParams.get("driver") ?? undefined;
  const vehicleLabelParam = searchParams.get("vehicleLabel") ?? undefined;

  const vehicle = VEHICLES[0];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FOOTER_NAV_MODE_STORAGE_KEY);
      setFooterNavMode(raw === "compact" ? "compact" : "full");
    } catch {
      setFooterNavMode("full");
    }
  }, []);

  // Observe the large title — when it scrolls out of the nearest overflow container,
  // show the compact nav bar. Must use the scroll container as root (not the viewport)
  // because the page scrolls inside PageTransition's overflow-y-auto div.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    // Walk up the DOM to find the scrollable ancestor
    let root: Element | null = el.parentElement;
    while (root) {
      const oy = window.getComputedStyle(root).overflowY;
      if (oy === "auto" || oy === "scroll") break;
      root = root.parentElement;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setTitleHidden(!entry.isIntersecting),
      { root: root ?? null, threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const navigate = useCallback(
    (params: { mode?: string }) => {
      const next = new URLSearchParams();
      const m = params.mode ?? "parked";
      if (m !== "parked") next.set("mode", m);
      const qs = next.toString();
      router.push(p(`/dashboard${qs ? `?${qs}` : ""}`));
    },
    [router]
  );

  function setMode(m: DashboardMode) {
    navigate({ mode: m });
  }

  const displayVehicles =
    fleetMode === "both-parked"
      ? VEHICLES.map((v) => ({ ...v, liveTrip: undefined }))
      : VEHICLES;

  function setNavMode(mode: FooterNavMode) {
    setFooterNavMode(mode);
    try {
      window.localStorage.setItem(FOOTER_NAV_MODE_STORAGE_KEY, mode);
      window.dispatchEvent(new Event("miles-proto-2-footer-nav-mode-change"));
    } catch {
      // ignore localStorage errors in prototype
    }
  }

  return (
    <main
      className="flex min-h-dvh flex-col bg-background pb-28"
      style={{
        paddingTop: "max(env(safe-area-inset-top), 8px)",
        paddingBottom: "max(env(safe-area-inset-bottom), 112px)",
      }}
    >
      {/* iOS compact nav bar — sticky zero-height anchor + absolute child.
          The sticky wrapper locks to the top of the scroll container without
          consuming space; the absolute header hangs from it. This avoids all
          fixed-inside-overflow issues. */}
      {(mode === "parked" && !vehicleLabelParam) && (
        <div className="sticky top-0 z-40 h-0 overflow-visible">
          <header
            aria-hidden={!titleHidden}
            className={`absolute inset-x-0 top-0 flex items-center justify-between border-b border-stroke-muted/60 bg-background/85 px-5 backdrop-blur-xl transition-all duration-200 ease-out ${
              titleHidden
                ? "translate-y-0 opacity-100"
                : "-translate-y-1 opacity-0 pointer-events-none"
            }`}
            style={{ paddingTop: "max(env(safe-area-inset-top), 12px)", paddingBottom: "10px" }}
          >
            <span className="text-base font-semibold text-text-primary">Miles</span>
            <HeaderAction headerAction={headerAction} size="compact" />
          </header>
        </div>
      )}

      {mode === "trip" || vehicleLabelParam ? (
        <TripInProgress
          vehicle={vehicle}
          driver={driverParam ?? "Emma"}
          vehicleLabel={vehicleLabelParam}
          mapStyle={mapStyle}
        />
      ) : mode === "complete" ? (
        <TripComplete vehicle={vehicle} onReturn={() => setMode("parked")} mapStyle={mapStyle} />
      ) : (
        <div className="flex flex-col gap-4">
          <FleetView vehicles={displayVehicles} headerAction={headerAction} showAvatars={showAvatars} mapStyle={mapStyle} titleRef={titleRef} compactCards={compactCards} setCompactCards={setCompactCards} />
          {!coachingDismissed && (
            <AgentCoachingCarousel
              cards={COACHING_CARDS}
              onAllDismissed={() => setCoachingDismissed(true)}
            />
          )}
          <ActivityFeed showAvatars={showAvatars} />
          {showTodos && <TodoPreview items={DEMO_TODOS} className="mx-5" />}
          <QuickActions showRoadsideAssist={headerAction === "profile"} />
        </div>
      )}

      {/* Proto state toggle */}
      <div className="mx-5 mt-6 flex flex-col items-center gap-3 border-t border-stroke-muted pt-4">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Proto controls
        </span>
        <Link
          href="/hub"
          className="rounded-full border border-stroke-muted bg-surface-card px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-background"
        >
          Design system hub
        </Link>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Fleet
          </span>
          <div className="flex items-center gap-1.5">
            {(["both-parked", "one-driving"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFleetMode(m)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  fleetMode === m
                    ? "bg-surface-strong text-text-secondary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {m === "both-parked" ? "both parked" : "one driving"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Header action
          </span>
          <div className="flex items-center gap-1.5">
            {(["profile", "roadside"] as const).map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => setHeaderAction(action)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  headerAction === action
                    ? "bg-surface-strong text-text-secondary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {action === "profile" ? "profile" : "roadside assist"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Avatars
          </span>
          <button
            type="button"
            onClick={() => setShowAvatars((prev) => !prev)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              showAvatars
                ? "bg-surface-strong text-text-secondary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {showAvatars ? "Photos on" : "Photos off"}
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Todos
          </span>
          <button
            type="button"
            onClick={() => setShowTodos((prev) => !prev)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              showTodos
                ? "bg-surface-strong text-text-secondary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {showTodos ? "Visible" : "Hidden"}
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Footer tabs
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setNavMode("full")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                footerNavMode === "full"
                  ? "bg-surface-strong text-text-secondary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              5 tabs
            </button>
            <button
              type="button"
              onClick={() => setNavMode("compact")}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                footerNavMode === "compact"
                  ? "bg-surface-strong text-text-secondary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              4 tabs (hide account)
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Map style
          </span>
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            className="rounded border border-stroke-muted bg-surface-card px-3 py-2 text-[11px] font-medium text-text-primary focus:border-stroke-strong focus:outline-none focus:ring-1 focus:ring-stroke-strong"
          >
            {MAPBOX_STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Theme
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setForceLightMode(true)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                !isDark
                  ? "bg-surface-strong text-text-secondary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setForceLightMode(false)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                isDark
                  ? "bg-surface-strong text-text-secondary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              Dark
            </button>
          </div>
        </div>
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
