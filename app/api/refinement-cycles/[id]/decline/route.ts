import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { onCycleDeclined } from "@/lib/refinementCycleBilling";

type Params = { params: { id: string } };

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
      studioReviewNote?: unknown;
      studioReviewAttachmentUrl?: unknown;
    };
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
    const result = await pool.query(
      `
      UPDATE refinement_cycles
      SET status = 'declined',
          declined_at = now(),
          declined_by = $2,
          studio_review_note = $3,
          studio_review_attachment_url = $4,
          updated_at = now()
      WHERE id = $1
        AND status = 'submitted'
      RETURNING id, status
      `,
      [params.id, user.accountId, studioReviewNote, studioReviewAttachmentUrl]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Cycle not found or no longer in submitted state" },
        { status: 409 }
      );
    }

    await onCycleDeclined(params.id);

    return NextResponse.json({
      id: result.rows[0].id,
      status: result.rows[0].status,
    });
  } catch (err) {
    console.error("[RefinementCycle decline]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Decline failed" },
      { status: 500 }
    );
  }
}
