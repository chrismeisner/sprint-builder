"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "@/app/sandboxes/miles-proto-3/_components/link";
import { MapView } from "@/app/sandboxes/miles-proto-3/_components/map-view";
import { TodoPreview } from "@/app/sandboxes/miles-proto-3/_components/todo-preview";
import { useForceLightMode, setForceLightMode } from "@/app/sandboxes/miles-proto-3/_components/force-light-mode";
import { DEMO_TODOS } from "@/app/sandboxes/miles-proto-3/_lib/demo-todos";
import { DEMO_TRIPS } from "@/app/sandboxes/miles-proto-3/_lib/demo-trips";
import { p } from "@/app/sandboxes/miles-proto-3/_lib/nav";

const FOOTER_NAV_MODE_STORAGE_KEY = "miles-proto-3-footer-nav-mode";
type FooterNavMode = "full" | "compact";

const MAPBOX_STYLES = [
  { value: "mapbox://styles/mapbox/light-v11", label: "Light" },
  { value: "mapbox://styles/mapbox/dark-v11", label: "Dark" },
  { value: "mapbox://styles/mapbox/streets-v12", label: "Streets" },
  { value: "mapbox://styles/mapbox/outdoors-v12", label: "Outdoors" },
  { value: "mapbox://styles/mapbox/satellite-v9", label: "Satellite" },
  { value: "mapbox://styles/mapbox/satellite-streets-v12", label: "Satellite Streets" },
] as const;

const AVATAR_MOM = "/miles-proto-3/images/mom.jpg";
const AVATAR_TEEN = "/miles-proto-3/images/teen.jpg";

/* ------------------------------------------------------------------ */
/*  iOS Type Scale Reference — 18 roles                               */
/*  Source of truth: lib/design-system/ios-typography.ts              */
/*  Hub reference:  /sandboxes/miles-proto-3/hub (Typography section) */
/*                                                                     */
/*  Figma style         iOS / SwiftUI               Tailwind           */
/*  ──────────────────  ──────────────────────────  ───────────────────*/
/*  Titles                                                             */
/*  Large Title         .largeTitle                 text-3xl font-bold leading-tight */
/*  Display             .title2 + .uppercase        text-2xl font-semibold uppercase leading-tight */
/*  Title               .title3                     text-lg font-semibold leading-snug */
/*  Headline            .headline                   text-base font-semibold */
/*                                                                     */
/*  Body                                                               */
/*  Subheadline Bold    .subheadline.bold()         text-sm font-semibold leading-none */
/*  Subheadline         .subheadline                text-sm font-medium */
/*  Body                .body                       text-sm leading-relaxed */
/*                                                                     */
/*  Stats                                                              */
/*  Stat — Large        36pt bold tabular           text-4xl font-bold leading-none tabular-nums */
/*  Stat — Medium       18pt bold tabular           text-lg font-bold tabular-nums */
/*                                                                     */
/*  Captions                                                           */
/*  Caption Emphasized  .caption.bold()             text-xs font-semibold */
/*  Caption             .caption                    text-xs font-medium */
/*  Caption Muted       .caption secondary          text-xs */
/*                                                                     */
/*  Small labels                                                       */
/*  Section Header      caption2 semibold uppercase text-[11px] font-semibold uppercase tracking-wide */
/*  Caption 2           .caption2                   text-[11px] font-medium */
/*                                                                     */
/*  Micro                                                              */
/*  Badge               10pt semibold uppercase     text-[10px] font-semibold uppercase tracking-wide */
/*  Micro Label         10pt medium uppercase       text-[10px] font-medium uppercase tracking-wide */
/*                                                                     */
/*  AI voice                                                           */
/*  AI Body             SF Mono .body               font-mono text-sm leading-relaxed */
/*  AI Label            SF Mono caption2 uppercase  font-mono text-[11px] font-medium uppercase tracking-wide */
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
    driver: string;
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
    imageSrc: "/api/sandbox-files/miles-proto-3/public/images/civic.jpg",
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
    driverScore: 82.7,
    scoreDelta: 3,
    scoreUpdated: "13h ago",
    engineCheckedAt: "No errors",
    fuelRange: "230 miles",
    lastTrip: {
      driver: "Christina",
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
    imageSrc: "/api/sandbox-files/miles-proto-3/public/images/rav4.jpg",
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
    driverScore: 74.3,
    scoreDelta: -2,
    scoreUpdated: "13h ago",
    engineCheckedAt: "No errors",
    fuelRange: "120 miles",
    liveTrip: { driver: "Jack", vehicleLabel: "Toyota RAV4", mph: 34, startedAgo: "12 mins ago" },
    lastTrip: {
      driver: "Emma",
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
      "Good evening Chris,\n\nJack took the RAV4 out 12 mins ago, and the Civic is parked at home. Let me know if you want a notification when he goes over 80 mph.",
    actionLabel: "Let's do it",
    actionHref: "/miles?context=fuel",
    dismissLabel: "Dismiss",
  },
  {
    id: "oil-reminder",
    message:
      "Your next oil change is due by May 12 or in about 800 miles, whichever comes first. I can help you schedule it or set a reminder.",
    actionLabel: "Set a reminder",
    actionHref: "/miles?context=oil",
    dismissLabel: "Dismiss",
  },
  {
    id: "score-tip",
    message:
      "One hard braking event on your last trip. I can share tips to smooth out your driving.",
    actionLabel: "Show me tips",
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

function StatsBento({ v, engineLabel, engineText, fuelText, compact = false }: {
  v: Vehicle;
  engineLabel: string;
  engineText: string;
  fuelText: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center divide-x divide-stroke-muted rounded-control bg-surface-subtle overflow-hidden">
        {/* Score */}
        <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 15, lineHeight: 1, fontVariationSettings: "'FILL' 1" }} aria-hidden="true">speed</span>
          <span className="text-sm font-bold leading-none text-semantic-success">{v.driverScore.toFixed(1)}</span>
        </div>
        {/* Engine */}
        <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 15, lineHeight: 1, fontVariationSettings: "'FILL' 1" }} aria-hidden="true">build</span>
          <span className={`text-sm font-bold leading-none ${engineText}`}>{engineLabel}</span>
        </div>
        {/* Fuel */}
        <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
          <span className="material-symbols-outlined text-text-muted" style={{ fontSize: 15, lineHeight: 1, fontVariationSettings: "'FILL' 1" }} aria-hidden="true">local_gas_station</span>
          <span className={`text-sm font-bold leading-none tabular-nums ${fuelText}`}>{(v.fuelPct ?? 0)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Score */}
      <div className="flex flex-col gap-1 rounded-control bg-surface-subtle px-3 py-2.5">
        <span className="text-[11px] font-medium text-text-muted">Miles Score</span>
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold leading-none tabular-nums text-semantic-success">{v.driverScore.toFixed(1)}</span>
          {v.scoreDelta >= 0 ? (
            <svg className="size-3 shrink-0 text-semantic-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
          ) : (
            <svg className="size-3 shrink-0 text-semantic-warning" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
            </svg>
          )}
        </div>
          <span className="text-[11px] font-medium text-text-muted">{v.scoreUpdated}</span>
      </div>
      {/* Engine */}
      <div className="flex flex-col gap-1 rounded-control bg-surface-subtle px-3 py-2.5">
        <span className="text-[11px] font-medium text-text-muted">Engine</span>
        <span className={`text-lg font-bold leading-none ${engineText}`}>{engineLabel}</span>
          <span className="text-[11px] font-medium text-text-muted whitespace-nowrap">{v.engineCheckedAt}</span>
      </div>
      {/* Fuel */}
      <div className="flex flex-col gap-1 rounded-control bg-surface-subtle px-3 py-2.5">
        <span className="text-[11px] font-medium text-text-muted">Fuel</span>
        <span className={`text-lg font-bold leading-none tabular-nums ${fuelText}`}>{(v.fuelPct ?? 0)}%</span>
          <span className="text-[11px] font-medium text-text-muted whitespace-nowrap overflow-hidden">{v.fuelRange}</span>
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
      className="mx-4 mb-4 flex items-start gap-3 rounded-panel border border-stroke-muted bg-surface-subtle px-3 py-3 transition-colors hover:bg-surface-strong"
    >
      <PersonAvatar
        name={live.driver}
        imageSrc={showAvatars ? AVATAR_TEEN : undefined}
        size="md"
        colorClass="bg-semantic-success"
        textColorClass="text-background"
        className="mt-0.5"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Title + Live indicator */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold leading-none text-semantic-success">{live.driver} is driving</span>
          <div className="flex shrink-0 items-center gap-1">
            <span className="size-1.5 rounded-full bg-semantic-success" />
            <span className="text-xs text-text-secondary">Live</span>
          </div>
        </div>
        {/* Speed + chevron */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tabular-nums text-semantic-success">{live.mph} mph</span>
          <svg className="size-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function LastTripStrip({ lastTrip, showAvatars, driverAvatarSrc }: {
  lastTrip: Vehicle["lastTrip"];
  showAvatars: boolean;
  driverAvatarSrc?: string;
}) {
  const timeLabel = lastTrip.time.replace(/^Today,\s*/i, "");
  return (
    <Link
      href="/trip-receipt"
      className="mx-4 mb-4 flex items-start gap-3 rounded-panel border border-stroke-muted bg-surface-subtle px-3 py-3 transition-colors hover:bg-surface-strong"
    >
      <PersonAvatar
        name={lastTrip.driver}
        imageSrc={showAvatars && driverAvatarSrc ? driverAvatarSrc : undefined}
        size="md"
        colorClass="bg-surface-strong"
        textColorClass="text-text-secondary"
        className="mt-0.5"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Route + time */}
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-semibold leading-none text-text-primary">{lastTrip.from} → {lastTrip.to}</span>
          <span className="shrink-0 text-xs text-text-secondary">{timeLabel}</span>
        </div>
        {/* Stats text + chevron */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tabular-nums text-text-muted">{lastTrip.duration} · {lastTrip.distance}</span>
          <svg className="size-3.5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

const CARD_DRIVER_AVATAR_MAP: Record<string, string> = {
  Christina: AVATAR_MOM,
  Emma: AVATAR_TEEN,
  Jack: AVATAR_TEEN,
};

function VehicleCardContent({ v, showAvatars = false, compact = false }: { v: Vehicle; showAvatars?: boolean; compact?: boolean }) {
  const live = v.liveTrip;
  const vehicleHref = `/vehicle?from=dashboard&vehicle=${v.id}`;
  const tripHref = live
    ? `/dashboard?mode=trip&driver=${encodeURIComponent(live.driver)}&vehicleLabel=${encodeURIComponent(live.vehicleLabel)}`
    : null;
  const lastTripAvatarSrc = CARD_DRIVER_AVATAR_MAP[v.lastTrip.driver];

  const engineLabel = v.engine === "good" ? "Good" : v.engine === "attention" ? "Attention" : "—";
  const engineText = v.engine === "good" ? "text-semantic-success" : "text-semantic-warning";
  const fuelPct = v.fuelPct ?? 0;
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
          <StatsBento v={v} engineLabel={engineLabel} engineText={engineText} fuelText={fuelText} compact />
        </Link>

        {/* Driver strip when live, last trip strip when parked */}
        {live && tripHref
          ? <DriverStrip live={live} tripHref={tripHref} showAvatars={showAvatars} />
          : <LastTripStrip lastTrip={v.lastTrip} showAvatars={showAvatars} driverAvatarSrc={lastTripAvatarSrc} />
        }
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
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
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
        <StatsBento v={v} engineLabel={engineLabel} engineText={engineText} fuelText={fuelText} />
      </Link>

      {/* Driver strip when live, last trip strip when parked */}
      {live && tripHref
        ? <DriverStrip live={live} tripHref={tripHref} showAvatars={showAvatars} />
        : <LastTripStrip lastTrip={v.lastTrip} showAvatars={showAvatars} driverAvatarSrc={lastTripAvatarSrc} />
      }
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Fleet view with list / card toggle                                 */
/* ------------------------------------------------------------------ */

function VehicleCarousel({
  vehicles,
  showAvatars,
  compactCards,
}: {
  vehicles: Vehicle[];
  showAvatars: boolean;
  compactCards: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const sorted = [...vehicles].sort((a, b) => (b.liveTrip ? 1 : 0) - (a.liveTrip ? 1 : 0));

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    const idx = Math.round(el.scrollLeft / width);
    setActiveIndex(Math.max(0, Math.min(idx, sorted.length - 1)));
  }, [sorted.length]);

  const goTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  }, []);

  return (
    <div className="mx-5 flex flex-col gap-2">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden scrollbar-none"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {sorted.map((v) => (
          <div key={v.id} className="w-full min-w-full shrink-0 basis-full snap-start">
            <div className="overflow-hidden rounded-card border border-stroke-muted bg-surface-card">
              <VehicleCardContent v={v} showAvatars={showAvatars} compact={compactCards} />
            </div>
          </div>
        ))}
      </div>
      {sorted.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {sorted.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to vehicle ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === activeIndex ? "size-1.5 bg-foreground" : "size-1.5 bg-stroke-muted hover:bg-stroke-strong"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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

function MapFilterPills({
  vehicles,
  filter,
  onChange,
}: {
  vehicles: Vehicle[];
  filter: string;
  onChange: (f: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto px-5"
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
    >
      {/* Fleet View pill */}
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`flex shrink-0 items-center justify-center rounded-full px-3.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors ${
          filter === "all"
            ? "bg-foreground text-background"
            : "border border-stroke-muted bg-surface-card text-text-secondary hover:bg-surface-subtle"
        }`}
      >
        Fleet View
      </button>

      {/* One pill per vehicle */}
      {vehicles.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(filter === v.id ? "all" : v.id)}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors ${
            filter === v.id
              ? "border-foreground bg-surface-card text-text-primary"
              : "border-stroke-muted bg-surface-card text-text-primary hover:bg-surface-subtle"
          }`}
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: VEHICLE_COLOR_MAP[v.name] ?? "#6b7280" }}
          />
          {v.name}
        </button>
      ))}
    </div>
  );
}

function FleetView({
  vehicles,
  showAvatars,
  mapStyle,
  compactCards,
  setCompactCards,
  vehicleLayout,
  afterFilterPills,
}: {
  vehicles: Vehicle[];
  showAvatars: boolean;
  mapStyle: string;
  compactCards: boolean;
  setCompactCards: (v: boolean) => void;
  vehicleLayout: VehicleLayout;
  afterFilterPills?: React.ReactNode;
}) {
  const [mapFilter, setMapFilter] = useState<string>("all");

  // When the fleet mode changes (vehicles prop changes), reset the filter
  // if the currently-filtered vehicle is no longer in the list.
  const filteredVehicles =
    mapFilter === "all"
      ? vehicles
      : vehicles.filter((v) => v.id === mapFilter).length > 0
      ? vehicles.filter((v) => v.id === mapFilter)
      : vehicles;

  const liveVehicle = filteredVehicles.find((v) => v.liveTrip);

  const allMarkers = [
    ...filteredVehicles
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
      {/*
        Bounding container: pills lock flush against the main header (no travel).
        Container ends at the map bottom — that is the displacement trigger.
      */}
      <div className="flex flex-col gap-0">
        <div className="sticky z-10 bg-background pt-2 pb-2" style={{ top: "67px" }}>
          <MapFilterPills vehicles={vehicles} filter={mapFilter} onChange={setMapFilter} />
        </div>

        {/* Fleet map — full-width, no rounding */}
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: "66.667%" }}>
          <MapView key={`fleet-${showAvatars}-${mapStyle}-${liveVehicle ? "live" : "parked"}-${mapFilter}`} markers={allMarkers} mapStyle={mapStyle} />
        </div>
      </div>

      {/* AI card — outside the bounding container, rendered after the map */}
      {afterFilterPills}

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

      {vehicleLayout === "carousel" ? (
        <VehicleCarousel vehicles={vehicles} showAvatars={showAvatars} compactCards={compactCards} />
      ) : (
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
      )}
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

/* ------------------------------------------------------------------ */
/*  Shared avatar primitives                                           */
/* ------------------------------------------------------------------ */

type AvatarSize = "sm" | "md"; // sm = size-7 (28 px)  md = size-9 (36 px)
const AVATAR_DIM: Record<AvatarSize, string> = { sm: "size-7", md: "size-9" };

/** Person photo, or a lettered circle when no photo is available. */
function PersonAvatar({
  name,
  imageSrc,
  size = "md",
  colorClass = "bg-surface-strong",
  textColorClass = "text-text-secondary",
  initials,
  bordered = false,
  className,
}: {
  name: string;
  imageSrc?: string;
  size?: AvatarSize;
  colorClass?: string;
  textColorClass?: string;
  /** Override the displayed label (defaults to first letter of name). */
  initials?: string;
  /** Adds border-2 border-background shadow-sm to an image avatar. */
  bordered?: boolean;
  className?: string;
}) {
  const dim = AVATAR_DIM[size];
  const label = initials ?? name[0];
  const textSize = label.length > 1 ? "text-[10px]" : "text-[11px]";
  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={name}
        className={`${dim} shrink-0 rounded-full object-cover${bordered ? " border-2 border-background shadow-sm" : ""}${className ? ` ${className}` : ""}`}
      />
    );
  }
  return (
    <div className={`flex ${dim} shrink-0 items-center justify-center rounded-full ${colorClass} ${textSize} font-semibold ${textColorClass}${className ? ` ${className}` : ""}`}>
      {label}
    </div>
  );
}

/** Vehicle initial on a colored circle, or a generic car-outline SVG when no vehicle data. */
function VehicleAvatar({
  vehicle,
  vehicleColor,
  size = "md",
  className,
}: {
  vehicle?: string;
  vehicleColor?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const dim = AVATAR_DIM[size];
  if (vehicle && vehicleColor) {
    return (
      <div
        className={`flex ${dim} shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-background${className ? ` ${className}` : ""}`}
        style={{ backgroundColor: vehicleColor }}
      >
        {vehicle[0]}
      </div>
    );
  }
  return (
    <div className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-surface-subtle${className ? ` ${className}` : ""}`}>
      <svg
        className={`${size === "sm" ? "size-3.5" : "size-4"} text-text-muted`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    </div>
  );
}

/**
 * PersonAvatar with a vehicle badge overlaid at the bottom-right — matching
 * the same proportions used by the map markers (overlay ≈ 50 % of base,
 * −4 px offset so it visibly spills outside the main circle).
 */
function PersonWithVehicleBadge({
  name,
  imageSrc,
  vehicle,
  vehicleColor,
  size = "md",
  colorClass = "bg-surface-strong",
  textColorClass = "text-text-secondary",
  className,
}: {
  name: string;
  imageSrc?: string;
  vehicle?: string;
  vehicleColor?: string;
  size?: AvatarSize;
  colorClass?: string;
  textColorClass?: string;
  className?: string;
}) {
  // sm: base size-7 (28 px) → overlay size-4 (16 px, 57 %)
  // md: base size-9 (36 px) → overlay size-[18px] (18 px, 50 %)
  const badgeSizeClass = size === "sm" ? "size-4" : "size-[18px]";
  return (
    <div className={`relative shrink-0${className ? ` ${className}` : ""}`}>
      <PersonAvatar
        name={name}
        imageSrc={imageSrc}
        size={size}
        colorClass={colorClass}
        textColorClass={textColorClass}
        bordered={!!imageSrc}
      />
      {vehicle && vehicleColor && (
        <span
          className={`absolute -bottom-1 -right-1 flex ${badgeSizeClass} items-center justify-center rounded-full border-2 border-background text-[9px] font-bold leading-none text-background shadow-sm`}
          style={{ backgroundColor: vehicleColor }}
        >
          {vehicle[0]}
        </span>
      )}
    </div>
  );
}

function TripActivityItem({
  trip,
  href,
  showAvatars,
  driverImageSrc,
  vehicleColor = "#2563eb",
  timeLabel,
  grouped = false,
}: {
  trip: (typeof DEMO_TRIPS)[number];
  href: string;
  showAvatars: boolean;
  driverImageSrc?: string;
  vehicleColor?: string;
  timeLabel?: string;
  grouped?: boolean;
}) {
  const resolvedTime = timeLabel ?? trip.timeRange.split(/\s*[–-]\s*/).pop();
  const outerCls = grouped
    ? "flex items-start gap-4 px-4 py-3 transition-colors hover:bg-surface-subtle"
    : "flex items-start gap-4 rounded-panel border border-stroke-muted bg-surface-card p-4 transition-colors hover:bg-surface-subtle";
  return (
    <div className={outerCls}>
      <PersonWithVehicleBadge
        name={trip.driver}
        imageSrc={showAvatars ? driverImageSrc : undefined}
        vehicle={trip.vehicle}
        vehicleColor={vehicleColor}
        size="md"
        className="mt-0.5"
        colorClass="bg-surface-strong"
        textColorClass="text-text-secondary"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Route + time */}
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="min-w-0 truncate text-sm font-semibold leading-none text-text-primary hover:underline">
            {trip.from} → {trip.to}
          </Link>
          <span className="shrink-0 text-xs text-text-secondary">{resolvedTime}</span>
        </div>
        {/* Details text + Trip pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tabular-nums text-text-muted">{trip.duration} · {trip.distance}</span>
          <span className="rounded-full bg-surface-subtle px-2.5 py-[5px] text-[11px] font-medium text-text-primary">Trip</span>
        </div>
      </div>
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

interface EventItem {
  id: string;
  title: string;
  detail: string;
  statusLabel: string;
  timeAgo: string;
  date: string;
  time: string;
  driver: string;
}

const DEMO_EVENTS: EventItem[] = [
  { id: "ev-speed-1", title: "Speeding detected",   detail: "67 in a 65 zone",    statusLabel: "Driving",  timeAgo: "2m ago",  date: "Today",     time: "4:38 PM", driver: "Emma" },
  { id: "ev-brake-1", title: "Hard braking",        detail: "Hwy 75 near Plano",  statusLabel: "Driving",  timeAgo: "18m ago", date: "Today",     time: "4:22 PM", driver: "Jack" },
  { id: "ev-phone-1", title: "Phone use detected",  detail: "At 34 mph on Oak St", statusLabel: "Parked",  timeAgo: "1h ago",  date: "Yesterday", time: "5:14 PM", driver: "Emma" },
];

function ScoreUpdateActivityItem({ item, timeLabel, grouped = false }: { item: ScoreUpdateItem; timeLabel?: string; grouped?: boolean }) {
  const isUp = item.delta >= 0;
  const deltaColor = isUp ? "text-semantic-success" : "text-semantic-warning";
  const resolvedTime = timeLabel ?? item.time;
  const outerCls = grouped
    ? "flex items-start gap-4 px-4 py-3 transition-colors hover:bg-surface-subtle"
    : "flex items-start gap-4 rounded-panel border border-stroke-muted bg-surface-card p-4 transition-colors hover:bg-surface-subtle";

  return (
    <div className={outerCls}>
      <VehicleAvatar
        vehicle={item.vehicle}
        vehicleColor={VEHICLE_COLOR_MAP[item.vehicle]}
        size="md"
        className="mt-0.5"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Title + time */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold leading-none text-text-primary">Miles Score updated</span>
          <span className="shrink-0 text-xs text-text-secondary">{resolvedTime}</span>
        </div>
        {/* Details text + Score pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted">
            {item.vehicle} · <span className={`tabular-nums ${deltaColor}`}>{isUp ? "+" : ""}{item.delta}</span>
          </span>
          <span className="rounded-full bg-surface-subtle px-2.5 py-[5px] text-[11px] font-medium text-text-primary">Score</span>
        </div>
      </div>
    </div>
  );
}

function EventActivityItem({
  event,
  showAvatars,
  driverImageSrc,
  grouped = false,
}: {
  event: EventItem;
  showAvatars: boolean;
  driverImageSrc?: string;
  grouped?: boolean;
}) {
  const outerCls = grouped
    ? "flex items-start gap-4 px-4 py-3 transition-colors hover:bg-surface-subtle"
    : "flex items-start gap-4 rounded-panel border border-stroke-muted bg-surface-card p-4 transition-colors hover:bg-surface-subtle";
  return (
    <div className={outerCls}>
      <PersonWithVehicleBadge
        name={event.driver}
        imageSrc={showAvatars ? driverImageSrc : undefined}
        size="md"
        colorClass="bg-surface-strong"
        textColorClass="text-text-secondary"
        className="mt-0.5"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Title + timeAgo — Miles/Subheadline + Miles/Caption Muted */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold leading-none text-text-primary">{event.title}</span>
          <span className="shrink-0 text-xs text-text-secondary">{event.timeAgo}</span>
        </div>
        {/* Detail + status pill */}
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-xs font-medium text-text-muted">{event.detail}</span>
          <span className="shrink-0 rounded-full bg-surface-subtle px-2.5 py-[5px] text-[11px] font-medium text-text-primary">{event.statusLabel}</span>
        </div>
      </div>
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
  | { kind: "live";  live: LiveTripEntry }
  | { kind: "event"; event: EventItem };

function LiveActivityCard({ live, showAvatars, grouped = false }: { live: LiveTripEntry; showAvatars: boolean; grouped?: boolean }) {
  const tripHref = `/dashboard?mode=trip&driver=${encodeURIComponent(live.driver)}&vehicleLabel=${encodeURIComponent(live.vehicleLabel)}`;
  const vehicleName = Object.keys(VEHICLE_COLOR_MAP).find((k) => live.vehicleLabel.includes(k));
  const vehicleColor = vehicleName ? VEHICLE_COLOR_MAP[vehicleName] : undefined;
  const outerCls = grouped
    ? "flex items-start gap-4 px-4 py-3 transition-colors hover:bg-surface-subtle"
    : "flex items-start gap-4 rounded-panel border border-stroke-muted bg-surface-card p-4 transition-colors hover:bg-surface-subtle";
  return (
    <Link href={tripHref} className={outerCls}>
      <PersonWithVehicleBadge
        name={live.driver}
        imageSrc={showAvatars ? AVATAR_TEEN : undefined}
        vehicle={vehicleName}
        vehicleColor={vehicleColor}
        size="md"
        colorClass="bg-semantic-success"
        textColorClass="text-background"
        className="mt-0.5"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Driver is driving + Now */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold leading-none text-semantic-success">{live.driver} is driving</span>
          <span className="shrink-0 text-xs text-text-secondary">Now</span>
        </div>
        {/* Details text + Driving pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-muted">
            <span className="tabular-nums text-semantic-success">{live.mph} mph</span> · {live.startedAgo}
          </span>
          <span className="rounded-full bg-surface-subtle px-2.5 py-[5px] text-[11px] font-medium text-text-primary">Driving</span>
        </div>
      </div>
    </Link>
  );
}

// Items ordered newest-first within each day.
// Today:     live now → 4:41 PM trip → 3:54 PM trip
// Yesterday: 11:30 PM scores → 6:02 PM trip → 8:32 AM trip
const ACTIVITY_ITEMS: ActivityEntry[] = [
  { kind: "live",  live: LIVE_ACTIVITY },         // Today — Now (live)
  { kind: "event", event: DEMO_EVENTS[0] },       // Today 4:38 PM — speeding
  { kind: "trip",  trip: DEMO_TRIPS[1] },         // Today 4:41 PM
  { kind: "event", event: DEMO_EVENTS[1] },       // Today 4:22 PM — hard braking
  { kind: "trip",  trip: DEMO_TRIPS[0] },         // Today 3:54 PM
  { kind: "score", item: DEMO_SCORE_UPDATES[2] }, // Yesterday 11:30 PM — Civic
  { kind: "score", item: DEMO_SCORE_UPDATES[3] }, // Yesterday 11:30 PM — RAV4
  { kind: "event", event: DEMO_EVENTS[2] },       // Yesterday 5:14 PM — phone use
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
  if (entry.kind === "event")  return entry.event.date;
  return entry.live.date;
}

function getEntryTime(entry: ActivityEntry): string {
  if (entry.kind === "trip")  return entry.trip.timeRange.split(/\s*[–-]\s*/).pop() ?? entry.trip.timeRange;
  if (entry.kind === "score") return entry.item.time;
  if (entry.kind === "event") return entry.event.time;
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      {/* Day groups — each day is a single connected panel (iOS inset-grouped style) */}
      {groups.map((group) => (
        <div key={group.date} className="flex flex-col gap-2">
          {/* Day label */}
          <span className="text-xs font-semibold text-text-secondary">{group.label}</span>

          {/* Grouped panel */}
          <div className="overflow-hidden rounded-panel border border-stroke-muted bg-surface-card">
            {group.entries.map((entry, i) => {
              const isLast = i === group.entries.length - 1;
              const key = entry.kind === "trip" ? entry.trip.id : entry.kind === "score" ? entry.item.id : entry.kind === "event" ? entry.event.id : entry.live.id;
              const time = getEntryTime(entry);

              return (
                <div key={key}>
                  {entry.kind === "trip" ? (
                    <TripActivityItem
                      trip={entry.trip}
                      href="/trip-receipt"
                      showAvatars={showAvatars}
                      driverImageSrc={DRIVER_AVATAR_MAP[entry.trip.driver]}
                      vehicleColor={VEHICLE_COLOR_MAP[entry.trip.vehicle ?? ""]}
                      timeLabel={time}
                      grouped
                    />
                  ) : entry.kind === "score" ? (
                    <ScoreUpdateActivityItem item={entry.item} timeLabel={time} grouped />
                  ) : entry.kind === "event" ? (
                    <EventActivityItem
                      event={entry.event}
                      showAvatars={showAvatars}
                      driverImageSrc={DRIVER_AVATAR_MAP[entry.event.driver]}
                      grouped
                    />
                  ) : (
                    <LiveActivityCard live={entry.live} showAvatars={showAvatars} grouped />
                  )}
                  {!isLast && <div className="h-px bg-stroke-muted" />}
                </div>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Miles tooltip — appears over the bottom nav after card dismiss    */
/* ------------------------------------------------------------------ */

function MilesTooltip({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  // Distance in px from the tooltip's bottom edge to the viewport bottom.
  // Equals the nav's distance from the viewport top to the viewport bottom,
  // i.e. window.innerHeight − nav.getBoundingClientRect().top.
  const [offsetBottom, setOffsetBottom] = useState(72);

  useEffect(() => {
    function measure() {
      const nav = document.querySelector("nav");
      if (nav) {
        const { top } = nav.getBoundingClientRect();
        setOffsetBottom(window.innerHeight - top);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(id);
    };
  }, []);

  return (
    // Full-screen scrim — tap anywhere to dismiss
    <div className="fixed inset-0 z-50" onClick={onDismiss} aria-label="Dismiss">
      {/* Tooltip pinned just above the sticky nav.
          left-1/2 lands on the Miles icon (centre of 5 equal tabs). */}
      <div
        className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 flex-col items-center"
        style={{
          bottom: offsetBottom,
          transition: "opacity 260ms ease, transform 260ms ease",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(8px)",
        }}
      >
        {/* Bubble */}
        <div
          className="pointer-events-auto rounded-2xl bg-foreground px-5 py-3 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="whitespace-nowrap font-mono text-sm leading-relaxed text-background">
            I&apos;m here if you need anything
          </p>
        </div>
        {/* Downward caret — tip touches the nav's top border */}
        <svg
          width="16"
          height="8"
          viewBox="0 0 16 8"
          className="shrink-0 text-foreground"
          fill="currentColor"
          aria-hidden
        >
          <path d="M0 0 L16 0 L8 8 Z" />
        </svg>
      </div>
    </div>
  );
}

function AgentCoachingCard({
  card,
  onRefresh,
  messageWrapperRef,
}: {
  card: CoachingCard;
  onRefresh?: () => void;
  messageWrapperRef?: React.RefObject<HTMLDivElement>;
}) {
  const [, setSpinning] = useState(false);

  function handleRefreshClick() {
    if (!onRefresh) return;
    setSpinning(true);
    onRefresh();
    setTimeout(() => setSpinning(false), 400);
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 rounded-panel border border-stroke-muted bg-surface-card p-5 shadow-card">
      {/* Message — carousel animates opacity + height via ref */}
      <div ref={messageWrapperRef} className="overflow-hidden">
        <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-text-secondary">
          {card.message}{"\n\n- Miles"}
        </p>
      </div>

      {/* Buttons — pinned to bottom */}
      <div className="mt-auto flex items-center gap-2">
        <Link
          href={card.actionHref}
          className="flex h-10 flex-1 items-center justify-center rounded-control bg-semantic-success px-5 text-sm font-medium text-background transition-colors hover:bg-semantic-success/90 active:bg-semantic-success/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-success focus-visible:ring-offset-1"
        >
          {card.actionLabel}
        </Link>
        {onRefresh && (
          <button
            type="button"
            onClick={handleRefreshClick}
            className="flex h-10 flex-1 items-center justify-center rounded-control border border-stroke-muted px-5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle active:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-muted focus-visible:ring-offset-1"
          >
            What else?
          </button>
        )}
      </div>
    </div>
  );
}

// Animation timing
const FADE_OUT_MS = 280;
const RESIZE_MS   = 400;
const FADE_IN_MS  = 280;

function AgentCoachingCarousel({
  cards,
  onAllDismissed,
}: {
  cards: CoachingCard[];
  onAllDismissed: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const messageWrapperRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  const currentCard = cards[activeIndex % cards.length];

  /**
   * Three-phase transition for refresh:
   *  1. Fade out message text
   *  2. Swap content + animate height to new natural height
   *  3. Fade in new message text
   */
  function runTransition(action: () => void) {
    if (animatingRef.current) return;
    const el = messageWrapperRef.current;
    if (!el) { action(); return; }
    animatingRef.current = true;

    el.style.transition = `opacity ${FADE_OUT_MS}ms ease`;
    el.style.opacity = "0";

    setTimeout(() => {
      const prevH = el.scrollHeight;
      el.style.transition = "none";
      el.style.height = `${prevH}px`;

      action();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.height = "auto";
          const newH = el.scrollHeight;

          if (newH !== prevH) {
            el.style.height = `${prevH}px`;
            el.getBoundingClientRect();
            el.style.transition = `height ${RESIZE_MS}ms ease`;
            el.style.height = `${newH}px`;
          } else {
            el.style.transition = "none";
          }

          setTimeout(() => {
            el.style.transition = `opacity ${FADE_IN_MS}ms ease`;
            el.style.opacity = "1";

            setTimeout(() => {
              el.style.height = "";
              el.style.transition = "";
              animatingRef.current = false;
            }, FADE_IN_MS);
          }, newH !== prevH ? RESIZE_MS : 0);
        });
      });
    }, FADE_OUT_MS);
  }

  function handleRefresh() {
    if (cards.length < 2) return;
    runTransition(() => setActiveIndex((i) => (i + 1) % cards.length));
  }

  /** Dismiss fades the message out then collapses the entire section. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleDismiss() {
    const el = messageWrapperRef.current;
    if (!el || animatingRef.current) {
      onAllDismissed();
      return;
    }
    animatingRef.current = true;
    el.style.transition = `opacity ${FADE_OUT_MS}ms ease`;
    el.style.opacity = "0";
    setTimeout(onAllDismissed, FADE_OUT_MS);
  }

  if (!currentCard) return null;

  return (
    <div className="mx-5">
      <AgentCoachingCard
        card={currentCard}
        onRefresh={handleRefresh}
        messageWrapperRef={messageWrapperRef}
      />
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
          <span className="text-sm font-semibold leading-none tabular-nums text-background">{maxMph} mph</span>
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
          <div key={s.label} className="flex flex-col gap-1 rounded-control bg-surface-subtle px-2.5 py-2">
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
      <PersonAvatar
        name={driver}
        initials={d.initials}
        size="md"
        colorClass={d.color}
        textColorClass="text-background"
      />
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
            className="inline-flex size-8 items-center justify-center rounded-full bg-surface-subtle text-text-secondary transition-colors hover:bg-surface-strong"
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
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Distance</span>
            <span className="text-sm font-semibold leading-none tabular-nums text-text-primary">{s.distance}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Duration</span>
            <span className="text-sm font-semibold leading-none tabular-nums text-text-primary">{s.duration}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Score</span>
            <span className="text-sm font-semibold leading-none tabular-nums text-text-primary">{s.score}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Events</span>
            <span className="text-sm font-semibold leading-none tabular-nums text-text-primary">{s.events}</span>
          </div>
        </div>

        {/* Driver */}
        <div className="flex items-center gap-2 border-t border-stroke-muted pt-3">
          <PersonAvatar
            name={s.driver}
            size="sm"
            colorClass="bg-surface-strong"
            textColorClass="text-text-secondary"
          />
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
type VehicleLayout = "list" | "carousel";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [coachingDismissed, setCoachingDismissed] = useState(false);
  const [showMilesTooltip, setShowMilesTooltip] = useState(false);
  const [headerAction, setHeaderAction] = useState<"profile" | "roadside">("roadside");
  const [footerNavMode, setFooterNavMode] = useState<FooterNavMode>("full");
  const [showAvatars, setShowAvatars] = useState(true);
  const [fleetMode, setFleetMode] = useState<FleetMode>("one-driving");
  const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v12");
  const [showTodos, setShowTodos] = useState(false);
  const [compactCards, setCompactCards] = useState(false);
  const [vehicleLayout, setVehicleLayout] = useState<VehicleLayout>("list");

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
      window.dispatchEvent(new Event("miles-proto-3-footer-nav-mode-change"));
    } catch {
      // ignore localStorage errors in prototype
    }
  }

  return (
    <main
      className="flex min-h-dvh flex-col bg-background"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 112px)",
      }}
    >
      {/* ── Sticky header — direct child of <main> so sticky works reliably ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between border-b border-stroke-muted bg-background px-5"
        style={{ paddingTop: "max(env(safe-area-inset-top), 12px)", paddingBottom: "10px" }}
      >
        <svg
          viewBox="80 190 690 365"
          className="h-[30px] w-auto text-brand-wordmark"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Miles"
          role="img"
          fill="currentColor"
          style={{ overflow: "visible" }}
        >
            <path d="M92.16,508.93c6.52-42.4,25.12-83.77,40.96-123.7,17.2-43.36,35.1-89.82,55.56-131.6,2.2-4.49,5.89-13.42,10.58-15.22,8.17-3.14,25.36,1.22,32.81,5.65,8.4,4.99,8.87,8.65,8.32,18.06-1.03,17.62-4.48,37.9-6.67,55.71-3.86,31.35-9.25,62.68-11.32,94.24-.09,1.37-.23,3.24.29,4.49,24.25-47.62,46.33-96.36,72.22-143.14,6.93-12.52,14.36-25.92,22.06-37.93,2.66-4.15,5.89-10.81,11.34-11.46,10.28-1.23,29.15,2.16,37.21,9.02,2.71,2.3,5.55,6.05,5.1,9.83-.49,4.07-5.76,14.31-7.46,18.98-26.19,72.06-46.22,154.33-61.96,229.56-2.15,10.3-6.63,27.76-6.74,37.69-.04,3.82.88,7.21,5.39,5.95,77.41-27.78,169.05-47.18,251.73-38.73,11.37,1.16,22.67,3.47,33.91,5.39l-6.62-26.69c3.98-11.8,9.07-.89,12.92,3.32,14.2,15.54,34.01,25.96,54.19,31.61,6.11,1.71,14.58.71,9.31,9.8l-86.38,38.93c-3.46.33-4.61-3.44-3.09-6.15l16.38-25.61-.29-1.52c-82.46-10.1-166.64,1.64-244.85,28.23-18.06,6.14-44.63,19.54-63.27,17.59-28.97-3.03-21.64-39.22-18.2-58.83,9.29-53.04,24.16-107.89,39.74-159.41,4.52-14.94,10.23-30.08,14.4-44.99.18-.64.76-2.01,0-2.4-1.74.88-2.99,3.83-4,5.6-22.97,40.46-46.49,85.62-64.82,128.34-5.77,13.45-10.26,28.71-16.59,41.59-2.11,4.29-4.25,8.16-9.55,9.05-10.07,1.68-25.16-3.47-30.18-12.74-7.09-13.09-2.27-48.54-.58-64.18,3.07-28.39,7.93-56.7,10.22-85.15l-.62-5.12c-16.06,45.61-33.44,90.91-47.1,137.36-4.51,15.32-8.78,30.88-11.56,46.63-1.75,9.91.08,22.62-11.58,26.81-17.3,6.22-30.83-5.97-30.64-23.33l-.56-.95v-.6Z" />
            <path d="M506.26,213.86c20.08,6.45,14.46,35.65,10.99,51.47-11.12,50.69-39.12,100.59-70.26,141.49-.76,9.69-2.65,19.5-1.97,29.27.56,7.99,3.94,16.95,13.64,12.98,9.24-3.78,28.92-34.02,31.13-43.86,1.11-4.97,1.42-10.03,2.84-15.15,7.84-28.18,36.48-75.14,65.27-85.31,18.11-6.4,36.56-1.68,38.38,19.78,2.85,33.78-32.85,77.22-64.33,86.83-3.15.96-8.78.2-9.44,4.36-1.06,6.68.55,22.92,5.67,27.84,10.63,10.24,28.51-6.77,36.31-14.08,26.04-24.41,46.28-61.27,60.29-93.89,4.3-10.01,8.74-27.59,17.42-34.17,8.62-6.53,21.8-5.44,28.17,3.64,4.45,6.34.7,7.98-1.47,13.45-10.89,27.4,5.67,38.53,13.82,61.77,13.65,38.9-6.33,89.53-53.65,84.8-16.82-1.68-33.82-15.09-25.88-33.51,1.53-3.55,9.84-15.05,13.82-14.98s1.97,7.05,2.13,9.2c1.04,13.99,19.63,14.41,27.21,5.13,12.31-15.09,4.65-46.83-.84-63.83-1.7-5.26-3.36-11.43-6.61-15.88-15.71,34.64-35.96,70.34-64.21,96.27-15.16,13.91-36.55,29.29-58.35,22.91-15.67-4.59-20.41-21.18-24.18-35.21-8.53,13.08-17.11,32.66-32.62,38.77-20.48,8.06-38.24-2.71-44.79-22.59l-2.41-9.57c-11.49,15.07-31.31,40.28-52.21,40.22-29.77-.08-24.19-38.05-20.53-57.15,3.9-20.36,9.73-42.9,15.87-62.71,1.52-4.91,6.36-21.68,9.36-24.53,4.09-3.89,14.61-1.34,19.61.09,13.45,3.84,11.79,7.16,8.82,19.63-6.46,27.18-20.72,56.86-22.03,84.74-.2,4.29-1.59,12.16,4.36,10.96,10.55-2.14,28.07-29.7,35.13-38.07,5.46-57.15,15.41-115.23,47.04-164.1,9.82-15.17,22.54-31.93,40.7-37h7.8ZM452.25,369.79c.83.94,3.83-3.69,4.33-4.36,16.25-21.84,30.7-56.96,37.98-83.19,2.58-9.29,8.86-34.23,6.02-42.61-1.14-3.36-3.78-1.17-5.43.61-9.17,9.89-18.99,32.99-23.71,45.88-9.76,26.67-16.31,55.39-19.19,83.67ZM548,380.34c10.34-10.53,22.96-28.16,26.84-42.46,5.39-19.86-7.19-14.1-16.09-4.68-15.16,16.03-24.9,40.66-32.09,61.18,8.22-1.83,15.6-8.2,21.34-14.04Z" />
            <path d="M395.09,262.6c29.77-4.03,20.74,50.46-6.14,49.02-23.12-1.24-17.31-45.84,6.14-49.02Z" />
          </svg>
        <HeaderAction headerAction={headerAction} />
      </div>

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
          <FleetView
            vehicles={displayVehicles}
            showAvatars={showAvatars}
            mapStyle={mapStyle}
            compactCards={compactCards}
            setCompactCards={setCompactCards}
            vehicleLayout={vehicleLayout}
            afterFilterPills={
              !coachingDismissed ? (
                <AgentCoachingCarousel
                  cards={COACHING_CARDS}
                  onAllDismissed={() => {
                    setCoachingDismissed(true);
                    setShowMilesTooltip(true);
                  }}
                />
              ) : undefined
            }
          />
          <ActivityFeed showAvatars={showAvatars} />
          {showTodos && <TodoPreview items={DEMO_TODOS} className="mx-5" />}
          <QuickActions showRoadsideAssist={headerAction === "profile"} />
        </div>
      )}

      {/* Proto state toggle */}
      <div className="mx-5 mt-6 flex flex-col items-center gap-3 border-t border-stroke-muted pt-4">
        <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
          Proto controls
        </span>
        <Link
          href="/hub"
          className="rounded-full border border-stroke-muted bg-surface-card px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-background"
        >
          Design system hub
        </Link>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
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
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
            Vehicle layout
          </span>
          <div className="flex items-center gap-1.5">
            {(["list", "carousel"] as const).map((layout) => (
              <button
                key={layout}
                type="button"
                onClick={() => setVehicleLayout(layout)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                  vehicleLayout === layout
                    ? "bg-surface-strong text-text-secondary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {layout}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
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
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
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
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
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
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
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
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
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
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
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
      {showMilesTooltip && (
        <MilesTooltip onDismiss={() => setShowMilesTooltip(false)} />
      )}
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
