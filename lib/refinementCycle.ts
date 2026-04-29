// Refinement Cycle business-logic helpers.
//
// Timing rules:
// - 3pm ET: client submission cutoff for the next-day delivery option.
// - 5pm ET: studio commits to deciding (accept/decline) by this time. After
//   5pm the admin's default delivery date rolls to the day after next.
// - 10am ET on delivery day: deposit deadline. Cycles still in
//   `awaiting_deposit` past this moment expire.
// - 5pm ET on delivery day: delivery target.

const ET_TIME_ZONE = "America/New_York";

export const REFINEMENT_CYCLE_TOTAL_PRICE = 1200;
export const REFINEMENT_CYCLE_DEPOSIT_AMOUNT = 600;
export const REFINEMENT_CYCLE_FINAL_AMOUNT = 600;
export const REFINEMENT_CYCLE_ACCEPTANCE_CUTOFF_HOUR_ET = 17; // 5pm ET — studio commits to deciding by this time
export const REFINEMENT_CYCLE_DEPOSIT_DEADLINE_HOUR_ET = 10; // 10am ET
export const REFINEMENT_CYCLE_DELIVERY_HOUR_ET = 17; // 5pm ET

// Client-facing preferred-date cutoff: submissions before 3pm ET can pick
// next business day as their earliest preference; after 3pm ET the earliest
// preference is the day after that.
export const REFINEMENT_CYCLE_PREFERRED_CUTOFF_HOUR_ET = 15; // 3pm ET
export const REFINEMENT_CYCLE_PREFERRED_DATE_OPTIONS = 3;

export type RefinementCycleStatus =
  | "submitted"
  | "accepted"
  | "awaiting_deposit"
  | "in_progress"
  | "delivered"
  | "declined"
  | "expired";

export const REFINEMENT_CYCLE_STATUSES: RefinementCycleStatus[] = [
  "submitted",
  "accepted",
  "awaiting_deposit",
  "in_progress",
  "delivered",
  "declined",
  "expired",
];

// Returns the hour (0–23) at the given instant in Eastern Time.
function getEtHour(at: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: ET_TIME_ZONE,
  });
  const part = formatter
    .formatToParts(at)
    .find((p) => p.type === "hour")?.value;
  const hour = Number(part);
  // Some locales render midnight as "24" — normalize to 0.
  return hour === 24 ? 0 : hour;
}

// Returns the ET calendar date (YYYY-MM-DD) at the given instant.
export function etDateOnly(at: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: ET_TIME_ZONE,
  });
  return formatter.format(at); // en-CA yields YYYY-MM-DD
}

// Returns true if `at` is past the 5pm ET acceptance cutoff for that ET day.
export function isPastAcceptanceCutoff(at: Date): boolean {
  return getEtHour(at) >= REFINEMENT_CYCLE_ACCEPTANCE_CUTOFF_HOUR_ET;
}

// Returns the next business day (Mon–Fri) AFTER the given ET date,
// as a YYYY-MM-DD string.
export function nextBusinessDayEt(fromEtDate: string): string {
  // Parse as a local-noon date to avoid TZ edge cases when stepping days.
  const [yy, mm, dd] = fromEtDate.split("-").map((n) => Number(n));
  const cursor = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
  do {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  } while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6);
  const yyyy = cursor.getUTCFullYear();
  const mo = String(cursor.getUTCMonth() + 1).padStart(2, "0");
  const da = String(cursor.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mo}-${da}`;
}

// Default delivery date for a cycle being accepted right now.
// Before 5pm ET → next business day.
// At/after 5pm ET → business day after that.
export function defaultDeliveryDateEt(now: Date = new Date()): string {
  const today = etDateOnly(now);
  const next = nextBusinessDayEt(today);
  return isPastAcceptanceCutoff(now) ? nextBusinessDayEt(next) : next;
}

// Earliest delivery date a client can prefer at submission time. Mirrors the
// 5pm cutoff (looser than the studio's 3pm acceptance commitment).
export function earliestPreferredDeliveryDateEt(now: Date = new Date()): string {
  const today = etDateOnly(now);
  const next = nextBusinessDayEt(today);
  return getEtHour(now) >= REFINEMENT_CYCLE_PREFERRED_CUTOFF_HOUR_ET
    ? nextBusinessDayEt(next)
    : next;
}

// Returns up to N business days starting from `fromEtDate` (inclusive).
export function nextNBusinessDaysEt(
  fromEtDate: string,
  count: number
): string[] {
  if (count <= 0) return [];
  const out: string[] = [];
  // Re-use nextBusinessDayEt to step forward; first day is `fromEtDate` itself
  // unless it's a weekend, in which case advance to the next weekday.
  const [yy, mm, dd] = fromEtDate.split("-").map((n) => Number(n));
  const cursor = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
  while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  while (out.length < count) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cursor.getUTCDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return out;
}

// Convenience: client-facing preferred delivery options.
export function preferredDeliveryDateOptionsEt(
  now: Date = new Date()
): string[] {
  return nextNBusinessDaysEt(
    earliestPreferredDeliveryDateEt(now),
    REFINEMENT_CYCLE_PREFERRED_DATE_OPTIONS
  );
}

// Convert a YYYY-MM-DD ET date + ET hour into a UTC timestamp.
// Uses Intl to resolve the timezone offset robustly across DST.
export function etDateAtHourToUtc(etDate: string, etHour: number): Date {
  const [yy, mm, dd] = etDate.split("-").map((n) => Number(n));
  // Start with a guess that treats the ET wall-clock time as if it were UTC,
  // then correct by the actual ET offset at that instant.
  const guess = new Date(Date.UTC(yy, mm - 1, dd, etHour, 0, 0));
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TIME_ZONE,
    timeZoneName: "shortOffset",
  });
  const tzPart = formatter
    .formatToParts(guess)
    .find((p) => p.type === "timeZoneName")?.value;
  // tzPart looks like "GMT-5" or "GMT-4"
  const match = tzPart?.match(/GMT([+-]\d+)/);
  const offsetHours = match ? Number(match[1]) : -5;
  // ET wall-clock hour = UTC hour + offsetHours, so UTC = wall - offsetHours
  return new Date(Date.UTC(yy, mm - 1, dd, etHour - offsetHours, 0, 0));
}

// Deposit deadline (10am ET on delivery date) as a UTC Date.
export function depositDeadlineFromDeliveryDate(deliveryDate: string): Date {
  return etDateAtHourToUtc(deliveryDate, REFINEMENT_CYCLE_DEPOSIT_DEADLINE_HOUR_ET);
}

export type StatusVisuals = {
  label: string;
  tone: "neutral" | "info" | "success" | "warning" | "danger";
};

export function statusVisuals(status: RefinementCycleStatus): StatusVisuals {
  switch (status) {
    case "submitted":
      return { label: "Submitted", tone: "info" };
    case "accepted":
      return { label: "Accepted", tone: "info" };
    case "awaiting_deposit":
      return { label: "Awaiting deposit", tone: "warning" };
    case "in_progress":
      return { label: "In progress", tone: "info" };
    case "delivered":
      return { label: "Delivered", tone: "success" };
    case "declined":
      return { label: "Declined", tone: "neutral" };
    case "expired":
      return { label: "Expired", tone: "danger" };
  }
}
