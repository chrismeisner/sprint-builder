import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

// Helper function to log task events
async function logTaskEvent(
  taskId: string,
  ideaId: string | null,
  eventType: string,
  eventData?: Record<string, unknown>
) {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO admin_task_events (id, task_id, idea_id, event_type, event_data) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        crypto.randomUUID(),
        taskId,
        ideaId,
        eventType,
        eventData ? JSON.stringify(eventData) : null,
      ]
    );
  } catch (err) {
    // Log error but don't fail the main operation
    console.error("Failed to log task event:", err);
  }
}

// GET /api/admin/tasks/tasks - List tasks with optional filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get("ideaId");
    const focus = searchParams.get("focus");
    const includeCompleted = searchParams.get("includeCompleted") !== "false";

    const pool = getPool();
    
    let query = `
      SELECT 
        t.*,
        i.title as idea_title,
        m.name as milestone_name,
        m.target_date as milestone_target_date
      FROM admin_tasks t
      LEFT JOIN admin_ideas i ON t.idea_id = i.id
      LEFT JOIN admin_milestones m ON t.milestone_id = m.id
      WHERE 1=1
    `;
    const values: (string | boolean)[] = [];
    let paramCount = 1;

    if (ideaId) {
      query += ` AND t.idea_id = $${paramCount++}`;
      values.push(ideaId);
    }

    if (focus) {
      query += ` AND t.focus = $${paramCount++}`;
      values.push(focus);
    }

    if (!includeCompleted) {
      query += ` AND t.completed = false`;
    }

    query += ` ORDER BY t.completed ASC, t.sort_order ASC, t.sub_sort_order ASC, t.created_at DESC`;

    const result = await pool.query(query, values);

    // Ensure attachments is always an array (handle null/undefined)
    const tasks = result.rows.map((task) => ({
      ...task,
      attachments: task.attachments || [],
    }));

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/admin/tasks/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const body = await request.json();
    const { name, note, idea_id, parent_task_id, milestone_id, focus, position } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const pool = getPool();
    
    // Calculate sort order based on position preference
    let sortOrder = 0;
    let subSortOrder = 0;

    if (parent_task_id) {
      // Subtask - use sub_sort_order
      const orderResult = await pool.query(
        `SELECT COALESCE(MAX(sub_sort_order), 0) + 1 as next_order 
         FROM admin_tasks WHERE parent_task_id = $1`,
        [parent_task_id]
      );
      subSortOrder = orderResult.rows[0].next_order;
    } else if (idea_id) {
      // Top-level task in an idea
      if (position === "top") {
        // Shift existing tasks down
        await pool.query(
          `UPDATE admin_tasks SET sort_order = sort_order + 1 
           WHERE idea_id = $1 AND parent_task_id IS NULL AND completed = false`,
          [idea_id]
        );
        sortOrder = 1;
      } else {
        const orderResult = await pool.query(
          `SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order 
           FROM admin_tasks WHERE idea_id = $1 AND parent_task_id IS NULL`,
          [idea_id]
        );
        sortOrder = orderResult.rows[0].next_order;
      }
    }

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO admin_tasks (id, name, note, idea_id, parent_task_id, milestone_id, focus, sort_order, sub_sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        name.trim(),
        note?.trim() || null,
        idea_id || null,
        parent_task_id || null,
        milestone_id || null,
        focus || "",
        sortOrder,
        subSortOrder,
      ]
    );

    // Log task creation event
    await logTaskEvent(id, idea_id || null, "created", {
      name: name.trim(),
      parent_task_id: parent_task_id || null,
    });

    return NextResponse.json({ task: result.rows[0] });
  } catch (error) {
    console.error("Error creating task:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

// PATCH /api/admin/tasks/tasks - Update a task or reorder tasks
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const body = await request.json();
    const pool = getPool();

    // Handle batch reorder
    if (body.reorder && Array.isArray(body.reorder)) {
      const updates = body.reorder as { id: string; sort_order?: number; sub_sort_order?: number }[];
      
      for (const update of updates) {
        if (update.sub_sort_order !== undefined) {
          await pool.query(
            `UPDATE admin_tasks SET sub_sort_order = $1, updated_at = now() WHERE id = $2`,
            [update.sub_sort_order, update.id]
          );
        } else if (update.sort_order !== undefined) {
          await pool.query(
            `UPDATE admin_tasks SET sort_order = $1, updated_at = now() WHERE id = $2`,
            [update.sort_order, update.id]
          );
        }
      }
      
      return NextResponse.json({ success: true });
    }

    // Handle single task update
    const { id, name, note, completed, focus, milestone_id } = body;
    
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Get current task state for event logging
    const currentTaskResult = await pool.query(
      `SELECT id, idea_id, name, note, completed, focus, milestone_id FROM admin_tasks WHERE id = $1`,
      [id]
    );
    const currentTask = currentTaskResult.rows[0];
    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }
    if (note !== undefined) {
      updates.push(`note = $${paramCount++}`);
      values.push(note?.trim() || null);
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(completed);
      updates.push(`completed_at = $${paramCount++}`);
      values.push(completed ? new Date().toISOString() : null);
      
      // If completing a task that's "in focus", clear the focus
      if (completed && currentTask.focus === "now") {
        updates.push(`focus = $${paramCount++}`);
        values.push("");
      }
    }
    if (focus !== undefined) {
      // If setting focus to "now", clear any other task's "now" focus first
      if (focus === "now") {
        await pool.query(`UPDATE admin_tasks SET focus = '' WHERE focus = 'now'`);
      }
      updates.push(`focus = $${paramCount++}`);
      values.push(focus);
    }
    if (milestone_id !== undefined) {
      updates.push(`milestone_id = $${paramCount++}`);
      values.push(milestone_id || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push("updated_at = now()");
    values.push(id);

    const result = await pool.query(
      `UPDATE admin_tasks SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updatedTask = result.rows[0];

    // Log events based on what changed
    // Completed status changed
    if (completed !== undefined && completed !== currentTask.completed) {
      if (completed) {
        await logTaskEvent(id, currentTask.idea_id, "completed", {
          name: updatedTask.name,
        });
      } else {
        await logTaskEvent(id, currentTask.idea_id, "uncompleted", {
          name: updatedTask.name,
        });
      }
    }

    // Focus changed
    if (focus !== undefined && focus !== currentTask.focus) {
      if (focus === "now") {
        await logTaskEvent(id, currentTask.idea_id, "focused", {
          name: updatedTask.name,
          previous_focus: currentTask.focus,
        });
      } else if (currentTask.focus === "now") {
        await logTaskEvent(id, currentTask.idea_id, "unfocused", {
          name: updatedTask.name,
          new_focus: focus,
        });
      }
      if (focus === "today" && currentTask.focus !== "today") {
        await logTaskEvent(id, currentTask.idea_id, "added_to_today", {
          name: updatedTask.name,
        });
      } else if (currentTask.focus === "today" && focus !== "today") {
        await logTaskEvent(id, currentTask.idea_id, "removed_from_today", {
          name: updatedTask.name,
        });
      }
    }

    // Note changed
    if (note !== undefined && note !== currentTask.note) {
      await logTaskEvent(id, currentTask.idea_id, "note_updated", {
        name: updatedTask.name,
        had_note: !!currentTask.note,
        has_note: !!note,
      });
    }

    // Milestone changed
    if (milestone_id !== undefined && milestone_id !== currentTask.milestone_id) {
      await logTaskEvent(id, currentTask.idea_id, "milestone_changed", {
        name: updatedTask.name,
        previous_milestone_id: currentTask.milestone_id,
        new_milestone_id: milestone_id,
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/admin/tasks/tasks?id=xxx - Delete a task
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
    
    // Get task info before deleting for event logging
    const taskResult = await pool.query(
      `SELECT id, idea_id, name FROM admin_tasks WHERE id = $1`,
      [id]
    );
    const taskToDelete = taskResult.rows[0];
    
    if (!taskToDelete) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Log deletion event before deleting (since we have ON DELETE CASCADE)
    // We'll log with task_id as null but include task info in event_data
    await pool.query(
      `INSERT INTO admin_task_events (id, task_id, idea_id, event_type, event_data) 
       VALUES ($1, NULL, $2, 'deleted', $3)`,
      [
        crypto.randomUUID(),
        taskToDelete.idea_id,
        JSON.stringify({ task_id: id, name: taskToDelete.name }),
      ]
    );
    
    const result = await pool.query(
      `DELETE FROM admin_tasks WHERE id = $1 RETURNING id, name`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Task "${result.rows[0].name}" deleted`,
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
