import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendHillInvoice, voidHillInvoice } from "@/lib/hillInvoicing";

// POST /api/admin/hills/[id]/invoices/[invoiceId]/stripe
// Body: { action: "send" | "void", dueDays?, description? }
// "send" creates + finalizes a real Stripe invoice (hosted payment link);
// "void" voids it. The webhook (metadata.hill_invoice_id) flips the row to
// paid/processing/failed as the client pays.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; invoiceId: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const body = await request.json().catch(() => ({}));
    const action = body.action ?? "send";

    if (action === "send") {
      const result = await sendHillInvoice(params.id, params.invoiceId, {
        dueDays: body.dueDays ?? null,
        description: body.description ?? null,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    if (action === "void") {
      await voidHillInvoice(params.id, params.invoiceId);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Error on hill invoice Stripe action:", error);
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Failed to process invoice";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
