import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const VALID_PHASES = ["scope", "climb", "descend"];
const VALID_SPANS = ["day", "week", "month", "quarter", "year"];

// GET /api/admin/hills/[id] — a single hill with its ideas, deliverables,
// and tasks (the full climb). Tasks are returned flat; the client nests them
// by idea_id / deliverable_id / parent_task_id.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();

    const { id } = params;
    const pool = getPool();

    const hillRes = await pool.query(
      `
      SELECT h.*, p.name AS project_name
      FROM hills h
      LEFT JOIN projects p ON p.id = h.project_id
      WHERE h.id = $1
      `,
      [id]
    );
    if (hillRes.rowCount === 0) {
      return NextResponse.json({ error: "Hill not found" }, { status: 404 });
    }

    const [ideas, deliverables, invoices, tasks] = await Promise.all([
      pool.query(
        `SELECT id, title, summary, status, project_id, sort_order
         FROM hill_ideas WHERE hill_id = $1 ORDER BY sort_order, created_at`,
        [id]
      ),
      pool.query(
        `SELECT id, name, description, notes, source, added_by, current_version,
                delivery_url, sort_order, origin, accepted_at, dismissed_at,
                price, quantity, deliverable_category, deliverable_scope
         FROM hill_deliverables WHERE hill_id = $1 ORDER BY sort_order, created_at`,
        [id]
      ),
      pool.query(
        `SELECT id, kind, label, amount, invoice_status, invoice_url, invoice_pdf_url,
                stripe_invoice_id, paid_at, payment_initiated_at, sort_order, created_at
         FROM hill_invoices WHERE hill_id = $1 ORDER BY sort_order, created_at`,
        [id]
      ),
      pool.query(
        `SELECT id, hill_id, idea_id, deliverable_id, parent_task_id, name, note,
                completed, progress, focus, origin, accepted_at, dismissed_at,
                sort_order, sub_sort_order
         FROM hill_tasks
         WHERE hill_id = $1
            OR idea_id IN (SELECT id FROM hill_ideas WHERE hill_id = $1)
            OR deliverable_id IN (SELECT id FROM hill_deliverables WHERE hill_id = $1)
         ORDER BY sort_order, sub_sort_order, created_at`,
        [id]
      ),
    ]);

    const hill = hillRes.rows[0];

    // Client-work money rollup (Path A). Scope total = Σ price×quantity over
    // deliverables; invoiced/paid derived from the hill_invoices satellite.
    const num = (v: unknown) => (v == null ? 0 : Number(v));
    const scopeTotal = deliverables.rows.reduce(
      (sum, d) => sum + num(d.price) * (Number(d.quantity) || 1),
      0
    );
    const activeInvoices = invoices.rows.filter((i) => i.invoice_status !== "voided");
    const amountInvoiced = activeInvoices.reduce((s, i) => s + num(i.amount), 0);
    const amountPaid = invoices.rows
      .filter((i) => i.invoice_status === "paid")
      .reduce((s, i) => s + num(i.amount), 0);

    return NextResponse.json({
      hill,
      ideas: ideas.rows,
      deliverables: deliverables.rows,
      invoices: invoices.rows,
      tasks: tasks.rows,
      billing: { scopeTotal, amountInvoiced, amountPaid },
    });
  } catch (error) {
    console.error("Error fetching hill:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch hill" }, { status: 500 });
  }
}

// PATCH /api/admin/hills/[id] — edit hill fields. Toggling `completed` also
// snaps progress to 100 and phase to descend (and clears on un-complete).
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const { id } = params;
    const body = await request.json();
    const pool = getPool();

    const sets: string[] = [];
    const values: unknown[] = [];
    let n = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${n++}`);
      values.push(val);
    };

    if (typeof body.title === "string") set("title", body.title.trim());
    if ("summary" in body) set("summary", body.summary ?? null);
    if (typeof body.status === "string") set("status", body.status);
    if (typeof body.phase === "string" && VALID_PHASES.includes(body.phase)) set("phase", body.phase);
    if (typeof body.progress === "number") set("progress", Math.max(0, Math.min(100, Math.round(body.progress))));
    if ("target_date" in body) set("target_date", body.target_date || null);
    if ("span_granularity" in body)
      set("span_granularity", VALID_SPANS.includes(body.span_granularity) ? body.span_granularity : null);

    if (typeof body.accepted === "boolean") {
      set("accepted_at", body.accepted ? new Date().toISOString() : null);
    }

    // "Start the climb": stamp the deliberate start and move scope → climb.
    if (typeof body.started === "boolean") {
      if (body.started) {
        set("started_at", new Date().toISOString());
        set("phase", "climb");
      } else {
        set("started_at", null);
      }
    }

    if (typeof body.completed === "boolean") {
      set("completed", body.completed);
      if (body.completed) {
        set("completed_at", new Date().toISOString());
        set("completed_by", admin.accountId);
        set("progress", 100);
        set("phase", "descend");
      } else {
        set("completed_at", null);
        set("completed_by", null);
      }
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }
    set("updated_at", new Date().toISOString());
    values.push(id);

    const result = await pool.query(
      `UPDATE hills SET ${sets.join(", ")} WHERE id = $${n} RETURNING *`,
      values
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Hill not found" }, { status: 404 });
    }
    return NextResponse.json({ hill: result.rows[0] });
  } catch (error) {
    console.error("Error updating hill:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update hill" }, { status: 500 });
  }
}

// DELETE /api/admin/hills/[id] — remove the hill. Its ideas/deliverables/tasks
// are NOT deleted; their hill_id is set null (they fall back to the loose
// backlog), matching the capture-first model.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(`DELETE FROM hills WHERE id = $1`, [params.id]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Hill not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting hill:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete hill" }, { status: 500 });
  }
}
