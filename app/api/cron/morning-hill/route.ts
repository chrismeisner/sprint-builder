import { NextRequest, NextResponse } from "next/server";
import { getPool, ensureSchema } from "@/lib/db";
import { SUPERADMIN_EMAIL } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { ensureDayHill, todayKey, dayTitle } from "@/lib/dayHill";
import { recordJobRun } from "@/lib/scheduledJobs";

// POST /api/cron/morning-hill — the morning ritual.
// Ensures today's day-hill exists (scope phase) and sends the studio owner a
// calm "let's start today's hill" nudge with a link to shape the day.
// Auth: CRON_SECRET bearer (Heroku Scheduler) or an admin session.
export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization") || "";
    const cronSecret = process.env.CRON_SECRET;
    const isCron = !!cronSecret && auth === `Bearer ${cronSecret}`;
    if (!isCron) {
      // Fall back to admin session for manual "run now".
      const { getCurrentUser } = await import("@/lib/auth");
      const user = await getCurrentUser().catch(() => null);
      if (!user?.isAdmin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 });
      }
    }

    await ensureSchema();
    const pool = getPool();

    // The studio owner.
    const ownerRes = await pool.query(
      `SELECT id, email, first_name FROM accounts WHERE lower(email) = lower($1) LIMIT 1`,
      [SUPERADMIN_EMAIL]
    );
    if (ownerRes.rowCount === 0) {
      return NextResponse.json({ error: "Owner account not found" }, { status: 404 });
    }
    const owner = ownerRes.rows[0] as { id: string; email: string; first_name: string | null };

    const dayKey = todayKey();
    const day = await ensureDayHill(dayKey, owner.id);

    // Carry any 'week'-focused personal tasks onto today's plate.
    await pool
      .query(
        `UPDATE hill_tasks t
            SET focus = CASE WHEN focus LIKE '%today%' THEN focus ELSE btrim('today,' || focus, ',') END,
                updated_at = now()
          WHERE t.completed = false AND t.focus LIKE '%week%'
            AND (t.hill_id IS NULL OR EXISTS (SELECT 1 FROM hills h WHERE h.id = t.hill_id AND h.type = 'personal'))`
      )
      .catch(() => {});

    const base = (process.env.BASE_URL || "https://meisner.design").replace(/\/$/, "");
    const link = `${base}/dashboard/hills/today`;
    const hello = owner.first_name ? owner.first_name : "there";
    const title = dayTitle(dayKey);

    const text = `Good morning, ${hello}.

${title} is a fresh hill. Before the climb, take a quiet minute with your coffee and shape it — confirm what matters today, add anything new, let the rest go.

Scope today's hill: ${link}

When you're ready, start the climb.`;

    const html = `
      <div style="font-family:-apple-system,system-ui,sans-serif;max-width:520px;margin:0 auto;color:#16201d;line-height:1.6">
        <p style="font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#8a938e;margin:0 0 8px">The morning hill</p>
        <h1 style="font-size:24px;margin:0 0 4px;font-weight:600">Good morning, ${hello}.</h1>
        <p style="color:#586762;margin:0 0 20px">${title} is a fresh hill.</p>
        <p style="margin:0 0 20px">Before the climb, take a quiet minute — coffee first. Confirm what matters today, add anything new, and let the rest go. This isn't work yet; it's just looking at the hill.</p>
        <p style="margin:0 0 28px">
          <a href="${link}" style="display:inline-block;background:#b4691a;color:#fff;text-decoration:none;padding:11px 22px;border-radius:10px;font-weight:600">Scope today's hill →</a>
        </p>
        <p style="color:#8a938e;font-size:14px;margin:0">When you're ready, start the climb.</p>
      </div>`;

    let emailed = false;
    try {
      const res = await sendEmail({
        to: owner.email,
        subject: `${title} — let's start today's hill`,
        text,
        html,
        category: "transactional",
        tag: "morning-hill",
      });
      emailed = res.success;
    } catch (e) {
      console.error("morning-hill email failed:", e);
    }

    await recordJobRun("morning-hill", "ok", `day-hill ${day.created ? "created" : "existed"}, emailed=${emailed}`);
    return NextResponse.json({ ok: true, dayKey, hillId: day.id, dayHillCreated: day.created, emailed });
  } catch (error) {
    console.error("Error in morning-hill:", error);
    return NextResponse.json({ error: "Failed to run morning ritual" }, { status: 500 });
  }
}
