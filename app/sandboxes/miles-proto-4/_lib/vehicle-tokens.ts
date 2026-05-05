/**
 * Color tokens used by map markers and vehicle chrome.
 *
 * Kept as raw hex (not CSS variables) because MapView writes these into
 * innerHTML for Mapbox markers, where CSS vars don't resolve.
 *
 * iOS mapping:
 *   VEHICLE_ACCENT[id]   → Color("vehicle.<id>")        (per-vehicle asset color)
 *   MARKER_LABEL.parked  → Color.semanticInfo           (matches --color-semantic-info)
 *   MARKER_LABEL.driving → Color.semanticSuccess        (matches --color-semantic-success)
 *   MARKER_LABEL.unknown → Color.secondary / .gray      (neutral fallback)
 */

export const VEHICLE_ACCENT = {
  civic: "#9b1c1c",
  ram: "#6b8cae",
} as const;

export type VehicleAccentId = keyof typeof VEHICLE_ACCENT;

/** Map a vehicle display name to its accent color. */
const NAME_TO_ID: Record<string, VehicleAccentId> = {
  Civic: "civic",
  "Kit's RAM": "ram",
};

export function vehicleAccentByName(name: string): string {
  const id = NAME_TO_ID[name];
  return id ? VEHICLE_ACCENT[id] : MARKER_LABEL.unknown;
}

/** Find a vehicle (name + accent color) by scanning a label like "Kit's RAM is driving". */
export function vehicleByLabel(label: string): { name: string; accent: string } | undefined {
  const match = Object.keys(NAME_TO_ID).find((name) => label.includes(name));
  return match ? { name: match, accent: VEHICLE_ACCENT[NAME_TO_ID[match]] } : undefined;
}

export const MARKER_LABEL = {
  parked: "#2563eb",
  driving: "#16a34a",
  unknown: "#6b7280",
} as const;
