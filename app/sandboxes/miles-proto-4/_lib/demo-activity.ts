import { DEMO_TRIPS, type DemoTrip } from "@/app/sandboxes/miles-proto-4/_lib/demo-trips";

/**
 * Unified activity-feed model.
 *
 * Powers the Trips page (a chronological feed mixing trips, score updates,
 * driving events, and the in-progress live trip).
 *
 * iOS mapping: each `ActivityEntry` is a row in a `List` with section
 * headers per day. The discriminated union maps to a SwiftUI enum + switch.
 */

export interface ScoreUpdateItem {
  id: string;
  vehicle: string;
  score: number;
  delta: number;
  date: string;
  time: string;
}

export const DEMO_SCORE_UPDATES: ScoreUpdateItem[] = [
  { id: "su-today-civic",  vehicle: "Civic",     score: 82, delta:  3, date: "Today",     time: "11:30 PM" },
  { id: "su-today-rav4",   vehicle: "Kit's RAM", score: 74, delta: -2, date: "Today",     time: "11:30 PM" },
  { id: "su-yest-civic",   vehicle: "Civic",     score: 79, delta:  1, date: "Yesterday", time: "11:30 PM" },
  { id: "su-yest-rav4",    vehicle: "Kit's RAM", score: 76, delta: -1, date: "Yesterday", time: "11:30 PM" },
];

export interface EventItem {
  id: string;
  title: string;
  detail: string;
  statusLabel: string;
  timeAgo: string;
  date: string;
  time: string;
  driver: string;
}

export const DEMO_EVENTS: EventItem[] = [
  { id: "ev-speed-1", title: "Speeding detected",  detail: "67 in a 65 zone",     statusLabel: "Driving", timeAgo: "2m ago",  date: "Today",     time: "4:38 PM", driver: "Emma" },
  { id: "ev-brake-1", title: "Hard braking",       detail: "Hwy 75 near Plano",   statusLabel: "Driving", timeAgo: "18m ago", date: "Today",     time: "4:22 PM", driver: "Jack" },
  { id: "ev-phone-1", title: "Phone use detected", detail: "At 34 mph on Oak St", statusLabel: "Parked",  timeAgo: "1h ago",  date: "Yesterday", time: "5:14 PM", driver: "Emma" },
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
  approximateLocation: "Preston Rd, Plano",
  startedAt: "5:18 PM",
  startLocation: "Preston Rd & Belt Line",
  lastRefreshedAt: "5:30 PM",
  date: "Today",
};

export type ActivityEntry =
  | { kind: "trip";  trip: DemoTrip }
  | { kind: "score"; item: ScoreUpdateItem }
  | { kind: "live";  live: LiveTripEntry }
  | { kind: "event"; event: EventItem };

/** Newest-first within each day. */
export const ACTIVITY_ITEMS: ActivityEntry[] = [
  { kind: "live",  live: LIVE_ACTIVITY },
  { kind: "event", event: DEMO_EVENTS[0] },
  { kind: "trip",  trip: DEMO_TRIPS[1] },
  { kind: "event", event: DEMO_EVENTS[1] },
  { kind: "trip",  trip: DEMO_TRIPS[0] },
  { kind: "score", item: DEMO_SCORE_UPDATES[2] },
  { kind: "score", item: DEMO_SCORE_UPDATES[3] },
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
  if (entry.kind === "score") return entry.item.date;
  if (entry.kind === "event") return entry.event.date;
  return entry.live.date;
}

export function getEntryTime(entry: ActivityEntry): string {
  if (entry.kind === "trip")  return entry.trip.timeRange.split(/\s*[–-]\s*/).pop() ?? entry.trip.timeRange;
  if (entry.kind === "score") return entry.item.time;
  if (entry.kind === "event") return entry.event.time;
  return "Now";
}

/** Optional driver associated with an entry — used by the Trips page filter. */
export function getEntryDriver(entry: ActivityEntry): string | undefined {
  if (entry.kind === "trip")  return entry.trip.driver;
  if (entry.kind === "event") return entry.event.driver;
  if (entry.kind === "live")  return entry.live.driver;
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
