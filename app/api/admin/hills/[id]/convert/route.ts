import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

// POST /api/admin/hills/[id]/convert — activate an accepted proposal hill.
//
// Path A: hills are authoritative for client work, so "converting" no longer
// mints a legacy sprint_drafts / refinement_cycles record. The hill *is* the
// engagement — accepting simply moves it out of the proposal/scope stage into
// active work (status=active, phase=climb) and stamps accepted/started. Scope,
// invoicing, agreement, and delivery all run on the hill itself.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const pool = getPool();

    const hillRes = await pool.query(`SELECT * FROM hills WHERE id = $1`, [params.id]);
    if (hillRes.rowCount === 0) return NextResponse.json({ error: "Hill not found" }, { status: 404 });
    const hill = hillRes.rows[0];

    if (hill.type !== "sprint" && hill.type !== "refinement_cycle") {
      return NextResponse.json({ error: "Only sprint or refinement hills can be activated" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const result = await pool.query(
      `UPDATE hills
          SET status = 'active',
              phase = 'climb',
              accepted_at = COALESCE(accepted_at, $2),
              started_at = COALESCE(started_at, $2),
              updated_at = now()
        WHERE id = $1
        RETURNING *`,
      [params.id, now]
    );

    await pool
      .query(
        `INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind, event_type, author_account_id, data)
         VALUES ($1, $2, 'hill', $2, 'event', 'activated', $3, $4)`,
        [crypto.randomUUID(), params.id, admin.accountId, JSON.stringify({ type: hill.type })]
      )
      .catch(() => {});

    return NextResponse.json(
      { ok: true, hill: result.rows[0], url: `/dashboard/hills/${params.id}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error activating hill:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to activate" }, { status: 500 });
  }
}
