import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  createDepositInvoiceForCycle,
  onCycleAccepted,
} from "@/lib/refinementCycleBilling";

type Params = { params: { id: string } };

// Recovery endpoint for cycles that landed in `awaiting_deposit` without a
// Stripe invoice URL — e.g. accepted under an older code path where Stripe
// failures were swallowed. Creates the deposit invoice, persists the URL,
// and re-sends the acceptance email so the client gets a real payment link.
export async function POST(req: Request, { params }: Params) {
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

    const pool = getPool();
    const stateRes = await pool.query(
      `SELECT status, stripe_deposit_invoice_url
       FROM refinement_cycles WHERE id = $1 LIMIT 1`,
      [params.id]
    );
    if (stateRes.rowCount === 0) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }
    const status = stateRes.rows[0].status as string;
    const existingUrl = stateRes.rows[0]
      .stripe_deposit_invoice_url as string | null;
    if (status !== "awaiting_deposit") {
      return NextResponse.json(
        {
          error: `Can only regenerate when status=awaiting_deposit (got: ${status})`,
        },
        { status: 409 }
      );
    }
    if (existingUrl) {
      return NextResponse.json(
        { error: "Cycle already has a deposit invoice URL", url: existingUrl },
        { status: 409 }
      );
    }

    let invoice;
    try {
      invoice = await createDepositInvoiceForCycle(params.id);
    } catch (err) {
      console.error(
        "[RefinementCycle regenerate-deposit-invoice] failed",
        err
      );
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 502 }
      );
    }

    await pool.query(
      `UPDATE refinement_cycles
       SET stripe_deposit_invoice_id = $2,
           stripe_deposit_invoice_url = $3,
           updated_at = now()
       WHERE id = $1`,
      [params.id, invoice.stripeInvoiceId, invoice.hostedInvoiceUrl]
    );

    // Default: send the acceptance email (with CC preferences honored) so
    // the client + CC'd project members get the Stripe link. The admin can
    // opt out by passing { notify: false } if they want to generate the
    // invoice quietly and reach out by other means.
    const body = (await req.json().catch(() => ({}))) as { notify?: unknown };
    const notify = body.notify !== false;
    if (notify) {
      await onCycleAccepted(params.id);
    }

    return NextResponse.json({
      url: invoice.hostedInvoiceUrl,
      notified: notify,
    });
  } catch (err) {
    console.error("[RefinementCycle regenerate-deposit-invoice] error", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Regenerate failed" },
      { status: 500 }
    );
  }
}
