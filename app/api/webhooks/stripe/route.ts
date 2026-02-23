import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/**
 * POST /api/webhooks/stripe
 *
 * Receives and verifies Stripe webhook events.
 * The raw request body must be read before any JSON parsing so the
 * HMAC signature can be validated against the exact bytes Stripe signed.
 *
 * To register this endpoint in the Stripe dashboard:
 *   https://dashboard.stripe.com/webhooks
 *   URL: https://<your-domain>/api/webhooks/stripe
 *
 * Events handled:
 *   payment_intent.succeeded        → mark matching invoice as "paid"
 *   payment_intent.payment_failed   → mark matching invoice as "failed"
 *   checkout.session.completed      → mark matching invoice as "paid"
 *   invoice.paid                    → mark matching invoice as "paid"
 *   invoice.payment_failed          → mark matching invoice as "failed"
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[StripeWebhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Read raw body — must NOT use request.json() before this
  const rawBody = await request.text();

  let event: import("stripe").Stripe.Event;
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-01-27.acacia",
    });
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[StripeWebhook] Signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  console.log(`[StripeWebhook] Received event: ${event.type} (${event.id})`);

  try {
    await handleEvent(event);
  } catch (err) {
    console.error(`[StripeWebhook] Handler error for ${event.type}:`, err);
    // Return 200 so Stripe doesn't retry — log the error internally instead
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------

async function handleEvent(event: import("stripe").Stripe.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      await onPaymentIntentSucceeded(
        event.data.object as import("stripe").Stripe.PaymentIntent
      );
      break;

    case "payment_intent.payment_failed":
      await onPaymentIntentFailed(
        event.data.object as import("stripe").Stripe.PaymentIntent
      );
      break;

    case "checkout.session.completed":
      await onCheckoutSessionCompleted(
        event.data.object as import("stripe").Stripe.Checkout.Session
      );
      break;

    case "invoice.paid":
      await onInvoicePaid(
        event.data.object as import("stripe").Stripe.Invoice
      );
      break;

    case "invoice.payment_failed":
      await onInvoicePaymentFailed(
        event.data.object as import("stripe").Stripe.Invoice
      );
      break;

    default:
      console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
  }
}

// ---------------------------------------------------------------------------
// Individual event handlers
// ---------------------------------------------------------------------------

async function onPaymentIntentSucceeded(
  pi: import("stripe").Stripe.PaymentIntent
) {
  console.log(`[StripeWebhook] PaymentIntent succeeded: ${pi.id}`);
  await updateInvoiceByStripeId(pi.id, "paid");
}

async function onPaymentIntentFailed(
  pi: import("stripe").Stripe.PaymentIntent
) {
  console.log(`[StripeWebhook] PaymentIntent failed: ${pi.id}`);
  await updateInvoiceByStripeId(pi.id, "failed");
}

async function onCheckoutSessionCompleted(
  session: import("stripe").Stripe.Checkout.Session
) {
  console.log(`[StripeWebhook] Checkout session completed: ${session.id}`);

  // Try to match by payment_intent first, then by session id stored in invoice_url
  if (session.payment_intent && typeof session.payment_intent === "string") {
    await updateInvoiceByStripeId(session.payment_intent, "paid");
  } else {
    await updateInvoiceByStripeId(session.id, "paid");
  }
}

async function onInvoicePaid(invoice: import("stripe").Stripe.Invoice) {
  console.log(`[StripeWebhook] Invoice paid: ${invoice.id}`);
  await updateInvoiceByStripeId(invoice.id, "paid");
}

async function onInvoicePaymentFailed(invoice: import("stripe").Stripe.Invoice) {
  console.log(`[StripeWebhook] Invoice payment failed: ${invoice.id}`);
  await updateInvoiceByStripeId(invoice.id, "failed");
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/**
 * Looks up a sprint_invoice by its Stripe ID (stored in invoice_url or a
 * dedicated stripe_id column if you add one later) and updates its status.
 *
 * The invoice_url column currently stores the Stripe-hosted invoice URL.
 * We match loosely by checking whether the URL contains the given Stripe ID.
 */
async function updateInvoiceByStripeId(stripeId: string, status: "paid" | "failed") {
  try {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE sprint_invoices
          SET invoice_status = $1, updated_at = now()
        WHERE invoice_url ILIKE $2
        RETURNING id, sprint_id, label, invoice_status`,
      [status, `%${stripeId}%`]
    );

    if ((result.rowCount ?? 0) > 0) {
      console.log(
        `[StripeWebhook] Updated ${result.rowCount} invoice(s) to "${status}" for Stripe ID: ${stripeId}`
      );
      result.rows.forEach((row) => {
        console.log(`  → invoice ${row.id} (${row.label}) on sprint ${row.sprint_id}`);
      });
    } else {
      console.warn(
        `[StripeWebhook] No sprint_invoices matched Stripe ID: ${stripeId} — event logged but no DB update made`
      );
    }
  } catch (err) {
    console.error("[StripeWebhook] DB update error:", err);
    throw err;
  }
}
