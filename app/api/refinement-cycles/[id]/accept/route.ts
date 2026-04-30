import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { depositDeadlineFromDeliveryDate } from "@/lib/refinementCycle";
import {
  createDepositInvoiceForCycle,
  onCycleAccepted,
} from "@/lib/refinementCycleBilling";

type Params = { params: { id: string } };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request, { params }: Params) {
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

    const body = (await request.json().catch(() => ({}))) as {
      deliveryDate?: unknown;
      studioReviewNote?: unknown;
      studioReviewAttachmentUrl?: unknown;
    };

    const deliveryDate =
      typeof body.deliveryDate === "string" &&
      DATE_PATTERN.test(body.deliveryDate)
        ? body.deliveryDate
        : null;
    if (!deliveryDate) {
      return NextResponse.json(
        { error: "deliveryDate (YYYY-MM-DD) is required" },
        { status: 400 }
      );
    }

    const studioReviewNote =
      typeof body.studioReviewNote === "string" && body.studioReviewNote.trim()
        ? body.studioReviewNote.trim().slice(0, 5000)
        : null;

    const studioReviewAttachmentUrl =
      typeof body.studioReviewAttachmentUrl === "string" &&
      body.studioReviewAttachmentUrl.trim()
        ? body.studioReviewAttachmentUrl.trim().slice(0, 1000)
        : null;

    const depositDueAt = depositDeadlineFromDeliveryDate(deliveryDate);

    const pool = getPool();

    // Pre-flight: confirm the cycle is still in `submitted` so we don't
    // create an orphan Stripe invoice if it was already processed.
    const stateRes = await pool.query(
      `SELECT status FROM refinement_cycles WHERE id = $1 LIMIT 1`,
      [params.id]
    );
    if (stateRes.rowCount === 0) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }
    if (stateRes.rows[0].status !== "submitted") {
      return NextResponse.json(
        { error: "Cycle is no longer in submitted state" },
        { status: 409 }
      );
    }

    // Create the Stripe deposit invoice BEFORE flipping status. If Stripe
    // fails (or returns no hosted URL), we throw — status stays `submitted`
    // and the admin can retry. Guarantees the acceptance email always
    // ships with a real payment link.
    let depositInvoice;
    try {
      depositInvoice = await createDepositInvoiceForCycle(params.id);
    } catch (err) {
      console.error("[RefinementCycle accept] deposit invoice failed", err);
      return NextResponse.json(
        {
          error:
            "Could not create the Stripe deposit invoice. Please try again in a moment.",
          details: (err as Error).message,
        },
        { status: 502 }
      );
    }

    const result = await pool.query(
      `
      UPDATE refinement_cycles
      SET status = 'awaiting_deposit',
          accepted_at = now(),
          accepted_by = $2,
          studio_review_note = $3,
          studio_review_attachment_url = $6,
          delivery_date = $4,
          deposit_due_at = $5,
          stripe_deposit_invoice_id = $7,
          stripe_deposit_invoice_url = $8,
          updated_at = now()
      WHERE id = $1
        AND status = 'submitted'
      RETURNING id, status, delivery_date, deposit_due_at
      `,
      [
        params.id,
        user.accountId,
        studioReviewNote,
        deliveryDate,
        depositDueAt,
        studioReviewAttachmentUrl,
        depositInvoice.stripeInvoiceId,
        depositInvoice.hostedInvoiceUrl,
      ]
    );

    if (result.rowCount === 0) {
      // Race: another admin accepted/declined between our pre-flight and
      // UPDATE. The Stripe invoice we just created is orphaned — log it so
      // it can be voided manually.
      console.error(
        `[RefinementCycle accept] race lost — orphan Stripe invoice ${depositInvoice.stripeInvoiceId} for cycle ${params.id}`
      );
      return NextResponse.json(
        { error: "Cycle is no longer in submitted state" },
        { status: 409 }
      );
    }

    await onCycleAccepted(params.id);

    return NextResponse.json({
      id: result.rows[0].id,
      status: result.rows[0].status,
    });
  } catch (err) {
    console.error("[RefinementCycle accept]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Accept failed" },
      { status: 500 }
    );
  }
}
