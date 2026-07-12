import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { requireAgent } from "@/lib/printAuth";
import { claimPrintJobs } from "@/lib/printJobs";

// POST /api/print/agents/claim — agent: atomically claim pending jobs for its
// printers. Body: { max?: number }. Returns { jobs: [...with cups_name] }.
export async function POST(request: NextRequest) {
  try {
    await ensureSchema();
    const agent = await requireAgent(request);
    const body = await request.json().catch(() => ({}));
    const jobs = await claimPrintJobs(agent.id, Number(body?.max) || 5);
    return NextResponse.json({ jobs });
  } catch (err) {
    if (err instanceof Error && err.message.includes("authentication")) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Error claiming print jobs:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
