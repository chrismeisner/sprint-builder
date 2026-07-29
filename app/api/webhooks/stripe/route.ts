import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { randomUUID } from "crypto";
import {
  sendEmail,
  generateInvoicePaidClientEmail,
  generateInvoicePaidAdminEmail,
  generateInvoiceProcessingAdminEmail,
  generateInvoiceProcessingClientEmail,
  generateRefinementCyclePaymentProcessingAdminEmail,
  generateRefinementCyclePaymentProcessingClientEmail,
  generateRefinementCyclePaymentPaidAdminEmail,
  generateRefinementCyclePaymentPaidClientEmail,
} from "@/lib/email";

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
 *   payment_intent.processing       → mark matching invoice as "processing" + notify admin (payment submitted, pending)
 *   payment_intent.succeeded        → mark matching invoice as "paid"
 *   payment_intent.payment_failed   → mark matching invoice as "failed"
 *   checkout.session.completed      → mark matching invoice as "paid"
 *   invoice.paid                    → mark matching invoice as "paid"
 *   invoice.payment_failed          → mark matching invoice as "failed"
 *   invoice.voided                  → mark matching invoice as "voided"
 *   charge.pending                  → mark matching invoice as "processing" (ACH/bank-transfer fallback when payment_intent.processing isn't emitted)
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

  const origin = new URL(request.url).origin;

  try {
    await handleEvent(event, origin);
  } catch (err) {
    console.error(`[StripeWebhook] Handler error for ${event.type}:`, err);
    // Return 200 so Stripe doesn't retry — log the error internally instead
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event dispatcher
// ---------------------------------------------------------------------------

async function handleEvent(event: import("stripe").Stripe.Event, origin: string) {
  switch (event.type) {
    case "payment_intent.processing":
      await onPaymentIntentProcessing(
        event.data.object as import("stripe").Stripe.PaymentIntent,
        origin
      );
      break;

    case "payment_intent.succeeded":
      await onPaymentIntentSucceeded(
        event.data.object as import("stripe").Stripe.PaymentIntent,
        origin
      );
      break;

    case "payment_intent.payment_failed":
      await onPaymentIntentFailed(
        event.data.object as import("stripe").Stripe.PaymentIntent,
        origin
      );
      break;

    case "checkout.session.completed":
      await onCheckoutSessionCompleted(
        event.data.object as import("stripe").Stripe.Checkout.Session,
        origin
      );
      break;

    case "invoice.paid":
      await onInvoicePaid(
        event.data.object as import("stripe").Stripe.Invoice,
        origin
      );
      break;

    case "invoice.payment_failed":
      await onInvoicePaymentFailed(
        event.data.object as import("stripe").Stripe.Invoice,
        origin
      );
      break;

    case "invoice.voided":
      await onInvoiceVoided(
        event.data.object as import("stripe").Stripe.Invoice,
        origin
      );
      break;

    case "charge.pending":
      await onChargePending(
        event.data.object as import("stripe").Stripe.Charge,
        origin
      );
      break;

    case "charge.refunded":
      await onChargeRefunded(
        event.data.object as import("stripe").Stripe.Charge,
        origin
      );
      break;

    default:
      console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
  }
}

// ---------------------------------------------------------------------------
// Individual event handlers
// ---------------------------------------------------------------------------

/** Resolve Stripe ID we can use to match sprint_invoices: prefer invoice id when this PaymentIntent is for an invoice. */
function paymentIntentToInvoiceStripeId(pi: import("stripe").Stripe.PaymentIntent): string {
  const inv = (pi as unknown as { invoice?: string | { id: string } | null }).invoice;
  if (typeof inv === "string") return inv;
  if (inv && typeof inv === "object" && "id" in inv) return (inv as { id: string }).id;
  return pi.id;
}

function customerIdOf(
  obj: { customer?: string | { id?: string } | null }
): string | null {
  const c = obj.customer;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && c.id) return c.id;
  return null;
}

/**
 * Under Stripe API 2026-01-28+, an invoice's PaymentIntent and Charge no longer
 * expose `invoice` or inherit the invoice's metadata — the link now lives in the
 * `invoice_payments` resource. So `payment_intent.processing` / `charge.pending`
 * events arrive with empty metadata and we can't recover `refinement_cycle_id`
 * from the event alone. Given a PaymentIntent id (+ its customer), walk the
 * customer's recent invoices and find the one whose invoice_payment references
 * this PI, so we can read its metadata and route the update correctly.
 */
async function findInvoiceForPaymentIntent(
  piId: string,
  customer: string | null
): Promise<import("stripe").Stripe.Invoice | null> {
  if (!customer) return null;
  try {
    const stripe = getStripe();
    const invoices = await stripe.invoices.list({ customer, limit: 20 });
    for (const inv of invoices.data) {
      if (!inv.id) continue;
      try {
        const pays = await stripe.invoicePayments.list({ invoice: inv.id, limit: 20 });
        const matched = pays.data.some((p) => {
          const pay = p.payment as { payment_intent?: string } | undefined;
          return pay?.payment_intent === piId;
        });
        if (matched) return inv;
      } catch (err) {
        console.error(
          `[StripeWebhook] invoice_payments lookup failed for invoice ${inv.id}:`,
          err
        );
      }
    }
  } catch (err) {
    console.error(
      `[StripeWebhook] Failed to resolve invoice for PaymentIntent ${piId}:`,
      err
    );
  }
  return null;
}

/**
 * Resolve the Stripe target id + routing metadata for a PaymentIntent/Charge
 * event. If the event already carries routing metadata (refinement_cycle_id or
 * invoice_id) we use it as-is; otherwise we recover the linked invoice via
 * `invoice_payments` and merge its metadata in. Returns the invoice id (so
 * sprint_invoices match by stripe_invoice_id) when an invoice is found.
 */
async function resolvePaymentTarget(
  fallbackStripeId: string,
  piId: string,
  customer: string | null,
  metadata: Record<string, string> | undefined
): Promise<{ stripeId: string; metadata: Record<string, string> | undefined }> {
  if (metadata?.refinement_cycle_id || metadata?.invoice_id) {
    return { stripeId: fallbackStripeId, metadata };
  }
  const inv = await findInvoiceForPaymentIntent(piId, customer);
  if (inv?.id) {
    return {
      stripeId: inv.id,
      metadata: { ...(metadata ?? {}), ...(inv.metadata ?? {}) },
    };
  }
  return { stripeId: fallbackStripeId, metadata };
}

async function onPaymentIntentProcessing(
  pi: import("stripe").Stripe.PaymentIntent,
  origin: string
) {
  console.log(`[StripeWebhook] PaymentIntent processing (payment submitted, pending): ${pi.id}`);
  const { stripeId, metadata } = await resolvePaymentTarget(
    paymentIntentToInvoiceStripeId(pi),
    pi.id,
    customerIdOf(pi),
    pi.metadata
  );
  await updateInvoiceStatus(stripeId, "processing", origin, metadata);
}

async function onPaymentIntentSucceeded(
  pi: import("stripe").Stripe.PaymentIntent,
  origin: string
) {
  console.log(`[StripeWebhook] PaymentIntent succeeded: ${pi.id}`);
  const { stripeId, metadata } = await resolvePaymentTarget(
    paymentIntentToInvoiceStripeId(pi),
    pi.id,
    customerIdOf(pi),
    pi.metadata
  );
  await updateInvoiceStatus(stripeId, "paid", origin, metadata);
}

async function onPaymentIntentFailed(
  pi: import("stripe").Stripe.PaymentIntent,
  origin: string
) {
  console.log(`[StripeWebhook] PaymentIntent failed: ${pi.id}`);
  const { stripeId, metadata } = await resolvePaymentTarget(
    paymentIntentToInvoiceStripeId(pi),
    pi.id,
    customerIdOf(pi),
    pi.metadata
  );
  await updateInvoiceStatus(stripeId, "failed", origin, metadata);
}

async function onCheckoutSessionCompleted(
  session: import("stripe").Stripe.Checkout.Session,
  origin: string
) {
  console.log(`[StripeWebhook] Checkout session completed: ${session.id}`);

  if (session.payment_intent && typeof session.payment_intent === "string") {
    await updateInvoiceStatus(session.payment_intent, "paid", origin, session.metadata ?? undefined);
  } else {
    await updateInvoiceStatus(session.id, "paid", origin, session.metadata ?? undefined);
  }
}

async function onInvoicePaid(invoice: import("stripe").Stripe.Invoice, origin: string) {
  console.log(`[StripeWebhook] Invoice paid: ${invoice.id}`);
  await updateInvoiceStatus(invoice.id, "paid", origin, invoice.metadata ?? undefined);
}

async function onInvoicePaymentFailed(invoice: import("stripe").Stripe.Invoice, origin: string) {
  console.log(`[StripeWebhook] Invoice payment failed: ${invoice.id}`);
  await updateInvoiceStatus(invoice.id, "failed", origin, invoice.metadata ?? undefined);
}

async function onInvoiceVoided(invoice: import("stripe").Stripe.Invoice, origin: string) {
  console.log(`[StripeWebhook] Invoice voided: ${invoice.id}`);
  await updateInvoiceStatus(invoice.id, "voided", origin, invoice.metadata ?? undefined);
}

// ACH / bank-transfer payments don't always trigger `payment_intent.processing`
// — Stripe may surface the in-flight state as `charge.pending` instead. Route
// it through the same "processing" path so the row gets stamped + notifications
// fire. COALESCE in the update statements protects against double-stamping when
// both events end up firing for the same payment.
async function onChargePending(charge: import("stripe").Stripe.Charge, origin: string) {
  console.log(`[StripeWebhook] Charge pending: ${charge.id}`);
  const maybeWithInvoice = charge as import("stripe").Stripe.Charge & {
    invoice?: string | { id?: string } | null;
  };
  const invoiceId =
    typeof maybeWithInvoice.invoice === "string"
      ? maybeWithInvoice.invoice
      : maybeWithInvoice.invoice?.id;
  const stripeId =
    invoiceId ??
    (typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.id);

  // We tag refinement_cycle_id on the invoice, not the charge — so for
  // invoice-backed charges we need to pull the invoice's metadata to route
  // the update to the right cycle. Fall back to charge.metadata when the
  // charge isn't tied to an invoice.
  let metadata: Record<string, string> | undefined =
    charge.metadata ?? undefined;
  if (invoiceId) {
    try {
      const stripe = getStripe();
      const inv = await stripe.invoices.retrieve(invoiceId);
      if (inv.metadata) metadata = { ...metadata, ...inv.metadata };
    } catch (err) {
      console.error(
        `[StripeWebhook] Failed to load invoice ${invoiceId} metadata for charge.pending:`,
        err
      );
    }
  }

  // Stripe API 2026-01-28+ no longer sets charge.invoice; recover the invoice
  // (and its metadata) from the charge's PaymentIntent via invoice_payments.
  const resolved = await resolvePaymentTarget(
    stripeId,
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.id,
    customerIdOf(charge),
    metadata
  );

  await updateInvoiceStatus(resolved.stripeId, "processing", origin, resolved.metadata);
}

async function onChargeRefunded(charge: import("stripe").Stripe.Charge, origin: string) {
  console.log(`[StripeWebhook] Charge refunded: ${charge.id}`);
  const maybeWithInvoice = charge as import("stripe").Stripe.Charge & {
    invoice?: string | { id?: string } | null;
  };
  const invoiceId =
    typeof maybeWithInvoice.invoice === "string"
      ? maybeWithInvoice.invoice
      : maybeWithInvoice.invoice?.id;
  const metadata = charge.metadata ?? undefined;
  const fallbackStripeId =
    invoiceId ?? (typeof charge.payment_intent === "string" ? charge.payment_intent : charge.id);
  const resolved = await resolvePaymentTarget(
    fallbackStripeId,
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.id,
    customerIdOf(charge),
    metadata
  );
  await updateInvoiceStatus(resolved.stripeId, "refunded", origin, resolved.metadata);
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
  status: "processing" | "paid" | "failed" | "voided" | "refunded",
  origin: string,
  metadata?: Record<string, string>
) {
  try {
    const pool = getPool();

    // Refinement Cycle invoices: tagged via metadata.refinement_cycle_id +
    // metadata.refinement_cycle_invoice_kind ('deposit' | 'final'). These rows
    // live in `refinement_cycles`, not `sprint_invoices`, so they take a
    // separate update path.
    if (metadata?.refinement_cycle_id) {
      await updateRefinementCycleStripeStatus(
        pool,
        metadata.refinement_cycle_id,
        metadata.refinement_cycle_invoice_kind === "final" ? "final" : "deposit",
        status,
        origin
      );
      return;
    }

    // Strategy 1: direct match via metadata.invoice_id
    if (metadata?.invoice_id) {
      const result = await pool.query(
        `WITH prev AS (
           SELECT id, invoice_status AS prev_status FROM sprint_invoices WHERE id = $2
         )
         UPDATE sprint_invoices si
            SET invoice_status = $1, updated_at = now()
           FROM prev
          WHERE si.id = prev.id
          RETURNING si.id, si.sprint_id, si.label, si.invoice_status, prev.prev_status`,
        [status, metadata.invoice_id]
      );
      if ((result.rowCount ?? 0) > 0) {
        await applyMatched(pool, result.rows, status, stripeId, origin, `metadata.invoice_id=${metadata.invoice_id}`);
        return;
      }
    }

    // Strategy 2: match by stripe_invoice_id column
    const byCol = await pool.query(
      `WITH prev AS (
         SELECT id, invoice_status AS prev_status FROM sprint_invoices WHERE stripe_invoice_id = $2
       )
       UPDATE sprint_invoices si
          SET invoice_status = $1, updated_at = now()
         FROM prev
        WHERE si.id = prev.id
        RETURNING si.id, si.sprint_id, si.label, si.invoice_status, prev.prev_status`,
      [status, stripeId]
    );
    if ((byCol.rowCount ?? 0) > 0) {
      await applyMatched(pool, byCol.rows, status, stripeId, origin, `stripe_invoice_id=${stripeId}`);
      return;
    }

    // Strategy 3: legacy URL-based fuzzy match
    const byUrl = await pool.query(
      `WITH prev AS (
         SELECT id, invoice_status AS prev_status FROM sprint_invoices WHERE invoice_url ILIKE $2
       )
       UPDATE sprint_invoices si
          SET invoice_status = $1, updated_at = now()
         FROM prev
        WHERE si.id = prev.id
        RETURNING si.id, si.sprint_id, si.label, si.invoice_status, prev.prev_status`,
      [status, `%${stripeId}%`]
    );
    if ((byUrl.rowCount ?? 0) > 0) {
      await applyMatched(pool, byUrl.rows, status, stripeId, origin, `invoice_url ILIKE %${stripeId}%`);
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

async function updateRefinementCycleStripeStatus(
  pool: ReturnType<typeof getPool>,
  cycleId: string,
  kind: "deposit" | "final",
  status: "processing" | "paid" | "failed" | "voided" | "refunded",
  origin: string
) {
  // The same payment surfaces as multiple Stripe events (e.g.
  // payment_intent.processing + charge.pending, or payment_intent.succeeded +
  // invoice.paid), all of which now route here. Each UPDATE stamps its
  // timestamp via COALESCE so it only takes the first time; we capture the
  // prior value and only fire notifications when WE performed that first
  // stamp — keeping emails exactly-once regardless of event fan-out.
  if (kind === "deposit") {
    if (status === "paid") {
      // Deposit cleared → cycle moves into in_progress and the studio knows
      // to start work. Only flip from awaiting_deposit so we don't trample
      // a manually-advanced state.
      const res = await pool.query(
        `WITH prev AS (
           SELECT deposit_paid_at AS old_ts FROM refinement_cycles WHERE id = $1
         )
         UPDATE refinement_cycles rc
         SET deposit_paid_at = COALESCE(rc.deposit_paid_at, now()),
             status = CASE
               WHEN rc.status = 'awaiting_deposit' THEN 'in_progress'
               ELSE rc.status
             END,
             updated_at = now()
         FROM prev
         WHERE rc.id = $1
         RETURNING rc.status, (prev.old_ts IS NULL) AS was_first`,
        [cycleId]
      );
      if ((res.rowCount ?? 0) > 0) {
        console.log(
          `[StripeWebhook] Refinement cycle ${cycleId} deposit paid → status=${res.rows[0].status}`
        );
        if (res.rows[0].was_first) {
          await sendCyclePaymentNotifications(pool, cycleId, "deposit", "paid", origin);
        }
      }
      return;
    }
    if (status === "processing") {
      const res = await pool.query(
        `WITH prev AS (
           SELECT deposit_payment_initiated_at AS old_ts FROM refinement_cycles WHERE id = $1
         )
         UPDATE refinement_cycles rc
         SET deposit_payment_initiated_at = COALESCE(rc.deposit_payment_initiated_at, now()),
             updated_at = now()
         FROM prev
         WHERE rc.id = $1
         RETURNING (prev.old_ts IS NULL) AS was_first`,
        [cycleId]
      );
      if ((res.rowCount ?? 0) > 0 && res.rows[0].was_first) {
        console.log(
          `[StripeWebhook] Refinement cycle ${cycleId} deposit payment processing — stamped`
        );
        await sendCyclePaymentNotifications(pool, cycleId, "deposit", "processing", origin);
      }
      return;
    }
    console.log(
      `[StripeWebhook] Refinement cycle ${cycleId} deposit invoice status=${status} (no-op)`
    );
    return;
  }

  // Final invoice paid → cycle moves from `awaiting_payment` (new flow) to
  // terminal `delivered`. Legacy cycles already in `delivered` only get the
  // final_paid_at stamp updated.
  if (status === "paid") {
    const res = await pool.query(
      `WITH prev AS (
         SELECT final_paid_at AS old_ts FROM refinement_cycles WHERE id = $1
       )
       UPDATE refinement_cycles rc
       SET final_paid_at = COALESCE(rc.final_paid_at, now()),
           status = CASE
             WHEN rc.status = 'awaiting_payment' THEN 'delivered'
             ELSE rc.status
           END,
           updated_at = now()
       FROM prev
       WHERE rc.id = $1
       RETURNING rc.status, (prev.old_ts IS NULL) AS was_first`,
      [cycleId]
    );
    if ((res.rowCount ?? 0) > 0) {
      console.log(
        `[StripeWebhook] Refinement cycle ${cycleId} final paid → status=${res.rows[0].status}`
      );
      if (res.rows[0].was_first) {
        await sendCyclePaymentNotifications(pool, cycleId, "final", "paid", origin);
      }
    }
    return;
  }
  if (status === "processing") {
    const res = await pool.query(
      `WITH prev AS (
         SELECT final_payment_initiated_at AS old_ts FROM refinement_cycles WHERE id = $1
       )
       UPDATE refinement_cycles rc
       SET final_payment_initiated_at = COALESCE(rc.final_payment_initiated_at, now()),
           updated_at = now()
       FROM prev
       WHERE rc.id = $1
       RETURNING (prev.old_ts IS NULL) AS was_first`,
      [cycleId]
    );
    if ((res.rowCount ?? 0) > 0 && res.rows[0].was_first) {
      console.log(
        `[StripeWebhook] Refinement cycle ${cycleId} final payment processing — stamped`
      );
      await sendCyclePaymentNotifications(pool, cycleId, "final", "processing", origin);
    }
    return;
  }
  console.log(
    `[StripeWebhook] Refinement cycle ${cycleId} final invoice status=${status} (no-op)`
  );
}

// Sends the client + admin notification pair for a refinement cycle invoice.
// `phase` selects the copy:
//   "processing" — payment submitted, in flight, not yet cleared (ACH pending)
//   "paid"       — payment cleared, funds available
// All sends are best-effort and never throw — Stripe webhooks must not retry
// on email failures.
async function sendCyclePaymentNotifications(
  pool: ReturnType<typeof getPool>,
  cycleId: string,
  kind: "deposit" | "final",
  phase: "processing" | "paid",
  origin: string
) {
  try {
    const infoRes = await pool.query(
      `SELECT rc.title, rc.submitter_email, rc.cc_emails,
              rc.total_price, rc.deposit_amount, rc.final_amount, rc.requires_deposit,
              p.name AS project_name, p.emoji AS project_emoji
       FROM refinement_cycles rc
       LEFT JOIN projects p ON p.id = rc.project_id
       WHERE rc.id = $1
       LIMIT 1`,
      [cycleId]
    );
    if ((infoRes.rowCount ?? 0) === 0) return;

    const info = infoRes.rows[0] as {
      title: string | null;
      submitter_email: string | null;
      cc_emails: string[] | null;
      total_price: string | number | null;
      deposit_amount: string | number | null;
      final_amount: string | number | null;
      requires_deposit: boolean | null;
      project_name: string | null;
      project_emoji: string | null;
    };

    const cycleUrl = `${origin}/dashboard/refinement-cycles/${cycleId}`;
    // Mirror the invoice amount chosen at creation (refinementCycleBilling):
    // the final invoice bills the remaining final_amount under the legacy
    // deposit flow, but the full total_price under pay-on-delivery
    // (requires_deposit = false). Keying off final_amount alone would
    // under-report pay-on-delivery cycles.
    const amount =
      kind === "deposit"
        ? Number(info.deposit_amount ?? 0)
        : info.requires_deposit
          ? Number(info.final_amount ?? 0)
          : Number(info.total_price ?? 0);

    // Client confirmation — submitter + cc_emails, deduped + lowercased.
    const clientRecipients = new Set<string>();
    if (info.submitter_email) clientRecipients.add(info.submitter_email.toLowerCase());
    for (const cc of info.cc_emails ?? []) {
      if (cc) clientRecipients.add(cc.toLowerCase());
    }
    for (const email of Array.from(clientRecipients)) {
      try {
        const content =
          phase === "paid"
            ? generateRefinementCyclePaymentPaidClientEmail({
                kind,
                cycleTitle: info.title,
                projectName: info.project_name,
                projectEmoji: info.project_emoji,
                amount,
              })
            : generateRefinementCyclePaymentProcessingClientEmail({
                kind,
                cycleTitle: info.title,
                projectName: info.project_name,
                projectEmoji: info.project_emoji,
                amount,
              });
        await sendEmail({
          to: email,
          ...content,
          category: "transactional",
          tag: `refinement-cycle-payment-${phase}-client`,
        });
      } catch (err) {
        console.error(
          `[StripeWebhook] Cycle ${phase} client email failed for ${email}:`,
          err
        );
      }
    }

    // Admin notification — every admin account.
    const clientEmailSummary =
      Array.from(clientRecipients).join(", ") || null;
    const adminRes = await pool.query(
      `SELECT email, first_name, last_name FROM accounts WHERE is_admin = true`
    );
    for (const admin of adminRes.rows as Array<{
      email: string;
      first_name: string | null;
      last_name: string | null;
    }>) {
      try {
        const adminName =
          [admin.first_name, admin.last_name].filter(Boolean).join(" ") || null;
        const content =
          phase === "paid"
            ? generateRefinementCyclePaymentPaidAdminEmail({
                kind,
                cycleTitle: info.title,
                projectName: info.project_name,
                projectEmoji: info.project_emoji,
                amount,
                clientEmail: clientEmailSummary,
                adminName,
                cycleUrl,
              })
            : generateRefinementCyclePaymentProcessingAdminEmail({
                kind,
                cycleTitle: info.title,
                projectName: info.project_name,
                projectEmoji: info.project_emoji,
                amount,
                clientEmail: clientEmailSummary,
                adminName,
                cycleUrl,
              });
        await sendEmail({
          to: admin.email,
          ...content,
          category: "transactional",
          tag: `refinement-cycle-payment-${phase}-admin`,
        });
      } catch (err) {
        console.error(
          `[StripeWebhook] Cycle ${phase} admin email failed for ${admin.email}:`,
          err
        );
      }
    }
  } catch (err) {
    console.error(
      `[StripeWebhook] Cycle ${phase} notifications failed for ${cycleId}:`,
      err
    );
  }
}

// Logs every matched row, then writes changelogs + fires notifications only
// for rows that actually transitioned to a new status. Multiple Stripe events
// fire for one payment (payment_intent.succeeded + invoice.paid, etc.) and all
// now resolve to the same invoice — gating on the prior status keeps changelog
// entries and emails exactly-once.
async function applyMatched(
  pool: ReturnType<typeof getPool>,
  rows: Array<{ id: string; sprint_id: string; label: string; invoice_status: string; prev_status: string }>,
  status: "processing" | "paid" | "failed" | "voided" | "refunded",
  stripeId: string,
  origin: string,
  matchedBy: string
) {
  logUpdated(rows, status, matchedBy);
  const changed = rows.filter((r) => r.prev_status !== status);
  if (changed.length === 0) {
    console.log(
      `[StripeWebhook] ${rows.length} invoice(s) already at "${status}" — skipping changelog/notifications (duplicate event)`
    );
    return;
  }
  await writeChangelogs(pool, changed, status, stripeId, origin);
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
  status: "processing" | "paid" | "failed" | "voided" | "refunded",
  stripeId: string,
  origin: string
) {
  const summaryMap: Record<string, string> = {
    processing: "Payment submitted — pending (not yet cleared)",
    paid: "Invoice payment received via Stripe",
    failed: "Stripe invoice payment failed",
    voided: "Stripe invoice voided",
    refunded: "Stripe charge refunded",
  };
  const actionMap: Record<string, string> = {
    processing: "invoice_processing",
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

  if (status === "processing") {
    await sendInvoiceProcessingNotifications(pool, rows, origin);
  }
  if (status === "paid") {
    await sendInvoicePaidNotifications(pool, rows, origin);
  }
}

/**
 * Fires when the client has submitted payment and it's in the pending state (payment_intent.processing).
 * Notifies admins that payment is pending; confirms to the client. Settlement notification is sent later via sendInvoicePaidNotifications.
 */
async function sendInvoiceProcessingNotifications(
  pool: ReturnType<typeof getPool>,
  rows: Array<{ id: string; sprint_id: string; label: string }>,
  origin: string
) {
  for (const row of rows) {
    try {
      const infoRes = await pool.query(
        `SELECT si.amount, sd.title AS sprint_title, sd.project_id
         FROM sprint_invoices si
         JOIN sprint_drafts sd ON sd.id = si.sprint_id
         WHERE si.id = $1`,
        [row.id]
      );
      if ((infoRes.rowCount ?? 0) === 0) continue;

      const info = infoRes.rows[0] as {
        amount: number | null;
        sprint_title: string | null;
        project_id: string | null;
      };

      const amount = info.amount ?? 0;
      const sprintUrl = `${origin}/sprints/${row.sprint_id}`;

      // Resolve client recipients
      type MemberRow = { email: string; name: string | null };
      let clientRecipients: MemberRow[] = [];
      if (info.project_id) {
        const membersRes = await pool.query(
          `SELECT pm.email,
                  COALESCE(NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''), a.name) AS name
           FROM project_members pm
           LEFT JOIN accounts a ON lower(pm.email) = lower(a.email)
           WHERE pm.project_id = $1 AND COALESCE(a.is_admin, false) = false
           ORDER BY pm.created_at ASC`,
          [info.project_id]
        );
        clientRecipients = membersRes.rows as MemberRow[];
      }
      if (clientRecipients.length === 0) {
        const fallbackRes = await pool.query(
          `SELECT a.email,
                  COALESCE(NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''), a.name) AS name
           FROM sprint_drafts sd
           LEFT JOIN projects p ON p.id = sd.project_id
           LEFT JOIN documents d ON d.id = sd.document_id
           LEFT JOIN accounts a ON a.id = COALESCE(p.account_id, d.account_id)
           WHERE sd.id = $1 AND a.is_admin = false AND a.email IS NOT NULL`,
          [row.sprint_id]
        );
        clientRecipients = fallbackRes.rows as MemberRow[];
      }

      // Client confirmation emails
      for (const recipient of clientRecipients) {
        try {
          const content = generateInvoiceProcessingClientEmail({
            invoiceLabel: row.label,
            invoiceAmount: amount,
            sprintTitle: info.sprint_title,
            clientName: recipient.name,
            sprintUrl,
          });
          await sendEmail({
            to: recipient.email,
            ...content,
            category: "transactional",
            tag: "invoice-processing-client",
          });
        } catch (err) {
          console.error(`[StripeWebhook] Processing client email failed for ${recipient.email}:`, err);
        }
      }

      // Admin notification
      const clientEmailSummary = clientRecipients.map((r) => r.email).join(", ") || null;
      const adminRes = await pool.query(
        `SELECT email, first_name, last_name FROM accounts WHERE is_admin = true`
      );
      for (const admin of adminRes.rows as Array<{ email: string; first_name: string | null; last_name: string | null }>) {
        try {
          const adminName = [admin.first_name, admin.last_name].filter(Boolean).join(" ") || null;
          const content = generateInvoiceProcessingAdminEmail({
            invoiceLabel: row.label,
            invoiceAmount: amount,
            adminName,
            clientEmail: clientEmailSummary,
            sprintTitle: info.sprint_title,
            sprintUrl,
          });
          await sendEmail({
            to: admin.email,
            ...content,
            category: "transactional",
            tag: "invoice-processing-admin",
          });
        } catch (err) {
          console.error(`[StripeWebhook] Processing admin email failed for ${admin.email}:`, err);
        }
      }
    } catch (err) {
      console.error(`[StripeWebhook] Processing notifications failed for invoice ${row.id}:`, err);
    }
  }
}

/**
 * Sends a payment confirmation to non-admin project members and an internal
 * notification to all admin accounts whenever a Stripe invoice is marked as paid.
 */
async function sendInvoicePaidNotifications(
  pool: ReturnType<typeof getPool>,
  rows: Array<{ id: string; sprint_id: string; label: string }>,
  origin: string
) {
  for (const row of rows) {
    try {
      // Resolve invoice amount and sprint info
      const infoRes = await pool.query(
        `SELECT si.amount, sd.title AS sprint_title, sd.project_id
         FROM sprint_invoices si
         JOIN sprint_drafts sd ON sd.id = si.sprint_id
         WHERE si.id = $1`,
        [row.id]
      );

      if ((infoRes.rowCount ?? 0) === 0) {
        console.warn(
          `[StripeWebhook] Could not resolve sprint for invoice ${row.id} — skipping paid notification`
        );
        continue;
      }

      const info = infoRes.rows[0] as {
        amount: number | null;
        sprint_title: string | null;
        project_id: string | null;
      };

      const amount = info.amount ?? 0;
      const sprintUrl = `${origin}/sprints/${row.sprint_id}`;

      // Resolve client recipients: non-admin project members
      type MemberRow = { email: string; name: string | null };
      let clientRecipients: MemberRow[] = [];

      if (info.project_id) {
        const membersRes = await pool.query(
          `SELECT pm.email,
                  COALESCE(
                    NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''),
                    a.name
                  ) AS name
           FROM project_members pm
           LEFT JOIN accounts a ON lower(pm.email) = lower(a.email)
           WHERE pm.project_id = $1 AND COALESCE(a.is_admin, false) = false
           ORDER BY pm.created_at ASC`,
          [info.project_id]
        );
        clientRecipients = membersRes.rows as MemberRow[];
      }

      // Fall back to the project/document account owner if no project members found
      if (clientRecipients.length === 0) {
        const fallbackRes = await pool.query(
          `SELECT a.email,
                  COALESCE(
                    NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''),
                    a.name
                  ) AS name
           FROM sprint_drafts sd
           LEFT JOIN projects p ON p.id = sd.project_id
           LEFT JOIN documents d ON d.id = sd.document_id
           LEFT JOIN accounts a ON a.id = COALESCE(p.account_id, d.account_id)
           WHERE sd.id = $1 AND a.is_admin = false AND a.email IS NOT NULL`,
          [row.sprint_id]
        );
        clientRecipients = fallbackRes.rows as MemberRow[];
      }

      // — Client confirmation emails (one per recipient) —
      for (const recipient of clientRecipients) {
        try {
          const clientContent = generateInvoicePaidClientEmail({
            invoiceLabel: row.label,
            invoiceAmount: amount,
            sprintTitle: info.sprint_title,
            clientName: recipient.name,
            sprintUrl,
          });
          await sendEmail({
            to: recipient.email,
            ...clientContent,
            category: "transactional",
            tag: "invoice-paid-client",
          });
        } catch (err) {
          console.error(
            `[StripeWebhook] Failed to send paid confirmation to ${recipient.email}:`,
            err
          );
        }
      }

      // — Admin notification email (all admin accounts) —
      const clientEmailSummary = clientRecipients.map((r) => r.email).join(", ") || null;
      const clientNameSummary = clientRecipients[0]?.name ?? null;

      const adminRes = await pool.query(
        `SELECT email, first_name, last_name FROM accounts WHERE is_admin = true`
      );
      for (const admin of adminRes.rows as Array<{
        email: string;
        first_name: string | null;
        last_name: string | null;
      }>) {
        const adminName = [admin.first_name, admin.last_name].filter(Boolean).join(" ") || null;
        const adminContent = generateInvoicePaidAdminEmail({
          invoiceLabel: row.label,
          invoiceAmount: amount,
          sprintTitle: info.sprint_title,
          clientName: clientNameSummary,
          clientEmail: clientEmailSummary ?? "",
          adminName,
        });
        try {
          await sendEmail({
            to: admin.email,
            ...adminContent,
            category: "transactional",
            tag: "invoice-paid-admin",
          });
        } catch (err) {
          console.error(`[StripeWebhook] Failed to send admin notification to ${admin.email}:`, err);
        }
      }
    } catch (err) {
      // Non-blocking — a notification failure must never cause Stripe retries
      console.error(
        `[StripeWebhook] Failed to send paid notifications for invoice ${row.id}:`,
        err
      );
    }
  }
}
