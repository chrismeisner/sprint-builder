import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: { id: string };
};

/**
 * PATCH /api/sprint-drafts/[id]/deliverables/scope
 * Update custom scope for a deliverable in a sprint draft
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
    const { deliverableId, customScope } = body as { 
      deliverableId?: unknown; 
      customScope?: unknown;
    };

    if (typeof deliverableId !== "string" || !deliverableId.trim()) {
      return NextResponse.json({ error: "deliverableId is required" }, { status: 400 });
    }

    const scope = typeof customScope === "string" ? customScope : "";

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

    // Update custom scope in junction table
    await pool.query(
      `UPDATE sprint_deliverables 
       SET custom_scope = $1
       WHERE sprint_draft_id = $2 AND deliverable_id = $3`,
      [scope, params.id, deliverableId]
    );

    // Update sprint updated_at timestamp
    await pool.query(
      `UPDATE sprint_drafts 
       SET updated_at = now()
       WHERE id = $1`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      customScope: scope,
    });
  } catch (error) {
    console.error("[SprintDeliverables] Update scope error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update scope" },
      { status: 500 }
    );
  }
}

