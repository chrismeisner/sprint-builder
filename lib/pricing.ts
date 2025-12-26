export const POINT_BASE_FEE = 5000;
export const POINT_PRICE_PER_POINT = 2500;
export const HOURS_PER_POINT = 15;

/**
 * Human-readable formula string so UI copies stay in sync with constants.
 */
export function pricingFormulaText(prefix = "Formula:") {
  return `${prefix} $${POINT_BASE_FEE.toLocaleString()} base + (complexity × $${POINT_PRICE_PER_POINT.toLocaleString()})`;
}

export function priceFromPoints(totalPoints: number) {
  return POINT_BASE_FEE + totalPoints * POINT_PRICE_PER_POINT;
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

export function calculatePricingFromDeliverables(deliverables: PricedDeliverable[]) {
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

  const totalPrice = priceFromPoints(totalPoints);

  return {
    price: totalPrice,
    hours: totalHours,
    points: totalPoints,
  };
}

