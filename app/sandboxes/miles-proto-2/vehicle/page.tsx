"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/app/sandboxes/miles-proto-2/_components/link";
import { MapView } from "@/app/sandboxes/miles-proto-2/_components/map-view";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface RecentTrip {
  id: string;
  from: string;
  to: string;
  date: string;
  distance: string;
  driver: string;
}

interface VehicleData {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  make: string;
  model: string;
  color: string;
  vin: string;
  plate: string;
  odometer: string;
  engine: { label: string; dot: string; text: string };
  battery: { label: string; dot: string; text: string };
  fuel: { label: string; dot: string; text: string };
  tires: { label: string; dot: string; text: string };
  oil: { label: string; dot: string; text: string };
  brakes: { label: string; dot: string; text: string };
  registration: string;
  insurance: string;
  parkedAt: { lat: number; lng: number };
  locationLabel: string;
  locationType: "saved" | "intersection";
  lastUpdated: string;
  liveTrip?: { driver: string; vehicleLabel: string; mph: number; tripHref: string };
  trips: RecentTrip[];
}

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

const VEHICLES: Record<string, VehicleData> = {
  civic: {
    id: "civic",
    title: "Honda Civic Sport",
    subtitle: "Chris's vehicle",
    year: 2019,
    make: "Honda",
    model: "Civic Sport",
    color: "Sonic Gray Pearl",
    vin: "19XFC2F59KE200847",
    plate: "MXR 4821 · TX",
    odometer: "41,230 mi",
    engine: { label: "Good", dot: "bg-green-500", text: "text-green-700" },
    battery: { label: "Good", dot: "bg-green-500", text: "text-green-700" },
    fuel: { label: "62%", dot: "bg-green-500", text: "text-neutral-700" },
    tires: { label: "Good", dot: "bg-green-500", text: "text-green-700" },
    oil: { label: "Good", dot: "bg-green-500", text: "text-green-700" },
    brakes: { label: "Good", dot: "bg-green-500", text: "text-green-700" },
    registration: "Mar 2027",
    insurance: "State Farm · expires Jun 2026",
    parkedAt: { lat: 33.0152, lng: -96.7108 },
    locationLabel: "Home",
    locationType: "saved",
    lastUpdated: "Just now",
    trips: [
      { id: "t1", from: "Home", to: "Target", date: "Today", distance: "4.2 mi", driver: "Chris" },
      { id: "t2", from: "Target", to: "Home", date: "Today", distance: "4.1 mi", driver: "Chris" },
      { id: "t3", from: "Home", to: "Work", date: "Yesterday", distance: "11.3 mi", driver: "Emma" },
    ],
  },
  rav4: {
    id: "rav4",
    title: "Toyota RAV4",
    subtitle: "Jack's vehicle",
    year: 2021,
    make: "Toyota",
    model: "RAV4 XLE",
    color: "Magnetic Gray",
    vin: "2T3P1RFV8MW200913",
    plate: "LGX 9204 · TX",
    odometer: "28,441 mi",
    engine: { label: "Good", dot: "bg-green-500", text: "text-green-700" },
    battery: { label: "Fair", dot: "bg-amber-500", text: "text-amber-700" },
    fuel: { label: "38%", dot: "bg-amber-500", text: "text-neutral-700" },
    tires: { label: "Good", dot: "bg-green-500", text: "text-green-700" },
    oil: { label: "Due soon", dot: "bg-amber-500", text: "text-amber-700" },
    brakes: { label: "Good", dot: "bg-green-500", text: "text-green-700" },
    registration: "Apr 2026",
    insurance: "State Farm · expires Jun 2026",
    parkedAt: { lat: 33.0218, lng: -96.6945 },
    locationLabel: "Elm St & 4th Ave",
    locationType: "intersection",
    lastUpdated: "3 min ago",
    liveTrip: {
      driver: "Jack",
      vehicleLabel: "Subaru Outback",
      mph: 34,
      tripHref: "/dashboard?mode=trip&driver=Jack&vehicleLabel=Subaru+Outback",
    },
    trips: [
      { id: "t4", from: "Work", to: "Elm St & 4th Ave", date: "Today", distance: "11.3 mi", driver: "Jack" },
      { id: "t5", from: "Home", to: "Work", date: "Yesterday", distance: "11.1 mi", driver: "Jack" },
      { id: "t6", from: "School", to: "Home", date: "Yesterday", distance: "3.8 mi", driver: "Emma" },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

function VehicleContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "dashboard";
  const vehicleId = searchParams.get("vehicle") ?? "civic";
  const vehicle = VEHICLES[vehicleId] ?? VEHICLES.civic;
  const closeHref = `/${from}`;
  const live = vehicle.liveTrip;

  const healthItems = [
    { name: "Engine", value: vehicle.engine.label, dot: vehicle.engine.dot, text: vehicle.engine.text },
    { name: "Battery", value: vehicle.battery.label, dot: vehicle.battery.dot, text: vehicle.battery.text },
    { name: "Fuel", value: vehicle.fuel.label, dot: vehicle.fuel.dot, text: vehicle.fuel.text },
    { name: "Tires", value: vehicle.tires.label, dot: vehicle.tires.dot, text: vehicle.tires.text },
    { name: "Oil", value: vehicle.oil.label, dot: vehicle.oil.dot, text: vehicle.oil.text },
    { name: "Brakes", value: vehicle.brakes.label, dot: vehicle.brakes.dot, text: vehicle.brakes.text },
  ];

  return (
    <main className="flex min-h-dvh flex-col px-6 pb-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {/* Close button */}
        <div className="flex justify-end pt-2">
          <Link
            href={closeHref}
            className="inline-flex size-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200"
            aria-label="Close"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>

        {/* Vehicle image + title */}
        <div className="flex flex-col items-center gap-2 -mt-4 -mb-2">
          <img
            src="/miles-proto-2/images/civic.png"
            alt={vehicle.title}
            className="h-44 w-auto max-w-[85%] object-contain object-center opacity-90 scale-[1.15]"
          />
          <h1 className="text-base font-semibold leading-snug text-neutral-900 text-center">{vehicle.title}</h1>
        </div>

        {/* Map — live trip or parked */}
        {live ? (
          <Link
            href={live.tripHref}
            className="block overflow-hidden rounded-2xl border border-green-200 transition-colors hover:border-green-300"
          >
            <div className="relative aspect-[16/7] w-full overflow-hidden">
              <MapView
                route={LIVE_ROUTE}
                markers={[
                  { lat: LIVE_ROUTE[0][0], lng: LIVE_ROUTE[0][1], type: "start" },
                  { lat: LIVE_ROUTE[LIVE_ROUTE.length - 1][0], lng: LIVE_ROUTE[LIVE_ROUTE.length - 1][1], type: "end" },
                ]}
                interactive={false}
                routeColor="#16a34a"
                routeWeight={4}
              />
              {/* Live badge */}
              <div className="absolute right-3 top-3">
                <span className="flex items-center gap-1.5 rounded-full bg-green-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                  </span>
                  Trip active
                </span>
              </div>
              {/* Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg className="size-3.5 text-white/90" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6.75 6.75 0 0 1-7.029 6.716 6.75 6.75 0 0 1-6.716 7.029.75.75 0 0 1-.764-.898l.66-3.296a.75.75 0 0 1 .565-.565l3.296-.66a.75.75 0 0 1 .898.764A6.75 6.75 0 0 1 21 8.25Z" />
                    </svg>
                    <span className="text-xs font-medium text-white">{live.driver} · {live.mph} mph</span>
                  </div>
                  <span className="text-xs font-medium text-white/80">Tap to view trip →</span>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <div className="relative aspect-[16/7] w-full overflow-hidden">
              <MapView
                center={[vehicle.parkedAt.lat, vehicle.parkedAt.lng]}
                zoom={15}
                markers={[{ lat: vehicle.parkedAt.lat, lng: vehicle.parkedAt.lng, type: "end" }]}
                interactive={false}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8">
                <div className="flex items-center gap-1.5">
                  {vehicle.locationType === "saved" ? (
                    <svg className="size-3.5 text-white/90" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="size-3.5 text-white/90" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  )}
                  <span className="text-xs font-medium text-white">
                    {vehicle.locationLabel} · Parked {vehicle.lastUpdated}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health bento grid */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Health</h2>
          <div className="grid grid-cols-3 gap-2">
            {healthItems.map((c) => (
              <div key={c.name} className="flex flex-col gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-3">
                <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
                  {c.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`size-1.5 rounded-full ${c.dot}`} />
                  <span className={`text-sm font-semibold leading-none ${c.text}`}>
                    {c.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Trips */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Recent Trips</h2>
            <Link href="/trips" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              See all
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white overflow-hidden">
            {vehicle.trips.map((trip) => (
              <Link
                key={trip.id}
                href="/trip-receipt"
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                  <svg className="size-4 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-medium text-neutral-900 truncate">{trip.from}</span>
                    <span className="text-xs text-neutral-400">→</span>
                    <span className="text-sm font-medium text-neutral-900 truncate">{trip.to}</span>
                  </div>
                  <span className="text-xs text-neutral-400">{trip.date} · {trip.distance} · {trip.driver}</span>
                </div>
                <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* Vehicle Info */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Vehicle Info</h2>
          <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {[
              { label: "Year", value: String(vehicle.year) },
              { label: "Make", value: vehicle.make },
              { label: "Model", value: vehicle.model },
              { label: "Color", value: vehicle.color },
              { label: "VIN", value: vehicle.vin },
              { label: "License plate", value: vehicle.plate },
              { label: "Odometer", value: vehicle.odometer },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-neutral-500">{row.label}</span>
                <span className="text-sm font-medium text-neutral-900 tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Documents */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Documents</h2>
          <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
            {[
              { label: "Registration expires", value: vehicle.registration },
              { label: "Insurance", value: vehicle.insurance },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-neutral-500">{row.label}</span>
                <span className="text-sm font-medium text-neutral-900">{row.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Miles Device */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Miles Device</h2>
          <Link
            href="/device-health"
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:bg-neutral-50"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              <svg className="size-5 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-neutral-900">Miles IO6</span>
              <span className="text-xs text-green-600">Online · All systems good</span>
            </div>
            <svg className="size-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </section>

      </div>
    </main>
  );
}

export default function VehiclePage() {
  return (
    <Suspense>
      <VehicleContent />
    </Suspense>
  );
}
