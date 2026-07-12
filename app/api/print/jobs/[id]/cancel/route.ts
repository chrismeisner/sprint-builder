import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { cancelPrintJob } from "@/lib/printJobs";

// POST /api/print/jobs/:id/cancel — admin: cancel a still-pending job.
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    await ensureSchema();
    const job = await cancelPrintJob(params.id);
    if (!job) {
      return NextResponse.json(
        { error: "Only pending jobs can be canceled." },
        { status: 409 }
      );
    }
    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof Error && error.message.includes("required")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error canceling print job:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
