import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import crypto from "crypto";

// POST /api/scope — the public scoping front door.
//
// A submission lands as a `documents` row (the submitter's raw answers + email)
// plus a project-less `sprint_drafts` row pointing at it, which is exactly the
// shape /dashboard/sprint-drafts already renders — it LEFT JOINs documents for
// the submitter email. The studio triages from there: assign a project, then
// build the sprint or open a refinement cycle.
//
// Refinement requests come through here too. refinement_cycles.project_id is
// NOT NULL, so an anonymous submitter can't create one directly; the requested
// type rides in draft.requestedType for the studio to act on once a project
// exists.
//
// Intentionally unauthenticated (it's the public funnel), so all input is
// capped and sanitized here. This does not touch Stripe or invoices.

const MAX_ITEMS = 50;
const MAX_LEN = 500;
const MAX_EMAIL = 320;

// Rough timeline → sprint length. sprint_drafts.weeks is NOT NULL DEFAULT 2.
const WEEKS_BY_SPAN: Record<string, number> = {
  day: 1,
  week: 1,
  month: 4,
  quarter: 12,
  year: 12,
};

function cleanLines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((s) => (typeof s === "string" ? s.trim().slice(0, MAX_LEN) : ""))
    .filter(Boolean)
    .slice(0, MAX_ITEMS);
}

export async function POST(request: NextRequest) {
  try {
    await ensureSchema();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim().slice(0, MAX_LEN) : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Attribute to the account if the submitter happens to be signed in.
    const user = await getCurrentUser().catch(() => null);
    const email =
      (typeof body.email === "string" ? body.email.trim().slice(0, MAX_EMAIL) : "") ||
      user?.email ||
      "";
    if (!email) {
      return NextResponse.json(
        { error: "An email is required so we can follow up" },
        { status: 400 }
      );
    }

    const requestedType = body.type === "refinement_cycle" ? "refinement_cycle" : "sprint";
    const span = typeof body.span_granularity === "string" ? body.span_granularity : "";
    const weeks = WEEKS_BY_SPAN[span] ?? 2;
    const summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 5000) : "";
    const deliverables = cleanLines(body.deliverables);
    const tasks = cleanLines(body.tasks);

    const documentId = crypto.randomUUID();
    const draftId = crypto.randomUUID();

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO documents (id, filename, email, content)
         VALUES ($1, 'scope-intake', $2, $3::jsonb)`,
        [
          documentId,
          email,
          JSON.stringify({
            source: "scope",
            title,
            requestedType,
            span: span || null,
            summary: summary || null,
            deliverables,
            tasks,
            email,
          }),
        ]
      );

      await client.query(
        `INSERT INTO sprint_drafts
           (id, document_id, draft, status, title, weeks, deliverable_count, updated_at)
         VALUES ($1, $2, $3::jsonb, 'draft', $4, $5, $6, now())`,
        [
          draftId,
          documentId,
          JSON.stringify({
            sprintTitle: title,
            source: "scope",
            requestedType,
            summary: summary || null,
            proposedDeliverables: deliverables,
            openQuestions: tasks,
          }),
          title,
          weeks,
          deliverables.length,
        ]
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    return NextResponse.json(
      {
        ok: true,
        sprintDraftId: draftId,
        suggested: { deliverables: deliverables.length, tasks: tasks.length },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in scope intake:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
