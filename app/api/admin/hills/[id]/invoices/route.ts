import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import crypto from "crypto";

// GET /api/admin/hills/[id]/invoices — list a client hill's invoices.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const r = await pool.query(
      `SELECT id, kind, label, amount, invoice_status, invoice_url, invoice_pdf_url,
              stripe_invoice_id, paid_at, payment_initiated_at, sort_order, created_at
         FROM hill_invoices WHERE hill_id = $1 ORDER BY sort_order, created_at`,
      [params.id]
    );
    return NextResponse.json({ invoices: r.rows });
  } catch (error) {
    console.error("Error listing hill invoices:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to list invoices" }, { status: 500 });
  }
}

// POST /api/admin/hills/[id]/invoices — add a draft invoice row (not yet sent
// to Stripe). Body: { label, amount, kind? }
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const body = await request.json();
    const label = (body.label ?? "").toString().trim();
    if (!label) return NextResponse.json({ error: "Label is required" }, { status: 400 });
    const amount =
      body.amount === undefined || body.amount === null || body.amount === ""
        ? null
        : Number(body.amount);
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      return NextResponse.json({ error: "Amount must be a non-negative number" }, { status: 400 });
    }
    const kind = ["sprint", "custom", "deposit", "final"].includes(body.kind) ? body.kind : "custom";

    const pool = getPool();
    const hill = await pool.query(`SELECT id FROM hills WHERE id = $1`, [params.id]);
    if (hill.rowCount === 0) return NextResponse.json({ error: "Hill not found" }, { status: 404 });

    const orderRes = await pool.query(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM hill_invoices WHERE hill_id = $1`,
      [params.id]
    );
    const id = crypto.randomUUID();
    const r = await pool.query(
      `INSERT INTO hill_invoices (id, hill_id, kind, label, amount, invoice_status, sort_order)
       VALUES ($1, $2, $3, $4, $5, 'not_sent', $6) RETURNING *`,
      [id, params.id, kind, label, amount, orderRes.rows[0].next]
    );
    return NextResponse.json({ invoice: r.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating hill invoice:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
