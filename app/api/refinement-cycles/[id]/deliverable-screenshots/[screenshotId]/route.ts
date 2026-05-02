import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { id: string; screenshotId: string } };

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const pool = getPool();
    const res = await pool.query(
      `DELETE FROM refinement_cycle_deliverable_screenshots
       WHERE id = $1 AND refinement_cycle_id = $2
       RETURNING id`,
      [params.screenshotId, params.id]
    );
    if (res.rowCount === 0) {
      return NextResponse.json(
        { error: "Screenshot not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ id: params.screenshotId });
  } catch (err) {
    console.error("[RefinementCycle deliverable-screenshots DELETE]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Delete failed" },
      { status: 500 }
    );
  }
}
