import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sendCycleInvoiceReminder } from "@/lib/refinementCycleBilling";

type Params = { params: { id: string } };

// POST /api/refinement-cycles/[id]/send-invoice-reminder
//
// Admin-triggered manual nudge for an unpaid refinement-cycle invoice. Picks
// deposit or final based on current cycle status, emails the submitter, and
// CCs the cycle's cc_emails plus all studio admins.
//
// Body (optional): { customNote?: string }
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

    const body = (await req.json().catch(() => ({}))) as {
      customNote?: unknown;
    };
    const customNote =
      typeof body.customNote === "string" && body.customNote.trim().length > 0
        ? body.customNote.trim()
        : null;

    const result = await sendCycleInvoiceReminder(params.id, { customNote });
    if (!result.ok) {
      const statusCode =
        result.reason === "not_found"
          ? 404
          : result.reason === "no_open_invoice"
          ? 409
          : 400;
      return NextResponse.json({ error: result.reason }, { status: statusCode });
    }

    console.log(
      `[RefinementCycle send-invoice-reminder] admin=${user.email} cycle=${params.id} kind=${result.kind} to=${result.recipient}`
    );
    return NextResponse.json({
      ok: true,
      kind: result.kind,
      recipient: result.recipient,
    });
  } catch (err) {
    console.error("[RefinementCycle send-invoice-reminder] error", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Send failed" },
      { status: 500 }
    );
  }
}
