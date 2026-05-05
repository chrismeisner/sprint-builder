import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    };

    const figmaFileUrl = clipUrl(body.figmaFileUrl);
    const loomWalkthroughUrl = clipUrl(body.loomWalkthroughUrl);
    const prototypeLink = clipUrl(body.prototypeLink);
    const engineeringNotes = clipText(body.engineeringNotes);

    const pool = getPool();
    const result = await pool.query(
      `
      UPDATE refinement_cycles
      SET figma_file_url = $3,
          loom_walkthrough_url = $4,
          engineering_notes = $5,
          prototype_link = $6,
          delivery_draft_saved_at = now(),
          delivery_draft_saved_by = $2,
          updated_at = now()
      WHERE id = $1
        AND status IN ('in_progress', 'awaiting_deposit')
      RETURNING id, delivery_draft_saved_at
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
            "Cycle not found or not in a draftable state (must be in_progress or awaiting_deposit).",
        },
        { status: 409 }
      );
    }

    const savedAt = result.rows[0].delivery_draft_saved_at as Date | string;
    return NextResponse.json({
      id: result.rows[0].id as string,
      deliveryDraftSavedAt:
        savedAt instanceof Date ? savedAt.toISOString() : savedAt,
      deliveryDraftSavedByEmail: user.email,
    });
  } catch (err) {
    console.error("[RefinementCycle delivery-draft]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Save draft failed" },
      { status: 500 }
    );
  }
}
