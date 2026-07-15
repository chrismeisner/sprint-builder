import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { recordHillBillingEvent } from "@/lib/hillBilling";
import {
  sendEmail,
  generateInvoicePaidClientEmail,
  generateInvoicePaidAdminEmail,
  generateInvoiceProcessingAdminEmail,
  generateInvoiceProcessingClientEmail,
} from "@/lib/email";

/**
 * POST /api/webhooks/stripe
 *
 * Receives and verifies Stripe webhook events, then reconciles them against the
 * hill-native billing satellite (`hill_invoices`). Hills are authoritative for
 * client billing: every Stripe invoice we create is stamped with
 * metadata.{hill_id, hill_invoice_id} (see lib/hillInvoicing.ts), so payments
 * route straight back to the owning invoice row.
 *
 * The raw request body must be read before any JSON parsing so the HMAC
 * signature can be validated against the exact bytes Stripe signed.
 *
 * Events handled:
 *   payment_intent.processing       → invoice "processing" (payment submitted, pending) + notify
 *   payment_intent.succeeded        → invoice "paid"
 *   payment_intent.payment_failed   → invoice "failed"
 *   checkout.session.completed      → invoice "paid"
 *   invoice.paid                    → invoice "paid"
 *   invoice.payment_failed          → invoice "failed"
 *   invoice.voided                  → invoice "voided"
 *   charge.pending                  → invoice "processing" (ACH fallback)
 *   charge.refunded                 → invoice "refunded"
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[StripeWebhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
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
      await onPaymentIntentStatus(event.data.object as import("stripe").Stripe.PaymentIntent, "processing", origin);
      break;
    case "payment_intent.succeeded":
      await onPaymentIntentStatus(event.data.object as import("stripe").Stripe.PaymentIntent, "paid", origin);
      break;
    case "payment_intent.payment_failed":
      await onPaymentIntentStatus(event.data.object as import("stripe").Stripe.PaymentIntent, "failed", origin);
      break;
    case "checkout.session.completed":
      await onCheckoutSessionCompleted(event.data.object as import("stripe").Stripe.Checkout.Session, origin);
      break;
    case "invoice.paid":
      await updateInvoiceStatus((event.data.object as import("stripe").Stripe.Invoice).id, "paid", origin, (event.data.object as import("stripe").Stripe.Invoice).metadata ?? undefined);
      break;
    case "invoice.payment_failed":
      await updateInvoiceStatus((event.data.object as import("stripe").Stripe.Invoice).id, "failed", origin, (event.data.object as import("stripe").Stripe.Invoice).metadata ?? undefined);
      break;
    case "invoice.voided":
      await updateInvoiceStatus((event.data.object as import("stripe").Stripe.Invoice).id, "voided", origin, (event.data.object as import("stripe").Stripe.Invoice).metadata ?? undefined);
      break;
    case "charge.pending":
      await onChargeStatus(event.data.object as import("stripe").Stripe.Charge, "processing", origin);
      break;
    case "charge.refunded":
      await onChargeStatus(event.data.object as import("stripe").Stripe.Charge, "refunded", origin);
      break;
    default:
      console.log(`[StripeWebhook] Unhandled event type: ${event.type}`);
  }
}

// ---------------------------------------------------------------------------
// Event → target resolution
// ---------------------------------------------------------------------------

type InvoiceStatus = "processing" | "paid" | "failed" | "voided" | "refunded";

/** Prefer the invoice id when a PaymentIntent is for an invoice; else the PI id. */
function paymentIntentToInvoiceStripeId(pi: import("stripe").Stripe.PaymentIntent): string {
  const inv = (pi as unknown as { invoice?: string | { id: string } | null }).invoice;
  if (typeof inv === "string") return inv;
  if (inv && typeof inv === "object" && "id" in inv) return (inv as { id: string }).id;
  return pi.id;
}

function customerIdOf(obj: { customer?: string | { id?: string } | null }): string | null {
  const c = obj.customer;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && c.id) return c.id;
  return null;
}

/**
 * Under Stripe API 2026-01-28+, an invoice's PaymentIntent and Charge no longer
 * expose `invoice` or inherit the invoice's metadata — the link now lives in the
 * `invoice_payments` resource. So `payment_intent.processing` / `charge.pending`
 * events arrive with empty metadata and we can't recover `hill_invoice_id` from
 * the event alone. Given a PaymentIntent id (+ its customer), walk the customer's
 * recent invoices and find the one whose invoice_payment references this PI, so
 * we can read its metadata and route the update correctly.
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
        console.error(`[StripeWebhook] invoice_payments lookup failed for invoice ${inv.id}:`, err);
      }
    }
  } catch (err) {
    console.error(`[StripeWebhook] Failed to resolve invoice for PaymentIntent ${piId}:`, err);
  }
  return null;
}

/**
 * Resolve the Stripe target id + routing metadata for a PaymentIntent/Charge
 * event. If the event already carries hill_invoice_id we use it as-is; otherwise
 * we recover the linked invoice via `invoice_payments` and merge its metadata in,
 * returning the invoice id (so hill_invoices matches by stripe_invoice_id).
 */
async function resolvePaymentTarget(
  fallbackStripeId: string,
  piId: string,
  customer: string | null,
  metadata: Record<string, string> | undefined
): Promise<{ stripeId: string; metadata: Record<string, string> | undefined }> {
  if (metadata?.hill_invoice_id) {
    return { stripeId: fallbackStripeId, metadata };
  }
  const inv = await findInvoiceForPaymentIntent(piId, customer);
  if (inv?.id) {
    return { stripeId: inv.id, metadata: { ...(metadata ?? {}), ...(inv.metadata ?? {}) } };
  }
  return { stripeId: fallbackStripeId, metadata };
}

async function onPaymentIntentStatus(
  pi: import("stripe").Stripe.PaymentIntent,
  status: InvoiceStatus,
  origin: string
) {
  console.log(`[StripeWebhook] PaymentIntent ${status}: ${pi.id}`);
  const { stripeId, metadata } = await resolvePaymentTarget(
    paymentIntentToInvoiceStripeId(pi),
    pi.id,
    customerIdOf(pi),
    pi.metadata
  );
  await updateInvoiceStatus(stripeId, status, origin, metadata);
}

async function onCheckoutSessionCompleted(
  session: import("stripe").Stripe.Checkout.Session,
  origin: string
) {
  console.log(`[StripeWebhook] Checkout session completed: ${session.id}`);
  const stripeId =
    session.payment_intent && typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.id;
  await updateInvoiceStatus(stripeId, "paid", origin, session.metadata ?? undefined);
}

// ACH / bank-transfer payments don't always trigger `payment_intent.processing`
// — Stripe may surface the in-flight state as `charge.pending` instead, and
// refunds as `charge.refunded`. Recover the invoice + its metadata and route
// through the same update path.
async function onChargeStatus(
  charge: import("stripe").Stripe.Charge,
  status: InvoiceStatus,
  origin: string
) {
  console.log(`[StripeWebhook] Charge ${status}: ${charge.id}`);
  const maybeWithInvoice = charge as import("stripe").Stripe.Charge & {
    invoice?: string | { id?: string } | null;
  };
  const invoiceId =
    typeof maybeWithInvoice.invoice === "string" ? maybeWithInvoice.invoice : maybeWithInvoice.invoice?.id;
  const fallbackStripeId =
    invoiceId ?? (typeof charge.payment_intent === "string" ? charge.payment_intent : charge.id);

  let metadata: Record<string, string> | undefined = charge.metadata ?? undefined;
  if (invoiceId) {
    try {
      const inv = await getStripe().invoices.retrieve(invoiceId);
      if (inv.metadata) metadata = { ...metadata, ...inv.metadata };
    } catch (err) {
      console.error(`[StripeWebhook] Failed to load invoice ${invoiceId} metadata for charge:`, err);
    }
  }

  const resolved = await resolvePaymentTarget(
    fallbackStripeId,
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.id,
    customerIdOf(charge),
    metadata
  );
  await updateInvoiceStatus(resolved.stripeId, status, origin, resolved.metadata);
}

// ---------------------------------------------------------------------------
// Reconcile against hill_invoices
// ---------------------------------------------------------------------------

type MatchedInvoice = {
  id: string;
  hill_id: string;
  label: string;
  amount: string | number | null;
  prev_status: string;
};

/**
 * Update a hill_invoices row's status. Matching strategy (priority order):
 * 1. metadata.hill_invoice_id — the row id we stamped onto the Stripe invoice.
 * 2. stripe_invoice_id column — the Stripe invoice id we stored on send.
 *
 * paid/processing also stamp paid_at / payment_initiated_at via COALESCE so a
 * timestamp is only set once even when several Stripe events fire for one
 * payment. We gate the hill-timeline event + emails on an actual status change
 * to keep them exactly-once under event fan-out.
 */
async function updateInvoiceStatus(
  stripeId: string,
  status: InvoiceStatus,
  origin: string,
  metadata?: Record<string, string>
) {
  const pool = getPool();
  const tsCol = status === "paid" ? "paid_at" : status === "processing" ? "payment_initiated_at" : null;

  const runUpdate = async (matchCol: "id" | "stripe_invoice_id", value: string) => {
    const tsSet = tsCol ? `${tsCol} = COALESCE(hi.${tsCol}, now()),` : "";
    const res = await pool.query(
      `WITH prev AS (
         SELECT id, invoice_status AS prev_status FROM hill_invoices WHERE ${matchCol} = $2
       )
       UPDATE hill_invoices hi
          SET invoice_status = $1, ${tsSet} updated_at = now()
         FROM prev
        WHERE hi.id = prev.id
        RETURNING hi.id, hi.hill_id, hi.label, hi.amount, prev.prev_status`,
      [status, value]
    );
    return res.rows as MatchedInvoice[];
  };

  try {
    let rows: MatchedInvoice[] = [];
    let matchedBy = "";
    if (metadata?.hill_invoice_id) {
      rows = await runUpdate("id", metadata.hill_invoice_id);
      matchedBy = `metadata.hill_invoice_id=${metadata.hill_invoice_id}`;
    }
    if (rows.length === 0) {
      rows = await runUpdate("stripe_invoice_id", stripeId);
      matchedBy = `stripe_invoice_id=${stripeId}`;
    }

    if (rows.length === 0) {
      console.warn(
        `[StripeWebhook] No hill_invoices matched (stripeId=${stripeId}, hill_invoice_id=${metadata?.hill_invoice_id ?? "—"}) — event logged, no DB update`
      );
      return;
    }

    console.log(`[StripeWebhook] Updated ${rows.length} hill invoice(s) → "${status}" (by ${matchedBy})`);
    const changed = rows.filter((r) => r.prev_status !== status);
    if (changed.length === 0) {
      console.log(`[StripeWebhook] Already at "${status}" — skipping timeline/notifications (duplicate event)`);
      return;
    }

    for (const row of changed) {
      await recordHillBillingEvent(pool, row.hill_id, `billing_${status}`, {
        source: "hill_invoice",
        invoiceId: row.id,
        label: row.label,
        stripeId,
        status,
      });
      if (status === "processing" || status === "paid") {
        await sendHillInvoiceNotifications(pool, row, status, origin);
      }
    }
  } catch (err) {
    console.error("[StripeWebhook] DB update error:", err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Notifications (client + admin) — best-effort, never throw
// ---------------------------------------------------------------------------

async function sendHillInvoiceNotifications(
  pool: ReturnType<typeof getPool>,
  invoice: MatchedInvoice,
  phase: "processing" | "paid",
  origin: string
) {
  try {
    const hillRes = await pool.query(
      `SELECT h.title, h.project_id, p.account_id AS project_account_id
         FROM hills h LEFT JOIN projects p ON p.id = h.project_id
        WHERE h.id = $1`,
      [invoice.hill_id]
    );
    if ((hillRes.rowCount ?? 0) === 0) return;
    const hill = hillRes.rows[0] as {
      title: string | null;
      project_id: string | null;
      project_account_id: string | null;
    };

    const amount = Number(invoice.amount ?? 0);
    const adminUrl = `${origin}/dashboard/hills/${invoice.hill_id}`;
    const clientUrl = hill.project_id ? `${origin}/projects/${hill.project_id}` : origin;

    // Client recipients: non-admin project members, falling back to the project owner.
    type MemberRow = { email: string; name: string | null };
    let clientRecipients: MemberRow[] = [];
    if (hill.project_id) {
      const membersRes = await pool.query(
        `SELECT pm.email,
                COALESCE(NULLIF(TRIM(CONCAT(a.first_name, ' ', a.last_name)), ''), a.name) AS name
           FROM project_members pm
           LEFT JOIN accounts a ON lower(pm.email) = lower(a.email)
          WHERE pm.project_id = $1 AND COALESCE(a.is_admin, false) = false
          ORDER BY pm.created_at ASC`,
        [hill.project_id]
      );
      clientRecipients = membersRes.rows as MemberRow[];
    }
    if (clientRecipients.length === 0 && hill.project_account_id) {
      const ownerRes = await pool.query(
        `SELECT email, COALESCE(NULLIF(TRIM(CONCAT(first_name, ' ', last_name)), ''), name) AS name
           FROM accounts WHERE id = $1 AND COALESCE(is_admin, false) = false AND email IS NOT NULL`,
        [hill.project_account_id]
      );
      clientRecipients = ownerRes.rows as MemberRow[];
    }

    for (const recipient of clientRecipients) {
      try {
        const content =
          phase === "paid"
            ? generateInvoicePaidClientEmail({
                invoiceLabel: invoice.label,
                invoiceAmount: amount,
                sprintTitle: hill.title,
                clientName: recipient.name,
                sprintUrl: clientUrl,
              })
            : generateInvoiceProcessingClientEmail({
                invoiceLabel: invoice.label,
                invoiceAmount: amount,
                sprintTitle: hill.title,
                clientName: recipient.name,
                sprintUrl: clientUrl,
              });
        await sendEmail({ to: recipient.email, ...content, category: "transactional", tag: `invoice-${phase}-client` });
      } catch (err) {
        console.error(`[StripeWebhook] ${phase} client email failed for ${recipient.email}:`, err);
      }
    }

    const clientEmailSummary = clientRecipients.map((r) => r.email).join(", ") || null;
    const clientNameSummary = clientRecipients[0]?.name ?? null;
    const adminRes = await pool.query(`SELECT email, first_name, last_name FROM accounts WHERE is_admin = true`);
    for (const admin of adminRes.rows as Array<{ email: string; first_name: string | null; last_name: string | null }>) {
      try {
        const adminName = [admin.first_name, admin.last_name].filter(Boolean).join(" ") || null;
        const content =
          phase === "paid"
            ? generateInvoicePaidAdminEmail({
                invoiceLabel: invoice.label,
                invoiceAmount: amount,
                sprintTitle: hill.title,
                clientName: clientNameSummary,
                clientEmail: clientEmailSummary ?? "",
                adminName,
              })
            : generateInvoiceProcessingAdminEmail({
                invoiceLabel: invoice.label,
                invoiceAmount: amount,
                adminName,
                clientEmail: clientEmailSummary,
                sprintTitle: hill.title,
                sprintUrl: adminUrl,
              });
        await sendEmail({ to: admin.email, ...content, category: "transactional", tag: `invoice-${phase}-admin` });
      } catch (err) {
        console.error(`[StripeWebhook] ${phase} admin email failed for ${admin.email}:`, err);
      }
    }
  } catch (err) {
    console.error(`[StripeWebhook] ${phase} notifications failed for invoice ${invoice.id}:`, err);
  }
}
