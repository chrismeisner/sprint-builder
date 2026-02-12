import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { priceFromPoints, hoursFromPoints } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: { id: string };
};

/**
 * POST /api/sprint-drafts/[id]/sync-deliverables
 * Sync all deliverables in this sprint with their source deliverables
 * Updates name, description, category, scope, and points from the master deliverable
 */
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    
    // Only admins can sync deliverables
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const pool = getPool();

    // Verify sprint exists
    const sprintCheck = await pool.query(
      `SELECT id, status FROM sprint_drafts WHERE id = $1`,
      [params.id]
    );

    if (sprintCheck.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const sprint = sprintCheck.rows[0] as { id: string; status: string | null };

    // Get all sprint deliverables with their source deliverable data
    const deliverables = await pool.query(
      `SELECT 
         sd.id as junction_id,
         sd.deliverable_id,
         sd.complexity_score,
         sd.quantity,
         sd.custom_estimate_points,
         d.name,
         d.description,
         d.category,
         d.scope,
         d.points
       FROM sprint_deliverables sd
       INNER JOIN deliverables d ON sd.deliverable_id = d.id
       WHERE sd.sprint_draft_id = $1`,
      [params.id]
    );

    if (deliverables.rowCount === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No deliverables to sync",
        updatedCount: 0 
      });
    }

    let updatedCount = 0;

    // Update each sprint deliverable with fresh data from source
    for (const row of deliverables.rows) {
      const del = row as {
        junction_id: string;
        deliverable_id: string;
        complexity_score: number | null;
        quantity: number;
        custom_estimate_points: number | null;
        name: string;
        description: string | null;
        category: string | null;
        scope: string | null;
        points: number | null;
      };

      // Calculate adjusted points based on complexity if it was customized
      const basePoints = del.points ?? 0;
      const complexityScore = del.complexity_score ?? 1.0;
      
      // If custom_estimate_points exists and differs from source, preserve the adjustment ratio
      let newCustomPoints = basePoints;
      if (del.custom_estimate_points && del.custom_estimate_points !== basePoints) {
        // Preserve custom adjustment - apply same multiplier to new base
        const oldMultiplier = basePoints > 0 ? del.custom_estimate_points / basePoints : 1;
        newCustomPoints = Math.round(basePoints * oldMultiplier * 10) / 10;
      }

      const newCustomHours = hoursFromPoints(newCustomPoints);

      // Update sprint_deliverable with fresh source data
      await pool.query(
        `UPDATE sprint_deliverables 
         SET deliverable_name = $1,
             deliverable_description = $2,
             deliverable_category = $3,
             deliverable_scope = $4,
             base_points = $5,
             custom_estimate_points = $6,
             custom_hours = $7
         WHERE id = $8`,
        [
          del.name,
          del.description,
          del.category,
          del.scope,
          basePoints,
          newCustomPoints,
          newCustomHours,
          del.junction_id,
        ]
      );

      updatedCount++;
    }

    // Recalculate totals
    const totalsResult = await pool.query(
      `SELECT 
         COUNT(*)::int as deliverable_count,
         COALESCE(SUM(COALESCE(sd.custom_estimate_points, sd.base_points, d.points, 0) * sd.quantity), 0)::numeric as total_points
       FROM sprint_deliverables sd
       LEFT JOIN deliverables d ON sd.deliverable_id = d.id
       WHERE sd.sprint_draft_id = $1`,
      [params.id]
    );

    const totals = totalsResult.rows[0] as {
      deliverable_count: number;
      total_points: number;
    };

    const totalPoints = Number(totals.total_points);
    const totalHours = hoursFromPoints(totalPoints);
    const totalPrice = priceFromPoints(totalPoints);

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
        totalPoints,
        totalHours,
        totalPrice,
        params.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${updatedCount} deliverable${updatedCount !== 1 ? 's' : ''}`,
      updatedCount,
      updatedTotals: {
        totalPoints,
        totalHours,
        totalPrice,
      },
    });
  } catch (error) {
    console.error("[SyncDeliverables] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync deliverables" },
      { status: 500 }
    );
  }
}
