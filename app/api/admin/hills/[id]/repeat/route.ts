import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { computeNextRun, describeRecurrence, type Recurrence } from "@/lib/recurrence";
import crypto from "crypto";

const TZ = "America/New_York";
const VALID_FREQ = ["daily", "weekly", "monthly", "yearly"];

// GET — the recurrence (if any) that repeats this hill.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const r = await pool.query(
      `SELECT id, freq, interval, at_time, by_weekday, timezone, active, next_run_at
         FROM hill_recurrences WHERE source_hill_id = $1 AND active = true
         ORDER BY created_at LIMIT 1`,
      [params.id]
    );
    if (r.rowCount === 0) return NextResponse.json({ recurrence: null });
    const row = r.rows[0];
    return NextResponse.json({
      recurrence: { ...row, description: describeRecurrence(row as Recurrence) },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error reading recurrence:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST — start repeating this hill on a cadence.
// Body: { freq, interval?, at_time?, by_weekday?: number[] }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const pool = getPool();

    const hill = await pool.query(`SELECT id, type FROM hills WHERE id = $1`, [params.id]);
    if (hill.rowCount === 0) return NextResponse.json({ error: "Hill not found" }, { status: 404 });

    const existing = await pool.query(
      `SELECT id FROM hill_recurrences WHERE source_hill_id = $1 AND active = true`,
      [params.id]
    );
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: "This hill already repeats" }, { status: 409 });
    }

    const body = await request.json();
    const freq = VALID_FREQ.includes(body.freq) ? body.freq : "weekly";
    const interval = Math.max(1, parseInt(String(body.interval ?? 1), 10) || 1);
    const at_time = typeof body.at_time === "string" && /^\d{1,2}:\d{2}$/.test(body.at_time) ? body.at_time : "09:00";
    const by_weekday =
      Array.isArray(body.by_weekday) && body.by_weekday.length
        ? body.by_weekday.map((n: unknown) => parseInt(String(n), 10)).filter((n: number) => n >= 0 && n <= 6)
        : null;

    const rec: Recurrence = { freq, interval, at_time, by_weekday, by_monthday: null, timezone: TZ, starts_on: null, ends_on: null };
    const next = computeNextRun(rec, new Date());

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO hill_recurrences
         (id, created_by, hill_type, source_hill_id, freq, interval, at_time, by_weekday,
          timezone, active, next_run_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)`,
      [id, admin.accountId, hill.rows[0].type, params.id, freq, interval, at_time, by_weekday, TZ, next]
    );

    return NextResponse.json(
      { ok: true, recurrenceId: id, description: describeRecurrence(rec), nextRunAt: next },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error creating recurrence:", error);
    return NextResponse.json({ error: "Failed to start repeat" }, { status: 500 });
  }
}

// DELETE — stop repeating this hill.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    await pool.query(`UPDATE hill_recurrences SET active = false, updated_at = now() WHERE source_hill_id = $1`, [params.id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error stopping recurrence:", error);
    return NextResponse.json({ error: "Failed to stop" }, { status: 500 });
  }
}
