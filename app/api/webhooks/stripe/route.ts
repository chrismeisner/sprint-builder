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

async function onPaymentIntentProcessing(
  pi: import("stripe").Stripe.PaymentIntent,
  origin: string
) {
  const stripeId = paymentIntentToInvoiceStripeId(pi);
  console.log(`[StripeWebhook] PaymentIntent processing (payment submitted, pending): ${pi.id}`);
  await updateInvoiceStatus(stripeId, "processing", origin, pi.metadata);
}

async function onPaymentIntentSucceeded(
  pi: import("stripe").Stripe.PaymentIntent,
  origin: string
) {
  const stripeId = paymentIntentToInvoiceStripeId(pi);
  console.log(`[StripeWebhook] PaymentIntent succeeded: ${pi.id}`);
  await updateInvoiceStatus(stripeId, "paid", origin, pi.metadata);
}

async function onPaymentIntentFailed(
  pi: import("stripe").Stripe.PaymentIntent,
  origin: string
) {
  const stripeId = paymentIntentToInvoiceStripeId(pi);
  console.log(`[StripeWebhook] PaymentIntent failed: ${pi.id}`);
  await updateInvoiceStatus(stripeId, "failed", origin, pi.metadata);
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
  if (invoiceId) {
    await updateInvoiceStatus(invoiceId, "refunded", origin, metadata);
  } else {
    await updateInvoiceStatus(charge.payment_intent as string, "refunded", origin, metadata);
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
        `UPDATE sprint_invoices
            SET invoice_status = $1, updated_at = now()
          WHERE id = $2
          RETURNING id, sprint_id, label, invoice_status`,
        [status, metadata.invoice_id]
      );
      if ((result.rowCount ?? 0) > 0) {
        logUpdated(result.rows, status, `metadata.invoice_id=${metadata.invoice_id}`);
        await writeChangelogs(pool, result.rows, status, stripeId, origin);
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
      await writeChangelogs(pool, byCol.rows, status, stripeId, origin);
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
      await writeChangelogs(pool, byUrl.rows, status, stripeId, origin);
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
  if (kind === "deposit") {
    if (status === "paid") {
      // Deposit cleared → cycle moves into in_progress and the studio knows
      // to start work. Only flip from awaiting_deposit so we don't trample
      // a manually-advanced state.
      const res = await pool.query(
        `UPDATE refinement_cycles
         SET deposit_paid_at = COALESCE(deposit_paid_at, now()),
             status = CASE
               WHEN status = 'awaiting_deposit' THEN 'in_progress'
               ELSE status
             END,
             updated_at = now()
         WHERE id = $1
         RETURNING id, status`,
        [cycleId]
      );
      if ((res.rowCount ?? 0) > 0) {
        console.log(
          `[StripeWebhook] Refinement cycle ${cycleId} deposit paid → status=${res.rows[0].status}`
        );
      }
      return;
    }
    if (status === "processing") {
      const res = await pool.query(
        `UPDATE refinement_cycles
         SET deposit_payment_initiated_at = COALESCE(deposit_payment_initiated_at, now()),
             updated_at = now()
         WHERE id = $1
         RETURNING id`,
        [cycleId]
      );
      if ((res.rowCount ?? 0) > 0) {
        console.log(
          `[StripeWebhook] Refinement cycle ${cycleId} deposit payment processing — stamped`
        );
        await sendCyclePaymentProcessingNotifications(pool, cycleId, "deposit", origin);
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
      `UPDATE refinement_cycles
       SET final_paid_at = COALESCE(final_paid_at, now()),
           status = CASE
             WHEN status = 'awaiting_payment' THEN 'delivered'
             ELSE status
           END,
           updated_at = now()
       WHERE id = $1
       RETURNING id, status`,
      [cycleId]
    );
    if ((res.rowCount ?? 0) > 0) {
      console.log(
        `[StripeWebhook] Refinement cycle ${cycleId} final paid → status=${res.rows[0].status}`
      );
    }
    return;
  }
  if (status === "processing") {
    const res = await pool.query(
      `UPDATE refinement_cycles
       SET final_payment_initiated_at = COALESCE(final_payment_initiated_at, now()),
           updated_at = now()
       WHERE id = $1
       RETURNING id`,
      [cycleId]
    );
    if ((res.rowCount ?? 0) > 0) {
      console.log(
        `[StripeWebhook] Refinement cycle ${cycleId} final payment processing — stamped`
      );
      await sendCyclePaymentProcessingNotifications(pool, cycleId, "final", origin);
    }
    return;
  }
  console.log(
    `[StripeWebhook] Refinement cycle ${cycleId} final invoice status=${status} (no-op)`
  );
}

// Sends two emails when a refinement cycle invoice enters processing:
//   1. Admin notification — flags that payment is in flight, not yet cleared.
//   2. Client confirmation — reassures the submitter (and CC list) that the
//      studio has seen their bank transfer.
// All sends are best-effort and never throw — Stripe webhooks must not retry
// on email failures.
async function sendCyclePaymentProcessingNotifications(
  pool: ReturnType<typeof getPool>,
  cycleId: string,
  kind: "deposit" | "final",
  origin: string
) {
  try {
    const infoRes = await pool.query(
      `SELECT rc.title, rc.submitter_email, rc.cc_emails,
              rc.total_price, rc.deposit_amount, rc.final_amount,
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
      project_name: string | null;
      project_emoji: string | null;
    };

    const cycleUrl = `${origin}/dashboard/refinement-cycles/${cycleId}`;
    // For new pay-on-delivery cycles the final invoice is the full
    // total_price; legacy cycles split into deposit/final. Fall back through
    // the columns so either path renders a sensible amount.
    const amount =
      kind === "deposit"
        ? Number(info.deposit_amount ?? 0)
        : Number(info.final_amount ?? info.total_price ?? 0);

    // Client confirmation — submitter + cc_emails, deduped + lowercased.
    const clientRecipients = new Set<string>();
    if (info.submitter_email) clientRecipients.add(info.submitter_email.toLowerCase());
    for (const cc of info.cc_emails ?? []) {
      if (cc) clientRecipients.add(cc.toLowerCase());
    }
    for (const email of Array.from(clientRecipients)) {
      try {
        const content = generateRefinementCyclePaymentProcessingClientEmail({
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
          tag: "refinement-cycle-payment-processing-client",
        });
      } catch (err) {
        console.error(
          `[StripeWebhook] Cycle processing client email failed for ${email}:`,
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
        const content = generateRefinementCyclePaymentProcessingAdminEmail({
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
          tag: "refinement-cycle-payment-processing-admin",
        });
      } catch (err) {
        console.error(
          `[StripeWebhook] Cycle processing admin email failed for ${admin.email}:`,
          err
        );
      }
    }
  } catch (err) {
    console.error(
      `[StripeWebhook] Cycle processing notifications failed for ${cycleId}:`,
      err
    );
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
