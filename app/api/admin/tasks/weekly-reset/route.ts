import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import crypto from "crypto";

// POST /api/admin/tasks/weekly-reset
// Full weekly clean slate — archives ALL open tasks including "week" focus tasks.
// Runs Saturday at 8:00 AM UTC (3:00 AM EST) via Heroku Scheduler.
// Protected by CRON_SECRET — called via scripts/weekly-reset.js.
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

    // Fetch ALL open, non-archived tasks (including week tasks)
    const tasksToArchive = await pool.query(
      `SELECT id, idea_id, name FROM admin_tasks WHERE completed = false AND archived = false`
    );

    if ((tasksToArchive.rowCount ?? 0) === 0) {
      return NextResponse.json({ success: true, archived: 0, message: "No open tasks to archive" });
    }

    // Archive everything and clear all focus flags
    await pool.query(
      `UPDATE admin_tasks
       SET archived = true, archived_at = now(), focus = '', updated_at = now()
       WHERE completed = false AND archived = false`
    );

    // Log the weekly_reset event
    const taskIds = tasksToArchive.rows.map((t: { id: string }) => t.id);
    await pool.query(
      `INSERT INTO admin_task_events (id, task_id, idea_id, event_type, event_data)
       VALUES ($1, NULL, NULL, 'weekly_reset', $2)`,
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
      message: `Weekly reset complete — ${tasksToArchive.rowCount} task(s) archived`,
    });
  } catch (error) {
    console.error("Error running weekly reset:", error);
    return NextResponse.json({ error: "Weekly reset failed" }, { status: 500 });
  }
}
