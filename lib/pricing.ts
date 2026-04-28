export const POINT_BASE_FEE = 0;
export const POINT_PRICE_PER_POINT = 1750;
export const HOURS_PER_POINT = 10;
export const DEFAULT_HOURLY_RATE = POINT_PRICE_PER_POINT / HOURS_PER_POINT; // 175

export const UPDATE_CYCLE_WEEKLY_RATE = 2000;

/**
 * Smoke Test Sprint pricing
 * Formula: hourly_rate × mapped_hours_per_day(complexity) × working_days
 * Complexity mapping:
 * 1 => 2 hrs/day
 * 2 => 3 hrs/day
 * 3 => 4 hrs/day
 * 4 => 6 hrs/day
 * 5 => 8 hrs/day
 * Default: complexity 3 => 4 hrs/day; 250 × 4 × 10 = $10,000
 */
export const SMOKE_TEST_DEFAULT_COMPLEXITY = 3;
export const SMOKE_TEST_DEFAULT_HOURLY_RATE = 250;
export const SMOKE_TEST_HOURS_PER_COMPLEXITY_POINT = 10;
export const SMOKE_TEST_TIMELINE_WORKING_DAYS = 10;

/**
 * Default day-by-day theme labels for the 10-working-day Smoke Test Sprint.
 * Index 0 = Day 1 (Monday Week 1) … Index 9 = Day 10 (Friday Week 2).
 */
export const SMOKE_TEST_DAY_THEMES: readonly string[] = [
  "Aligned",
  "Generative",
  "Opinionated",
  "Decisive",
  "Clear",
  "Focused",
  "Excited",
  "Confident",
  "Meticulous",
  "Satisfied",
] as const;

export const SMOKE_TEST_COMPLEXITY_TIERS = {
  low: { score: 1, label: "Low" },
  medium: { score: 3, label: "Medium" },
  high: { score: 5, label: "High" },
} as const;

export type SmokeTestComplexityTier = keyof typeof SMOKE_TEST_COMPLEXITY_TIERS;

const SMOKE_TEST_COMPLEXITY_TO_HOURS_PER_DAY: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 6,
  5: 8,
};

export function smokeTestHoursPerDayFromComplexity(complexity: number): number {
  const normalized = Math.min(5, Math.max(1, Math.round(complexity)));
  return SMOKE_TEST_COMPLEXITY_TO_HOURS_PER_DAY[normalized] ?? 4;
}

export function calculateSmokeTestHours(complexity: number): number {
  return smokeTestHoursPerDayFromComplexity(complexity) * SMOKE_TEST_TIMELINE_WORKING_DAYS;
}

export function calculateSmokeTestPrice(complexity: number, hourlyRate: number): number {
  return hourlyRate * smokeTestHoursPerDayFromComplexity(complexity) * SMOKE_TEST_TIMELINE_WORKING_DAYS;
}

export function inferSmokeTestTier(complexity: number): SmokeTestComplexityTier | "custom" {
  for (const key of Object.keys(SMOKE_TEST_COMPLEXITY_TIERS) as SmokeTestComplexityTier[]) {
    if (SMOKE_TEST_COMPLEXITY_TIERS[key].score === complexity) return key;
  }
  return "custom";
}

/**
 * Derive the per-point price from an hourly rate.
 * Default: 175 $/hr × 10 hrs/pt = $1,750/pt
 */
export function pointPriceFromRate(hourlyRate?: number | null): number {
  const rate = hourlyRate != null && Number.isFinite(hourlyRate) && hourlyRate > 0
    ? hourlyRate
    : DEFAULT_HOURLY_RATE;
  return rate * HOURS_PER_POINT;
}

/**
 * Human-readable formula string so UI copies stay in sync with constants.
 */
export function pricingFormulaText(prefix = "Formula:", hourlyRate?: number | null) {
  const ppp = pointPriceFromRate(hourlyRate);
  return `${prefix} $${POINT_BASE_FEE.toLocaleString()} base + (complexity × $${ppp.toLocaleString()})`;
}

export function priceFromPoints(totalPoints: number, hourlyRate?: number | null) {
  const ppp = pointPriceFromRate(hourlyRate);
  return POINT_BASE_FEE + totalPoints * ppp;
}

export function hoursFromPoints(totalPoints: number) {
  return totalPoints * HOURS_PER_POINT;
}

export type PricedDeliverable = {
  points?: number | null;
  defaultEstimatePoints?: number | null;
  complexityScore?: number | null;
  quantity?: number | null;
};

export function calculatePricingFromDeliverables(
  deliverables: PricedDeliverable[],
  hourlyRate?: number | null,
) {
  let totalPoints = 0;
  let totalHours = 0;

  deliverables.forEach((d) => {
    const basePoints = d.points ?? d.defaultEstimatePoints ?? 0;
    const qty = d.quantity ?? 1;
    const complexity = d.complexityScore ?? 1.0;

    const points = basePoints * qty * complexity;
    totalPoints += points;
    totalHours += hoursFromPoints(points);
  });

  const totalPrice = priceFromPoints(totalPoints, hourlyRate);

  return {
    price: totalPrice,
    hours: totalHours,
    points: totalPoints,
  };
}
