import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

type Params = { params: { id: string } };

// DELETE /api/refinement-cycles/[id]
//
// Revoke / withdraw a cycle. Allowed when:
//   - status is `submitted` — the submitter or an admin can pull it back
//   - status is `accepted` / `awaiting_deposit` — admin only; voids the
//     Stripe deposit invoice if one was issued
// Once the deposit has been paid (status `in_progress` or later), this
// route 409s — refunds + reconciliation belong in a separate flow.
export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const pool = getPool();
    const cycleRes = await pool.query(
      `SELECT rc.id, rc.status, rc.submitter_email, rc.project_id,
              rc.stripe_deposit_invoice_id
       FROM refinement_cycles rc
       WHERE rc.id = $1
       LIMIT 1`,
      [params.id]
    );
    if (cycleRes.rowCount === 0) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }
    const cycle = cycleRes.rows[0] as {
      id: string;
      status: string;
      submitter_email: string | null;
      project_id: string;
      stripe_deposit_invoice_id: string | null;
    };

    const isAdmin = Boolean(user.isAdmin);
    const isSubmitter =
      cycle.submitter_email != null &&
      cycle.submitter_email.toLowerCase() === user.email.toLowerCase();

    if (!isAdmin && !isSubmitter) {
      return NextResponse.json(
        { error: "You can only revoke cycles you submitted" },
        { status: 403 }
      );
    }

    // Submitter can revoke only while still pending review. Admin can revoke
    // through the awaiting-deposit window.
    const revocableForSubmitter = cycle.status === "submitted";
    const revocableForAdmin =
      cycle.status === "submitted" ||
      cycle.status === "accepted" ||
      cycle.status === "awaiting_deposit";

    const allowed = isAdmin ? revocableForAdmin : revocableForSubmitter;
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            cycle.status === "in_progress" || cycle.status === "delivered"
              ? "Deposit has been paid — contact the studio to handle this case."
              : `Cycle is ${cycle.status}; nothing to revoke.`,
        },
        { status: 409 }
      );
    }

    // Best-effort: void any unpaid Stripe deposit invoice before deleting the
    // row, so the hosted payment URL stops working.
    if (cycle.stripe_deposit_invoice_id && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = getStripe();
        await stripe.invoices.voidInvoice(cycle.stripe_deposit_invoice_id);
      } catch (err) {
        console.error(
          `[RefinementCycle DELETE] Failed to void Stripe invoice ${cycle.stripe_deposit_invoice_id}:`,
          (err as Error).message
        );
      }
    }

    // FK cascade handles refinement_cycle_screens.
    await pool.query(`DELETE FROM refinement_cycles WHERE id = $1`, [
      params.id,
    ]);

    return NextResponse.json({ ok: true, projectId: cycle.project_id });
  } catch (err) {
    console.error("[RefinementCycle DELETE]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Revoke failed" },
      { status: 500 }
    );
  }
}
