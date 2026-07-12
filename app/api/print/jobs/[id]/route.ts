import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { requireAgent } from "@/lib/printAuth";
import { transitionPrintJob } from "@/lib/printJobs";

// PATCH /api/print/jobs/:id — agent: report a status transition for a job it holds.
// Body: { status: "printing" | "printed" | "failed", error? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureSchema();
    const agent = await requireAgent(request);
    const body = await request.json().catch(() => ({}));
    const { status, error } = body || {};

    if (!["printing", "printed", "failed"].includes(status)) {
      return NextResponse.json(
        { error: "status must be printing, printed, or failed." },
        { status: 400 }
      );
    }

    const job = await transitionPrintJob(params.id, agent.id, status, error);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not claimed by this agent." },
        { status: 404 }
      );
    }
    return NextResponse.json({ job });
  } catch (err) {
    if (err instanceof Error && err.message.includes("authentication")) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Error transitioning print job:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
