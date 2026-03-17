"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "@/app/sandboxes/miles-proto-2/_components/link";
import { MapView } from "@/app/sandboxes/miles-proto-2/_components/map-view";
import { TodoPreview } from "@/app/sandboxes/miles-proto-2/_components/todo-preview";
import { TripListItem } from "@/app/sandboxes/miles-proto-2/_components/trip-list-item";
import { DEMO_TODOS } from "@/app/sandboxes/miles-proto-2/_lib/demo-todos";
import { DEMO_TRIPS } from "@/app/sandboxes/miles-proto-2/_lib/demo-trips";
import { p } from "@/app/sandboxes/miles-proto-2/_lib/nav";

const FOOTER_NAV_MODE_STORAGE_KEY = "miles-proto-2-footer-nav-mode";
type FooterNavMode = "full" | "compact";

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
  scoreUpdated: string;
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
    scoreUpdated: "Updated today",
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
    scoreUpdated: "Updated today",
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

const RECENT_TRIPS = DEMO_TRIPS.slice(0, 3);

/* ------------------------------------------------------------------ */
/*  Shared vehicle content (no map) — used by both list and card view  */
/* ------------------------------------------------------------------ */

function VehicleCardContent({ v }: { v: Vehicle }) {
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

  return (
    <>
      {/* Vehicle header + car image */}
      <Link href={vehicleHref} className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2 transition-colors hover:bg-background/80">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{v.name}</span>
            {live && (
              <span className="flex items-center gap-1 rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold text-semantic-success">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-semantic-success opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-semantic-success" />
                </span>
                Live
              </span>
            )}
          </div>
          <span className="text-xs text-text-muted">{v.year} {v.make} {v.model}</span>
          {!live && <span className="text-[11px] text-text-muted">{v.locationLabel} · Parked {v.lastUpdated}</span>}
        </div>
        <div className="flex items-center gap-1">
          <img
            src={v.imageSrc}
            alt={v.name}
            className="w-24 object-contain opacity-90"
          />
          <svg className="size-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </Link>

      {/* Bento stats — always Score / Engine / Fuel */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <div className="flex flex-col gap-1.5 rounded-panel border border-stroke-muted bg-background px-3 py-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Miles Score</span>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-semantic-success" />
            <span className="text-sm font-semibold leading-none text-semantic-success">{v.driverScore}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-panel border border-stroke-muted bg-background px-3 py-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Engine</span>
          <div className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${engineDot}`} />
            <span className={`text-sm font-semibold leading-none ${engineText}`}>{engineLabel}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-panel border border-stroke-muted bg-background px-3 py-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Fuel</span>
          <div className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${fuelDot}`} />
            <span className={`text-sm font-semibold leading-none ${fuelText}`}>{fuelPct}%</span>
          </div>
        </div>
      </div>

      {/* Driver strip — live trip only, below bento */}
      {live && tripHref && (
        <Link
          href={tripHref}
          className="mx-4 mb-4 flex items-center justify-between rounded-panel border border-stroke-muted bg-surface-subtle px-3 py-2.5 transition-colors hover:bg-surface-strong"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-semantic-success text-[11px] font-semibold text-background">
              {live.driver[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-semantic-success">{live.driver} is driving</span>
              <span className="text-[11px] text-semantic-success">{live.startedAgo}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold tabular-nums text-semantic-success">{live.mph}</span>
              <span className="text-[11px] text-semantic-success">mph</span>
            </div>
            <svg className="size-3.5 text-semantic-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </Link>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Fleet view with list / card toggle                                 */
/* ------------------------------------------------------------------ */

function FleetView({
  vehicles,
  headerAction,
}: {
  vehicles: Vehicle[];
  headerAction: "profile" | "roadside";
}) {
  const liveVehicle = vehicles.find((v) => v.liveTrip);
  const hasLive = !!liveVehicle;

  const allMarkers = [
    ...vehicles
      .filter((v) => !v.liveTrip)
      .map((v) => ({ lat: v.parkedAt.lat, lng: v.parkedAt.lng, type: "end" as const, color: "#2563eb" })),
    ...(hasLive
      ? [{
          lat: LIVE_ROUTE[LIVE_ROUTE.length - 1][0],
          lng: LIVE_ROUTE[LIVE_ROUTE.length - 1][1],
          type: "end" as const,
          color: "#16a34a",
          label: "Trip active",
        }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Dashboard header */}
      <div className="flex items-center justify-between px-5 pt-3">
        <h1 className="text-2xl font-bold leading-none text-text-primary">Miles</h1>
        {headerAction === "roadside" ? (
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-full border border-stroke-muted bg-surface-card px-2.5 transition-colors hover:bg-surface-subtle"
          >
            <div className="flex size-6 items-center justify-center rounded-full bg-surface-subtle">
              <svg className="size-3.5 text-semantic-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-semantic-danger">Roadside Assist</span>
          </button>
        ) : (
          <Link
            href="/account"
            className="flex items-center gap-2 rounded-full py-1 pl-3 pr-1 transition-colors hover:bg-surface-strong"
          >
            <span className="text-sm font-medium text-text-secondary">Chris M.</span>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-accent text-xs font-semibold leading-none text-brand-inverse">
              CM
            </div>
          </Link>
        )}
      </div>

      {/* Fleet map — always shown, never changes */}
      <div className="mx-5 overflow-hidden rounded-card border border-stroke-muted">
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <MapView markers={allMarkers} interactive={false} />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-4 pb-3 pt-6">
            <span className="text-xs font-medium text-background/80">
              {vehicles.length} vehicles · {hasLive ? "1 trip active" : "all parked"}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicles section header */}
      <div className="px-5">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">Vehicles</span>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {[...vehicles].sort((a, b) => (b.liveTrip ? 1 : 0) - (a.liveTrip ? 1 : 0)).map((v) => (
          <div key={v.id} className="overflow-hidden rounded-card border border-stroke-muted bg-surface-card">
            <VehicleCardContent v={v} />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentTrips() {
  return (
    <div className="mx-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Recent Trips
        </span>
        <Link href="/trips" className="text-xs font-medium text-semantic-info hover:text-semantic-info/80">
          See all
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-stroke-muted rounded-panel border border-stroke-muted bg-surface-card">
        {RECENT_TRIPS.map((t) => (
          <TripListItem
            key={t.id}
            trip={t}
            href="/trip-receipt"
            showVehicle
            className="py-3"
          />
        ))}
      </div>
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
    <div className="flex w-full flex-col gap-3 rounded-panel border border-stroke-muted bg-surface-subtle p-4">
      <div className="flex flex-col gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-strong">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/miles-proto-2/miles-icon.svg"
            alt="Miles"
            className="size-8 object-contain"
          />
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          {card.message}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={card.actionHref}
          className="flex h-8 items-center rounded-control bg-semantic-success px-3.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
        >
          {card.actionLabel}
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 items-center rounded-control px-3.5 text-xs font-semibold text-semantic-success transition-colors hover:bg-surface-strong"
        >
          {card.dismissLabel}
        </button>
      </div>
    </div>
  );
}

function AgentCoachingCarousel({
  cards,
  onDismiss,
}: {
  cards: CoachingCard[];
  onDismiss: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (width <= 0) return;
    const idx = Math.round(el.scrollLeft / width);
    const clamped = Math.max(0, Math.min(idx, cards.length - 1));
    setActiveIndex(clamped);
  }, [cards.length]);

  const goTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const width = el.clientWidth;
    el.scrollTo({ left: idx * width, behavior: "smooth" });
  }, []);

  return (
    <div className="mx-5 flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
        From Miles
      </span>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden scrollbar-none"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className="w-full min-w-full shrink-0 basis-full snap-start"
          >
            <AgentCoachingCard card={card} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {cards.map((_, i) => (
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
    </div>
  );
}

function QuickActions({ showRoadsideAssist }: { showRoadsideAssist: boolean }) {
  if (!showRoadsideAssist) return null;

  return (
    <div className="mx-5 grid grid-cols-1 gap-3">
      <button
        type="button"
        className="flex flex-col items-center gap-2 rounded-panel border border-stroke-muted bg-surface-card p-4 transition-colors hover:bg-background"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-surface-subtle">
          <svg className="size-5 text-semantic-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <span className="text-xs font-semibold text-text-secondary">Roadside Assist</span>
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
          <div key={s.label} className="flex flex-col gap-1 rounded-control bg-background px-2.5 py-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">{s.label}</span>
            <div className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${s.dot}`} />
              <span className={`text-xs font-semibold leading-none ${s.text}`}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}

function TripDriverCard({ driver }: { driver: string }) {
  const DRIVER_DATA: Record<string, { initials: string; color: string; score: number; relation: string }> = {
    Jack:  { initials: "JM", color: "bg-semantic-info", score: 74, relation: "Child" },
    Emma:  { initials: "EM", color: "bg-brand-primary", score: 79, relation: "Spouse" },
    Chris: { initials: "CM", color: "bg-semantic-success", score: 82, relation: "You" },
  };
  const d = DRIVER_DATA[driver] ?? { initials: driver.slice(0, 2).toUpperCase(), color: "bg-stroke-strong", score: "--", relation: "Driver" };
  return (
    <Link
      href="/drivers"
      className="mx-5 flex items-center gap-3 rounded-panel border border-stroke-muted bg-surface-card p-3.5 transition-colors hover:bg-background"
    >
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${d.color} text-xs font-semibold text-brand-inverse`}>
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
}: {
  vehicle: Vehicle;
  driver: string;
  vehicleLabel?: string;
}) {
  const currentPos = LIVE_ROUTE[LIVE_ROUTE.length - 1];
  const fromAgent = !!vehicleLabel;
  return (
    <div className="flex flex-col gap-4 pt-3">
      {/* Modal header — Trip active left, close right */}
      <div className="flex items-center justify-between px-5 pt-2">
        <span className="flex items-center gap-1.5 rounded-full bg-surface-strong px-3 py-1.5 text-xs font-semibold text-semantic-success">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-semantic-success opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-semantic-success" />
          </span>
          Trip active
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
}: {
  vehicle: Vehicle;
  onReturn: () => void;
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
          <span className="text-base font-semibold text-text-primary">
            {s.from} &rarr; {s.to}
          </span>
          <span className="text-xs text-text-secondary">{s.time}</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-text-muted">Distance</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">{s.distance}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-text-muted">Duration</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">{s.duration}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-text-muted">Score</span>
            <span className="text-sm font-semibold tabular-nums text-text-primary">{s.score}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-text-muted">Events</span>
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
          <span className="text-sm text-text-secondary">{s.driver}</span>
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
          <p className="flex-1 text-sm leading-relaxed text-text-secondary">
            One hard braking event on Preston Rd. Leaving a little more following distance can help — want tips?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/miles?context=coaching-braking"
            className="flex h-8 items-center rounded-control bg-semantic-success px-3.5 text-xs font-semibold text-background transition-opacity hover:opacity-90"
          >
            Show me
          </Link>
          <button
            type="button"
            onClick={onReturn}
            className="flex h-8 items-center rounded-control px-3.5 text-xs font-semibold text-semantic-success transition-colors hover:bg-surface-strong"
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

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [coachingDismissed, setCoachingDismissed] = useState(false);
  const [headerAction, setHeaderAction] = useState<"profile" | "roadside">("profile");
  const [footerNavMode, setFooterNavMode] = useState<FooterNavMode>("full");

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
    <main className="flex min-h-dvh flex-col bg-background pb-24">
      {mode === "trip" || vehicleLabelParam ? (
        <TripInProgress
          vehicle={vehicle}
          driver={driverParam ?? "Emma"}
          vehicleLabel={vehicleLabelParam}
        />
      ) : mode === "complete" ? (
        <TripComplete vehicle={vehicle} onReturn={() => setMode("parked")} />
      ) : (
        <div className="flex flex-col gap-4">
          <FleetView vehicles={VEHICLES} headerAction={headerAction} />
          <RecentTrips />
          {!coachingDismissed && (
            <AgentCoachingCarousel
              cards={COACHING_CARDS}
              onDismiss={() => setCoachingDismissed(true)}
            />
          )}
          <TodoPreview items={DEMO_TODOS} className="mx-5" />
          <QuickActions showRoadsideAssist={headerAction === "profile"} />
        </div>
      )}

      {/* Proto state toggle */}
      <div className="mx-5 mt-6 flex flex-col items-center gap-3 border-t border-stroke-muted pt-4">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Proto controls
        </span>
        <Link
          href={p("/hub")}
          className="rounded-full border border-stroke-muted bg-surface-card px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-background"
        >
          Design system hub
        </Link>
        <div className="flex items-center gap-1.5">
          {(["parked", "trip", "complete"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                mode === m
                  ? "bg-surface-strong text-text-secondary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {m === "complete" ? "trip complete" : m}
            </button>
          ))}
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
              4 tabs (hide profile)
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
