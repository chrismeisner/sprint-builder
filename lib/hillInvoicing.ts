import { getPool } from "@/lib/db";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import type { Pool } from "pg";

// Hill-native invoicing (Path A). A client hill carries any number of
// hill_invoices rows. "Sending" one creates + finalizes a real Stripe invoice,
// stamped with metadata { hill_id, hill_invoice_id } so the webhook can route
// the payment back to this exact row. Billing stays a satellite keyed on
// hill_id — never folded into the hills table.

// Max days a hill invoice can stay open (matches the refinement-cycle cap).
const HILL_INVOICE_DUE_DEFAULT_DAYS = 14;
const HILL_INVOICE_DUE_MAX_DAYS = 365;

export type HillInvoiceRow = {
  id: string;
  hill_id: string;
  kind: string;
  label: string;
  amount: string | number | null;
  invoice_status: string;
  invoice_url: string | null;
  stripe_invoice_id: string | null;
};

type HillBillingContext = {
  invoice: HillInvoiceRow;
  hillTitle: string | null;
  projectName: string | null;
  billingAccountId: string | null;
};

async function loadHillInvoiceContext(
  pool: Pool,
  hillId: string,
  invoiceId: string
): Promise<HillBillingContext | null> {
  const res = await pool.query(
    `SELECT hi.*, h.title AS hill_title, h.created_by AS hill_created_by,
            p.name AS project_name, p.account_id AS project_account_id
       FROM hill_invoices hi
       JOIN hills h ON h.id = hi.hill_id
       LEFT JOIN projects p ON p.id = h.project_id
      WHERE hi.id = $1 AND hi.hill_id = $2`,
    [invoiceId, hillId]
  );
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  return {
    invoice: row as HillInvoiceRow,
    hillTitle: row.hill_title ?? null,
    projectName: row.project_name ?? null,
    // Bill the project owner when known; fall back to whoever created the hill
    // so hills without a project can still be invoiced.
    billingAccountId: row.project_account_id ?? row.hill_created_by ?? null,
  };
}

// Create + finalize a Stripe invoice for a hill_invoices row, then stamp the
// row with the Stripe id / hosted URL and flip it to 'sent'. Idempotent-ish:
// refuses to re-send a row that already has a live (non-voided) Stripe invoice.
export async function sendHillInvoice(
  hillId: string,
  invoiceId: string,
  opts?: { dueDays?: number | null; description?: string | null }
): Promise<{ stripeInvoiceId: string; hostedInvoiceUrl: string | null }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  const pool = getPool();
  const ctx = await loadHillInvoiceContext(pool, hillId, invoiceId);
  if (!ctx) throw new Error("Hill invoice not found");
  if (ctx.invoice.stripe_invoice_id && ctx.invoice.invoice_status !== "voided") {
    throw new Error("Invoice already sent — void it first to re-issue");
  }
  if (!ctx.billingAccountId) {
    throw new Error(
      "Cannot invoice: hill has no project owner or creator account to bill"
    );
  }
  const amount = Number(ctx.invoice.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invoice amount must be a positive number");
  }

  const stripe = getStripe();
  const stripeCustomerId = await getOrCreateStripeCustomer(pool, ctx.billingAccountId);

  const dueDays =
    typeof opts?.dueDays === "number" && Number.isFinite(opts.dueDays) && opts.dueDays >= 0
      ? Math.min(Math.floor(opts.dueDays), HILL_INVOICE_DUE_MAX_DAYS)
      : HILL_INVOICE_DUE_DEFAULT_DAYS;
  const dueDateUnix = Math.floor(Date.now() / 1000) + dueDays * 86400;

  const description =
    (opts?.description && opts.description.trim()) ||
    ctx.invoice.label ||
    `${ctx.projectName ?? ctx.hillTitle ?? "Studio"} — invoice`;

  const stripeInvoice = await stripe.invoices.create({
    customer: stripeCustomerId,
    collection_method: "send_invoice",
    due_date: dueDateUnix,
    payment_settings: { payment_method_types: ["us_bank_account", "card"] },
    metadata: {
      hill_id: hillId,
      hill_invoice_id: invoiceId,
    },
  });

  await stripe.invoiceItems.create({
    customer: stripeCustomerId,
    invoice: stripeInvoice.id,
    amount: Math.round(amount * 100),
    currency: "usd",
    description,
  });

  const finalized = await stripe.invoices.finalizeInvoice(stripeInvoice.id, {
    auto_advance: false,
  });

  await pool.query(
    `UPDATE hill_invoices
        SET stripe_invoice_id = $1, invoice_url = $2, invoice_status = 'sent', updated_at = now()
      WHERE id = $3 AND hill_id = $4`,
    [finalized.id, finalized.hosted_invoice_url ?? null, invoiceId, hillId]
  );

  return {
    stripeInvoiceId: finalized.id,
    hostedInvoiceUrl: finalized.hosted_invoice_url ?? null,
  };
}

// Void the Stripe invoice (if any) and mark the row voided.
export async function voidHillInvoice(hillId: string, invoiceId: string): Promise<void> {
  const pool = getPool();
  const ctx = await loadHillInvoiceContext(pool, hillId, invoiceId);
  if (!ctx) throw new Error("Hill invoice not found");

  if (ctx.invoice.stripe_invoice_id && process.env.STRIPE_SECRET_KEY) {
    try {
      await getStripe().invoices.voidInvoice(ctx.invoice.stripe_invoice_id);
    } catch (err) {
      // A already-void/paid invoice can't be voided again — surface but don't
      // block the local status flip.
      console.warn(
        "[hillInvoicing] Stripe voidInvoice failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  await pool.query(
    `UPDATE hill_invoices
        SET invoice_status = 'voided', updated_at = now()
      WHERE id = $1 AND hill_id = $2`,
    [invoiceId, hillId]
  );
}
