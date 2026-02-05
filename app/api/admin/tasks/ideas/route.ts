import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

// GET /api/admin/tasks/ideas - List all ideas with task counts
export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();

    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        i.*,
        m.name as milestone_name,
        m.target_date as milestone_target_date,
        p.name as project_name,
        (SELECT COUNT(*) FROM admin_tasks WHERE idea_id = i.id) as task_count,
        (SELECT COUNT(*) FROM admin_tasks WHERE idea_id = i.id AND completed = true) as completed_task_count
      FROM admin_ideas i
      LEFT JOIN admin_milestones m ON i.milestone_id = m.id
      LEFT JOIN projects p ON i.project_id = p.id
      ORDER BY i.sort_order ASC, i.created_at DESC
    `);

    return NextResponse.json({ ideas: result.rows });
  } catch (error) {
    console.error("Error fetching ideas:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

// POST /api/admin/tasks/ideas - Create a new idea
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const body = await request.json();
    const { title, summary, project_id } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const pool = getPool();
    
    // Get the next sort order
    const orderResult = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM admin_ideas`
    );
    const sortOrder = orderResult.rows[0].next_order;

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO admin_ideas (id, title, summary, sort_order, project_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, title.trim(), summary?.trim() || null, sortOrder, project_id || null]
    );

    return NextResponse.json({ idea: result.rows[0] });
  } catch (error) {
    console.error("Error creating idea:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}

// PATCH /api/admin/tasks/ideas - Update an idea or reorder ideas
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const body = await request.json();
    const pool = getPool();

    // Handle batch reorder
    if (body.reorder && Array.isArray(body.reorder)) {
      const updates = body.reorder as { id: string; sort_order: number }[];
      
      for (const update of updates) {
        await pool.query(
          `UPDATE admin_ideas SET sort_order = $1, updated_at = now() WHERE id = $2`,
          [update.sort_order, update.id]
        );
      }
      
      return NextResponse.json({ success: true });
    }

    // Handle single idea update
    const { id, title, summary, milestone_id, project_id } = body;
    
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title.trim());
    }
    if (summary !== undefined) {
      updates.push(`summary = $${paramCount++}`);
      values.push(summary?.trim() || null);
    }
    if (milestone_id !== undefined) {
      updates.push(`milestone_id = $${paramCount++}`);
      values.push(milestone_id || null);
    }
    if (project_id !== undefined) {
      updates.push(`project_id = $${paramCount++}`);
      values.push(project_id || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = now()");
    values.push(id);

    const result = await pool.query(
      `UPDATE admin_ideas SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({ idea: result.rows[0] });
  } catch (error) {
    console.error("Error updating idea:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
  }
}

// DELETE /api/admin/tasks/ideas?id=xxx - Delete an idea
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
      `DELETE FROM admin_ideas WHERE id = $1 RETURNING id, title`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Idea "${result.rows[0].title}" deleted`,
    });
  } catch (error) {
    console.error("Error deleting idea:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 });
  }
}
