import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { id: string; invoiceId: string } };

/**
 * PATCH /api/sprint-drafts/[id]/invoices/[invoiceId]
 * Updates an individual invoice's status, URL, or label.
 * Admin only.
 */
export async function PATCH(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    // Verify invoice exists and belongs to this sprint
    const invoiceRes = await pool.query(
      `SELECT id FROM sprint_invoices WHERE id = $1 AND sprint_id = $2`,
      [params.invoiceId, params.id]
    );
    if ((invoiceRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: string[] = [];
    const values: (string | number | null)[] = [];
    let paramIndex = 1;

    // Update invoice_url
    if (body.invoice_url !== undefined) {
      updates.push(`invoice_url = $${paramIndex++}`);
      values.push(body.invoice_url || null);
    }

    // Update invoice_status
    if (body.invoice_status !== undefined) {
      const validStatuses = ["not_sent", "sent", "paid", "overdue"];
      const statusValue = validStatuses.includes(body.invoice_status) ? body.invoice_status : "not_sent";
      updates.push(`invoice_status = $${paramIndex++}`);
      values.push(statusValue);
    }

    // Update label
    if (body.label !== undefined && typeof body.label === "string" && body.label.trim()) {
      updates.push(`label = $${paramIndex++}`);
      values.push(body.label.trim());
    }

    // Update amount
    if (body.amount !== undefined) {
      const amt = Number(body.amount);
      updates.push(`amount = $${paramIndex++}`);
      values.push(Number.isFinite(amt) ? amt : null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.push("updated_at = now()");
    values.push(params.invoiceId);

    await pool.query(
      `UPDATE sprint_invoices SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    // Return the updated invoice
    const updatedRes = await pool.query(
      `SELECT id, sprint_id, label, invoice_url, invoice_status, invoice_pdf_url, amount, sort_order, created_at, updated_at
       FROM sprint_invoices WHERE id = $1`,
      [params.invoiceId]
    );

    return NextResponse.json({ invoice: updatedRes.rows[0] });
  } catch (err) {
    console.error("[Invoice PATCH]", err);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

/**
 * DELETE /api/sprint-drafts/[id]/invoices/[invoiceId]
 * Deletes an individual invoice record.
 * Admin only.
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    await pool.query(
      `DELETE FROM sprint_invoices WHERE id = $1 AND sprint_id = $2`,
      [params.invoiceId, params.id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Invoice DELETE]", err);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
