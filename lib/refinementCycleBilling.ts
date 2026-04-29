// Stripe + email orchestration for refinement cycles.
//
// Each function is best-effort: if Stripe or Mailgun isn't configured, the
// function logs a warning and returns without throwing, so the lifecycle
// transition (accept/decline/deliver) still completes. The cycle row records
// whatever URLs were captured.

import type { Pool } from "pg";
import { getPool } from "@/lib/db";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import {
  sendEmail,
  generateRefinementCycleAcceptedClientEmail,
  generateRefinementCycleDeclinedClientEmail,
  generateRefinementCycleExpiredClientEmail,
  generateRefinementCycleDeliveredClientEmail,
  generateRefinementCycleSubmittedAdminEmail,
  generateRefinementCycleSubmittedClientEmail,
} from "@/lib/email";

const REFINEMENT_CYCLE_PAYMENT_DUE_BUFFER_DAYS = 7; // Stripe-side fallback; the
// real expiry is enforced by the deposit-deadline cron at 10am ET on delivery
// day, so the Stripe due_date is a soft floor.

function getCalBookingUrl(): string | null {
  const url = process.env.REFINEMENT_CYCLE_CAL_URL?.trim();
  return url || null;
}

function getBaseUrl(): string {
  return (
    (process.env.BASE_URL || "").replace(/\/$/, "") || "https://meisner.design"
  );
}

async function getAdminEmails(pool: Pool): Promise<string[]> {
  const res = await pool.query(
    `SELECT email FROM accounts WHERE is_admin = true AND email IS NOT NULL`
  );
  return res.rows.map((r) => r.email as string).filter(Boolean);
}

type CycleBillingContext = {
  cycle: {
    id: string;
    title: string | null;
    submitter_email: string | null;
    project_id: string;
    delivery_date: string | null;
    studio_review_note: string | null;
    deposit_amount: number;
    final_amount: number;
    cc_emails: string[];
  };
  project: {
    id: string;
    name: string | null;
    emoji: string | null;
    account_id: string;
  };
};

async function loadCycleContext(
  pool: Pool,
  cycleId: string
): Promise<CycleBillingContext | null> {
  const res = await pool.query(
    `
    SELECT rc.id, rc.title, rc.submitter_email, rc.project_id, rc.delivery_date,
           rc.studio_review_note, rc.deposit_amount, rc.final_amount,
           rc.cc_emails,
           p.name AS project_name, p.emoji AS project_emoji,
           p.account_id AS project_account_id
    FROM refinement_cycles rc
    JOIN projects p ON p.id = rc.project_id
    WHERE rc.id = $1
    LIMIT 1
    `,
    [cycleId]
  );
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  return {
    cycle: {
      id: row.id as string,
      title: (row.title as string | null) ?? null,
      submitter_email: (row.submitter_email as string | null) ?? null,
      project_id: row.project_id as string,
      delivery_date:
        row.delivery_date instanceof Date
          ? row.delivery_date.toISOString().slice(0, 10)
          : ((row.delivery_date as string | null) ?? null),
      studio_review_note: (row.studio_review_note as string | null) ?? null,
      deposit_amount: Number(row.deposit_amount ?? 600),
      final_amount: Number(row.final_amount ?? 600),
      cc_emails: Array.isArray(row.cc_emails) ? (row.cc_emails as string[]) : [],
    },
    project: {
      id: row.project_id as string,
      name: (row.project_name as string | null) ?? null,
      emoji: (row.project_emoji as string | null) ?? null,
      account_id: row.project_account_id as string,
    },
  };
}

type StripeInvoiceResult = {
  stripeInvoiceId: string;
  hostedInvoiceUrl: string | null;
};

async function createCycleStripeInvoice(
  pool: Pool,
  ctx: CycleBillingContext,
  kind: "deposit" | "final",
  amount: number
): Promise<StripeInvoiceResult | null> {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn(
      `[RefinementCycleBilling] Skipping ${kind} invoice — STRIPE_SECRET_KEY not set (cycle=${ctx.cycle.id})`
    );
    return null;
  }

  const stripe = getStripe();
  const stripeCustomerId = await getOrCreateStripeCustomer(
    pool,
    ctx.project.account_id
  );

  const description = `Refinement Cycle ${kind === "deposit" ? "deposit" : "final"} — ${ctx.project.name ?? ctx.cycle.project_id}`;
  const dueDateUnix =
    Math.floor(Date.now() / 1000) +
    REFINEMENT_CYCLE_PAYMENT_DUE_BUFFER_DAYS * 86400;

  const invoice = await stripe.invoices.create({
    customer: stripeCustomerId,
    collection_method: "send_invoice",
    due_date: dueDateUnix,
    payment_settings: {
      payment_method_types: ["us_bank_account", "card"],
    },
    metadata: {
      refinement_cycle_id: ctx.cycle.id,
      refinement_cycle_invoice_kind: kind,
      project_id: ctx.cycle.project_id,
    },
  });

  await stripe.invoiceItems.create({
    customer: stripeCustomerId,
    invoice: invoice.id,
    amount: Math.round(amount * 100),
    currency: "usd",
    description,
  });

  const finalized = await stripe.invoices.finalizeInvoice(invoice.id, {
    auto_advance: false,
  });

  return {
    stripeInvoiceId: finalized.id,
    hostedInvoiceUrl: finalized.hosted_invoice_url ?? null,
  };
}

// -------------------------------------------------------------------------
// Lifecycle hooks — call these after a status transition.
// -------------------------------------------------------------------------

export async function onCycleSubmitted(cycleId: string): Promise<void> {
  try {
    const pool = getPool();
    const ctx = await loadCycleContext(pool, cycleId);
    if (!ctx) return;

    // 1) Confirmation to the submitter — CC any team members the submitter
    //    elected to loop in. Sent as transactional so it's delivered even
    //    if the recipient has unsubscribed from notifications.
    if (ctx.cycle.submitter_email) {
      try {
        // Look up the submitter's display name for a friendlier greeting.
        const nameRes = await pool.query(
          `SELECT
             COALESCE(
               NULLIF(name, ''),
               NULLIF(CONCAT_WS(' ', NULLIF(first_name, ''), NULLIF(last_name, '')), '')
             ) AS display_name
           FROM accounts
           WHERE lower(email) = lower($1)
           LIMIT 1`,
          [ctx.cycle.submitter_email]
        );
        const submitterName =
          (nameRes.rows[0]?.display_name as string | null) ?? null;

        const projectUrl = `${getBaseUrl()}/projects/${ctx.cycle.project_id}`;
        const content = generateRefinementCycleSubmittedClientEmail({
          title: ctx.cycle.title,
          submitterName,
          projectName: ctx.project.name,
          projectEmoji: ctx.project.emoji,
          projectUrl,
        });
        await sendEmail({
          to: ctx.cycle.submitter_email,
          cc:
            ctx.cycle.cc_emails.length > 0
              ? ctx.cycle.cc_emails.join(",")
              : undefined,
          ...content,
          category: "transactional",
          tag: "refinement-cycle-submitted-client",
        });
      } catch (err) {
        console.error(
          `[RefinementCycleBilling] submitted client email failed for ${ctx.cycle.submitter_email}:`,
          err
        );
      }
    }

    // 2) Admin queue notification.
    const adminEmails = await getAdminEmails(pool);
    if (adminEmails.length === 0) return;

    const reviewUrl = `${getBaseUrl()}/dashboard/refinement-cycles/${cycleId}`;
    const content = generateRefinementCycleSubmittedAdminEmail({
      title: ctx.cycle.title,
      submitterEmail: ctx.cycle.submitter_email,
      projectName: ctx.project.name,
      projectEmoji: ctx.project.emoji,
      reviewUrl,
    });
    for (const to of adminEmails) {
      try {
        await sendEmail({
          to,
          ...content,
          // Operational queue notification — required for the studio to know
          // there's work to review. Sent as transactional so click-tracking
          // doesn't rewrite the review link through the Mailgun tracking
          // subdomain (which has a mismatched SSL cert) and so it can't be
          // unsubscribed from.
          category: "transactional",
          tag: "refinement-cycle-submitted",
        });
      } catch (err) {
        console.error(
          `[RefinementCycleBilling] submitted admin email failed for ${to}:`,
          err
        );
      }
    }
  } catch (err) {
    console.error("[RefinementCycleBilling] onCycleSubmitted error:", err);
  }
}

export async function onCycleAccepted(cycleId: string): Promise<void> {
  try {
    const pool = getPool();
    const ctx = await loadCycleContext(pool, cycleId);
    if (!ctx) return;

    let stripeResult: StripeInvoiceResult | null = null;
    try {
      stripeResult = await createCycleStripeInvoice(
        pool,
        ctx,
        "deposit",
        ctx.cycle.deposit_amount
      );
    } catch (err) {
      console.error(
        `[RefinementCycleBilling] deposit invoice creation failed (cycle=${cycleId}):`,
        err
      );
    }

    const calBookingUrl = getCalBookingUrl();

    if (stripeResult) {
      await pool.query(
        `UPDATE refinement_cycles
         SET stripe_deposit_invoice_id = $2,
             stripe_deposit_invoice_url = $3,
             cal_booking_url = COALESCE($4, cal_booking_url),
             updated_at = now()
         WHERE id = $1`,
        [cycleId, stripeResult.stripeInvoiceId, stripeResult.hostedInvoiceUrl, calBookingUrl]
      );
    } else if (calBookingUrl) {
      await pool.query(
        `UPDATE refinement_cycles
         SET cal_booking_url = COALESCE(cal_booking_url, $2),
             updated_at = now()
         WHERE id = $1`,
        [cycleId, calBookingUrl]
      );
    }

    if (ctx.cycle.submitter_email) {
      try {
        const content = generateRefinementCycleAcceptedClientEmail({
          title: ctx.cycle.title,
          projectName: ctx.project.name,
          projectEmoji: ctx.project.emoji,
          studioNote: ctx.cycle.studio_review_note,
          deliveryDate: ctx.cycle.delivery_date,
          depositAmount: ctx.cycle.deposit_amount,
          stripeInvoiceUrl: stripeResult?.hostedInvoiceUrl ?? null,
          calBookingUrl,
        });
        await sendEmail({
          to: ctx.cycle.submitter_email,
          cc:
            ctx.cycle.cc_emails.length > 0
              ? ctx.cycle.cc_emails.join(",")
              : undefined,
          ...content,
          category: "transactional",
          tag: "refinement-cycle-accepted",
        });
      } catch (err) {
        console.error(
          `[RefinementCycleBilling] accepted email failed for ${ctx.cycle.submitter_email}:`,
          err
        );
      }
    }
  } catch (err) {
    console.error("[RefinementCycleBilling] onCycleAccepted error:", err);
  }
}

export async function onCycleDeclined(cycleId: string): Promise<void> {
  try {
    const pool = getPool();
    const ctx = await loadCycleContext(pool, cycleId);
    if (!ctx || !ctx.cycle.submitter_email) return;

    const content = generateRefinementCycleDeclinedClientEmail({
      projectName: ctx.project.name,
      projectEmoji: ctx.project.emoji,
      studioNote: ctx.cycle.studio_review_note,
      newSubmissionUrl: `${getBaseUrl()}/dashboard/refinement-cycles/new?projectId=${ctx.cycle.project_id}`,
    });
    await sendEmail({
      to: ctx.cycle.submitter_email,
      cc:
        ctx.cycle.cc_emails.length > 0
          ? ctx.cycle.cc_emails.join(",")
          : undefined,
      ...content,
      category: "transactional",
      tag: "refinement-cycle-declined",
    });
  } catch (err) {
    console.error("[RefinementCycleBilling] onCycleDeclined error:", err);
  }
}

export async function onCycleExpired(cycleId: string): Promise<void> {
  try {
    const pool = getPool();
    const ctx = await loadCycleContext(pool, cycleId);
    if (!ctx || !ctx.cycle.submitter_email) return;

    const content = generateRefinementCycleExpiredClientEmail({
      projectName: ctx.project.name,
      projectEmoji: ctx.project.emoji,
      newSubmissionUrl: `${getBaseUrl()}/dashboard/refinement-cycles/new?projectId=${ctx.cycle.project_id}`,
    });
    await sendEmail({
      to: ctx.cycle.submitter_email,
      cc:
        ctx.cycle.cc_emails.length > 0
          ? ctx.cycle.cc_emails.join(",")
          : undefined,
      ...content,
      category: "transactional",
      tag: "refinement-cycle-expired",
    });
  } catch (err) {
    console.error("[RefinementCycleBilling] onCycleExpired error:", err);
  }
}

type DeliverPayload = {
  figmaFileUrl?: string | null;
  loomWalkthroughUrl?: string | null;
  engineeringNotes?: string | null;
};

export async function onCycleDelivered(
  cycleId: string,
  payload: DeliverPayload
): Promise<{ stripeInvoiceUrl: string | null }> {
  let stripeResult: StripeInvoiceResult | null = null;
  try {
    const pool = getPool();
    const ctx = await loadCycleContext(pool, cycleId);
    if (!ctx) return { stripeInvoiceUrl: null };

    try {
      stripeResult = await createCycleStripeInvoice(
        pool,
        ctx,
        "final",
        ctx.cycle.final_amount
      );
    } catch (err) {
      console.error(
        `[RefinementCycleBilling] final invoice creation failed (cycle=${cycleId}):`,
        err
      );
    }

    if (stripeResult) {
      await pool.query(
        `UPDATE refinement_cycles
         SET stripe_final_invoice_id = $2,
             stripe_final_invoice_url = $3,
             updated_at = now()
         WHERE id = $1`,
        [cycleId, stripeResult.stripeInvoiceId, stripeResult.hostedInvoiceUrl]
      );
    }

    if (ctx.cycle.submitter_email) {
      try {
        const content = generateRefinementCycleDeliveredClientEmail({
          projectName: ctx.project.name,
          projectEmoji: ctx.project.emoji,
          finalAmount: ctx.cycle.final_amount,
          stripeInvoiceUrl: stripeResult?.hostedInvoiceUrl ?? null,
          figmaFileUrl: payload.figmaFileUrl ?? null,
          loomWalkthroughUrl: payload.loomWalkthroughUrl ?? null,
          engineeringNotes: payload.engineeringNotes ?? null,
        });
        await sendEmail({
          to: ctx.cycle.submitter_email,
          cc:
            ctx.cycle.cc_emails.length > 0
              ? ctx.cycle.cc_emails.join(",")
              : undefined,
          ...content,
          category: "transactional",
          tag: "refinement-cycle-delivered",
        });
      } catch (err) {
        console.error(
          `[RefinementCycleBilling] delivered email failed for ${ctx.cycle.submitter_email}:`,
          err
        );
      }
    }
  } catch (err) {
    console.error("[RefinementCycleBilling] onCycleDelivered error:", err);
  }
  return { stripeInvoiceUrl: stripeResult?.hostedInvoiceUrl ?? null };
}
