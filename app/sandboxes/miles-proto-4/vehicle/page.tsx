"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "@/app/sandboxes/miles-proto-4/_components/link";
import { MapView } from "@/app/sandboxes/miles-proto-4/_components/map-view";
import { TodoPreview } from "@/app/sandboxes/miles-proto-4/_components/todo-preview";
import { TripListItem } from "@/app/sandboxes/miles-proto-4/_components/trip-list-item";
import { DEMO_TODOS } from "@/app/sandboxes/miles-proto-4/_lib/demo-todos";
import type { DemoTrip } from "@/app/sandboxes/miles-proto-4/_lib/demo-trips";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface VehicleData {
  id: string;
  nickname: string;
  imageSrc: string;
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
  trips: DemoTrip[];
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
    nickname: "Civic",
    imageSrc: "/api/sandbox-files/miles-proto-4/public/images/civic.jpg",
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
      { id: "t1", from: "6128 Preston Rd", to: "W Park Blvd & Coit Rd", date: "Today", timeRange: "3:42 – 3:54 PM", distance: "4.2 mi", duration: "12 min", score: 88, events: 1, driver: "Christina", driverInitials: "CM", vehicle: "Civic" },
      { id: "t2", from: "3501 McDermott Rd", to: "Home", date: "Today", timeRange: "4:30 – 4:41 PM", distance: "4.1 mi", duration: "11 min", score: 92, events: 0, driver: "Christina", driverInitials: "CM", vehicle: "Civic" },
      { id: "t3", from: "1210 Legacy Dr", to: "N Central Expy & E Park Blvd", date: "Yesterday", timeRange: "8:05 – 8:32 AM", distance: "11.3 mi", duration: "27 min", score: 79, events: 2, driver: "Emma", driverInitials: "ER", vehicle: "Civic" },
    ],
  },
  rav4: {
    id: "rav4",
    nickname: "RAV4",
    imageSrc: "/api/sandbox-files/miles-proto-4/public/images/rav4.jpg",
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
      vehicleLabel: "Toyota RAV4",
      mph: 34,
      tripHref: "/dashboard?mode=trip&driver=Jack&vehicleLabel=Toyota+RAV4",
    },
    trips: [
      { id: "t4", from: "Ohio Dr & W 15th St", to: "2041 Alma Dr", date: "Today", timeRange: "5:45 – 6:02 PM", distance: "3.8 mi", duration: "17 min", score: 85, events: 0, driver: "Jack", driverInitials: "JM", vehicle: "RAV4" },
      { id: "t5", from: "908 W Spring Creek Pkwy", to: "7320 Independence Pkwy", date: "Yesterday", timeRange: "6:15 – 6:38 PM", distance: "8.9 mi", duration: "23 min", score: 81, events: 1, driver: "Jack", driverInitials: "JM", vehicle: "RAV4" },
      { id: "t6", from: "Ridgeview Dr & Alma Rd", to: "8401 Angels Dr", date: "Yesterday", timeRange: "3:15 – 3:35 PM", distance: "5.7 mi", duration: "20 min", score: 87, events: 1, driver: "Emma", driverInitials: "ER", vehicle: "RAV4" },
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
  const vehicleTodos = DEMO_TODOS.filter((item) => item.vehicleId === vehicle.id);
  const vehicleDetails = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  const healthItems = [
    { name: "Engine", value: vehicle.engine.label, dot: vehicle.engine.dot, text: vehicle.engine.text },
    { name: "Battery", value: vehicle.battery.label, dot: vehicle.battery.dot, text: vehicle.battery.text },
    { name: "Fuel", value: vehicle.fuel.label, dot: vehicle.fuel.dot, text: vehicle.fuel.text },
    { name: "Tires", value: vehicle.tires.label, dot: vehicle.tires.dot, text: vehicle.tires.text },
    { name: "Oil", value: vehicle.oil.label, dot: vehicle.oil.dot, text: vehicle.oil.text },
    { name: "Device", value: "Connected", dot: "bg-green-500", text: "text-green-700" },
  ];

  return (
    <main className="min-h-dvh bg-neutral-100 pt-4">
      <div className="relative mx-auto max-w-md">
        <div className="flex min-h-dvh w-full flex-col rounded-t-3xl bg-white px-6 pb-16 pt-6 shadow-xl">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold leading-snug text-neutral-900">{vehicle.nickname}</h1>
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

        {/* Vehicle hero bento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-3">
            <div className="flex flex-1 items-center justify-center py-2">
              <img
                src={vehicle.imageSrc}
                alt={vehicle.nickname}
                className="h-24 w-full object-contain object-center opacity-90"
              />
            </div>
            <span className="text-xs text-neutral-500">{vehicleDetails}</span>
          </div>

          {live ? (
            <Link
              href={live.tripHref}
              className="block h-full overflow-hidden rounded-2xl border border-green-200 transition-colors hover:border-green-300"
            >
              <div className="relative h-full w-full overflow-hidden">
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
                <div className="absolute right-2 top-2">
                  <span className="flex items-center gap-1 rounded-full bg-green-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
                    <span className="relative flex size-1.5">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                    </span>
                    Live
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-white">{live.driver} driving</span>
                    <span className="text-[11px] text-white/80">{live.mph} mph</span>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="h-full overflow-hidden rounded-2xl border border-neutral-200">
              <div className="relative h-full w-full overflow-hidden">
                <MapView
                  center={[vehicle.parkedAt.lat, vehicle.parkedAt.lng]}
                  zoom={15}
                  markers={[{ lat: vehicle.parkedAt.lat, lng: vehicle.parkedAt.lng, type: "end" }]}
                  interactive={false}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
                  <div className="flex flex-col gap-1">
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
                      <span className="text-[11px] font-semibold text-white">{vehicle.locationLabel}</span>
                    </div>
                    <span className="text-[11px] text-white/80">Parked {vehicle.lastUpdated}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
              <TripListItem
                key={trip.id}
                trip={trip}
                href="/trip-receipt"
                className="py-3"
              />
            ))}
          </div>
        </section>

        {/* To-do */}
        <section className="flex flex-col gap-3">
          <TodoPreview
            items={vehicleTodos}
            title="To-Do"
            href="/todos"
          />
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

        </div>
        </div>
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
