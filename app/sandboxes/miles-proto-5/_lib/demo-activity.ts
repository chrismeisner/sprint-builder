import { DEMO_TRIPS, type DemoTrip } from "@/app/sandboxes/miles-proto-5/_lib/demo-trips";

/**
 * Unified activity-feed model.
 *
 * Powers the Trips page (a chronological feed mixing trips, driving events,
 * and the in-progress live trip).
 *
 * iOS mapping: each `ActivityEntry` is a row in a `List` with section
 * headers per day. The discriminated union maps to a SwiftUI enum + switch.
 */

export interface EventItem {
  id: string;
  title: string;
  detail: string;
  statusLabel: string;
  timeAgo: string;
  date: string;
  time: string;
  category: "driving";
  driver?: string;
  vehicle?: string;
}

export const DEMO_EVENTS: EventItem[] = [
  { id: "ev-speed-1", title: "Speeding detected",  detail: "62 in a 55 zone, US-202",        statusLabel: "Driving", timeAgo: "2m ago",  date: "Today",     time: "4:38 PM", category: "driving", driver: "Emma", vehicle: "Civic" },
  { id: "ev-brake-1", title: "Hard braking",       detail: "US-202 near Solebury, PA",       statusLabel: "Driving", timeAgo: "18m ago", date: "Today",     time: "4:22 PM", category: "driving", driver: "Jack", vehicle: "Kit's RAM" },
  { id: "ev-phone-1", title: "Phone use detected", detail: "At 34 mph on River Rd",          statusLabel: "Parked",  timeAgo: "1h ago",  date: "Yesterday", time: "5:14 PM", category: "driving", driver: "Emma", vehicle: "RAV4" },
];

export interface LiveTripEntry {
  id: string;
  driver: string;
  vehicleLabel: string;
  mph: number;
  startedAgo: string;
  approximateLocation: string;
  startedAt: string;
  startLocation: string;
  lastRefreshedAt: string;
  date: string;
}

export const LIVE_ACTIVITY: LiveTripEntry = {
  id: "live-jack",
  driver: "Jack",
  vehicleLabel: "Kit's RAM",
  mph: 34,
  startedAgo: "12 min",
  approximateLocation: "River Rd, Lambertville, NJ",
  startedAt: "5:18 PM",
  startLocation: "Bridge St & Main St, New Hope, PA",
  lastRefreshedAt: "5:30 PM",
  date: "Today",
};

export type ActivityEntry =
  | { kind: "trip";  trip: DemoTrip }
  | { kind: "live";  live: LiveTripEntry }
  | { kind: "event"; event: EventItem };

/** Newest-first within each day. */
export const ACTIVITY_ITEMS: ActivityEntry[] = [
  { kind: "live",  live: LIVE_ACTIVITY },
  { kind: "event", event: DEMO_EVENTS[0] },
  { kind: "trip",  trip: DEMO_TRIPS[1] },
  { kind: "event", event: DEMO_EVENTS[1] },
  { kind: "trip",  trip: DEMO_TRIPS[0] },
  { kind: "event", event: DEMO_EVENTS[2] },
  { kind: "trip",  trip: DEMO_TRIPS[3] },
  { kind: "trip",  trip: DEMO_TRIPS[2] },
];

export const ACTIVITY_DATE_LABELS: Record<string, string> = {
  Today:     "Today, March 20, 2026",
  Yesterday: "Yesterday, March 19, 2026",
};

export function getEntryDate(entry: ActivityEntry): string {
  if (entry.kind === "trip")  return entry.trip.date;
  if (entry.kind === "event") return entry.event.date;
  return entry.live.date;
}

export function getEntryTime(entry: ActivityEntry): string {
  if (entry.kind === "trip")  return entry.trip.timeRange.split(/\s*[–-]\s*/).pop() ?? entry.trip.timeRange;
  if (entry.kind === "event") return entry.event.time;
  return "Now";
}

/** Optional driver associated with an entry — used by the Trips page filter.
 * Score events have no driver (vehicle-level). */
export function getEntryDriver(entry: ActivityEntry): string | undefined {
  if (entry.kind === "trip")  return entry.trip.driver;
  if (entry.kind === "event") return entry.event.driver;
  if (entry.kind === "live")  return entry.live.driver;
  return undefined;
}

/** Optional vehicle associated with an entry — used by the Trips page filter. */
export function getEntryVehicle(entry: ActivityEntry): string | undefined {
  if (entry.kind === "trip")  return entry.trip.vehicle;
  if (entry.kind === "event") return entry.event.vehicle;
  if (entry.kind === "live")  return entry.live.vehicleLabel;
  return undefined;
}

export function groupActivityByDate(items: ActivityEntry[]) {
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
