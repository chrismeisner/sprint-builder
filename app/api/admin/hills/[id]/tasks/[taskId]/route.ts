import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// Canonicalize a focus string to the allowed tiers in priority order.
// The ladder is '' -> week -> today -> now (now implies it's on today's plate).
function normalizeFocus(raw: unknown): string {
  const tiers = ["now", "today", "week"] as const;
  const parts = String(raw ?? "")
    .split(",")
    .map((s) => s.trim());
  return tiers.filter((t) => parts.includes(t)).join(",");
}

// PATCH /api/admin/hills/[id]/tasks/[taskId] — toggle complete, set progress,
// rename, or accept/dismiss a suggested task. Completing snaps progress to 100.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const body = await request.json();
    const pool = getPool();

    const sets: string[] = [];
    const values: unknown[] = [];
    let n = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${n++}`);
      values.push(val);
    };

    let newFocus: string | null = null;
    if ("focus" in body) {
      newFocus = normalizeFocus(body.focus);
      set("focus", newFocus);
    }
    if (typeof body.name === "string") set("name", body.name.trim());
    if ("note" in body) set("note", body.note ?? null);
    if (typeof body.progress === "number") set("progress", Math.max(0, Math.min(100, Math.round(body.progress))));
    if (typeof body.completed === "boolean") {
      set("completed", body.completed);
      set("completed_at", body.completed ? new Date().toISOString() : null);
      if (body.completed) set("progress", 100);
    }
    if (typeof body.accepted === "boolean") {
      set("accepted_at", body.accepted ? new Date().toISOString() : null);
      if (body.accepted) set("dismissed_at", null);
    }
    if (typeof body.dismissed === "boolean") {
      set("dismissed_at", body.dismissed ? new Date().toISOString() : null);
    }

    if (sets.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    set("updated_at", new Date().toISOString());
    values.push(params.taskId, params.id);

    const result = await pool.query(
      `UPDATE hill_tasks SET ${sets.join(", ")} WHERE id = $${n++} AND hill_id = $${n} RETURNING *`,
      values
    );
    if (result.rowCount === 0) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // "Now" is a global singleton: focusing this task as `now` clears `now`
    // from every other task (their today/week tiers are preserved).
    if (newFocus && newFocus.split(",").includes("now")) {
      await pool.query(
        `UPDATE hill_tasks
           SET focus = array_to_string(array_remove(string_to_array(focus, ','), 'now'), ','),
               updated_at = now()
         WHERE id <> $1 AND focus LIKE '%now%'`,
        [params.taskId]
      );
    }

    return NextResponse.json({ task: result.rows[0] });
  } catch (error) {
    console.error("Error updating task:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE /api/admin/hills/[id]/tasks/[taskId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM hill_tasks WHERE id = $1 AND hill_id = $2`,
      [params.taskId, params.id]
    );
    if (result.rowCount === 0) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
