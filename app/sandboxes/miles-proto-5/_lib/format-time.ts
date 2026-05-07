/**
 * Split a "3:42 – 3:54 PM" range into ["3:42 PM", "3:54 PM"], propagating the
 * meridiem from whichever side has it. Used by trip rows on the Trips feed
 * and by `LastTripStrip` on the Dashboard.
 *
 * iOS mapping: equivalent to formatting two `Date` values with `.shortened`
 * time style — keep this purely presentational so the iOS rebuild can swap
 * to native formatters.
 */
export function normalizeTimeRange(timeRange: string): [string, string] {
  const [rawStart = "", rawEnd = ""] = timeRange.split(/\s+[–-]\s+/);
  const startMatch = rawStart.match(/\b(am|pm)\b/i);
  const endMatch = rawEnd.match(/\b(am|pm)\b/i);
  const meridiem = (endMatch?.[1] ?? startMatch?.[1] ?? "").toUpperCase();

  const normalize = (value: string) =>
    value.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase()).trim();

  const start = startMatch ? normalize(rawStart) : meridiem ? `${rawStart} ${meridiem}` : rawStart;
  const end = endMatch ? normalize(rawEnd) : meridiem ? `${rawEnd} ${meridiem}` : rawEnd;

  return [start.trim(), end.trim()];
}
