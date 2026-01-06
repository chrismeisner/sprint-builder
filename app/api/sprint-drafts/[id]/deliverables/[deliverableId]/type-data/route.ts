import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: { id: string; deliverableId: string };
};

/**
 * PATCH /api/sprint-drafts/[id]/deliverables/[deliverableId]/type-data
 * 
 * Update a sprint deliverable's type-specific data (e.g., color palette colors, logo variations, etc.)
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
    const { typeData } = body;

    // typeData can be null (to clear), or an object
    if (typeData !== null && typeof typeData !== "object") {
      return NextResponse.json({ error: "typeData must be an object or null" }, { status: 400 });
    }

    const updateResult = await pool.query(
      `UPDATE sprint_deliverables 
       SET type_data = $1::jsonb
       WHERE id = $2
       RETURNING id, type_data`,
      [typeData ? JSON.stringify(typeData) : null, params.deliverableId]
    );

    // Also update sprint's updated_at
    await pool.query(
      `UPDATE sprint_drafts SET updated_at = NOW() WHERE id = $1`,
      [params.id]
    );

    return NextResponse.json({
      success: true,
      deliverable: {
        id: updateResult.rows[0].id,
        typeData: updateResult.rows[0].type_data,
      },
    });
  } catch (error: unknown) {
    console.error("Error updating sprint deliverable type data:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sprint-drafts/[id]/deliverables/[deliverableId]/type-data
 * 
 * Get a sprint deliverable's type-specific data
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
        spd.id,
        spd.type_data,
        d.name as global_name,
        d.slug as global_slug,
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
      id: row.id,
      typeData: row.type_data,
      deliverableName: row.global_name,
      deliverableSlug: row.global_slug,
    });
  } catch (error: unknown) {
    console.error("Error fetching sprint deliverable type data:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

