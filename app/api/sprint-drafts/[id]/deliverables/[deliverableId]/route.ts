import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { priceFromPoints, hoursFromPoints } from "@/lib/pricing";

type Params = {
  params: { id: string; deliverableId: string };
};

/**
 * PATCH /api/sprint-drafts/[id]/deliverables/[deliverableId]
 * 
 * Update a sprint deliverable's content, notes, etc.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify the sprint deliverable exists and user has access
    const checkResult = await pool.query(
      `SELECT 
        spd.id,
        spd.sprint_draft_id,
        sd.status,
        d.account_id,
        sd.project_id
       FROM sprint_deliverables spd
       JOIN sprint_drafts sd ON spd.sprint_draft_id = sd.id
       JOIN documents d ON sd.document_id = d.id
       WHERE spd.id = $1 AND sd.id = $2`,
      [params.deliverableId, params.id]
    );

    if (checkResult.rowCount === 0) {
      return NextResponse.json({ error: "Sprint deliverable not found" }, { status: 404 });
    }

    const sprintDeliverable = checkResult.rows[0];
    const isOwner = sprintDeliverable.account_id === currentUser.accountId;
    const isAdmin = currentUser.isAdmin === true;

    // Check project membership
    let isProjectMember = false;
    if (sprintDeliverable.project_id) {
      const memberRes = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
        [sprintDeliverable.project_id, currentUser.email]
      );
      isProjectMember = Boolean(memberRes?.rowCount && memberRes.rowCount > 0);
    }

    if (!isOwner && !isAdmin && !isProjectMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Don't allow edits to completed sprints (unless admin)
    if (sprintDeliverable.status === "complete" && !isAdmin) {
      return NextResponse.json({ error: "Cannot edit deliverables in completed sprints" }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { content, notes, customScope, attachments, deliveryUrl, customEstimatePoints } = body;

    // Build update query
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    if (typeof content === "string") {
      updates.push(`content = $${paramIndex++}`);
      values.push(content || null);
    }

    if (typeof notes === "string") {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes || null);
    }

    if (typeof customScope === "string") {
      updates.push(`custom_scope = $${paramIndex++}`);
      values.push(customScope || null);
    }

    if (Array.isArray(attachments)) {
      updates.push(`attachments = $${paramIndex++}::jsonb`);
      values.push(JSON.stringify(attachments));
    }

    if (deliveryUrl !== undefined) {
      updates.push(`delivery_url = $${paramIndex++}`);
      values.push(typeof deliveryUrl === "string" ? (deliveryUrl.trim() || null) : null);
    }

    if (customEstimatePoints !== undefined) {
      updates.push(`custom_estimate_points = $${paramIndex++}`);
      values.push(typeof customEstimatePoints === "number" ? customEstimatePoints : null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(params.deliverableId);

    const updateResult = await pool.query(
      `UPDATE sprint_deliverables 
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, content, notes, custom_scope, attachments, delivery_url, custom_estimate_points`,
      values
    );

    // Recalculate sprint totals from all deliverables
    const deliverablesResult = await pool.query(
      `SELECT 
        COALESCE(spd.custom_estimate_points, del.default_estimate_points, 0) as points,
        COALESCE(spd.complexity_score, 1.0) as complexity_score
       FROM sprint_deliverables spd
       LEFT JOIN deliverables del ON spd.deliverable_id = del.id
       WHERE spd.sprint_draft_id = $1`,
      [params.id]
    );

    let totalPoints = 0;
    for (const row of deliverablesResult.rows) {
      const points = Number(row.points) || 0;
      const complexity = Number(row.complexity_score) || 1.0;
      totalPoints += points * complexity;
    }

    const totalPrice = priceFromPoints(totalPoints);
    const totalHours = hoursFromPoints(totalPoints);

    // Update sprint totals and updated_at
    await pool.query(
      `UPDATE sprint_drafts 
       SET updated_at = NOW(),
           total_estimate_points = $2,
           total_fixed_price = $3,
           total_fixed_hours = $4
       WHERE id = $1`,
      [params.id, totalPoints, totalPrice, totalHours]
    );

    return NextResponse.json({
      success: true,
      deliverable: {
        id: updateResult.rows[0].id,
        content: updateResult.rows[0].content,
        notes: updateResult.rows[0].notes,
        customScope: updateResult.rows[0].custom_scope,
        attachments: updateResult.rows[0].attachments,
        deliveryUrl: updateResult.rows[0].delivery_url,
      },
      sprintTotals: {
        totalPoints,
        totalPrice,
        totalHours,
      },
    });
  } catch (error: unknown) {
    console.error("Error updating sprint deliverable:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sprint-drafts/[id]/deliverables/[deliverableId]
 * 
 * Get a single sprint deliverable's details
 */
export async function GET(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT 
        spd.*,
        d.name as global_name,
        d.description as global_description,
        d.category as global_category,
        d.scope as global_scope,
        d.presentation_content,
        sd.title as sprint_title,
        sd.status as sprint_status,
        doc.account_id,
        sd.project_id
       FROM sprint_deliverables spd
       LEFT JOIN deliverables d ON spd.deliverable_id = d.id
       JOIN sprint_drafts sd ON spd.sprint_draft_id = sd.id
       JOIN documents doc ON sd.document_id = doc.id
       WHERE spd.id = $1 AND sd.id = $2`,
      [params.deliverableId, params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Sprint deliverable not found" }, { status: 404 });
    }

    const row = result.rows[0];
    const isOwner = row.account_id === currentUser.accountId;
    const isAdmin = currentUser.isAdmin === true;

    // Check project membership
    let isProjectMember = false;
    if (row.project_id) {
      const memberRes = await pool.query(
        `SELECT 1 FROM project_members WHERE project_id = $1 AND lower(email) = lower($2) LIMIT 1`,
        [row.project_id, currentUser.email]
      );
      isProjectMember = Boolean(memberRes?.rowCount && memberRes.rowCount > 0);
    }

    if (!isOwner && !isAdmin && !isProjectMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      deliverable: {
        id: row.id,
        deliverableId: row.deliverable_id,
        name: row.deliverable_name ?? row.global_name,
        description: row.deliverable_description ?? row.global_description,
        category: row.deliverable_category ?? row.global_category,
        scope: row.custom_scope ?? row.deliverable_scope ?? row.global_scope,
        basePoints: row.base_points,
        customPoints: row.custom_estimate_points,
        complexityScore: row.complexity_score,
        notes: row.notes,
        content: row.content,
        attachments: row.attachments,
        presentationContent: row.presentation_content,
        sprintTitle: row.sprint_title,
        sprintStatus: row.sprint_status,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching sprint deliverable:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

