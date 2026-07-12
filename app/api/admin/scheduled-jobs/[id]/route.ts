import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const VALID_STATUS = ["active", "inactive", "draft"];

// PATCH /api/admin/scheduled-jobs/[id] — set status (active/inactive/draft) or
// edit a draft's fields.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const body = await request.json();
    const pool = getPool();

    const sets: string[] = [];
    const values: unknown[] = [];
    let n = 1;
    const set = (col: string, v: unknown) => { sets.push(`${col} = $${n++}`); values.push(v); };

    if (typeof body.status === "string" && VALID_STATUS.includes(body.status)) set("status", body.status);
    if (typeof body.label === "string" && body.label.trim()) set("label", body.label.trim());
    if ("description" in body) set("description", body.description ?? null);
    if ("command" in body) set("command", body.command ?? null);
    if ("cadence" in body) set("cadence", body.cadence ?? null);

    if (sets.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    set("updated_at", new Date().toISOString());
    values.push(params.id);

    const r = await pool.query(`UPDATE scheduled_jobs SET ${sets.join(", ")} WHERE id = $${n} RETURNING *`, values);
    if (r.rowCount === 0) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    return NextResponse.json({ job: r.rows[0] });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error updating scheduled job:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE — only draft jobs can be removed (the built-in ones stay).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const r = await pool.query(
      `DELETE FROM scheduled_jobs WHERE id = $1 AND job_key LIKE 'draft-%'`,
      [params.id]
    );
    if (r.rowCount === 0) return NextResponse.json({ error: "Only draft jobs can be deleted" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error deleting scheduled job:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
