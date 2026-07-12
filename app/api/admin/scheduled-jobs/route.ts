import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

// GET /api/admin/scheduled-jobs — the registry. Each row carries last_run_at
// (stamped by the cron endpoints), so the page can show whether a job is really
// firing — not just how Heroku Scheduler is configured (which the app can't read).
export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const rows = (
      await pool.query(
        `SELECT id, job_key, label, description, command, endpoint, cadence,
                expected_interval_minutes, status, last_run_at, last_run_status,
                last_run_note, sort_order
           FROM scheduled_jobs ORDER BY sort_order, label`
      )
    ).rows;
    return NextResponse.json({ jobs: rows });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error listing scheduled jobs:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST /api/admin/scheduled-jobs — add a draft (a job you're planning).
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    const body = await request.json();
    const label = (body.label ?? "").toString().trim();
    if (!label) return NextResponse.json({ error: "Label is required" }, { status: 400 });

    const id = crypto.randomUUID();
    const jobKey = "draft-" + id.slice(0, 8);
    const pool = getPool();
    const r = await pool.query(
      `INSERT INTO scheduled_jobs (id, job_key, label, description, command, endpoint, cadence, status, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', 100)
       RETURNING *`,
      [id, jobKey, label, body.description ?? null, body.command ?? null, body.endpoint ?? null, body.cadence ?? null]
    );
    return NextResponse.json({ job: r.rows[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error creating scheduled job:", error);
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}
