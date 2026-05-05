"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import { MapView } from "@/app/sandboxes/miles-proto-4/_components/map-view";
import { useForceLightMode, setForceLightMode } from "@/app/sandboxes/miles-proto-4/_components/force-light-mode";
import { useMilesSheet } from "@/app/sandboxes/miles-proto-4/_components/miles-sheet";
import { TripListItem } from "@/app/sandboxes/miles-proto-4/_components/trip-list-item";
import {
  ACTIVITY_ITEMS,
  LIVE_ACTIVITY,
  getEntryTime,
  type ActivityEntry,
  type EventItem,
  type ScoreUpdateItem,
} from "@/app/sandboxes/miles-proto-4/_lib/demo-activity";
import { p } from "@/app/sandboxes/miles-proto-4/_lib/nav";
import {
  MARKER_LABEL,
  vehicleAccentByName,
} from "@/app/sandboxes/miles-proto-4/_lib/vehicle-tokens";
import { SymbolIcon } from "@/app/sandboxes/miles-proto-4/_components/symbol-icon";

const FOOTER_NAV_MODE_STORAGE_KEY = "miles-proto-4-footer-nav-mode";
type FooterNavMode = "full" | "compact";

const MAPBOX_STYLES = [
  { value: "mapbox://styles/mapbox/light-v11", label: "Light" },
  { value: "mapbox://styles/mapbox/dark-v11", label: "Dark" },
  { value: "mapbox://styles/mapbox/streets-v12", label: "Streets" },
  { value: "mapbox://styles/mapbox/outdoors-v12", label: "Outdoors" },
  { value: "mapbox://styles/mapbox/satellite-v9", label: "Satellite" },
  { value: "mapbox://styles/mapbox/satellite-streets-v12", label: "Satellite Streets" },
] as const;

const AVATAR_MOM = "/miles-proto-4/images/mom.jpg";
const AVATAR_TEEN = "/miles-proto-4/images/teen.jpg";

/* ------------------------------------------------------------------ */
/*  iOS Type Scale Reference — 18 roles                               */
/*  Source of truth: lib/design-system/ios-typography.ts              */
/*  Hub reference:  /sandboxes/miles-proto-4/hub (Typography section) */
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
  /** Optional — when missing, the dashboard tile renders a photo placeholder. */
  imageSrc?: string;
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
  liveTrip?: {
    driver: string;
    vehicleLabel: string;
    mph: number;
    startedAgo: string;
    approximateLocation: string;
    startedAt: string;
    startLocation: string;
    lastRefreshedAt: string;
  };
  lastTrip: TripPreview;
  /** Older trips, displayed under Activity after lastTrip. Capped to fit the
   *  3-item dashboard preview. */
  priorTrips?: TripPreview[];
}

interface TripPreview {
  driver: string;
  from: string;
  to: string;
  time: string;
  timeRange: string;
  duration: string;
  distance: string;
  score: number;
  events: number;
}

const VEHICLES: Vehicle[] = [
  {
    id: "civic",
    name: "Civic",
    /* No photo yet — surfaces the empty-state placeholder on the dashboard tile
       and on the vehicle detail hero so we can demo the upload/generate affordance. */
    imageSrc: undefined,
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
      timeRange: "3:42 – 3:54 PM",
      duration: "12 min",
      distance: "4.2 mi",
      score: 88,
      events: 1,
    },
    priorTrips: [
      {
        driver: "Christina",
        from: "4521 Main St",
        to: "Whole Foods Market",
        time: "Today, 11:08 AM",
        timeRange: "11:08 – 11:23 AM",
        duration: "15 min",
        distance: "5.6 mi",
        score: 92,
        events: 0,
      },
      {
        driver: "Emma",
        from: "Plano West HS",
        to: "4521 Main St",
        time: "Yesterday, 4:41 PM",
        timeRange: "4:41 – 4:58 PM",
        duration: "17 min",
        distance: "6.2 mi",
        score: 79,
        events: 2,
      },
    ],
  },
  {
    id: "rav4",
    name: "Kit's RAM",
    imageSrc: "/api/sandbox-files/miles-proto-4/public/images/rav4.jpg",
    year: 2015,
    make: "RAM",
    model: "2500",
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
    liveTrip: {
      driver: "Jack",
      vehicleLabel: "Kit's RAM",
      mph: 34,
      startedAgo: "12 min",
      approximateLocation: "Preston Rd, Plano",
      startedAt: "5:18 PM",
      startLocation: "Preston Rd & Belt Line",
      lastRefreshedAt: "5:30 PM",
    },
    lastTrip: {
      driver: "Emma",
      from: "Preston Rd & Belt Line",
      to: "Elm St & 4th Ave",
      time: "Today, 5:18 PM",
      timeRange: "5:18 – 5:42 PM",
      duration: "24 min",
      distance: "11.3 mi",
      score: 71,
      events: 3,
    },
    priorTrips: [
      {
        driver: "Jack",
        from: "Home Depot",
        to: "Preston Rd & Belt Line",
        time: "Today, 2:14 PM",
        timeRange: "2:14 – 2:33 PM",
        duration: "19 min",
        distance: "8.8 mi",
        score: 84,
        events: 1,
      },
      {
        driver: "Jack",
        from: "Elm St & 4th Ave",
        to: "Lowe's",
        time: "Yesterday, 9:02 AM",
        timeRange: "9:02 – 9:21 AM",
        duration: "19 min",
        distance: "7.5 mi",
        score: 81,
        events: 0,
      },
    ],
  },
];

interface CoachingCard {
  id: string;
  message: string;
  actionLabel: string;
  /** Context key passed to openMilesSheet when the action button is tapped. */
  actionContext: string;
  dismissLabel: string;
}

const COACHING_CARDS: CoachingCard[] = [
  {
    id: "fuel-reminder",
    message:
      "Jack took Kit's RAM out 12 mins ago, and the Civic's been parked at home all afternoon. I noticed something about his trips this week worth flagging.",
    actionLabel: "Tell me more",
    actionContext: "kid-trip-alert",
    dismissLabel: "Dismiss",
  },
  {
    id: "oil-reminder",
    message:
      "Your next oil change is due by May 12 or in about 800 miles, whichever comes first. I can help you schedule it or set a reminder.",
    actionLabel: "Set a reminder",
    actionContext: "oil",
    dismissLabel: "Dismiss",
  },
  {
    id: "score-tip",
    message:
      "One hard braking event on your last trip. I can share tips to smooth out your driving.",
    actionLabel: "Show me tips",
    actionContext: "fuel",
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
  const live = v.liveTrip;

  if (compact) {
    return (
      <div className="flex items-center divide-x divide-stroke-muted rounded-control bg-surface-subtle overflow-hidden">
        {/* Speed when driving, otherwise Score */}
        {live ? (
          <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
            <span className="relative flex size-1.5 shrink-0">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-semantic-success opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-semantic-success" />
            </span>
            <span className="text-sm font-bold leading-none tabular-nums text-semantic-success">
              {live.mph} mph
            </span>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
            <SymbolIcon name="speed" filled size="sm" />
            <span className="text-sm font-bold leading-none text-semantic-success">{v.driverScore.toFixed(1)}</span>
          </div>
        )}
        {/* Engine */}
        <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
          <SymbolIcon name="build" filled size="sm" />
          <span className={`text-sm font-bold leading-none ${engineText}`}>{engineLabel}</span>
        </div>
        {/* Fuel */}
        <div className="flex flex-1 items-center justify-center gap-1.5 px-3 py-2">
          <SymbolIcon name="local_gas_station" filled size="sm" />
          <span className={`text-sm font-bold leading-none tabular-nums ${fuelText}`}>{(v.fuelPct ?? 0)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Speed when driving, otherwise Miles Score */}
      {live ? (
        <div className="flex flex-col gap-1 rounded-control bg-surface-subtle px-3 py-2.5">
          <span className="text-[11px] font-medium text-text-muted">Speed</span>
          <span className="text-lg font-bold leading-none tabular-nums text-semantic-success">
            {live.mph}
          </span>
          <span className="text-[11px] font-medium text-text-muted">mph</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1 rounded-control bg-surface-subtle px-3 py-2.5">
          <span className="text-[11px] font-medium text-text-muted">Score</span>
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
      )}
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

function VehicleCardContent({ v, compact = false }: { v: Vehicle; showAvatars?: boolean; compact?: boolean }) {
  const live = v.liveTrip;

  const engineLabel = v.engine === "good" ? "Good" : v.engine === "attention" ? "Attention" : "—";
  const engineText = v.engine === "good" ? "text-semantic-success" : "text-semantic-warning";
  const fuelPct = v.fuelPct ?? 0;
  const fuelText = fuelPct > 30 ? "text-text-secondary" : "text-semantic-warning";

  if (compact) {
    return (
      <>
        {/* Compact header */}
        <div className="flex w-full flex-col gap-1.5 px-4 pt-3.5 pb-3 text-left">
          <span className="text-base font-semibold uppercase leading-tight text-text-primary">{v.name}</span>
          <StatusBadge live={live} />
        </div>

        {/* Stats bento */}
        <div className="block w-full px-4 pb-3 text-left">
          <StatsBento v={v} engineLabel={engineLabel} engineText={engineText} fuelText={fuelText} compact />
        </div>
      </>
    );
  }

  const locationLabel = live ? live.approximateLocation : v.locationLabel;

  return (
    <>
      {/* Default header: name + status (left) | car image (right) */}
      <div className="flex w-full flex-col gap-2 px-4 pt-3.5 pb-2 text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-2xl font-semibold uppercase leading-tight text-text-primary">{v.name}</span>
            <StatusBadge live={live} />
          </div>
          <div className="flex h-16 w-24 shrink-0 items-center justify-center">
            {v.imageSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={v.imageSrc} alt={v.name} className="max-h-full w-full object-contain opacity-90" />
            ) : (
              <div className="h-full w-full" aria-hidden />
            )}
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-text-secondary">
          <SymbolIcon name="location_on" filled size="sm" className="shrink-0 text-text-muted" />
          <span className="truncate">{locationLabel}</span>
        </div>
      </div>

      {/* Stats bento — pinned to bottom so cards with shorter headers
          (e.g. no photo) bottom-align their stats with photo'd cards. */}
      <div className="mt-auto flex w-full flex-col gap-2 px-4 pb-3 text-left">
        <StatsBento v={v} engineLabel={engineLabel} engineText={engineText} fuelText={fuelText} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Fleet view                                                         */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  showAvatars,
  mapStyle,
  compactCards,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setCompactCards,
}: {
  vehicles: Vehicle[];
  showAvatars: boolean;
  mapStyle: string;
  compactCards: boolean;
  setCompactCards: (v: boolean) => void;
}) {
  /* Sorted vehicles drive both the carousel order and the map's active
     vehicle. Live trips float to the top so the swipe order matches the
     dashboard's existing priority. */
  const sortedVehicles = [...vehicles].sort(
    (a, b) => (b.liveTrip ? 1 : 0) - (a.liveTrip ? 1 : 0)
  );

  /* Active vehicle = the one currently in view in the carousel. Drives the
     map's filter / zoom so swiping the carousel pans the map to the
     matching vehicle. */
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const tiles = el.children;
        if (tiles.length < 2) return;
        const t0 = tiles[0] as HTMLElement;
        const t1 = tiles[1] as HTMLElement;
        const step = t1.offsetLeft - t0.offsetLeft;
        if (step <= 0) return;
        const idx = Math.round(el.scrollLeft / step);
        setActiveIdx(Math.min(tiles.length - 1, Math.max(0, idx)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sortedVehicles.length]);

  const activeVehicleId = sortedVehicles[activeIdx]?.id ?? "";
  const filteredVehicles =
    sortedVehicles.filter((v) => v.id === activeVehicleId).length > 0
      ? sortedVehicles.filter((v) => v.id === activeVehicleId)
      : sortedVehicles;

  const liveVehicle = filteredVehicles.find((v) => v.liveTrip);

  const allMarkers = [
    ...filteredVehicles
      .filter((v) => !v.liveTrip)
      .map((v) => ({
        lat: v.parkedAt.lat,
        lng: v.parkedAt.lng,
        type: "end" as const,
        color: vehicleAccentByName(v.name),
        labelColor: MARKER_LABEL.parked,
        label: "Parked",
        initial: v.name[0],
      })),
    ...(liveVehicle
      ? [{
          lat: LIVE_ROUTE[LIVE_ROUTE.length - 1][0],
          lng: LIVE_ROUTE[LIVE_ROUTE.length - 1][1],
          type: "end" as const,
          color: vehicleAccentByName(liveVehicle.name),
          labelColor: MARKER_LABEL.driving,
          label: "Driving",
          imageSrc: AVATAR_TEEN,
          overlayInitial: liveVehicle.name[0],
          overlayColor: vehicleAccentByName(liveVehicle.name),
        }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Map zooms to the vehicle currently active in the carousel. Swiping
          the carousel below remounts MapView (via the activeVehicleId in
          the key) so it refits to that vehicle's marker. The map runs tall
          and the vehicle carousel pulls up with a negative margin so the
          cards float over its lower edge — the map reads as a backdrop
          behind them. */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: "90%" }}>
        <MapView
          key={`fleet-${showAvatars}-${mapStyle}-${liveVehicle ? "live" : "parked"}-${activeVehicleId}`}
          markers={allMarkers}
          mapStyle={mapStyle}
        />
      </div>

      <div
        ref={carouselRef}
        className="relative z-10 -mt-24 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 scroll-px-5 touch-pan-x [&::-webkit-scrollbar]:hidden"
      >
        {sortedVehicles.map((v) => (
          <Link
            key={v.id}
            href={`/vehicle?vehicle=${v.id}&from=dashboard`}
            className="flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-card border border-stroke-muted bg-surface-card"
          >
            <VehicleCardContent v={v} showAvatars={showAvatars} compact={compactCards} />
          </Link>
        ))}
      </div>

      {sortedVehicles.length > 1 && (
        <div
          className="-mt-2 -mb-2 flex justify-center"
          aria-label="Vehicle carousel position"
        >
          {sortedVehicles.map((v, i) => (
            <button
              key={v.id}
              type="button"
              aria-label={`Show ${v.name}`}
              aria-current={i === activeIdx ? "true" : undefined}
              onClick={() => {
                const el = carouselRef.current;
                if (!el) return;
                const tile = el.children[i] as HTMLElement | undefined;
                if (!tile) return;
                el.scrollTo({ left: tile.offsetLeft, behavior: "smooth" });
              }}
              className="flex size-3 items-center justify-center"
            >
              <span
                className={`size-1.5 rounded-full transition-colors ${
                  i === activeIdx ? "bg-foreground" : "bg-stroke-muted"
                }`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Activity — live trip card pinned on top, then recent trips across
          all vehicles. Mirrors /trips: uppercase eyebrow + a green-tinted
          live card + a rounded card of divided TripListItem rows. */}
      <div className="flex items-center justify-between px-5 pt-2">
        <h2 className="text-base font-semibold text-text-primary">Activity</h2>
        <Link
          href="/trips"
          className="text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          See all
        </Link>
      </div>
      <div className="mx-5 flex flex-col gap-2">
        <Link
          href={`/dashboard?mode=trip&driver=${encodeURIComponent(
            LIVE_ACTIVITY.driver
          )}&vehicleLabel=${encodeURIComponent(LIVE_ACTIVITY.vehicleLabel)}`}
          className="flex items-center gap-3 rounded-panel border border-stroke-muted bg-surface-card px-3 py-3"
        >
          {/* Wireframe avatar — gray circle with person icon, plus a small
              car badge overlay so the row reads as "person driving a vehicle"
              without leaning on real photos. */}
          <div className="relative shrink-0">
            <div className="flex size-9 items-center justify-center rounded-full border border-stroke-muted bg-surface-subtle">
              <SymbolIcon name="person" size="sm" filled className="text-text-muted" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-background bg-surface-subtle">
              <SymbolIcon name="directions_car" size="sm" filled className="text-text-muted" />
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-xs leading-none tabular-nums text-text-muted">
                {LIVE_ACTIVITY.startedAt}
              </span>
              <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-snug text-text-primary">
                {LIVE_ACTIVITY.startLocation}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-xs leading-none tabular-nums text-text-muted">
                {LIVE_ACTIVITY.lastRefreshedAt}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="relative flex size-1.5 shrink-0">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-semantic-success opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-semantic-success" />
                </span>
                <span className="block truncate text-sm font-medium leading-snug text-semantic-success">
                  Driving
                </span>
              </div>
            </div>
          </div>
          <svg
            className="size-3.5 shrink-0 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>

        {ACTIVITY_ITEMS.filter((e) => e.kind !== "live")
          .slice(0, 5)
          .map((entry) => (
            <div
              key={entryKey(entry)}
              className="overflow-hidden rounded-panel border border-stroke-muted bg-surface-card"
            >
              <ActivityFeedRow entry={entry} />
            </div>
          ))}
      </div>
    </div>
  );
}

function entryKey(entry: ActivityEntry): string {
  if (entry.kind === "trip") return entry.trip.id;
  if (entry.kind === "score") return entry.item.id;
  if (entry.kind === "event") return entry.event.id;
  return entry.live.id;
}

function ActivityFeedRow({ entry }: { entry: ActivityEntry }) {
  if (entry.kind === "trip") {
    return <TripListItem trip={entry.trip} href="/trip-receipt" />;
  }
  if (entry.kind === "score") {
    return <ScoreUpdateRow item={entry.item} time={getEntryTime(entry)} />;
  }
  if (entry.kind === "event") {
    return <EventRow event={entry.event} time={getEntryTime(entry)} />;
  }
  // "live" entries surface as the pinned live row above this feed.
  return null;
}

function ScoreUpdateRow({ item, time }: { item: ScoreUpdateItem; time: string }) {
  const isUp = item.delta >= 0;
  const deltaClass = isUp ? "text-emerald-600" : "text-amber-600";
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
        <svg
          className="size-4 text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium leading-snug text-neutral-900">
            Miles Score updated
          </span>
          <span className="shrink-0 text-xs text-neutral-400 tabular-nums">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span>{item.vehicle}</span>
          <span className="text-neutral-300">&middot;</span>
          <span className="tabular-nums text-neutral-700">{item.score}</span>
          <span className={`tabular-nums font-medium ${deltaClass}`}>
            {isUp ? "+" : ""}
            {item.delta}
          </span>
        </div>
      </div>
    </div>
  );
}

function EventRow({ event, time }: { event: EventItem; time: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
        <svg
          className="size-4 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium leading-snug text-neutral-900">
            {event.title}
          </span>
          <span className="shrink-0 text-xs text-neutral-400 tabular-nums">{time}</span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
          <span className="truncate">{event.detail}</span>
          <span className="text-neutral-300">&middot;</span>
          <span className="shrink-0">{event.driver}</span>
        </div>
      </div>
    </div>
  );
}

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
    label: "Why did my score dip on Kit's RAM?",
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

/* ------------------------------------------------------------------ */
/*  Miles tooltip — appears over the bottom nav after card dismiss    */
/* ------------------------------------------------------------------ */

/**
 * MilesTipOverlay — speech-bubble overlay anchored above the bottom nav,
 * with a downward caret pointing at the centered Miles "M" tab. Reads as
 * if Miles is talking through the tab. Reuses the coaching card content
 * shape (top-left X dismiss · mono message · low-key green CTA).
 *
 * iOS analogue: TipKit popover (iOS 17+) attached to a `TabView` button,
 * with `.tipBackground` + an `arrowEdge` of `.bottom`.
 */
function MilesTipOverlay({
  card,
  onDismiss,
}: {
  card: CoachingCard;
  onDismiss: () => void;
}) {
  const { openMilesSheet } = useMilesSheet();
  const [visible, setVisible] = useState(false);
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
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex flex-col items-center"
      style={{
        bottom: offsetBottom,
        transition: "opacity 260ms ease, transform 260ms ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
      }}
      aria-live="polite"
    >
      <div className="pointer-events-auto mx-5 flex w-full max-w-[300px] flex-col gap-2.5 rounded-panel border border-stroke-muted bg-surface-card p-4 shadow-card">
        <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-text-secondary">
          {card.message}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => openMilesSheet(card.actionContext, "medium")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-semantic-success transition-opacity active:opacity-60"
          >
            <SymbolIcon name="auto_awesome" size="sm" filled className="text-semantic-success" />
            {card.actionLabel}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm font-medium text-text-muted transition-opacity active:opacity-60"
          >
            {card.dismissLabel}
          </button>
        </div>
      </div>
      {/* Downward caret aligned to the centered Miles tab. */}
      <svg
        width="18"
        height="9"
        viewBox="0 0 18 9"
        className="-mt-px shrink-0 text-surface-card"
        fill="currentColor"
        aria-hidden
      >
        <path d="M0 0 L18 0 L9 9 Z" />
      </svg>
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
            routeColor={MARKER_LABEL.driving}
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
            <SymbolIcon name="auto_awesome" size="sm" filled className="text-semantic-success" />
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
  const [compactCards, setCompactCards] = useState(false);

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
      window.dispatchEvent(new Event("miles-proto-4-footer-nav-mode-change"));
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
          />
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
      {!coachingDismissed && COACHING_CARDS[0] && (
        <MilesTipOverlay
          card={COACHING_CARDS[0]}
          onDismiss={() => setCoachingDismissed(true)}
        />
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
