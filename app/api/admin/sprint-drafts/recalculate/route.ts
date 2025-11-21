import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

/**
 * POST /api/admin/sprint-drafts/recalculate
 * Recalculate all sprint deliverables' custom hours/price/points based on complexity
 * Useful for backfilling data or fixing sprints created before full calculations were implemented
 */
export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    // Get all sprint deliverables that need recalculation
    const result = await pool.query(`
      SELECT 
        spd.id,
        spd.sprint_draft_id,
        spd.deliverable_id,
        spd.complexity_score,
        d.fixed_hours,
        d.fixed_price,
        d.default_estimate_points
      FROM sprint_deliverables spd
      JOIN deliverables d ON spd.deliverable_id = d.id
      WHERE d.active = true
    `);

    let updated = 0;

    for (const row of result.rows) {
      const complexity = row.complexity_score != null ? Number(row.complexity_score) : 1.0;
      const adjustedHours = row.fixed_hours ? Number(row.fixed_hours) * complexity : null;
      const adjustedPrice = row.fixed_price ? Number(row.fixed_price) * complexity : null;
      const adjustedPoints = row.default_estimate_points 
        ? Math.round(Number(row.default_estimate_points) * complexity)
        : null;

      await pool.query(
        `UPDATE sprint_deliverables 
         SET custom_hours = $1,
             custom_price = $2,
             custom_estimate_points = $3
         WHERE id = $4`,
        [adjustedHours, adjustedPrice, adjustedPoints, row.id]
      );

      updated++;
    }

    // Recalculate totals for all sprint drafts
    const sprints = await pool.query(`SELECT DISTINCT sprint_draft_id FROM sprint_deliverables`);
    
    for (const sprint of sprints.rows) {
      await recalculateTotals(pool, sprint.sprint_draft_id);
    }

    return NextResponse.json({
      success: true,
      recalculated: updated,
      sprints: sprints.rowCount,
    });
  } catch (error) {
    console.error("[RecalculateSprints] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to recalculate" },
      { status: 500 }
    );
  }
}

async function recalculateTotals(pool: any, sprintId: string) {
  const result = await pool.query(
    `SELECT 
       COUNT(*)::int as deliverable_count,
       COALESCE(SUM(COALESCE(custom_estimate_points, 0)), 0)::int as total_points,
       COALESCE(SUM(COALESCE(custom_hours, 0)), 0)::numeric as total_hours,
       COALESCE(SUM(COALESCE(custom_price, 0)), 0)::numeric as total_price
     FROM sprint_deliverables
     WHERE sprint_draft_id = $1`,
    [sprintId]
  );

  const totals = result.rows[0] as {
    deliverable_count: number;
    total_points: number;
    total_hours: number;
    total_price: number;
  };

  await pool.query(
    `UPDATE sprint_drafts 
     SET deliverable_count = $1,
         total_estimate_points = $2,
         total_fixed_hours = $3,
         total_fixed_price = $4,
         updated_at = now()
     WHERE id = $5`,
    [
      totals.deliverable_count,
      totals.total_points,
      totals.total_hours,
      totals.total_price,
      sprintId,
    ]
  );
}

