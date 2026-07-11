import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/hills/[id]/deliverables/[deliverableId]
// Rename, edit notes, or accept/dismiss a suggested deliverable.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; deliverableId: string } }
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

    if (typeof body.name === "string") set("name", body.name.trim());
    if ("notes" in body) set("notes", body.notes ?? null);
    if ("delivery_url" in body) set("delivery_url", body.delivery_url ?? null);
    if (typeof body.accepted === "boolean") {
      set("accepted_at", body.accepted ? new Date().toISOString() : null);
      if (body.accepted) set("dismissed_at", null);
    }
    if (typeof body.dismissed === "boolean") {
      set("dismissed_at", body.dismissed ? new Date().toISOString() : null);
    }

    if (sets.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    set("updated_at", new Date().toISOString());
    values.push(params.deliverableId, params.id);

    const result = await pool.query(
      `UPDATE hill_deliverables SET ${sets.join(", ")} WHERE id = $${n++} AND hill_id = $${n} RETURNING *`,
      values
    );
    if (result.rowCount === 0) return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    return NextResponse.json({ deliverable: result.rows[0] });
  } catch (error) {
    console.error("Error updating deliverable:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update deliverable" }, { status: 500 });
  }
}

// DELETE /api/admin/hills/[id]/deliverables/[deliverableId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; deliverableId: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM hill_deliverables WHERE id = $1 AND hill_id = $2`,
      [params.deliverableId, params.id]
    );
    if (result.rowCount === 0) return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting deliverable:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete deliverable" }, { status: 500 });
  }
}
