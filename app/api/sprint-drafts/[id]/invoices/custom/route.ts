import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

type Params = { params: { id: string } };

/**
 * POST /api/sprint-drafts/[id]/invoices/custom
 *
 * Creates a single ad-hoc invoice for a sprint with a custom label and amount.
 * Admin only.
 */
export async function POST(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const body = await request.json().catch(() => ({})) as {
      label?: string;
      amount?: number;
    };

    const label = typeof body.label === "string" ? body.label.trim() : "";
    const amount = typeof body.amount === "number" && Number.isFinite(body.amount) ? body.amount : 0;

    if (!label) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }

    // Verify the sprint exists
    const sprintRes = await pool.query(`SELECT id FROM sprint_drafts WHERE id = $1`, [params.id]);
    if ((sprintRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    // Determine next sort_order
    const maxRes = await pool.query(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM sprint_invoices WHERE sprint_id = $1`,
      [params.id]
    );
    const nextOrder = (maxRes.rows[0] as { next_order: number }).next_order;

    const id = randomUUID();
    await pool.query(
      `INSERT INTO sprint_invoices (id, sprint_id, label, amount, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, params.id, label, amount, nextOrder]
    );

    const result = await pool.query(
      `SELECT id, sprint_id, label, invoice_url, invoice_status, invoice_pdf_url,
              amount, sort_order, stripe_invoice_id, created_at, updated_at
       FROM sprint_invoices WHERE id = $1`,
      [id]
    );

    return NextResponse.json({ invoice: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("[Custom Invoice POST]", err);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
