import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { calculatePricingFromDeliverables, POINT_BASE_FEE, POINT_PRICE_PER_POINT } from "@/lib/pricing";

/**
 * GET /api/admin/sprint-packages/calculate
 * Shows calculated totals for each package at base complexity (1.0)
 */
export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();

    const result = await pool.query(`
      SELECT 
        sp.id,
        sp.name,
        sp.slug,
        json_agg(
          json_build_object(
            'name', d.name,
            'fixedHours', d.fixed_hours,
            'fixedPrice', d.fixed_price,
            'points', d.default_estimate_points,
            'quantity', spd.quantity,
            'complexityScore', COALESCE(spd.complexity_score, 1.0)
          ) ORDER BY spd.sort_order ASC
        ) as deliverables
      FROM sprint_packages sp
      LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
      LEFT JOIN deliverables d ON spd.deliverable_id = d.id
      WHERE sp.active = true
      GROUP BY sp.id
      ORDER BY sp.sort_order ASC
    `);

    const calculations = result.rows.map((pkg: {
      name: string;
      slug: string;
      deliverables: Array<{ fixedHours: string | null; fixedPrice: string | null; points: string | null; quantity: string | null; complexityScore: string | null }>;
    }) => {
      const { price, hours, points } = calculatePricingFromDeliverables(
        pkg.deliverables.map((d) => ({
          points: d.points ? parseFloat(d.points) : 0,
          quantity: d.quantity ? parseFloat(d.quantity) : 1,
          complexityScore: d.complexityScore ? parseFloat(d.complexityScore) : 1,
        }))
      );

      return {
        name: pkg.name,
        slug: pkg.slug,
        calculatedPrice: price,
        calculatedHours: hours,
        calculatedPoints: points,
        pricingModel: {
          baseFee: POINT_BASE_FEE,
          pricePerPoint: POINT_PRICE_PER_POINT,
        },
        deliverables: pkg.deliverables,
      };
    });

    return NextResponse.json({
      success: true,
      calculations,
    });
  } catch (error: unknown) {
    console.error("Error calculating packages:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

