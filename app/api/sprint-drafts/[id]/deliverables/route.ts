import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
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
       JOIN documents d ON sd.document_id = d.id
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
      `SELECT id, name, description, scope, category, fixed_hours, fixed_price, default_estimate_points
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
      fixed_hours: number | null;
      fixed_price: number | null;
      default_estimate_points: number | null;
    };

    // Calculate adjusted values based on complexity
    const adjustedHours = deliverable.fixed_hours ? deliverable.fixed_hours * complexity : null;
    const adjustedPrice = deliverable.fixed_price ? deliverable.fixed_price * complexity : null;
    const adjustedPoints = deliverable.default_estimate_points 
      ? Math.round(deliverable.default_estimate_points * complexity)
      : null;

    // Add to sprint_deliverables junction table, copying scope from master deliverable
    const junctionId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO sprint_deliverables 
       (id, sprint_draft_id, deliverable_id, quantity, complexity_score, custom_hours, custom_price, custom_estimate_points, custom_scope)
       VALUES ($1, $2, $3, 1, $4, $5, $6, $7, $8)
       ON CONFLICT (sprint_draft_id, deliverable_id) DO NOTHING`,
      [
        junctionId,
        params.id,
        deliverable.id,
        complexity,
        adjustedHours,
        adjustedPrice,
        adjustedPoints,
        deliverable.scope, // Copy scope from master deliverable
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
        baseHours: deliverable.fixed_hours,
        basePrice: deliverable.fixed_price,
        basePoints: deliverable.default_estimate_points,
        complexityScore: complexity,
        adjustedHours,
        adjustedPrice,
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
       JOIN documents d ON sd.document_id = d.id
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

  // Return the calculated totals
  return {
    totalPoints: Number(totals.total_points),
    totalHours: Number(totals.total_hours),
    totalPrice: Number(totals.total_price),
  };
}

