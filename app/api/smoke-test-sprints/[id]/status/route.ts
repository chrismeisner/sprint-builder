import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { id: string } };

const ALLOWED_STATUSES = new Set([
  "draft",
  "scheduled",
  "in_progress",
  "complete",
  "archived",
]);

export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { status?: unknown };
    const status = typeof body.status === "string" ? body.status : "";
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const res = await pool.query(
      `UPDATE smoke_test_sprints
       SET status = $1, updated_by = $2, updated_at = now()
       WHERE id = $3
       RETURNING id, status`,
      [status, user.accountId ?? null, params.id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: res.rows[0].status });
  } catch (err) {
    console.error("[SmokeTestSprintsAPI] status PATCH error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to update status" },
      { status: 500 }
    );
  }
}
