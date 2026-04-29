import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { id: string; screenId: string } };

const MAX_TEXT = 5000;

function clipText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_TEXT) : null;
}

async function assertEditable(cycleId: string) {
  const pool = getPool();
  const res = await pool.query(
    `SELECT status FROM refinement_cycles WHERE id = $1 LIMIT 1`,
    [cycleId]
  );
  if (res.rowCount === 0) {
    return { error: "Cycle not found", status: 404 as const };
  }
  if (res.rows[0].status !== "submitted") {
    return {
      error: "Scope is locked once the cycle is accepted or declined",
      status: 409 as const,
    };
  }
  return null;
}

export async function PATCH(request: Request, { params }: Params) {
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

    const guard = await assertEditable(params.id);
    if (guard) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: unknown;
      notes?: unknown;
      adminNote?: unknown;
    };

    const sets: string[] = [];
    const vals: unknown[] = [];
    let pidx = 1;
    if ("name" in body) {
      sets.push(`name = $${pidx++}`);
      vals.push(clipText(body.name));
    }
    if ("notes" in body) {
      sets.push(`notes = $${pidx++}`);
      vals.push(clipText(body.notes));
    }
    if ("adminNote" in body) {
      sets.push(`admin_note = $${pidx++}`);
      vals.push(clipText(body.adminNote));
    }
    if (sets.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    sets.push(`updated_at = now()`);
    vals.push(params.screenId, params.id);

    const pool = getPool();
    const res = await pool.query(
      `UPDATE refinement_cycle_screens
       SET ${sets.join(", ")}
       WHERE id = $${pidx++} AND refinement_cycle_id = $${pidx}
       RETURNING id`,
      vals
    );
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[RefinementCycle screens PATCH]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to update screen" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
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

    const guard = await assertEditable(params.id);
    if (guard) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const pool = getPool();
    const res = await pool.query(
      `DELETE FROM refinement_cycle_screens
       WHERE id = $1 AND refinement_cycle_id = $2
       RETURNING id`,
      [params.screenId, params.id]
    );
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Screen not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[RefinementCycle screens DELETE]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to remove screen" },
      { status: 500 }
    );
  }
}
