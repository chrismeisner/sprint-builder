import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPool } from "@/lib/db";

// Event types our webhook handler supports
const SUPPORTED_EVENTS = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
] as const;

type SupportedEventType = (typeof SUPPORTED_EVENTS)[number];

// ---------------------------------------------------------------------------
// GET /api/admin/stripe/webhooks
// Returns registered Stripe webhook endpoints + app webhook URL
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? inferAppUrl(request);
  const webhookEndpointUrl = `${appUrl}/api/webhooks/stripe`;

  if (!secretKey) {
    return NextResponse.json({
      appWebhookUrl: webhookEndpointUrl,
      hasWebhookSecret: false,
      endpoints: [],
      error: "STRIPE_SECRET_KEY not set",
    });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2026-01-28.clover" });
    const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });

    return NextResponse.json({
      appWebhookUrl: webhookEndpointUrl,
      hasWebhookSecret: Boolean(webhookSecret),
      endpoints: endpoints.data.map((ep) => ({
        id: ep.id,
        url: ep.url,
        status: ep.status,
        enabledEvents: ep.enabled_events,
        created: ep.created,
      })),
      error: null,
    });
  } catch (err) {
    return NextResponse.json({
      appWebhookUrl: webhookEndpointUrl,
      hasWebhookSecret: Boolean(webhookSecret),
      endpoints: [],
      error: err instanceof Error ? err.message : "Failed to fetch webhook endpoints",
    });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/stripe/webhooks
// Simulates a Stripe event by running the handler logic directly (admin only,
// no signature verification — useful for local dev and smoke-testing).
// Body: { eventType: SupportedEventType }
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { eventType?: string };
  const eventType = body.eventType as SupportedEventType | undefined;

  if (!eventType || !SUPPORTED_EVENTS.includes(eventType as SupportedEventType)) {
    return NextResponse.json(
      { error: `eventType must be one of: ${SUPPORTED_EVENTS.join(", ")}` },
      { status: 400 }
    );
  }

  const fakeStripeId = `sim_${Date.now()}`;
  const logs: string[] = [];

  const log = (msg: string) => {
    console.log(`[WebhookSim] ${msg}`);
    logs.push(msg);
  };

  log(`Simulating event: ${eventType}`);
  log(`Fake Stripe ID: ${fakeStripeId}`);

  try {
    const pool = getPool();

    // Determine target status from the event type
    const status: "paid" | "failed" =
      eventType.endsWith(".succeeded") ||
      eventType.endsWith(".completed") ||
      eventType === "invoice.paid"
        ? "paid"
        : "failed";

    log(`Target invoice status: ${status}`);

    // Attempt to match invoices (will return 0 rows since it's a fake ID — that's expected)
    const result = await pool.query(
      `UPDATE sprint_invoices
          SET invoice_status = $1, updated_at = now()
        WHERE invoice_url ILIKE $2
        RETURNING id, sprint_id, label, invoice_status`,
      [status, `%${fakeStripeId}%`]
    );

    const matchedCount = result.rowCount ?? 0;

    if (matchedCount > 0) {
      log(`Updated ${matchedCount} invoice(s) to "${status}"`);
      result.rows.forEach((row) => {
        log(`  → invoice ${row.id} (${row.label}) on sprint ${row.sprint_id}`);
      });
    } else {
      log(`No invoices matched fake ID — handler logic ran successfully (0 DB rows updated, which is expected for a simulation)`);
    }

    // Also do a quick DB connectivity check
    const dbCheck = await pool.query(`SELECT COUNT(*)::int as count FROM sprint_invoices`);
    const totalInvoices = (dbCheck.rows[0] as { count: number }).count;
    log(`DB check OK — ${totalInvoices} total invoice(s) in sprint_invoices table`);

    return NextResponse.json({
      success: true,
      eventType,
      fakeStripeId,
      matchedInvoices: matchedCount,
      logs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log(`ERROR: ${message}`);
    return NextResponse.json(
      { success: false, eventType, fakeStripeId, logs, error: message },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferAppUrl(request: Request): string {
  try {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "http://localhost:3000";
  }
}
