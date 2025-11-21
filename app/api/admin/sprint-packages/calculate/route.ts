import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

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
        sp.flat_fee,
        sp.flat_hours,
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

    const calculations = result.rows.map((pkg: any) => {
      let totalHours = 0;
      let totalPrice = 0;
      let totalPoints = 0;

      pkg.deliverables.forEach((d: any) => {
        const hours = parseFloat(d.fixedHours || 0);
        const price = parseFloat(d.fixedPrice || 0);
        const points = parseInt(d.points || 0);
        const qty = parseInt(d.quantity || 1);
        const complexity = parseFloat(d.complexityScore || 1.0);

        totalHours += hours * complexity * qty;
        totalPrice += price * complexity * qty;
        totalPoints += points * qty;
      });

      return {
        name: pkg.name,
        slug: pkg.slug,
        calculatedPrice: totalPrice,
        calculatedHours: totalHours,
        calculatedPoints: totalPoints,
        storedFlatFee: parseFloat(pkg.flat_fee || 0),
        storedFlatHours: parseFloat(pkg.flat_hours || 0),
        priceMatch: Math.abs(totalPrice - parseFloat(pkg.flat_fee || 0)) < 0.01,
        hoursMatch: Math.abs(totalHours - parseFloat(pkg.flat_hours || 0)) < 0.01,
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

