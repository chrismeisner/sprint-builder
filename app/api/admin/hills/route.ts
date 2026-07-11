import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

// Default status per hill type (each type keeps its own vocabulary).
const DEFAULT_STATUS: Record<string, string> = {
  personal: "active",
  sprint: "draft",
  refinement_cycle: "submitted",
};
const VALID_TYPES = ["personal", "sprint", "refinement_cycle"];
const VALID_PHASES = ["scope", "climb", "descend"];
const VALID_SPANS = ["day", "week", "month", "quarter", "year"];

// GET /api/admin/hills — list hills with rollup counts.
// Optional filters: ?type=personal|sprint|refinement_cycle  ?phase=scope|climb|descend
// Reads the unified hill_* tables (see docs/hill-model.md).
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const phase = searchParams.get("phase");

    const pool = getPool();
    const result = await pool.query(
      `
      SELECT
        h.id, h.type, h.title, h.summary, h.status, h.phase, h.progress,
        h.project_id, h.span_granularity, h.start_date, h.target_date,
        h.completed, h.completed_at, h.recurrence_id, h.origin, h.accepted_at,
        h.submitter_email, h.created_at, h.updated_at,
        p.name AS project_name,
        (SELECT count(*)::int FROM hill_ideas i WHERE i.hill_id = h.id) AS idea_count,
        (SELECT count(*)::int FROM hill_deliverables d WHERE d.hill_id = h.id) AS deliverable_count,
        (SELECT count(*)::int FROM hill_tasks t WHERE t.hill_id = h.id) AS task_count,
        (SELECT count(*)::int FROM hill_tasks t WHERE t.hill_id = h.id AND t.completed) AS task_done
      FROM hills h
      LEFT JOIN projects p ON p.id = h.project_id
      WHERE ($1::text IS NULL OR h.type = $1)
        AND ($2::text IS NULL OR h.phase = $2)
      ORDER BY
        CASE h.phase WHEN 'scope' THEN 0 WHEN 'climb' THEN 1 WHEN 'descend' THEN 2 ELSE 3 END,
        h.completed,
        h.target_date ASC NULLS LAST,
        h.created_at DESC
      `,
      [type, phase]
    );

    return NextResponse.json({ hills: result.rows });
  } catch (error) {
    console.error("Error fetching hills:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch hills" }, { status: 500 });
  }
}

// POST /api/admin/hills — create a new hill (start a climb).
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();

    const body = await request.json();
    const type = VALID_TYPES.includes(body.type) ? body.type : "personal";
    const title = (body.title ?? "").toString().trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const phase = VALID_PHASES.includes(body.phase) ? body.phase : "scope";
    const status = typeof body.status === "string" && body.status ? body.status : DEFAULT_STATUS[type];
    const span = VALID_SPANS.includes(body.span_granularity) ? body.span_granularity : null;

    const id = crypto.randomUUID();
    const pool = getPool();
    const result = await pool.query(
      `
      INSERT INTO hills (id, type, title, summary, status, phase, progress,
        span_granularity, target_date, project_id, origin, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $9, 'manual', $10)
      RETURNING *
      `,
      [
        id,
        type,
        title,
        body.summary ?? null,
        status,
        phase,
        span,
        body.target_date || null,
        body.project_id || null,
        admin.accountId,
      ]
    );

    // Best-effort activity log.
    pool
      .query(
        `INSERT INTO hill_events (id, hill_id, subject_type, subject_id, kind, event_type, author_account_id)
         VALUES ($1, $2, 'hill', $2, 'event', 'created', $3)`,
        [crypto.randomUUID(), id, admin.accountId]
      )
      .catch(() => {});

    return NextResponse.json({ hill: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating hill:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create hill" }, { status: 500 });
  }
}
