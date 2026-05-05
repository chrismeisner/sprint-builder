"use client";

import { useLocalStorageState } from "@/app/sandboxes/miles-proto-4/_lib/use-local-storage-state";
import type { DemoTrip } from "@/app/sandboxes/miles-proto-4/_lib/demo-trips";

export interface MetricTile {
  id: string;
  label: string;
  value: string;
  dot: string;
  text?: string;
  /** Material Symbols name. iOS mapping: SF Symbol systemName. */
  icon?: string;
  /** Per-metric freshness label, surfaced in carousel view. */
  lastUpdated?: string;
}

export const METRIC_ICONS: Record<string, string> = {
  fuel: "local_gas_station",
  battery: "battery_charging_full",
  diagnostics: "troubleshoot",
  odometer: "speed",
  status: "local_parking",
  "connected-via": "sensors",
};

export interface MaintenanceItem {
  title: string;
  detail: string;
}

export interface PastActivityItem {
  id: string;
  title: string;
  detail: string;
}

export interface DriverEntry {
  id: string;
  name: string;
  initials: string;
  /** Tailwind background class for the initial avatar. */
  color: string;
  /** Relative time of this driver's most recent trip in this vehicle (e.g. "12m ago"). */
  lastTrip?: string;
  /** Driver's Miles score (0-100). Color-coded against the same thresholds as /driver-score. */
  score?: number;
}

export interface VehicleData {
  id: string;
  nickname: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  /** Optional — when missing, the hero card renders an "Upload or Generate" placeholder. */
  imageSrc?: string;
  parkedAt: { lat: number; lng: number };
  signalLabel: string;
  lastUpdated: string;
  primaryMetrics: MetricTile[];
  extendedMetrics: MetricTile[];
  insurance: {
    carrier: string;
    policyNumber: string;
    companyCode: string;
    state: string;
    namedInsureds: string[];
    expires: string;
    status: "Active" | "Expired";
    agent: { name: string; phone: string };
  };
  registration: { plate: string; state: string; expires: string; status: "Active" | "Expired" };
  upcomingMaintenance: MaintenanceItem[];
  pastMaintenance: PastActivityItem[];
  drivers: DriverEntry[];
  trips: DemoTrip[];
}

const VEHICLES: Record<string, VehicleData> = {
  civic: {
    id: "civic",
    nickname: "Civic",
    year: 2019,
    make: "Honda",
    model: "Civic Sport",
    vin: "2HGFC2F69KH542018",
    /* No photo yet — drives the upload-or-generate placeholder card on the hero. */
    imageSrc: undefined,
    parkedAt: { lat: 33.0152, lng: -96.7108 },
    signalLabel: "Updated 2m ago",
    lastUpdated: "Updated 2 min ago",
    primaryMetrics: [
      { id: "fuel", label: "Fuel", value: "62%", dot: "bg-green-500", text: "text-neutral-900", lastUpdated: "2m ago" },
      { id: "battery", label: "Battery", value: "12.6V", dot: "bg-green-500", text: "text-green-700", lastUpdated: "2m ago" },
      { id: "diagnostics", label: "Diagnostics", value: "0 codes", dot: "bg-green-500", text: "text-green-700", lastUpdated: "5m ago" },
      { id: "odometer", label: "Odometer", value: "41,230 mi", dot: "bg-neutral-300", text: "text-neutral-900", lastUpdated: "2m ago" },
    ],
    extendedMetrics: [
      { id: "status", label: "Status", value: "Parked", dot: "bg-green-500", text: "text-green-700", lastUpdated: "Just now" },
      { id: "connected-via", label: "Connected via", value: "Miles Plug", dot: "bg-green-500", text: "text-green-700", lastUpdated: "2m ago" },
    ],
    insurance: {
      carrier: "State Farm",
      policyNumber: "1023524-D30-30 F",
      companyCode: "962",
      state: "NJ",
      namedInsureds: ["KLEIN, KIT & BLANCHE", "KLEIN, TALIUR SHEA"],
      expires: "Expires Oct 30, 2026",
      status: "Active",
      agent: { name: "MORGAN SAYRE", phone: "(908) 824-7848" },
    },
    registration: { plate: "MXR 4821", state: "TX", expires: "Expires Mar 2027", status: "Active" },
    upcomingMaintenance: [
      { title: "Oil change", detail: "Due in ~2,800 mi" },
      { title: "Tire rotation", detail: "Due Aug 2026" },
      { title: "Annual inspection", detail: "Due Mar 2027" },
    ],
    pastMaintenance: [
      { id: "civic-oil-2025", title: "Oil change", detail: "Nov 12, 2025 · Honda Service · $74.50" },
      { id: "civic-cabin-filter", title: "Cabin air filter", detail: "Aug 02, 2025 · Honda Service · $42.00" },
      { id: "civic-rotation", title: "Tire rotation", detail: "May 21, 2025 · Discount Tire · Free" },
    ],
    drivers: [
      { id: "christina", name: "Christina", initials: "CM", color: "bg-semantic-success", lastTrip: "12m ago", score: 82 },
      { id: "emma", name: "Emma", initials: "EM", color: "bg-foreground", lastTrip: "1d ago", score: 79 },
    ],
    trips: [
      { id: "t1", from: "6128 Preston Rd", to: "W Park Blvd & Coit Rd", date: "Today", timeRange: "3:42 – 3:54 PM", distance: "4.2 mi", duration: "12 min", score: 88, events: 1, driver: "Christina", driverInitials: "CM", vehicle: "Civic" },
      { id: "t2", from: "3501 McDermott Rd", to: "Home", date: "Today", timeRange: "4:30 – 4:41 PM", distance: "4.1 mi", duration: "11 min", score: 92, events: 0, driver: "Christina", driverInitials: "CM", vehicle: "Civic" },
      { id: "t3", from: "1210 Legacy Dr", to: "N Central Expy & E Park Blvd", date: "Yesterday", timeRange: "8:05 – 8:32 AM", distance: "11.3 mi", duration: "27 min", score: 79, events: 2, driver: "Emma", driverInitials: "ER", vehicle: "Civic" },
    ],
  },
  rav4: {
    id: "rav4",
    nickname: "Kit's RAM",
    year: 2015,
    make: "RAM",
    model: "2500",
    vin: "3C6UR5DL5FG681204",
    imageSrc: "/api/sandbox-files/miles-proto-4/public/images/rav4.jpg",
    parkedAt: { lat: 33.0218, lng: -96.6945 },
    signalLabel: "No signal 1d",
    lastUpdated: "Updated yesterday",
    primaryMetrics: [
      { id: "fuel", label: "Fuel", value: "50%", dot: "bg-green-500", text: "text-green-700", lastUpdated: "1d ago" },
      { id: "battery", label: "Battery", value: "13.9V", dot: "bg-green-500", text: "text-green-700", lastUpdated: "1d ago" },
      { id: "diagnostics", label: "Diagnostics", value: "0 codes", dot: "bg-green-500", text: "text-green-700", lastUpdated: "2d ago" },
      { id: "odometer", label: "Odometer", value: "104,617 mi", dot: "bg-neutral-300", text: "text-neutral-900", lastUpdated: "1d ago" },
    ],
    extendedMetrics: [
      { id: "status", label: "Status", value: "Parked", dot: "bg-green-500", text: "text-green-700", lastUpdated: "1d ago" },
      { id: "connected-via", label: "Connected via", value: "Miles Plug", dot: "bg-green-500", text: "text-green-700", lastUpdated: "1d ago" },
    ],
    insurance: {
      carrier: "GEICO",
      policyNumber: "4471-78-22-49",
      companyCode: "847",
      state: "OR",
      namedInsureds: ["KLEIN, KIT & BLANCHE"],
      expires: "Expires Jun 2027",
      status: "Active",
      agent: { name: "JANET MORALES", phone: "(503) 555-0142" },
    },
    registration: { plate: "5MNP012", state: "OR", expires: "Expires Sep 2027", status: "Active" },
    upcomingMaintenance: [
      { title: "Oil change", detail: "Due in ~1,500 mi" },
      { title: "Tire rotation", detail: "Due Jun 2026" },
      { title: "Annual inspection", detail: "Due Sep 2026" },
    ],
    pastMaintenance: [
      { id: "oil-change", title: "Oil change", detail: "Feb 14, 2026 · Jiffy Lube · $58.32" },
      { id: "tire-rotation", title: "Tire rotation", detail: "Sep 29, 2025 · Discount Tire · Free" },
      { id: "front-brake-pads", title: "Front brake pads", detail: "Mar 15, 2025 · Local mechanic · $320.00" },
      { id: "battery-replacement", title: "Battery replacement", detail: "Aug 29, 2024 · AutoZone · $189.99" },
    ],
    drivers: [
      { id: "jack", name: "Jack", initials: "JM", color: "bg-semantic-info", lastTrip: "Just now", score: 74 },
      { id: "emma", name: "Emma", initials: "EM", color: "bg-foreground", lastTrip: "1d ago", score: 79 },
    ],
    trips: [
      { id: "t4", from: "Ohio Dr & W 15th St", to: "2041 Alma Dr", date: "Today", timeRange: "5:45 – 6:02 PM", distance: "3.8 mi", duration: "17 min", score: 85, events: 0, driver: "Jack", driverInitials: "JM", vehicle: "RAM" },
      { id: "t5", from: "908 W Spring Creek Pkwy", to: "7320 Independence Pkwy", date: "Yesterday", timeRange: "6:15 – 6:38 PM", distance: "8.9 mi", duration: "23 min", score: 81, events: 1, driver: "Jack", driverInitials: "JM", vehicle: "RAM" },
      { id: "t6", from: "Ridgeview Dr & Alma Rd", to: "8401 Angels Dr", date: "Yesterday", timeRange: "3:15 – 3:35 PM", distance: "5.7 mi", duration: "20 min", score: 87, events: 1, driver: "Emma", driverInitials: "ER", vehicle: "RAM" },
    ],
  },
};

export function getVehicleData(vehicleId: string | null | undefined): VehicleData {
  if (!vehicleId) return VEHICLES.civic;
  return VEHICLES[vehicleId] ?? VEHICLES.civic;
}

export function useVehicleNickname(vehicleId: string): string {
  const vehicle = getVehicleData(vehicleId);
  const [nickname] = useLocalStorageState(
    `miles-proto-4-vehicle-nickname-${vehicle.id}`,
    vehicle.nickname
  );
  return nickname;
}
