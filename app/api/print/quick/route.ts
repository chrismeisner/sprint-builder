import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { enqueuePrintJob, getDefaultPrinterId, PrintJobError } from "@/lib/printJobs";

// POST /api/print/quick — admin: the one-liner any Life OS surface calls to send
// text to the studio printer. Resolves the default printer server-side and
// enqueues a `note` receipt. Body: { text, printerId?, source?, cut? }
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    await ensureSchema();
    const body = await request.json().catch(() => ({}));
    const text = (body?.text ?? "").toString();
    if (!text.trim()) {
      return NextResponse.json({ error: "text is required." }, { status: 400 });
    }

    const printerId = body?.printerId || (await getDefaultPrinterId());
    if (!printerId) {
      return NextResponse.json(
        { error: "No printer is set up yet. Add one under Dashboard → Printers." },
        { status: 409 }
      );
    }

    const job = await enqueuePrintJob(
      printerId,
      { type: "note", text, cut: body?.cut === "none" ? "none" : "partial" },
      { source: typeof body?.source === "string" ? body.source : "quick", createdBy: admin.accountId }
    );
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof PrintJobError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error in quick print:", error);
    return NextResponse.json({ error: "Failed to print" }, { status: 500 });
  }
}
