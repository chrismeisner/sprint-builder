"use client";

import { useEffect, useRef, useState } from "react";
import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import { BottomSheet } from "@/app/sandboxes/miles-proto-4/_components/bottom-sheet";
import { MapView } from "@/app/sandboxes/miles-proto-4/_components/map-view";
import { SymbolIcon } from "@/app/sandboxes/miles-proto-4/_components/symbol-icon";
import { TripListItem } from "@/app/sandboxes/miles-proto-4/_components/trip-list-item";
import { useLocalStorageState } from "@/app/sandboxes/miles-proto-4/_lib/use-local-storage-state";
import { MARKER_LABEL } from "@/app/sandboxes/miles-proto-4/_lib/vehicle-tokens";
import {
  METRIC_ICONS,
  getVehicleData,
  useVehicleNickname,
  type VehicleData,
  type MetricTile,
} from "@/app/sandboxes/miles-proto-4/_lib/vehicle-data";

// Re-export the data API so existing consumers that point at this module
// continue to work. New consumers should import from `_lib/vehicle-data`
// directly so they don't pull mapbox-gl into their bundle.
export { METRIC_ICONS, getVehicleData, useVehicleNickname };
export type { VehicleData };

const VEHICLE_NICKNAME_COLOR: Record<string, string> = {
  civic: "#9b1c1c",
  rav4: "#6b8cae",
};

/* ------------------------------------------------------------------ */
/*  Body                                                               */
/* ------------------------------------------------------------------ */

export function VehicleDetailBody({ vehicleId }: { vehicleId: string }) {
  const vehicle = getVehicleData(vehicleId);
  const inferredName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const [nickname] = useLocalStorageState(
    `miles-proto-4-vehicle-nickname-${vehicle.id}`,
    vehicle.nickname
  );
  const [showVin, setShowVin] = useState(false);
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false);
  const [healthView] = useLocalStorageState<"bento" | "carousel">(
    `miles-proto-4-vehicle-health-view-${vehicle.id}`,
    "bento"
  );
  const healthMetrics = [...vehicle.primaryMetrics, ...vehicle.extendedMetrics].map((m) => ({
    ...m,
    icon: m.icon ?? METRIC_ICONS[m.id],
  }));
  const mapParallaxRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const CAROUSEL_VISIBLE = 3;
  const dotCount = Math.max(1, healthMetrics.length - CAROUSEL_VISIBLE + 1);
  const [carouselDot, setCarouselDot] = useState(0);

  /* Track active dot from scrollLeft. One dot per single-tile swipe
     position (so 6 metrics shown 3-up → 4 dots, one per leading-tile
     position). Step is read from the first two children's offsetLeft so
     gap changes don't require re-tuning. iOS analogue: UIPageControl
     driven by collectionView.contentOffset.x / itemWidth. */
  useEffect(() => {
    if (healthView !== "carousel") return;
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
        setCarouselDot(Math.min(dotCount - 1, Math.max(0, idx)));
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [healthView, dotCount]);

  /* Click-and-drag scrolling for desktop mouse. Touch swipe is left to the
     browser's native horizontal scroll (already works via overflow-x-auto).
     Snap is temporarily disabled during the drag so movement is 1:1, then
     re-enabled on release so the scroller settles on a tile. */
  useEffect(() => {
    if (healthView !== "carousel") return;
    const el = carouselRef.current;
    if (!el) return;

    let dragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let pointerId = -1;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      dragging = true;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;
      pointerId = e.pointerId;
      try {
        el.setPointerCapture(pointerId);
      } catch {
        /* ignore — capture not supported */
      }
      el.style.cursor = "grabbing";
      el.style.scrollSnapType = "none";
      el.style.userSelect = "none";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      el.scrollLeft = startScrollLeft - (e.clientX - startX);
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = "";
      el.style.scrollSnapType = "";
      el.style.userSelect = "";
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
    };
  }, [healthView]);

  /* Parallax: translate the map content down by 40% of scrollY so it scrolls
     up at ~60% of page speed, while the outer overflow-hidden wrapper clips
     the excess. iOS analogue: UIScrollView delegate reading contentOffset.y
     and applying a CATransform3DMakeTranslation to the header view. */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const node = mapParallaxRef.current;
        if (!node) return;
        const y = window.scrollY;
        node.style.transform = `translate3d(0, ${y * 0.4}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="flex flex-col gap-6">
      {/* Hero — full-bleed map, overlapping vehicle photo card, then nickname + make/model */}
      <div className="-mx-5 -mt-5 flex flex-col">
        <div className="relative z-0 h-[220px] w-full overflow-hidden bg-neutral-100">
          <div ref={mapParallaxRef} className="absolute inset-0 will-change-transform">
            <MapView
              center={[vehicle.parkedAt.lat, vehicle.parkedAt.lng]}
              zoom={14}
              interactive={false}
              markers={[
                {
                  lat: vehicle.parkedAt.lat,
                  lng: vehicle.parkedAt.lng,
                  type: "end",
                  color: VEHICLE_NICKNAME_COLOR[vehicle.id] ?? "#dc2626",
                  labelColor: MARKER_LABEL.parked,
                  label: "Parked",
                  initial: nickname[0],
                },
              ]}
              className="h-full w-full"
            />
          </div>
        </div>

        <div className="relative z-10 -mt-[60px] mx-auto flex w-[276px] flex-col items-center rounded-2xl border border-neutral-200 bg-white p-4 shadow-lg">
          {vehicle.imageSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={vehicle.imageSrc}
              alt={nickname}
              className="h-[140px] w-[206px] object-contain"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPhotoSheetOpen(true)}
              className="flex h-[140px] w-[206px] flex-col items-center justify-center gap-1 rounded-lg bg-neutral-100 text-neutral-500 transition-colors active:bg-neutral-200"
            >
              <SymbolIcon name="add_a_photo" size="md" className="text-neutral-500" />
              <span className="text-xs font-medium text-neutral-700">Upload or Generate an Image</span>
            </button>
          )}

          <h1 className="mt-3 text-center text-2xl font-semibold uppercase tracking-wide text-neutral-900">
            {nickname}
          </h1>
          <button
            type="button"
            onClick={() => setShowVin((v) => !v)}
            aria-label={showVin ? "Show year, make, and model" : "Show VIN"}
            className={`mt-1 rounded px-2 py-0.5 text-center text-xs text-neutral-500 transition-colors active:bg-neutral-100 ${
              showVin ? "font-mono tracking-wide" : ""
            }`}
          >
            {showVin ? vehicle.vin : inferredName}
          </button>
          <span
            className={`mt-2 inline-flex h-6 min-w-[105px] items-center justify-center rounded-md px-2 text-xs ${plateStatusClass(vehicle.registration.status)}`}
            aria-label={`License plate ${vehicle.registration.plate}, ${vehicle.registration.status}`}
          >
            {vehicle.registration.plate}
          </span>
        </div>
      </div>

      {/* Health */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Health</h2>
          <Link
            href={`/vehicles/health?vehicle=${vehicle.id}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            See all
          </Link>
        </div>
        {healthView === "bento" ? (
          <div className="grid grid-cols-3 gap-2">
            {healthMetrics.map((m) => (
              <MetricBentoTile key={m.id} metric={m} vehicleId={vehicle.id} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div
              ref={carouselRef}
              className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-1 scroll-px-5 cursor-grab touch-pan-x [&::-webkit-scrollbar]:hidden"
            >
              {healthMetrics.map((m) => (
                <MetricCarouselTile key={m.id} metric={m} vehicleId={vehicle.id} />
              ))}
            </div>
            {dotCount > 1 && (
              <div className="flex justify-center gap-1.5 pt-1" aria-label="Health page indicator">
                {Array.from({ length: dotCount }).map((_, i) => (
                  <span
                    key={i}
                    aria-current={i === carouselDot ? "true" : undefined}
                    className={`size-1.5 rounded-full transition-colors ${
                      i === carouselDot ? "bg-neutral-900" : "bg-neutral-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Drivers */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Drivers</h2>
          <Link
            href={`/vehicles/drivers?vehicle=${vehicle.id}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            See all
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {vehicle.drivers.map((driver) => (
            <Link
              key={driver.id}
              href="/drivers"
              className="flex items-center gap-3 p-4 transition-colors active:bg-neutral-50"
            >
              <span
                className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white ${driver.color}`}
              >
                {driver.initials}
              </span>
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-medium text-neutral-900">{driver.name}</span>
                {driver.lastTrip && (
                  <span className="truncate text-xs text-neutral-500">
                    Last trip · {driver.lastTrip}
                  </span>
                )}
              </div>
              {driver.score !== undefined && (
                <span
                  aria-label={`Miles score ${driver.score}`}
                  className={`shrink-0 text-sm font-semibold tabular-nums ${driverScoreColor(driver.score)}`}
                >
                  {driver.score}
                </span>
              )}
              <Chevron />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Trips */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Recent Trips</h2>
          <Link href="/trips" className="text-xs font-medium text-blue-600 hover:text-blue-700">
            See all
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white overflow-hidden">
          {vehicle.trips.map((trip) => (
            <TripListItem
              key={trip.id}
              trip={trip}
              href="/trip-receipt"
              className="py-3"
            />
          ))}
        </div>
      </section>

      {/* To-Do — forward-looking task list */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">To-Do</h2>
          <Link
            href={`/vehicles/todos?vehicle=${vehicle.id}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            See all
          </Link>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white px-4">
          <ul className="flex flex-col divide-y divide-neutral-100">
            {vehicle.upcomingMaintenance.map((item) => (
              <li key={item.title} className="flex items-center gap-3 py-3">
                <span className="size-3 rounded-full border-2 border-neutral-300" aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="truncate text-sm font-medium text-neutral-900">{item.title}</span>
                  <span className="truncate text-xs text-neutral-500">{item.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Service History — immutable record of completed work */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Service History</h2>
          <button
            type="button"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 active:opacity-60"
          >
            See all
          </button>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white px-4">
          <ul className="flex flex-col divide-y divide-neutral-100">
            {vehicle.pastMaintenance.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/vehicles/maintenance/${item.id}`}
                  className="-mx-1 flex items-center gap-2 rounded-lg px-1 py-3 transition-colors active:bg-neutral-100"
                >
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-sm font-medium text-neutral-900">{item.title}</span>
                    <span className="truncate text-xs text-neutral-500">{item.detail}</span>
                  </div>
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Documentation */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-neutral-900">Documentation</h2>
        <div className="flex flex-col gap-3">
          <DocumentCard
            href={`/vehicles/insurance?vehicle=${vehicle.id}`}
            icon={<ShieldIcon />}
            label="Insurance"
            primary={vehicle.insurance.carrier}
            secondary={vehicle.insurance.expires}
            status={vehicle.insurance.status}
          />
          <DocumentCard
            href={`/vehicles/registration?vehicle=${vehicle.id}`}
            icon={<DocIcon />}
            label="Registration"
            primary={`${vehicle.registration.plate} · ${vehicle.registration.state}`}
            secondary={vehicle.registration.expires}
            status={vehicle.registration.status}
          />
        </div>
      </section>

      <BottomSheet
        open={photoSheetOpen}
        onClose={() => setPhotoSheetOpen(false)}
        title="Add a photo"
      >
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="divide-y divide-neutral-200">
            <button
              type="button"
              onClick={() => setPhotoSheetOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-neutral-100"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-semantic-info">
                <SymbolIcon name="upload" size="md" className="text-semantic-info" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-medium text-neutral-900">Upload photo</span>
                <span className="text-xs text-neutral-500">Pick from your photo library or take a new one</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPhotoSheetOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-neutral-100"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
                <SymbolIcon name="auto_awesome" size="md" className="text-green-700" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-medium text-neutral-900">Generate image</span>
                <span className="text-xs text-neutral-500">Miles renders one from year, make, and model</span>
              </div>
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Subcomponents                                                      */
/* ------------------------------------------------------------------ */

function DocumentCard({
  href,
  icon,
  label,
  primary,
  secondary,
  status,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary: string;
  status: "Active" | "Expired";
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 transition-colors active:bg-neutral-50"
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
        <span className="truncate text-sm font-semibold text-neutral-900">{primary}</span>
        <span className="truncate text-xs text-neutral-500">{secondary}</span>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
          status === "Active"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        {status}
      </span>
      <Chevron />
    </Link>
  );
}

function MetricBentoTile({ metric, vehicleId }: { metric: MetricTile; vehicleId: string }) {
  return (
    <Link
      href={`/vehicles/metrics/${metric.id}?vehicle=${vehicleId}`}
      className="flex min-h-[104px] flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-3 transition-colors active:bg-neutral-50"
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700">
        <SymbolIcon name={metric.icon ?? "circle"} size="sm" className="text-neutral-700" />
      </span>
      <span className="mt-auto truncate text-[10px] font-medium uppercase tracking-wide text-neutral-400">
        {metric.label}
      </span>
      <div className="flex items-center gap-1.5">
        <span className={`size-1.5 shrink-0 rounded-full ${metric.dot}`} />
        <span className={`truncate text-sm font-semibold leading-none ${metric.text ?? "text-neutral-900"}`}>
          {metric.value}
        </span>
      </div>
    </Link>
  );
}

function MetricCarouselTile({ metric, vehicleId }: { metric: MetricTile; vehicleId: string }) {
  return (
    <Link
      href={`/vehicles/metrics/${metric.id}?vehicle=${vehicleId}`}
      className="flex w-[calc((100%-1rem)/3)] shrink-0 snap-start flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-3 transition-colors active:bg-neutral-50"
    >
      <span className="flex size-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
        <SymbolIcon
          name={metric.icon ?? "circle"}
          size="sm"
          className="text-neutral-700"
        />
      </span>
      <span className="truncate text-[10px] font-medium uppercase tracking-wide text-neutral-400">
        {metric.label}
      </span>
      <div className="flex items-center gap-1.5">
        <span className={`size-1.5 shrink-0 rounded-full ${metric.dot}`} />
        <span
          className={`truncate text-sm font-semibold leading-none ${metric.text ?? "text-neutral-900"}`}
        >
          {metric.value}
        </span>
      </div>
      {metric.lastUpdated && (
        <span className="truncate text-[10px] text-neutral-400">{metric.lastUpdated}</span>
      )}
    </Link>
  );
}

/** Color the license-plate chip by registration status. Active reads as a
 *  neutral plate (matches the Figma reference); Expired tints red as a
 *  passive alert. iOS analogue: a Color/Material computed from the
 *  registration state and applied to the chip background. */
function plateStatusClass(status: "Active" | "Expired") {
  switch (status) {
    case "Expired":
      return "bg-red-100 text-red-700 ring-1 ring-inset ring-red-200";
    case "Active":
    default:
      return "bg-neutral-200 text-neutral-900";
  }
}

/** Same threshold/colors used by /driver-score so the in-row score reads
 *  identically to the dedicated screen. iOS analogue: a Color computed
 *  from the score and applied via `.foregroundStyle(_:)`. */
function driverScoreColor(score: number) {
  if (score >= 80) return "text-green-700";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function Chevron() {
  return (
    <svg
      className="size-4 shrink-0 text-neutral-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Z" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" strokeLinejoin="round" />
      <path d="M14 3v6h6" strokeLinejoin="round" />
      <path d="M8 13h8M8 17h5" strokeLinecap="round" />
    </svg>
  );
}
