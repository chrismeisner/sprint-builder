import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { onCycleDelivered } from "@/lib/refinementCycleBilling";

type Params = { params: { id: string } };

const MAX_TEXT = 10_000;

function clipText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_TEXT) : null;
}

function clipUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 1000) : null;
}

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
      figmaFileUrl?: unknown;
      loomWalkthroughUrl?: unknown;
      prototypeLink?: unknown;
      engineeringNotes?: unknown;
      invoiceAmountOverride?: unknown;
      invoiceDescriptionOverride?: unknown;
    };

    const figmaFileUrl = clipUrl(body.figmaFileUrl);
    const loomWalkthroughUrl = clipUrl(body.loomWalkthroughUrl);
    const prototypeLink = clipUrl(body.prototypeLink);
    const engineeringNotes = clipText(body.engineeringNotes);

    let invoiceAmountOverride: number | null = null;
    if (body.invoiceAmountOverride !== undefined && body.invoiceAmountOverride !== null && body.invoiceAmountOverride !== "") {
      const n = Number(body.invoiceAmountOverride);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json(
          { error: "Invoice amount must be a non-negative number" },
          { status: 400 }
        );
      }
      invoiceAmountOverride = n;
    }
    const invoiceDescriptionOverride =
      typeof body.invoiceDescriptionOverride === "string" &&
      body.invoiceDescriptionOverride.trim()
        ? body.invoiceDescriptionOverride.trim().slice(0, 200)
        : null;

    const pool = getPool();
    const result = await pool.query(
      `
      UPDATE refinement_cycles
      SET status = 'awaiting_payment',
          delivered_at = now(),
          delivered_by = $2,
          figma_file_url = COALESCE($3, figma_file_url),
          loom_walkthrough_url = COALESCE($4, loom_walkthrough_url),
          engineering_notes = COALESCE($5, engineering_notes),
          prototype_link = COALESCE($6, prototype_link),
          updated_at = now()
      WHERE id = $1
        AND status IN ('in_progress', 'awaiting_deposit')
      RETURNING id, status
      `,
      [
        params.id,
        user.accountId,
        figmaFileUrl,
        loomWalkthroughUrl,
        engineeringNotes,
        prototypeLink,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          error:
            "Cycle not found or not in a deliverable state (must be in_progress or awaiting_deposit).",
        },
        { status: 409 }
      );
    }

    await onCycleDelivered(params.id, {
      figmaFileUrl,
      loomWalkthroughUrl,
      prototypeLink,
      engineeringNotes,
      invoiceAmountOverride,
      invoiceDescriptionOverride,
    });

    return NextResponse.json({
      id: result.rows[0].id,
      status: result.rows[0].status,
    });
  } catch (err) {
    console.error("[RefinementCycle deliver]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Deliver failed" },
      { status: 500 }
    );
  }
}
