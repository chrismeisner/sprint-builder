import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { computeNextRun, type Recurrence } from "@/lib/recurrence";
import { recordJobRun } from "@/lib/scheduledJobs";
import type { Pool } from "pg";
import crypto from "crypto";

// POST /api/cron/spawn-recurrences — instantiate every recurrence whose
// next_run_at is due, by deep-cloning its source hill (structure copied, all
// completion/focus reset to fresh), then reschedule. Auth: CRON_SECRET bearer
// (Heroku Scheduler) or an admin session. Personal-side; no revenue code.
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET;
    const isCron = !!cronSecret && auth === `Bearer ${cronSecret}`;
    if (!isCron) {
      const { getCurrentUser } = await import("@/lib/auth");
      const user = await getCurrentUser().catch(() => null);
      if (!user?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await ensureSchema();
    const pool = getPool();
    const due = await pool.query(
      `SELECT * FROM hill_recurrences
        WHERE active = true AND next_run_at IS NOT NULL AND next_run_at <= now()`
    );

    const spawned: { recurrenceId: string; hillId: string | null }[] = [];
    for (const rec of due.rows) {
      let hillId: string | null = null;
      try {
        hillId = rec.source_hill_id ? await cloneHill(pool, rec.source_hill_id, rec.id) : null;
      } catch (e) {
        console.error("spawn clone failed for recurrence", rec.id, e);
      }
      // Reschedule from now so a backlog of missed runs collapses to one next run.
      const next = computeNextRun(rec as Recurrence, new Date());
      await pool.query(
        `UPDATE hill_recurrences SET last_run_at = now(), next_run_at = $2, updated_at = now() WHERE id = $1`,
        [rec.id, next]
      );
      spawned.push({ recurrenceId: rec.id, hillId });
    }

    await recordJobRun("spawn-recurrences", "ok", `${due.rowCount ?? 0} due, ${spawned.filter((s) => s.hillId).length} spawned`);
    return NextResponse.json({ ok: true, due: due.rowCount ?? 0, spawned });
  } catch (error) {
    console.error("Error spawning recurrences:", error);
    return NextResponse.json({ error: "Failed to spawn" }, { status: 500 });
  }
}

// Deep-clone a hill's structure into a fresh hill (scope phase, everything
// incomplete/unfocused), preserving idea/deliverable/subtask relationships.
async function cloneHill(pool: Pool, sourceId: string, recurrenceId: string): Promise<string | null> {
  const src = (await pool.query(`SELECT * FROM hills WHERE id = $1`, [sourceId])).rows[0];
  if (!src) return null;

  const newHillId = crypto.randomUUID();
  const status = src.type === "sprint" ? "draft" : src.type === "refinement_cycle" ? "submitted" : "active";
  await pool.query(
    `INSERT INTO hills (id, type, title, summary, status, phase, progress, project_id,
        span_granularity, origin, created_by, recurrence_id, spawned_from_hill_id)
     VALUES ($1, $2, $3, $4, $5, 'scope', 0, $6, $7, 'recurring', $8, $9, $10)`,
    [newHillId, src.type, src.title, src.summary, status, src.project_id, src.span_granularity, src.created_by, recurrenceId, sourceId]
  );

  const ideaMap = new Map<string, string>();
  for (const idea of (await pool.query(`SELECT * FROM hill_ideas WHERE hill_id = $1 ORDER BY sort_order`, [sourceId])).rows) {
    const nid = crypto.randomUUID();
    ideaMap.set(idea.id, nid);
    await pool.query(
      `INSERT INTO hill_ideas (id, hill_id, title, summary, status, sort_order) VALUES ($1, $2, $3, $4, 'active', $5)`,
      [nid, newHillId, idea.title, idea.summary, idea.sort_order]
    );
  }

  const delivMap = new Map<string, string>();
  for (const d of (await pool.query(`SELECT * FROM hill_deliverables WHERE hill_id = $1 AND dismissed_at IS NULL ORDER BY sort_order`, [sourceId])).rows) {
    const nid = crypto.randomUUID();
    delivMap.set(d.id, nid);
    await pool.query(
      `INSERT INTO hill_deliverables (id, hill_id, name, description, notes, source, origin, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, 'recurring', $7)`,
      [nid, newHillId, d.name, d.description, d.notes, d.source, d.sort_order]
    );
  }

  // Tasks: two passes so subtask parent links resolve.
  const taskMap = new Map<string, string>();
  const srcTasks = (await pool.query(`SELECT * FROM hill_tasks WHERE hill_id = $1 AND archived = false AND dismissed_at IS NULL ORDER BY sort_order, sub_sort_order`, [sourceId])).rows;
  for (const t of srcTasks) {
    const nid = crypto.randomUUID();
    taskMap.set(t.id, nid);
    await pool.query(
      `INSERT INTO hill_tasks (id, hill_id, idea_id, deliverable_id, name, note, completed,
          progress, focus, origin, sort_order, sub_sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, false, 0, '', 'recurring', $7, $8)`,
      [nid, newHillId, t.idea_id ? ideaMap.get(t.idea_id) ?? null : null, t.deliverable_id ? delivMap.get(t.deliverable_id) ?? null : null, t.name, t.note, t.sort_order, t.sub_sort_order]
    );
  }
  for (const t of srcTasks) {
    if (t.parent_task_id && taskMap.has(t.parent_task_id)) {
      await pool.query(`UPDATE hill_tasks SET parent_task_id = $1 WHERE id = $2`, [taskMap.get(t.parent_task_id), taskMap.get(t.id)]);
    }
  }

  await pool
    .query(
      `INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind, event_type, data)
       VALUES ($1, $2, 'hill', $2, 'event', 'spawned', $3)`,
      [crypto.randomUUID(), newHillId, JSON.stringify({ recurrenceId, from: sourceId })]
    )
    .catch(() => {});

  return newHillId;
}
