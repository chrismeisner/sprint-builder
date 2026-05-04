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

// Authorize a mutation against the parent cycle. Returns either an error
// payload or { isAdmin } describing the caller's role.
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

async function stampLastEdited(cycleId: string, accountId: string | null) {
  await getPool().query(
    `UPDATE refinement_cycles
     SET last_edited_at = now(),
         last_edited_by = $1,
         updated_at = now()
     WHERE id = $2`,
    [accountId, cycleId]
  );
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

    const guard = await authorizeEdit(params.id, user);
    if ("error" in guard) {
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
    // adminNote is studio-only — ignore the field for submitter edits to
    // prevent the client UI from accidentally clobbering studio annotations.
    if ("adminNote" in body && guard.isAdmin) {
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
    await stampLastEdited(params.id, user.accountId);
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

    const guard = await authorizeEdit(params.id, user);
    if ("error" in guard) {
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
    await stampLastEdited(params.id, user.accountId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[RefinementCycle screens DELETE]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to remove screen" },
      { status: 500 }
    );
  }
}
