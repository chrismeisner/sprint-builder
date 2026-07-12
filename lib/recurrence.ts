// Recurrence scheduling for hills — "repeat this hill weekly at 9am", etc.
// Computes the next run instant for a hill_recurrences row, honoring an IANA
// timezone so wall-clock times (e.g. 09:00 ET) are correct across DST.

export type Recurrence = {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  at_time: string | null; // "HH:MM"
  by_weekday: number[] | null; // 0=Sun … 6=Sat (weekly)
  by_monthday: number[] | null; // 1..31 (monthly)
  timezone: string; // IANA, e.g. "America/New_York"
  starts_on: string | null; // YYYY-MM-DD
  ends_on: string | null; // YYYY-MM-DD
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

// The UTC instant whose wall-clock, in `tz`, is exactly y-mo-d h:mi (mo 1-12).
// Single-pass offset correction; fine for typical (non-DST-transition) times.
export function zonedWallClockToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  mi: number,
  tz: string
): Date {
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  }).formatToParts(new Date(utcGuess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const shownHour = get("hour") === 24 ? 0 : get("hour");
  const shown = Date.UTC(get("year"), get("month") - 1, get("day"), shownHour, get("minute"), get("second"));
  const offset = shown - utcGuess; // how far `tz` is ahead of UTC at this instant
  return new Date(utcGuess - offset);
}

// The calendar date (Y/M/D) that `instant` falls on, in `tz`.
function zonedYmd(instant: Date, tz: string): { y: number; mo: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), mo: get("month"), d: get("day") };
}

function weekdayInTz(instant: Date, tz: string): number {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(instant);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

/**
 * Next run strictly after `from`. Scans forward day-by-day (bounded) for the
 * first day matching the cadence, at `at_time` (default 09:00) in the recurrence
 * timezone. Returns null if past ends_on or nothing found within the horizon.
 */
export function computeNextRun(rec: Recurrence, from: Date = new Date()): Date | null {
  const tz = rec.timezone || "America/New_York";
  const [hh, mi] = (rec.at_time || "09:00").split(":").map((x) => parseInt(x, 10));
  const hour = Number.isFinite(hh) ? hh : 9;
  const minute = Number.isFinite(mi) ? mi : 0;
  const interval = Math.max(1, rec.interval || 1);

  const startsOn = rec.starts_on ? new Date(`${rec.starts_on}T00:00:00Z`) : null;
  const endsOn = rec.ends_on ? new Date(`${rec.ends_on}T23:59:59Z`) : null;

  // Anchor scan at the later of `from` and starts_on.
  const scanStart = startsOn && startsOn.getTime() > from.getTime() ? startsOn : from;
  const { y, mo, d } = zonedYmd(scanStart, tz);

  for (let i = 0; i < 800; i++) {
    // Candidate day = scanStart's date + i days (built via UTC midnight to step days).
    const base = new Date(Date.UTC(y, mo - 1, d));
    base.setUTCDate(base.getUTCDate() + i);
    const cy = base.getUTCFullYear();
    const cmo = base.getUTCMonth() + 1;
    const cd = base.getUTCDate();
    const candidate = zonedWallClockToUtc(cy, cmo, cd, hour, minute, tz);
    if (candidate.getTime() <= from.getTime()) continue;
    if (endsOn && candidate.getTime() > endsOn.getTime()) return null;

    let matches = false;
    if (rec.freq === "daily") {
      matches = true; // interval handled below via day counting from starts_on
      if (interval > 1 && startsOn) {
        const days = Math.round((Date.UTC(cy, cmo - 1, cd) - Date.UTC(zonedYmd(startsOn, tz).y, zonedYmd(startsOn, tz).mo - 1, zonedYmd(startsOn, tz).d)) / 86400000);
        matches = days % interval === 0;
      }
    } else if (rec.freq === "weekly") {
      const wd = weekdayInTz(candidate, tz);
      matches = (rec.by_weekday && rec.by_weekday.length ? rec.by_weekday : [weekdayInTz(scanStart, tz)]).includes(wd);
    } else if (rec.freq === "monthly") {
      matches = (rec.by_monthday && rec.by_monthday.length ? rec.by_monthday : [d]).includes(cd);
    } else if (rec.freq === "yearly") {
      matches = cmo === mo && cd === d;
    }
    if (matches) return candidate;
  }
  return null;
}

/** Human summary, e.g. "Every weekday at 6:30 AM" (loose). */
export function describeRecurrence(rec: Recurrence): string {
  const time = rec.at_time || "09:00";
  const [h, m] = time.split(":").map((x) => parseInt(x, 10));
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  const t = `${h12}:${pad(m)} ${ampm}`;
  const every = rec.interval > 1 ? `every ${rec.interval} ` : "";
  if (rec.freq === "daily") return `Every ${every ? rec.interval + " days" : "day"} at ${t}`;
  if (rec.freq === "weekly") {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = rec.by_weekday?.length ? rec.by_weekday.map((d) => names[d]).join(", ") : "week";
    return `${every ? "Every " + rec.interval + " weeks" : "Weekly"} on ${days} at ${t}`;
  }
  if (rec.freq === "monthly") return `Monthly at ${t}`;
  return `Yearly at ${t}`;
}
