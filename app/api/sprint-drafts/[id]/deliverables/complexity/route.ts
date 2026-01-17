import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { priceFromPoints, hoursFromPoints } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: { id: string };
};

/**
 * PATCH /api/sprint-drafts/[id]/deliverables/complexity
 * Update complexity score for a deliverable in a sprint draft
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const pool = getPool();
    const body = await request.json();
    const { deliverableId, complexityScore } = body as { 
      deliverableId?: unknown; 
      complexityScore?: unknown;
    };

    if (typeof deliverableId !== "string" || !deliverableId.trim()) {
      return NextResponse.json({ error: "deliverableId is required" }, { status: 400 });
    }

    // Parse complexity score (default to 1.0)
    // Valid values: 0.75 (Simple), 1.0 (Normal), 1.5 (Complex), 2.0 (Very Complex)
    let complexity = 1.0;
    if (typeof complexityScore === "number") {
      complexity = Math.max(0.5, Math.min(2, complexityScore));
    } else if (typeof complexityScore === "string") {
      const parsed = parseFloat(complexityScore);
      if (!isNaN(parsed)) {
        complexity = Math.max(0.5, Math.min(2, parsed));
      }
    }

    // Verify sprint ownership
    const sprintCheck = await pool.query(
      `SELECT sd.id, sd.status, d.account_id 
       FROM sprint_drafts sd
       LEFT JOIN documents d ON sd.document_id = d.id
       WHERE sd.id = $1`,
      [params.id]
    );

    if (sprintCheck.rowCount === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const sprint = sprintCheck.rows[0] as { id: string; status: string | null; account_id: string | null };
    
    if (sprint.account_id !== user.accountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (sprint.status !== "draft") {
      return NextResponse.json({ error: "Can only edit drafts" }, { status: 400 });
    }

    // Fetch the deliverable details to recalculate adjusted values
    const deliverableResult = await pool.query(
      `SELECT id, name, points
       FROM deliverables WHERE id = $1 AND active = true`,
      [deliverableId]
    );

    if (deliverableResult.rowCount === 0) {
      return NextResponse.json({ error: "Deliverable not found or inactive" }, { status: 404 });
    }

    const deliverable = deliverableResult.rows[0] as {
      id: string;
      name: string;
      points: number | null;
    };

    // Calculate adjusted values based on complexity
    const basePoints = deliverable.points ?? 0;
    const adjustedPoints = Math.round(basePoints * complexity * 10) / 10;
    const adjustedHours = hoursFromPoints(adjustedPoints); // hours = 15x complexity
    const adjustedPrice = priceFromPoints(adjustedPoints);

    // Update complexity score and adjusted values in junction table
    await pool.query(
      `UPDATE sprint_deliverables 
       SET complexity_score = $1,
           custom_hours = $2,
           custom_estimate_points = $3,
           base_points = $4
       WHERE sprint_draft_id = $5 AND deliverable_id = $6`,
      [complexity, adjustedHours, adjustedPoints, adjustedPoints, params.id, deliverableId]
    );

    // Recalculate totals
    await recalculateTotals(pool, params.id);

    // Fetch updated totals to return
    const totalsResult = await pool.query(
      `SELECT total_estimate_points, total_fixed_hours, total_fixed_price
       FROM sprint_drafts
       WHERE id = $1`,
      [params.id]
    );

    const totals = totalsResult.rows[0] as {
      total_estimate_points: number | null;
      total_fixed_hours: number | null;
      total_fixed_price: number | null;
    };

    return NextResponse.json({
      success: true,
      updatedTotals: {
        totalPoints: totals.total_estimate_points ?? 0,
        totalHours: totals.total_fixed_hours ?? 0,
        totalPrice: totals.total_fixed_price ?? 0,
      },
      deliverable: {
        id: deliverable.id,
        name: deliverable.name,
        complexityScore: complexity,
        adjustedHours,
        adjustedPrice,
        adjustedPoints,
      },
    });
  } catch (error) {
    console.error("[SprintDeliverables] Update complexity error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update complexity" },
      { status: 500 }
    );
  }
}

async function recalculateTotals(pool: ReturnType<typeof getPool>, sprintId: string) {
  const result = await pool.query(
    `SELECT 
       COUNT(*)::int as deliverable_count,
       COALESCE(SUM(COALESCE(custom_estimate_points, base_points, d.points, 0) * sd.quantity), 0)::numeric as total_points
     FROM sprint_deliverables sd
     LEFT JOIN deliverables d ON sd.deliverable_id = d.id
     WHERE sd.sprint_draft_id = $1`,
    [sprintId]
  );

  const totals = result.rows[0] as {
    deliverable_count: number;
    total_points: number;
  };

  const totalPoints = Number(totals.total_points);
  const totalHours = hoursFromPoints(totalPoints); // hours = 15x complexity
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
      totals.total_points,
      totalHours,
      totalPrice,
      sprintId,
    ]
  );
}

