import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

// GET /api/admin/tasks/milestones - List all milestones with task counts
export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();

    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        m.*,
        (SELECT COUNT(*) FROM admin_tasks WHERE milestone_id = m.id) as task_count,
        (SELECT COUNT(*) FROM admin_tasks WHERE milestone_id = m.id AND completed = true) as completed_task_count
      FROM admin_milestones m
      ORDER BY m.target_date ASC NULLS LAST, m.sort_order ASC, m.created_at DESC
    `);

    return NextResponse.json({ milestones: result.rows });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch milestones" }, { status: 500 });
  }
}

// POST /api/admin/tasks/milestones - Create a new milestone
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const body = await request.json();
    const { name, target_date, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const pool = getPool();
    
    // Get the next sort order
    const orderResult = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM admin_milestones`
    );
    const sortOrder = orderResult.rows[0].next_order;

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO admin_milestones (id, name, target_date, notes, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, name.trim(), target_date || null, notes?.trim() || null, sortOrder]
    );

    return NextResponse.json({ milestone: result.rows[0] });
  } catch (error) {
    console.error("Error creating milestone:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create milestone" }, { status: 500 });
  }
}

// PATCH /api/admin/tasks/milestones - Update a milestone
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const body = await request.json();
    const { id, name, target_date, notes, completed } = body;
    
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const pool = getPool();
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }
    if (target_date !== undefined) {
      updates.push(`target_date = $${paramCount++}`);
      values.push(target_date || null);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes?.trim() || null);
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(completed);
      updates.push(`completed_at = $${paramCount++}`);
      values.push(completed ? new Date().toISOString() : null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = now()");
    values.push(id);

    const result = await pool.query(
      `UPDATE admin_milestones SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    return NextResponse.json({ milestone: result.rows[0] });
  } catch (error) {
    console.error("Error updating milestone:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update milestone" }, { status: 500 });
  }
}

// DELETE /api/admin/tasks/milestones?id=xxx - Delete a milestone
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM admin_milestones WHERE id = $1 RETURNING id, name`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Milestone "${result.rows[0].name}" deleted`,
    });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete milestone" }, { status: 500 });
  }
}
