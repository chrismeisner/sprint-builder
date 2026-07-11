import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/hills/events — the unified activity feed across all hills.
// Paginated (?limit=&offset=), optional ?kind= filter. Reads hill_events, the
// stream that replaced admin_task_events + changelog + daily_updates + comments
// + refinement notes.
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
    const kind = searchParams.get("kind");

    const pool = getPool();
    const result = await pool.query(
      `
      SELECT e.id, e.hill_id, e.subject_type, e.kind, e.event_type, e.body,
             e.author_email, e.data, e.created_at,
             h.title AS hill_title, h.type AS hill_type,
             a.name AS author_name, a.email AS author_account_email
      FROM hill_events e
      LEFT JOIN hills h ON h.id = e.hill_id
      LEFT JOIN accounts a ON a.id = e.author_account_id
      WHERE ($1::text IS NULL OR e.kind = $1)
      ORDER BY e.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [kind, limit, offset]
    );

    const totalRes = await pool.query(
      `SELECT count(*)::int AS c FROM hill_events e WHERE ($1::text IS NULL OR e.kind = $1)`,
      [kind]
    );

    return NextResponse.json({
      events: result.rows,
      total: totalRes.rows[0].c,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching hill events:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
