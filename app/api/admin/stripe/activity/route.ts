import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const STRIPE_ACTIONS = [
  "stripe_link_generated",
  "invoice_sent",
  "invoice_paid",
  "invoice_payment_failed",
  "invoice_voided",
  "invoice_refunded",
];

/**
 * GET /api/admin/stripe/activity
 *
 * Returns a paginated list of all Stripe-related changelog entries across every
 * sprint, joined with sprint title and author name.
 *
 * Query params:
 *   limit  — number of results (default 50, max 200)
 *   offset — skip N results for pagination (default 0)
 *   action — filter to a single action type (optional)
 */
export async function GET(request: Request) {
  try {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);
    const actionFilter = searchParams.get("action");

    const actions = actionFilter && STRIPE_ACTIONS.includes(actionFilter)
      ? [actionFilter]
      : STRIPE_ACTIONS;

    const placeholders = actions.map((_, i) => `$${i + 1}`).join(", ");

    const result = await pool.query(
      `SELECT
         cl.id,
         cl.action,
         cl.summary,
         cl.details,
         cl.created_at,
         sd.id   AS sprint_id,
         sd.title AS sprint_title,
         COALESCE(
           NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''),
           a.name,
           a.email
         ) AS author_name
       FROM sprint_draft_changelog cl
       LEFT JOIN sprint_drafts sd ON sd.id = cl.sprint_draft_id
       LEFT JOIN accounts a ON a.id = cl.account_id
       WHERE cl.action IN (${placeholders})
       ORDER BY cl.created_at DESC
       LIMIT $${actions.length + 1} OFFSET $${actions.length + 2}`,
      [...actions, limit, offset]
    );

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM sprint_draft_changelog
       WHERE action IN (${placeholders})`,
      actions
    );

    return NextResponse.json({
      entries: result.rows,
      total: countRes.rows[0]?.total ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    console.error("[StripeActivity GET]", err);
    return NextResponse.json({ error: "Failed to load Stripe activity" }, { status: 500 });
  }
}
