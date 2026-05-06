import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

type Params = { params: { id: string } };

// PATCH /api/refinement-cycles/[id]/payment-status
//
// Admin override for the deposit/final payment timestamps. Stripe webhooks
// normally write these (`payment_intent.processing` → *_payment_initiated_at,
// `invoice.paid` / `payment_intent.succeeded` → *_paid_at), but some payment
// paths skip the `processing` event or arrive late, so admins occasionally
// need to flip the row by hand after confirming with the client.
//
// Body: { kind: "deposit" | "final", status: "processing" | "paid" | "reset" }
//   processing → stamp *_payment_initiated_at = now() (only if null)
//   paid       → stamp *_paid_at = now() (and advance cycle.status when it
//                still matches the gating state)
//   reset      → clear both *_payment_initiated_at and *_paid_at for the kind
export async function PATCH(req: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    if (!user.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      kind?: unknown;
      status?: unknown;
    };
    const kind = body.kind === "deposit" || body.kind === "final" ? body.kind : null;
    const status =
      body.status === "processing" ||
      body.status === "paid" ||
      body.status === "reset"
        ? body.status
        : null;
    if (!kind || !status) {
      return NextResponse.json(
        { error: "kind must be 'deposit' | 'final' and status must be 'processing' | 'paid' | 'reset'" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const initiatedCol =
      kind === "deposit" ? "deposit_payment_initiated_at" : "final_payment_initiated_at";
    const paidCol = kind === "deposit" ? "deposit_paid_at" : "final_paid_at";

    if (status === "processing") {
      const res = await pool.query(
        `UPDATE refinement_cycles
         SET ${initiatedCol} = COALESCE(${initiatedCol}, now()),
             updated_at = now()
         WHERE id = $1
         RETURNING id, ${initiatedCol} AS initiated_at, ${paidCol} AS paid_at, status`,
        [params.id]
      );
      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
      }
      console.log(
        `[RefinementCycle payment-status] admin=${user.email} cycle=${params.id} ${kind}=processing`
      );
      return NextResponse.json({ ok: true, row: res.rows[0] });
    }

    if (status === "paid") {
      // Mirror webhook semantics: deposit paid advances awaiting_deposit →
      // in_progress; final paid advances awaiting_payment → delivered. Other
      // statuses are left alone so the admin doesn't unintentionally rewind.
      const sql =
        kind === "deposit"
          ? `UPDATE refinement_cycles
             SET deposit_paid_at = COALESCE(deposit_paid_at, now()),
                 status = CASE WHEN status = 'awaiting_deposit' THEN 'in_progress' ELSE status END,
                 updated_at = now()
             WHERE id = $1
             RETURNING id, deposit_paid_at AS paid_at, status`
          : `UPDATE refinement_cycles
             SET final_paid_at = COALESCE(final_paid_at, now()),
                 status = CASE WHEN status = 'awaiting_payment' THEN 'delivered' ELSE status END,
                 updated_at = now()
             WHERE id = $1
             RETURNING id, final_paid_at AS paid_at, status`;
      const res = await pool.query(sql, [params.id]);
      if (res.rowCount === 0) {
        return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
      }
      console.log(
        `[RefinementCycle payment-status] admin=${user.email} cycle=${params.id} ${kind}=paid → status=${res.rows[0].status}`
      );
      return NextResponse.json({ ok: true, row: res.rows[0] });
    }

    // reset
    const res = await pool.query(
      `UPDATE refinement_cycles
       SET ${initiatedCol} = NULL,
           ${paidCol} = NULL,
           updated_at = now()
       WHERE id = $1
       RETURNING id, status`,
      [params.id]
    );
    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }
    console.log(
      `[RefinementCycle payment-status] admin=${user.email} cycle=${params.id} ${kind}=reset`
    );
    return NextResponse.json({ ok: true, row: res.rows[0] });
  } catch (err) {
    console.error("[RefinementCycle payment-status] error", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Update failed" },
      { status: 500 }
    );
  }
}
