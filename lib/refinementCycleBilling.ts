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
  generateRefinementCycleRevokedClientEmail,
  generateRefinementCycleRevokedAdminEmail,
  generateRefinementCycleSubmittedAdminEmail,
  generateRefinementCycleSubmittedClientEmail,
} from "@/lib/email";

const REFINEMENT_CYCLE_PAYMENT_DUE_BUFFER_DAYS = 7; // Stripe-side fallback; the
// real expiry is enforced by the deposit-deadline cron at 10am ET on delivery
// day, so the Stripe due_date is a soft floor.

// Day-specific Cal booking links for the optional 10am ET check-in. Indexed
// by JS day-of-week (0=Sun … 6=Sat). Cycles only deliver on weekdays, so
// Sat/Sun are intentionally absent.
const CAL_BOOKING_URLS_BY_DOW: Record<number, string> = {
  1: "https://cal.com/chrismeisner/monday-mornings",
  2: "https://cal.com/chrismeisner/tuesday-mornings",
  3: "https://cal.com/chrismeisner/wednesday-mornings",
  4: "https://cal.com/chrismeisner/thursday-mornings",
  5: "https://cal.com/chrismeisner/friday-morning",
};

function getCalBookingUrlForDeliveryDate(
  deliveryDate: string | null
): string | null {
  if (!deliveryDate) return null;
  const [yy, mm, dd] = deliveryDate.split("-").map((n) => Number(n));
  if (!yy || !mm || !dd) return null;
  // Parse as UTC noon to get a stable day-of-week regardless of DST.
  const dow = new Date(Date.UTC(yy, mm - 1, dd, 12, 0, 0)).getUTCDay();
  return CAL_BOOKING_URLS_BY_DOW[dow] ?? null;
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
    studio_review_attachment_url: string | null;
    stripe_deposit_invoice_url: string | null;
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
           rc.studio_review_note, rc.studio_review_attachment_url,
           rc.stripe_deposit_invoice_url,
           rc.deposit_amount, rc.final_amount,
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
      studio_review_attachment_url:
        (row.studio_review_attachment_url as string | null) ?? null,
      stripe_deposit_invoice_url:
        (row.stripe_deposit_invoice_url as string | null) ?? null,
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

export type DepositInvoice = {
  stripeInvoiceId: string;
  hostedInvoiceUrl: string;
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

// Creates the Stripe deposit invoice for a cycle and returns the URL.
// Retries transient errors a few times so an admin click doesn't fail just
// because Stripe blipped. Throws (with a descriptive error) if every attempt
// fails or if Stripe is unconfigured / the URL comes back empty — callers
// should surface this to the admin so they can retry rather than send an
// acceptance email without a payment link.
export async function createDepositInvoiceForCycle(
  cycleId: string
): Promise<DepositInvoice> {
  const pool = getPool();
  const ctx = await loadCycleContext(pool, cycleId);
  if (!ctx) {
    throw new Error(`Cycle ${cycleId} not found`);
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured — cannot create deposit invoice"
    );
  }

  const delays = [0, 500, 2000];
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
    try {
      const result = await createCycleStripeInvoice(
        pool,
        ctx,
        "deposit",
        ctx.cycle.deposit_amount
      );
      if (result && result.hostedInvoiceUrl) {
        return {
          stripeInvoiceId: result.stripeInvoiceId,
          hostedInvoiceUrl: result.hostedInvoiceUrl,
        };
      }
      lastErr = new Error("Stripe returned no hosted invoice URL");
    } catch (err) {
      lastErr = err;
      console.warn(
        `[RefinementCycleBilling] deposit invoice attempt ${attempt + 1} failed (cycle=${cycleId}):`,
        err
      );
    }
  }
  throw new Error(
    `Failed to create Stripe deposit invoice after ${delays.length} attempts: ${
      (lastErr as Error)?.message ?? "unknown error"
    }`
  );
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

// Sends the acceptance email. The Stripe deposit invoice MUST already be on
// the cycle row (callers ensure this via `createDepositInvoiceForCycle`)
// before invoking this — the email is gated on a real payment URL so the
// client never gets a "link will follow shortly" placeholder.
export async function onCycleAccepted(cycleId: string): Promise<void> {
  try {
    const pool = getPool();
    const ctx = await loadCycleContext(pool, cycleId);
    if (!ctx) return;
    if (!ctx.cycle.submitter_email) return;
    if (!ctx.cycle.stripe_deposit_invoice_url) {
      console.error(
        `[RefinementCycleBilling] onCycleAccepted skipped — no Stripe deposit URL on cycle ${cycleId}; refusing to send email without a real payment link`
      );
      return;
    }

    const calBookingUrl = getCalBookingUrlForDeliveryDate(
      ctx.cycle.delivery_date
    );

    try {
      const content = generateRefinementCycleAcceptedClientEmail({
        title: ctx.cycle.title,
        projectName: ctx.project.name,
        projectEmoji: ctx.project.emoji,
        studioNote: ctx.cycle.studio_review_note,
        studioAttachmentUrl: ctx.cycle.studio_review_attachment_url,
        deliveryDate: ctx.cycle.delivery_date,
        depositAmount: ctx.cycle.deposit_amount,
        stripeInvoiceUrl: ctx.cycle.stripe_deposit_invoice_url,
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
      studioAttachmentUrl: ctx.cycle.studio_review_attachment_url,
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

// Notify all parties when a cycle is revoked. Called AFTER the row has
// already been deleted, so we accept a snapshot of the cycle data.
export type RevokedCycleSnapshot = {
  cycleId: string;
  title: string | null;
  submitterEmail: string | null;
  ccEmails: string[];
  projectId: string;
  projectName: string | null;
  projectEmoji: string | null;
};

export async function onCycleRevoked(
  snapshot: RevokedCycleSnapshot,
  actor: { email: string | null; isStudio: boolean }
): Promise<void> {
  try {
    const pool = getPool();
    const newSubmissionUrl = `${getBaseUrl()}/dashboard/refinement-cycles/new?projectId=${snapshot.projectId}`;

    // Client confirmation (to submitter, CC any team members they looped in).
    if (snapshot.submitterEmail) {
      try {
        const content = generateRefinementCycleRevokedClientEmail({
          title: snapshot.title,
          projectName: snapshot.projectName,
          projectEmoji: snapshot.projectEmoji,
          revokedByStudio: actor.isStudio,
          newSubmissionUrl,
        });
        await sendEmail({
          to: snapshot.submitterEmail,
          cc:
            snapshot.ccEmails.length > 0
              ? snapshot.ccEmails.join(",")
              : undefined,
          ...content,
          category: "transactional",
          tag: "refinement-cycle-revoked",
        });
      } catch (err) {
        console.error(
          `[RefinementCycleBilling] revoked client email failed for ${snapshot.submitterEmail}:`,
          err
        );
      }
    }

    // Admin confirmation — so the studio knows the queue changed.
    const adminEmails = await getAdminEmails(pool);
    if (adminEmails.length === 0) return;
    const adminContent = generateRefinementCycleRevokedAdminEmail({
      title: snapshot.title,
      submitterEmail: snapshot.submitterEmail,
      projectName: snapshot.projectName,
      projectEmoji: snapshot.projectEmoji,
      revokedByStudio: actor.isStudio,
      actorEmail: actor.email,
    });
    for (const to of adminEmails) {
      try {
        await sendEmail({
          to,
          ...adminContent,
          category: "transactional",
          tag: "refinement-cycle-revoked-admin",
        });
      } catch (err) {
        console.error(
          `[RefinementCycleBilling] revoked admin email failed for ${to}:`,
          err
        );
      }
    }
  } catch (err) {
    console.error("[RefinementCycleBilling] onCycleRevoked error:", err);
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
