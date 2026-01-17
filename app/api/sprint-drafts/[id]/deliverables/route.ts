import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { priceFromPoints, hoursFromPoints } from "@/lib/pricing";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: { id: string };
};

/**
 * POST /api/sprint-drafts/[id]/deliverables
 * Add a deliverable to a sprint draft
 */
export async function POST(request: Request, { params }: Params) {
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

    // Fetch the deliverable details including scope
    const deliverableResult = await pool.query(
      `SELECT id, name, description, scope, category, points
       FROM deliverables WHERE id = $1 AND active = true`,
      [deliverableId]
    );

    if (deliverableResult.rowCount === 0) {
      return NextResponse.json({ error: "Deliverable not found or inactive" }, { status: 404 });
    }

    const deliverable = deliverableResult.rows[0] as {
      id: string;
      name: string;
      description: string | null;
      scope: string | null;
      category: string | null;
      points: number | null;
    };

    // Calculate adjusted values based on complexity (points act as complexity)
    const basePoints = deliverable.points ?? 0;
    const adjustedPoints = Math.round(basePoints * complexity * 10) / 10;
    const adjustedHours = hoursFromPoints(adjustedPoints);

    // Add to sprint_deliverables junction table, copying scope from master deliverable
    const junctionId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO sprint_deliverables 
       (id, sprint_draft_id, deliverable_id, quantity,
        deliverable_name, deliverable_description, deliverable_category, deliverable_scope, base_points,
        custom_estimate_points, custom_hours)
       VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (sprint_draft_id, deliverable_id) DO NOTHING`,
      [
        junctionId,
        params.id,
        deliverable.id,
        deliverable.name,
        deliverable.description,
        deliverable.category,
        deliverable.scope,
        adjustedPoints,
        adjustedPoints,
        adjustedHours,
      ]
    );

    // Update totals
    const updatedTotals = await recalculateTotals(pool, params.id);

    // Update draft JSON to include new deliverable
    await pool.query(
      `UPDATE sprint_drafts 
       SET draft = jsonb_set(
         COALESCE(draft, '{}'::jsonb),
         '{deliverables}',
         COALESCE(draft->'deliverables', '[]'::jsonb) || $1::jsonb,
         true
       ),
       updated_at = now()
       WHERE id = $2`,
      [
        JSON.stringify([{
          deliverableId: deliverable.id,
          name: deliverable.name,
          reason: "Added by user",
        }]),
        params.id,
      ]
    );

    return NextResponse.json({
      success: true,
      deliverable: {
        id: deliverable.id,
        name: deliverable.name,
        category: deliverable.category,
        basePoints: deliverable.points,
        complexityScore: complexity,
        adjustedPoints,
      },
      updatedTotals,
    });
  } catch (error) {
    console.error("[SprintDeliverables] Add error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add deliverable" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sprint-drafts/[id]/deliverables?deliverableId=xxx
 * Remove a deliverable from a sprint draft
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deliverableId = searchParams.get("deliverableId");

    if (!deliverableId) {
      return NextResponse.json({ error: "deliverableId is required" }, { status: 400 });
    }

    const pool = getPool();

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

    // Remove from junction table
    await pool.query(
      `DELETE FROM sprint_deliverables 
       WHERE sprint_draft_id = $1 AND deliverable_id = $2`,
      [params.id, deliverableId]
    );

    // Update totals
    const updatedTotals = await recalculateTotals(pool, params.id);

    // Remove from draft JSON
    await pool.query(
      `UPDATE sprint_drafts 
       SET draft = jsonb_set(
         COALESCE(draft, '{}'::jsonb),
         '{deliverables}',
         (
           SELECT jsonb_agg(elem)
           FROM jsonb_array_elements(COALESCE(draft->'deliverables', '[]'::jsonb)) elem
           WHERE elem->>'deliverableId' != $1
         ),
         true
       ),
       updated_at = now()
       WHERE id = $2`,
      [deliverableId, params.id]
    );

    return NextResponse.json({ success: true, updatedTotals });
  } catch (error) {
    console.error("[SprintDeliverables] Delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove deliverable" },
      { status: 500 }
    );
  }
}

async function recalculateTotals(pool: ReturnType<typeof getPool>, sprintId: string) {
  const result = await pool.query(
    `SELECT 
       COUNT(*)::int as deliverable_count,
       COALESCE(SUM(COALESCE(sd.base_points, d.points, 0) * sd.quantity), 0)::numeric as total_points
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

  // Return the calculated totals
  return {
    totalPoints: Number(totals.total_points),
    totalHours: Number(totalHours),
    totalPrice: Number(totalPrice),
  };
}

