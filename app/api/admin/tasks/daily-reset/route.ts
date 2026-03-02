import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import crypto from "crypto";

// POST /api/admin/tasks/daily-reset
// Archives all open (non-completed, non-archived) tasks and clears their focus.
// Protected by CRON_SECRET — called by Heroku Scheduler via scripts/daily-reset.js.
export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const pool = getPool();

    // Archive open tasks that do NOT have "week" focus — week tasks survive the nightly reset
    const tasksToArchive = await pool.query(
      `SELECT id, idea_id, name FROM admin_tasks
       WHERE completed = false AND archived = false AND focus NOT LIKE '%week%'`
    );

    // For week tasks: strip "today" and "now" from their focus so they reset to just "week"
    await pool.query(
      `UPDATE admin_tasks
       SET focus = 'week', updated_at = now()
       WHERE completed = false AND archived = false AND focus LIKE '%week%' AND focus != 'week'`
    );

    if ((tasksToArchive.rowCount ?? 0) === 0) {
      return NextResponse.json({ success: true, archived: 0, message: "No open tasks to archive (week tasks preserved)" });
    }

    // Archive non-week open tasks and clear their focus
    await pool.query(
      `UPDATE admin_tasks
       SET archived = true, archived_at = now(), focus = '', updated_at = now()
       WHERE completed = false AND archived = false AND focus NOT LIKE '%week%'`
    );

    // Log the daily_reset event
    const taskIds = tasksToArchive.rows.map((t: { id: string }) => t.id);
    await pool.query(
      `INSERT INTO admin_task_events (id, task_id, idea_id, event_type, event_data)
       VALUES ($1, NULL, NULL, 'daily_reset', $2)`,
      [
        crypto.randomUUID(),
        JSON.stringify({
          archived_count: tasksToArchive.rowCount,
          task_ids: taskIds,
          reset_at: new Date().toISOString(),
        }),
      ]
    );

    return NextResponse.json({
      success: true,
      archived: tasksToArchive.rowCount,
      message: `Daily reset complete — ${tasksToArchive.rowCount} task(s) archived (week tasks preserved)`,
    });
  } catch (error) {
    console.error("Error running daily reset:", error);
    return NextResponse.json({ error: "Daily reset failed" }, { status: 500 });
  }
}
