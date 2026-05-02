import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { onCycleAccepted } from "@/lib/refinementCycleBilling";

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

    const pool = getPool();

    // Pay-on-delivery: acceptance commits the studio to the work and the
    // delivery date. No Stripe invoice is created here — the full invoice
    // is generated when the cycle is delivered.
    const result = await pool.query(
      `
      UPDATE refinement_cycles
      SET status = 'in_progress',
          accepted_at = now(),
          accepted_by = $2,
          studio_review_note = $3,
          studio_review_attachment_url = $5,
          delivery_date = $4,
          updated_at = now()
      WHERE id = $1
        AND status = 'submitted'
      RETURNING id, status, delivery_date
      `,
      [
        params.id,
        user.accountId,
        studioReviewNote,
        deliveryDate,
        studioReviewAttachmentUrl,
      ]
    );

    if (result.rowCount === 0) {
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
