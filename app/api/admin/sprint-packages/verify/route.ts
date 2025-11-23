import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * GET /api/admin/sprint-packages/verify
 * Verifies sprint packages and their workshop deliverables
 */
export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();

    // Fetch all sprint packages with their deliverables
    const result = await pool.query(`
      SELECT 
        sp.id,
        sp.name,
        sp.slug,
        sp.flat_fee,
        sp.flat_hours,
        json_agg(
          json_build_object(
            'deliverableId', d.id,
            'name', d.name,
            'type', d.deliverable_type,
            'fixedHours', d.fixed_hours,
            'fixedPrice', d.fixed_price,
            'quantity', spd.quantity
          ) ORDER BY spd.sort_order ASC
        ) as deliverables
      FROM sprint_packages sp
      LEFT JOIN sprint_package_deliverables spd ON sp.id = spd.sprint_package_id
      LEFT JOIN deliverables d ON spd.deliverable_id = d.id
      WHERE sp.active = true
      GROUP BY sp.id
      ORDER BY sp.sort_order ASC
    `);

    const packages = result.rows;

    // Count workshops
    const workshopCount = await pool.query(`
      SELECT COUNT(*) as count FROM deliverables WHERE deliverable_type = 'workshop'
    `);

    return NextResponse.json({
      success: true,
      workshopCount: parseInt(workshopCount.rows[0].count),
      packageCount: packages.length,
      packages,
    });
  } catch (error: unknown) {
    console.error("Error verifying packages:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


