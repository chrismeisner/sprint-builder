import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCalBookingUrlForDeliveryDate } from "@/lib/refinementCycleBilling";
import { generateRefinementCycleRescheduledClientEmail } from "@/lib/email";

type Params = { params: { id: string } };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getBaseUrl(): string {
  return (
    (process.env.BASE_URL || "").replace(/\/$/, "") || "https://meisner.design"
  );
}

// POST /api/refinement-cycles/[id]/reschedule-preview
//
// Pure preview — generates the email the reschedule route will send for the
// proposed new delivery date. Does not touch the cycle row.
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
      deliveryDate?: unknown;
    };

    const newDeliveryDate =
      typeof body.deliveryDate === "string" &&
      DATE_PATTERN.test(body.deliveryDate)
        ? body.deliveryDate
        : null;
    if (!newDeliveryDate) {
      return NextResponse.json(
        { error: "deliveryDate (YYYY-MM-DD) is required" },
        { status: 400 }
      );
    }

    const pool = getPool();
    const cycleRes = await pool.query(
      `SELECT rc.id, rc.title, rc.submitter_email, rc.cc_emails,
              rc.delivery_date, rc.studio_review_note,
              p.name AS project_name, p.emoji AS project_emoji
       FROM refinement_cycles rc
       LEFT JOIN projects p ON p.id = rc.project_id
       WHERE rc.id = $1
       LIMIT 1`,
      [params.id]
    );
    if (cycleRes.rowCount === 0) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }
    const row = cycleRes.rows[0] as {
      id: string;
      title: string | null;
      submitter_email: string | null;
      cc_emails: string[] | null;
      delivery_date: string | Date | null;
      studio_review_note: string | null;
      project_name: string | null;
      project_emoji: string | null;
    };

    const previousDeliveryDate =
      row.delivery_date instanceof Date
        ? row.delivery_date.toISOString().slice(0, 10)
        : (row.delivery_date as string | null);

    const calBookingUrl = getCalBookingUrlForDeliveryDate(newDeliveryDate);
    const content = generateRefinementCycleRescheduledClientEmail({
      title: row.title,
      projectName: row.project_name,
      projectEmoji: row.project_emoji,
      previousDeliveryDate,
      newDeliveryDate,
      calBookingUrl,
      cycleUrl: `${getBaseUrl()}/dashboard/refinement-cycles/${row.id}`,
      studioNote: row.studio_review_note,
    });

    return NextResponse.json({
      to: row.submitter_email ?? null,
      cc: Array.isArray(row.cc_emails) ? row.cc_emails : [],
      subject: content.subject,
      text: content.text,
      previousDeliveryDate,
      newDeliveryDate,
    });
  } catch (err) {
    console.error("[RefinementCycle reschedule-preview]", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Preview failed" },
      { status: 500 }
    );
  }
}
