// Refinement Cycle business-logic helpers.
//
// Delivery model: a cycle is one day of studio work split across two
// calendar days — "up-hill" the afternoon of Day 1 and delivery before
// noon ET on Day 2.
//
// Scheduling rules (day-based, no hour cutoff):
// - Earliest delivery is the business day after the next business day from
//   submission. Example: submit any time Monday → up-hill Tuesday →
//   delivery Wednesday. Submit any time Fri/Sat/Sun → up-hill Monday →
//   delivery Tuesday.
// - Mondays are never delivery days: up-hill would be Friday PM with a
//   weekend gap before delivery, which the studio can't run continuously.
//   When the computed delivery lands on Monday, it shifts to Tuesday.
// - The studio admin can accept or decline at any time — no acceptance
//   cutoff.

const ET_TIME_ZONE = "America/New_York";

export const REFINEMENT_CYCLE_TOTAL_PRICE = 1200;
export const REFINEMENT_CYCLE_DEPOSIT_AMOUNT = 600;
export const REFINEMENT_CYCLE_FINAL_AMOUNT = 600;

// Rate tiers. The actual amounts live on the cycle row at submission time
// (`total_price`, `deposit_amount`, `final_amount`) so existing billing /
// email code stays rate-agnostic. The `rate` column is for display.
//
// "pilot" is retired for new submissions (Full is the only option going
// forward) but the literal stays in the union so legacy pilot cycles still
// type-check on read and render with the "Pilot rate" label.
export type RefinementCycleRate = "pilot" | "full";

export type RefinementCycleRateOption = {
  id: RefinementCycleRate;
  label: string;
  totalPrice: number;
  depositAmount: number;
  finalAmount: number;
  blurb: string;
};

export const REFINEMENT_CYCLE_RATE_OPTIONS: RefinementCycleRateOption[] = [
  {
    id: "full",
    label: "Full rate",
    totalPrice: 1200,
    depositAmount: 600,
    finalAmount: 600,
    blurb: "Standard refinement cycle.",
  },
];

export const REFINEMENT_CYCLE_DEFAULT_RATE: RefinementCycleRate = "full";

export function getRateOption(
  rate: RefinementCycleRate
): RefinementCycleRateOption {
  return (
    REFINEMENT_CYCLE_RATE_OPTIONS.find((r) => r.id === rate) ??
    REFINEMENT_CYCLE_RATE_OPTIONS[0]
  );
}
// Delivery target: before 12pm ET (noon) on the delivery day.
export const REFINEMENT_CYCLE_DELIVERY_HOUR_ET = 12;

export const REFINEMENT_CYCLE_PREFERRED_DATE_OPTIONS = 3;

export type RefinementCycleStatus =
  | "submitted"
  | "accepted"
  | "awaiting_deposit"
  | "in_progress"
  | "awaiting_payment"
  | "delivered"
  | "declined"
  | "expired";

export const REFINEMENT_CYCLE_STATUSES: RefinementCycleStatus[] = [
  "submitted",
  "accepted",
  "awaiting_deposit",
  "in_progress",
  "awaiting_payment",
  "delivered",
  "declined",
  "expired",
];

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

// Returns true if the given YYYY-MM-DD ET date falls on a Monday.
function isMondayEt(etDate: string): boolean {
  const [yy, mm, dd] = etDate.split("-").map((n) => Number(n));
  return new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0)).getUTCDay() === 1;
}

// Valid delivery days are Tue/Wed/Thu/Fri. Mondays are skipped because the
// preceding up-hill block would land on Friday PM with a weekend gap before
// delivery — the studio can't run that continuously.
export function nextDeliveryDayAfterEt(fromEtDate: string): string {
  let candidate = nextBusinessDayEt(fromEtDate);
  while (isMondayEt(candidate)) {
    candidate = nextBusinessDayEt(candidate);
  }
  return candidate;
}

// Earliest delivery date for a cycle being accepted/submitted right now.
// Day-based: up-hill the next business day, deliver the business day after.
// Mondays are then skipped (no Monday deliveries — see file header).
export function earliestPreferredDeliveryDateEt(now: Date = new Date()): string {
  const today = etDateOnly(now);
  const upHillDay = nextBusinessDayEt(today);
  return nextDeliveryDayAfterEt(upHillDay);
}

// Default delivery date the admin sees when accepting — same earliest slot
// the client would have been offered.
export function defaultDeliveryDateEt(now: Date = new Date()): string {
  return earliestPreferredDeliveryDateEt(now);
}

// Returns up to N consecutive valid delivery days starting at `fromEtDate`
// (inclusive). Skips weekends AND Mondays.
export function nextNDeliveryDaysEt(
  fromEtDate: string,
  count: number
): string[] {
  if (count <= 0) return [];
  const out: string[] = [];
  const [yy, mm, dd] = fromEtDate.split("-").map((n) => Number(n));
  const cursor = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0));
  const isInvalid = (d: Date) => {
    const dow = d.getUTCDay();
    return dow === 0 || dow === 6 || dow === 1; // Sun, Sat, Mon
  };
  while (isInvalid(cursor)) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  while (out.length < count) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cursor.getUTCDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    while (isInvalid(cursor)) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return out;
}

// Convenience: client-facing preferred delivery options.
export function preferredDeliveryDateOptionsEt(
  now: Date = new Date()
): string[] {
  return nextNDeliveryDaysEt(
    earliestPreferredDeliveryDateEt(now),
    REFINEMENT_CYCLE_PREFERRED_DATE_OPTIONS
  );
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
    case "awaiting_payment":
      return { label: "Awaiting payment", tone: "warning" };
    case "delivered":
      return { label: "Delivered", tone: "success" };
    case "declined":
      return { label: "Declined", tone: "neutral" };
    case "expired":
      return { label: "Expired", tone: "danger" };
  }
}
