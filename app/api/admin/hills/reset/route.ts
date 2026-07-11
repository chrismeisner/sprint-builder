import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

// POST /api/admin/hills/reset?mode=daily|weekly — resets the personal focus
// ladder on a cadence, the hills successor to the admin_tasks daily/weekly reset.
//
// Scoped to PERSONAL hills (and loose personal tasks) only — client sprint /
// refinement tasks are never touched. NON-DESTRUCTIVE: it clears focus tiers, it
// does not archive or delete anything.
//   daily  → clears now/today (keeps week): tasks return to backlog or 'week'.
//   weekly → clears all focus tiers.
//
// Auth: an admin session, OR a CRON_SECRET bearer token (for Heroku Scheduler).
export async function POST(request: NextRequest) {
  try {
    const mode = new URL(request.url).searchParams.get("mode") === "weekly" ? "weekly" : "daily";

    const auth = request.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET;
    const isCron = !!cronSecret && auth === `Bearer ${cronSecret}`;
    if (!isCron) {
      const user = await getCurrentUser().catch(() => null);
      if (!user?.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    await ensureSchema();
    const pool = getPool();

    // Only personal-scope tasks (personal hill, or floating with no hill).
    const scope = `
      t.completed = false
      AND t.focus <> ''
      AND (t.hill_id IS NULL OR EXISTS (
        SELECT 1 FROM hills h WHERE h.id = t.hill_id AND h.type = 'personal'
      ))
    `;

    const sql =
      mode === "weekly"
        ? `UPDATE hill_tasks t SET focus = '', updated_at = now() WHERE ${scope}`
        : `UPDATE hill_tasks t
             SET focus = CASE WHEN t.focus LIKE '%week%' THEN 'week' ELSE '' END,
                 updated_at = now()
           WHERE ${scope}`;

    const result = await pool.query(sql);

    // Log the reset to the unified activity stream.
    await pool
      .query(
        `INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind, event_type, data)
         VALUES ($1, NULL, 'hill', NULL, 'event', $2, $3)`,
        [crypto.randomUUID(), `${mode}_reset`, JSON.stringify({ affected: result.rowCount ?? 0 })]
      )
      .catch(() => {});

    return NextResponse.json({ ok: true, mode, affected: result.rowCount ?? 0 });
  } catch (error) {
    console.error("Error resetting hills focus:", error);
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
