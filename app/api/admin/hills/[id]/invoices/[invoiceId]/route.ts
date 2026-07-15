import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH /api/admin/hills/[id]/invoices/[invoiceId] — edit a draft invoice's
// label / amount / order. Sending & voiding live under .../stripe.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; invoiceId: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const body = await request.json();
    const pool = getPool();

    const sets: string[] = [];
    const values: unknown[] = [];
    let n = 1;
    const set = (col: string, val: unknown) => {
      sets.push(`${col} = $${n++}`);
      values.push(val);
    };

    if (typeof body.label === "string") set("label", body.label.trim());
    if ("amount" in body) {
      const amt = body.amount === null || body.amount === "" ? null : Number(body.amount);
      if (amt !== null && (!Number.isFinite(amt) || amt < 0)) {
        return NextResponse.json({ error: "Amount must be a non-negative number" }, { status: 400 });
      }
      set("amount", amt);
    }
    if (typeof body.sort_order === "number") set("sort_order", Math.floor(body.sort_order));

    if (sets.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    set("updated_at", new Date().toISOString());
    values.push(params.invoiceId, params.id);

    const result = await pool.query(
      `UPDATE hill_invoices SET ${sets.join(", ")}
        WHERE id = $${n++} AND hill_id = $${n} RETURNING *`,
      values
    );
    if (result.rowCount === 0) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    return NextResponse.json({ invoice: result.rows[0] });
  } catch (error) {
    console.error("Error updating hill invoice:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

// DELETE /api/admin/hills/[id]/invoices/[invoiceId] — remove a draft invoice.
// Refuses if a live Stripe invoice is attached (void it first).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; invoiceId: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const pool = getPool();
    const existing = await pool.query(
      `SELECT stripe_invoice_id, invoice_status FROM hill_invoices WHERE id = $1 AND hill_id = $2`,
      [params.invoiceId, params.id]
    );
    if (existing.rowCount === 0) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    const row = existing.rows[0];
    if (row.stripe_invoice_id && row.invoice_status !== "voided") {
      return NextResponse.json(
        { error: "Void the Stripe invoice before deleting" },
        { status: 409 }
      );
    }
    await pool.query(`DELETE FROM hill_invoices WHERE id = $1 AND hill_id = $2`, [
      params.invoiceId,
      params.id,
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting hill invoice:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
