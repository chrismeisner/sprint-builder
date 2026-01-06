import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: { id: string };
};

const VALID_STATUSES = ["draft", "negotiating", "scheduled", "in_progress", "complete"];

/**
 * PATCH /api/admin/sprint-drafts/[id]/status
 * 
 * Update the status of a sprint draft
 * Admin-only endpoint
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    
    // Verify user is admin
    const currentUser = await getCurrentUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if sprint exists
    const sprintCheck = await pool.query(
      `SELECT id, status FROM sprint_drafts WHERE id = $1`,
      [params.id]
    );

    if (sprintCheck.rows.length === 0) {
      return NextResponse.json({ error: "Sprint draft not found" }, { status: 404 });
    }

    const oldStatus = sprintCheck.rows[0].status;

    // Update status
    const result = await pool.query(
      `UPDATE sprint_drafts
       SET status = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [status, params.id]
    );

    return NextResponse.json({
      success: true,
      message: `Status updated from '${oldStatus}' to '${status}'`,
      sprint: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at,
      },
    });

  } catch (error: unknown) {
    console.error("Error updating sprint status:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

