import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db";
import { recordJobRun } from "@/lib/scheduledJobs";
import { reapExpiredPrintJobs } from "@/lib/printJobs";

// POST /api/cron/reap-print-jobs — recover print jobs whose studio agent died
// mid-print (expired claim lease): back to 'pending', or 'failed' once attempts
// are exhausted. Auth: CRON_SECRET bearer (Heroku Scheduler) or an admin session.
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET;
    const isCron = !!cronSecret && auth === `Bearer ${cronSecret}`;
    if (!isCron) {
      const { getCurrentUser } = await import("@/lib/auth");
      const user = await getCurrentUser().catch(() => null);
      if (!user?.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    await ensureSchema();
    const { requeued, failed } = await reapExpiredPrintJobs();
    await recordJobRun("reap-print-jobs", "ok", `${requeued} requeued, ${failed} failed`);
    return NextResponse.json({ ok: true, requeued, failed });
  } catch (error) {
    console.error("Error reaping print jobs:", error);
    await recordJobRun("reap-print-jobs", "error", (error as Error)?.message).catch(() => {});
    return NextResponse.json({ error: "Failed to reap" }, { status: 500 });
  }
}
