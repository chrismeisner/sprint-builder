"use client";

import { Suspense, useState, useCallback, useRef } from "react";
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
    liveTrip: { driver: "Jack", vehicleLabel: "Subaru Outback", mph: 34, startedAgo: "12 mins ago" },
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
      "Your oil change is due in ~800 miles. I can help you schedule it or set a reminder.",
    actionLabel: "Chat with Miles",
    actionHref: "/miles?context=fuel",
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

interface TodoItem {
  id: string;
  title: string;
  subtitle: string;
  type: "setup" | "near-term" | "long-horizon";
  vehicle: string;
}

const TODOS: TodoItem[] = [
  { id: "insurance", title: "Upload insurance card", subtitle: "Needed for roadside assistance", type: "setup", vehicle: "Civic" },
  { id: "oil", title: "Oil change due", subtitle: "~800 mi remaining", type: "near-term", vehicle: "RAV4" },
  { id: "coolant", title: "Coolant flush at 50,000 mi", subtitle: "~12,800 mi away", type: "long-horizon", vehicle: "Civic" },
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

interface RecentTrip {
  id: string;
  from: string;
  to: string;
  date: string;
  timeRange: string;
  distance: string;
  duration: string;
  events: number;
  driver: string;
  vehicle: string;
}

const RECENT_TRIPS: RecentTrip[] = [
  { id: "t1", from: "Home", to: "Target", date: "Today", timeRange: "3:42 – 3:54 PM", distance: "4.2 mi", duration: "12 min", events: 1, driver: "Chris", vehicle: "Civic" },
  { id: "t2", from: "Target", to: "Preston Rd & Belt Line", date: "Today", timeRange: "4:30 – 4:41 PM", distance: "4.1 mi", duration: "11 min", events: 0, driver: "Chris", vehicle: "Civic" },
  { id: "t3", from: "Elm St & 4th Ave", to: "1200 Commerce St", date: "Yesterday", timeRange: "8:05 – 8:32 AM", distance: "11.3 mi", duration: "27 min", events: 2, driver: "Emma", vehicle: "RAV4" },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function _FleetSwitcher({
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
  const engineDot = v.engine === "good" ? "bg-green-500" : "bg-amber-500";
  const engineText = v.engine === "good" ? "text-green-700" : "text-amber-700";
  const fuelPct = v.fuelPct ?? 0;
  const fuelDot = fuelPct > 30 ? "bg-green-500" : "bg-amber-500";
  const fuelText = fuelPct > 30 ? "text-neutral-700" : "text-amber-700";

  return (
    <>
      {/* Vehicle header + car image */}
      <Link href={vehicleHref} className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2 transition-colors hover:bg-neutral-50/80">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-900">{v.name}</span>
            {live && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-green-500" />
                </span>
                Live
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-400">{v.year} {v.make} {v.model}</span>
          {!live && <span className="text-[11px] text-neutral-300">{v.locationLabel} · Parked {v.lastUpdated}</span>}
        </div>
        <div className="flex items-center gap-1">
          <img
            src="/miles-proto-2/images/civic.png"
            alt={v.name}
            className="w-24 object-contain opacity-90"
          />
          <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </Link>

      {/* Bento stats — always Score / Engine / Fuel */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <div className="flex flex-col gap-1.5 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Score</span>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-green-500" />
            <span className="text-sm font-semibold leading-none text-green-700">{v.driverScore}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Engine</span>
          <div className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${engineDot}`} />
            <span className={`text-sm font-semibold leading-none ${engineText}`}>{engineLabel}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">Fuel</span>
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
          className="mx-4 mb-4 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 transition-colors hover:bg-green-100"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green-600 text-[11px] font-semibold text-white">
              {live.driver[0]}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-green-900">{live.driver} is driving</span>
              <span className="text-[11px] text-green-700">{live.startedAgo}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold tabular-nums text-green-900">{live.mph}</span>
              <span className="text-[11px] text-green-700">mph</span>
            </div>
            <svg className="size-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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

function FleetView({ vehicles }: { vehicles: Vehicle[] }) {
  const liveVehicle = vehicles.find((v) => v.liveTrip);
  const hasLive = !!liveVehicle;
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIndex) setActiveIndex(idx);
  }, [activeIndex]);

  const goTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  }, []);

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
        <h1 className="text-2xl font-bold leading-none text-neutral-900">Miles</h1>
        <Link
          href="/account"
          className="flex items-center gap-2 rounded-full py-1 pl-3 pr-1 transition-colors hover:bg-neutral-100"
        >
          <span className="text-sm font-medium text-neutral-700">Chris M.</span>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-semibold leading-none text-white">
            CM
          </div>
        </Link>
      </div>

      {/* Fleet map — always shown, never changes */}
      <div className="mx-5 overflow-hidden rounded-2xl border border-neutral-200">
        <div className="relative aspect-[3/2] w-full overflow-hidden">
          <MapView markers={allMarkers} interactive={false} />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-4 pb-3 pt-6">
            <span className="text-xs font-medium text-white/80">
              {vehicles.length} vehicles · {hasLive ? "1 trip active" : "all parked"}
            </span>
          </div>
        </div>
      </div>

      {/* Vehicles section header + toggle */}
      <div className="flex items-center justify-between px-5">
        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Vehicles</span>
        <div className="flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
          {/* List view icon */}
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-label="List view"
            className={`flex size-7 items-center justify-center rounded-md transition-colors ${
              viewMode === "list" ? "bg-white shadow-sm text-neutral-800" : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          {/* Card / carousel icon */}
          <button
            type="button"
            onClick={() => { setViewMode("card"); setActiveIndex(0); }}
            aria-label="Card view"
            className={`flex size-7 items-center justify-center rounded-md transition-colors ${
              viewMode === "card" ? "bg-white shadow-sm text-neutral-800" : "text-neutral-400 hover:text-neutral-600"
            }`}
          >
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* List view */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-3 px-5">
          {[...vehicles].sort((a, b) => (b.liveTrip ? 1 : 0) - (a.liveTrip ? 1 : 0)).map((v) => (
            <div key={v.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <VehicleCardContent v={v} />
            </div>
          ))}
        </div>
      )}

      {/* Card / carousel view */}
      {viewMode === "card" && (
        <div className="flex flex-col gap-2">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex snap-x snap-mandatory overflow-x-scroll"
            style={{ scrollbarWidth: "none" }}
          >
            {[...vehicles].sort((a, b) => (b.liveTrip ? 1 : 0) - (a.liveTrip ? 1 : 0)).map((v) => (
              <div key={v.id} className="flex w-full shrink-0 snap-start px-5">
                <div className="w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  <VehicleCardContent v={v} />
                </div>
              </div>
            ))}
          </div>
          {/* Pagination dots */}
          <div className="flex items-center justify-center gap-1.5">
            {vehicles.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to vehicle ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === activeIndex ? "w-4 bg-neutral-700" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



function _MilesScoreCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      href="/driver-score"
      className="mx-5 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3.5 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Miles Score
        </span>
        <span className="text-2xl font-bold leading-none tabular-nums text-neutral-900">
          {vehicle.driverScore}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400">{vehicle.scoreUpdated}</span>
        <svg className="size-4 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}

function RecentTrips() {
  return (
    <div className="mx-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          Recent Trips
        </span>
        <Link href="/trips" className="text-xs font-medium text-blue-600 hover:text-blue-700">
          See all
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
        {RECENT_TRIPS.map((t) => (
          <Link
            key={t.id}
            href="/trip-receipt"
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
          >
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium leading-none text-neutral-900">
                  {t.from} &rarr; {t.to}
                </span>
                {t.events > 0 && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                    {t.events}
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-400">
                <span>{t.date} · {t.timeRange}</span>
                <span className="text-neutral-300">&middot;</span>
                <span>{t.distance}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium text-neutral-500">{t.vehicle}</span>
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium text-neutral-500">{t.driver}</span>
              </div>
            </div>
            <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
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
    <div className="flex w-full flex-col gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
      <div className="flex flex-col gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/miles-proto-2/miles-icon.svg"
            alt="Miles"
            className="size-8 object-contain"
          />
        </div>
        <p className="text-sm leading-relaxed text-green-800">
          {card.message}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={card.actionHref}
          className="flex h-8 items-center rounded-lg bg-green-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
        >
          {card.actionLabel}
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 items-center rounded-lg px-3.5 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100"
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
      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
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
              i === activeIndex ? "w-4 bg-neutral-700" : "w-1.5 bg-neutral-300 hover:bg-neutral-400"
            }`}
          />
        ))}
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
                <span className={`text-xs leading-none ${s.sub}`}>{item.subtitle}</span>
                <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium text-neutral-500">{item.vehicle}</span>
                </div>
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

function TripVehicleStatus({ vehicleLabel }: { vehicleLabel?: string }) {
  const STATUSES = [
    { label: "Engine", value: "Good", dot: "bg-green-500", text: "text-green-700" },
    { label: "Battery", value: "Fair", dot: "bg-amber-500", text: "text-amber-700" },
    { label: "Fuel", value: "38%", dot: "bg-blue-500", text: "text-neutral-700" },
  ];
  return (
    <Link
      href={`/vehicle?from=dashboard&vehicle=rav4`}
      className="mx-5 block rounded-xl border border-neutral-200 bg-white p-3 transition-colors hover:bg-neutral-50"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          {vehicleLabel ?? "Vehicle"}
        </span>
        <svg className="size-3.5 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {STATUSES.map((s) => (
          <div key={s.label} className="flex flex-col gap-1 rounded-lg bg-neutral-50 px-2.5 py-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">{s.label}</span>
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
    Jack:  { initials: "JM", color: "bg-blue-500",   score: 74, relation: "Child" },
    Emma:  { initials: "EM", color: "bg-purple-500", score: 79, relation: "Spouse" },
    Chris: { initials: "CM", color: "bg-green-600",  score: 82, relation: "You" },
  };
  const d = DRIVER_DATA[driver] ?? { initials: driver.slice(0, 2).toUpperCase(), color: "bg-neutral-400", score: "--", relation: "Driver" };
  return (
    <Link
      href="/drivers"
      className="mx-5 flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 transition-colors hover:bg-neutral-50"
    >
      <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${d.color} text-xs font-semibold text-white`}>
        {d.initials}
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold leading-none text-neutral-900">{driver}</span>
        <span className="text-xs text-neutral-400">{d.relation} · Miles Score {d.score}</span>
      </div>
      <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

function TripInProgress({
  vehicle: _vehicle,
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
        <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-green-600" />
          </span>
          Trip active
        </span>
        {fromAgent && (
          <Link
            href="/miles?context=kid-trip"
            className="inline-flex size-8 items-center justify-center rounded-full bg-black/10 text-neutral-600 transition-colors hover:bg-black/15"
            aria-label="Close"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </Link>
        )}
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
            <span className="text-xs font-medium">Preston Rd & Belt Line &rarr; ...</span>
          </div>
        </div>
      </div>

      {/* Speed */}
      <LiveSpeed mph={34} />

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

function _FleetMapView({
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

  const modeParam = searchParams.get("mode") as DashboardMode | null;
  const mode: DashboardMode =
    modeParam === "trip" || modeParam === "complete" ? modeParam : "parked";
  const driverParam = searchParams.get("driver") ?? undefined;
  const vehicleLabelParam = searchParams.get("vehicleLabel") ?? undefined;

  const vehicle = VEHICLES[0];

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

  return (
    <main className="flex min-h-dvh flex-col bg-neutral-50 pb-24">
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
          <FleetView vehicles={VEHICLES} />
          <RecentTrips />
          {!coachingDismissed && (
            <AgentCoachingCarousel
              cards={COACHING_CARDS}
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
