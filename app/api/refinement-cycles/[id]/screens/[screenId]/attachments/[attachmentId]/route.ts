import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: { id: string; screenId: string; attachmentId: string };
};

async function authorizeEdit(
  cycleId: string,
  user: { email: string; isAdmin?: boolean | null }
): Promise<
  { error: string; status: 401 | 403 | 404 | 409 } | { isAdmin: boolean }
> {
  const pool = getPool();
  const res = await pool.query(
    `SELECT status, submitter_email
     FROM refinement_cycles WHERE id = $1 LIMIT 1`,
    [cycleId]
  );
  if (res.rowCount === 0) {
    return { error: "Cycle not found", status: 404 };
  }
  const row = res.rows[0] as {
    status: string;
    submitter_email: string | null;
  };
  const isAdmin = Boolean(user.isAdmin);
  const isSubmitter =
    row.submitter_email != null &&
    row.submitter_email.toLowerCase() === user.email.toLowerCase();
  if (!isAdmin && !isSubmitter) {
    return {
      error: "Only the studio or the original submitter can edit scope",
      status: 403,
    };
  }
  if (row.status !== "submitted") {
    return {
      error: "Scope is locked once the cycle is accepted or declined",
      status: 409,
    };
  }
  return { isAdmin };
}

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

    const guard = await authorizeEdit(params.id, user);
    if ("error" in guard) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const pool = getPool();
    const res = await pool.query(
      `DELETE FROM refinement_cycle_screen_attachments a
       USING refinement_cycle_screens s
       WHERE a.id = $1
         AND a.screen_id = $2
         AND s.id = a.screen_id
         AND s.refinement_cycle_id = $3
       RETURNING a.id`,
      [params.attachmentId, params.screenId, params.id]
    );
    if (res.rowCount === 0) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }
    await pool.query(
      `UPDATE refinement_cycles
       SET last_edited_at = now(),
           last_edited_by = $1,
           updated_at = now()
       WHERE id = $2`,
      [user.accountId, params.id]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[RefinementCycle screen attachments DELETE]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
