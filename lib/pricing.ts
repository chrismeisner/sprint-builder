export const POINT_BASE_FEE = 0;
export const POINT_PRICE_PER_POINT = 1750;
export const HOURS_PER_POINT = 10;
export const DEFAULT_HOURLY_RATE = POINT_PRICE_PER_POINT / HOURS_PER_POINT; // 175

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
