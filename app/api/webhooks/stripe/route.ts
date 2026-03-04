import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { randomUUID } from "crypto";

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
 *   invoice.voided                  → mark matching invoice as "voided"
 *   charge.refunded                 → mark matching invoice as "refunded"
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
    const stripe = getStripe();
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

    case "invoice.voided":
      await onInvoiceVoided(
        event.data.object as import("stripe").Stripe.Invoice
      );
      break;

    case "charge.refunded":
      await onChargeRefunded(
        event.data.object as import("stripe").Stripe.Charge
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
  await updateInvoiceStatus(pi.id, "paid", pi.metadata);
}

async function onPaymentIntentFailed(
  pi: import("stripe").Stripe.PaymentIntent
) {
  console.log(`[StripeWebhook] PaymentIntent failed: ${pi.id}`);
  await updateInvoiceStatus(pi.id, "failed", pi.metadata);
}

async function onCheckoutSessionCompleted(
  session: import("stripe").Stripe.Checkout.Session
) {
  console.log(`[StripeWebhook] Checkout session completed: ${session.id}`);

  if (session.payment_intent && typeof session.payment_intent === "string") {
    await updateInvoiceStatus(session.payment_intent, "paid", session.metadata ?? undefined);
  } else {
    await updateInvoiceStatus(session.id, "paid", session.metadata ?? undefined);
  }
}

async function onInvoicePaid(invoice: import("stripe").Stripe.Invoice) {
  console.log(`[StripeWebhook] Invoice paid: ${invoice.id}`);
  await updateInvoiceStatus(invoice.id, "paid", invoice.metadata ?? undefined);
}

async function onInvoicePaymentFailed(invoice: import("stripe").Stripe.Invoice) {
  console.log(`[StripeWebhook] Invoice payment failed: ${invoice.id}`);
  await updateInvoiceStatus(invoice.id, "failed", invoice.metadata ?? undefined);
}

async function onInvoiceVoided(invoice: import("stripe").Stripe.Invoice) {
  console.log(`[StripeWebhook] Invoice voided: ${invoice.id}`);
  await updateInvoiceStatus(invoice.id, "voided", invoice.metadata ?? undefined);
}

async function onChargeRefunded(charge: import("stripe").Stripe.Charge) {
  console.log(`[StripeWebhook] Charge refunded: ${charge.id}`);
  const maybeWithInvoice = charge as import("stripe").Stripe.Charge & {
    invoice?: string | { id?: string } | null;
  };
  const invoiceId =
    typeof maybeWithInvoice.invoice === "string"
      ? maybeWithInvoice.invoice
      : maybeWithInvoice.invoice?.id;
  const metadata = charge.metadata ?? undefined;
  if (invoiceId) {
    await updateInvoiceStatus(invoiceId, "refunded", metadata);
  } else {
    await updateInvoiceStatus(charge.payment_intent as string, "refunded", metadata);
  }
}

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------

/**
 * Updates a sprint_invoice's status. Matching strategy (in priority order):
 * 1. metadata.invoice_id — direct row ID set when we created the Stripe invoice
 * 2. stripe_invoice_id column — matches the Stripe object ID we stored on creation
 * 3. invoice_url ILIKE — legacy fallback for manually-pasted Stripe URLs
 */
async function updateInvoiceStatus(
  stripeId: string,
  status: "paid" | "failed" | "voided" | "refunded",
  metadata?: Record<string, string>
) {
  try {
    const pool = getPool();

    // Strategy 1: direct match via metadata.invoice_id
    if (metadata?.invoice_id) {
      const result = await pool.query(
        `UPDATE sprint_invoices
            SET invoice_status = $1, updated_at = now()
          WHERE id = $2
          RETURNING id, sprint_id, label, invoice_status`,
        [status, metadata.invoice_id]
      );
      if ((result.rowCount ?? 0) > 0) {
        logUpdated(result.rows, status, `metadata.invoice_id=${metadata.invoice_id}`);
        await writeChangelogs(pool, result.rows, status, stripeId);
        return;
      }
    }

    // Strategy 2: match by stripe_invoice_id column
    const byCol = await pool.query(
      `UPDATE sprint_invoices
          SET invoice_status = $1, updated_at = now()
        WHERE stripe_invoice_id = $2
        RETURNING id, sprint_id, label, invoice_status`,
      [status, stripeId]
    );
    if ((byCol.rowCount ?? 0) > 0) {
      logUpdated(byCol.rows, status, `stripe_invoice_id=${stripeId}`);
      await writeChangelogs(pool, byCol.rows, status, stripeId);
      return;
    }

    // Strategy 3: legacy URL-based fuzzy match
    const byUrl = await pool.query(
      `UPDATE sprint_invoices
          SET invoice_status = $1, updated_at = now()
        WHERE invoice_url ILIKE $2
        RETURNING id, sprint_id, label, invoice_status`,
      [status, `%${stripeId}%`]
    );
    if ((byUrl.rowCount ?? 0) > 0) {
      logUpdated(byUrl.rows, status, `invoice_url ILIKE %${stripeId}%`);
      await writeChangelogs(pool, byUrl.rows, status, stripeId);
      return;
    }

    console.warn(
      `[StripeWebhook] No sprint_invoices matched Stripe ID: ${stripeId} — event logged but no DB update made`
    );
  } catch (err) {
    console.error("[StripeWebhook] DB update error:", err);
    throw err;
  }
}

function logUpdated(
  rows: Array<{ id: string; sprint_id: string; label: string }>,
  status: string,
  matchedBy: string
) {
  console.log(
    `[StripeWebhook] Updated ${rows.length} invoice(s) to "${status}" (matched by ${matchedBy})`
  );
  rows.forEach((row) => {
    console.log(`  → invoice ${row.id} (${row.label}) on sprint ${row.sprint_id}`);
  });
}

async function writeChangelogs(
  pool: ReturnType<typeof getPool>,
  rows: Array<{ id: string; sprint_id: string; label: string; invoice_status: string }>,
  status: "paid" | "failed" | "voided" | "refunded",
  stripeId: string
) {
  const summaryMap: Record<string, string> = {
    paid: "Invoice payment received via Stripe",
    failed: "Stripe invoice payment failed",
    voided: "Stripe invoice voided",
    refunded: "Stripe charge refunded",
  };
  const actionMap: Record<string, string> = {
    paid: "invoice_paid",
    failed: "invoice_payment_failed",
    voided: "invoice_voided",
    refunded: "invoice_refunded",
  };

  for (const row of rows) {
    try {
      await pool.query(
        `INSERT INTO sprint_draft_changelog (id, sprint_draft_id, account_id, action, summary, details)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
        [
          randomUUID(),
          row.sprint_id,
          null,
          actionMap[status],
          `${summaryMap[status]} for invoice "${row.label}"`,
          JSON.stringify({ invoice_id: row.id, label: row.label, stripe_id: stripeId, status }),
        ]
      );
    } catch (err) {
      // Non-blocking — don't fail the webhook if changelog write fails
      console.error("[StripeWebhook] Changelog write error:", err);
    }
  }
}
