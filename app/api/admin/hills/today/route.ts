import { NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { todayKey } from "@/lib/dayHill";

// GET /api/admin/hills/today — every task focused for today (or now) across all
// hills, plus today's day-hill (the morning ritual container). The daily-driver
// surface for the studio owner.
export async function GET() {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const pool = getPool();

    const dayHillRes = await pool.query(
      `SELECT id, title, day_key, phase, started_at, progress
         FROM hills
        WHERE day_key = $1 AND type = 'personal' AND created_by = $2
        ORDER BY created_at LIMIT 1`,
      [todayKey(), admin.accountId]
    );

    const result = await pool.query(
      `
      SELECT t.id, t.hill_id, t.name, t.note, t.completed, t.completed_at,
             t.progress, t.focus, t.origin, t.sort_order,
             h.title AS hill_title, h.type AS hill_type, h.phase AS hill_phase
      FROM hill_tasks t
      LEFT JOIN hills h ON h.id = t.hill_id
      WHERE t.archived = false
        AND (t.focus LIKE '%today%' OR t.focus LIKE '%now%')
      ORDER BY
        (t.focus LIKE '%now%') DESC,
        t.completed,
        t.sort_order,
        t.created_at
      `
    );
    return NextResponse.json({ tasks: result.rows, dayHill: dayHillRes.rows[0] ?? null });
  } catch (error) {
    console.error("Error fetching today:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch today" }, { status: 500 });
  }
}
