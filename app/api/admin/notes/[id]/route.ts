import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const VALID_SUBJECTS = ["hill", "idea", "deliverable", "task", "project"];

// PATCH /api/admin/notes/[id] — edit the text, or MOVE the note.
// Body: { body? } and/or { subjectType, subjectId } (null subjectType => inbox).
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const body = await request.json();
    const pool = getPool();

    const sets: string[] = [];
    const values: unknown[] = [];
    let n = 1;

    if (typeof body.body === "string") {
      if (!body.body.trim()) return NextResponse.json({ error: "Note text is required" }, { status: 400 });
      sets.push(`body = $${n++}`);
      values.push(body.body.trim());
    }
    // Move: subjectType present (may be null to send back to inbox).
    if ("subjectType" in body) {
      const st = VALID_SUBJECTS.includes(body.subjectType) ? body.subjectType : null;
      sets.push(`subject_type = $${n++}`);
      values.push(st);
      sets.push(`subject_id = $${n++}`);
      values.push(st ? (typeof body.subjectId === "string" ? body.subjectId : null) : null);
    }

    if (sets.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    sets.push(`updated_at = now()`);
    values.push(params.id, admin.accountId);

    const r = await pool.query(
      `UPDATE notes SET ${sets.join(", ")}
        WHERE id = $${n++} AND author_account_id = $${n}
        RETURNING id, body, subject_type, subject_id, created_at, updated_at`,
      values
    );
    if (r.rowCount === 0) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json({ note: r.rows[0] });
  } catch (error) {
    console.error("Error updating note:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// DELETE /api/admin/notes/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const r = await pool.query(`DELETE FROM notes WHERE id = $1 AND author_account_id = $2`, [params.id, admin.accountId]);
    if (r.rowCount === 0) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
