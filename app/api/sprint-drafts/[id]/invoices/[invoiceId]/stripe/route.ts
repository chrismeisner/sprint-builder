import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";

type Params = { params: { id: string; invoiceId: string } };

/**
 * POST /api/sprint-drafts/[id]/invoices/[invoiceId]/stripe
 *
 * Creates a Stripe Invoice from an existing sprint_invoice record, adds a
 * line item for the amount, and sends it to the client. Stores the Stripe
 * Invoice ID and hosted URL back on the row.
 *
 * Admin only.
 */
export async function POST(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Fetch the sprint invoice
    const invRes = await pool.query(
      `SELECT si.id, si.sprint_id, si.label, si.amount, si.stripe_invoice_id, si.invoice_status
       FROM sprint_invoices si
       WHERE si.id = $1 AND si.sprint_id = $2`,
      [params.invoiceId, params.id]
    );
    if ((invRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const inv = invRes.rows[0] as {
      id: string;
      sprint_id: string;
      label: string;
      amount: number | null;
      stripe_invoice_id: string | null;
      invoice_status: string;
    };

    if (inv.stripe_invoice_id) {
      return NextResponse.json(
        { error: "A Stripe invoice already exists for this record" },
        { status: 409 }
      );
    }

    if (!inv.amount || inv.amount <= 0) {
      return NextResponse.json(
        { error: "Invoice must have a positive amount before sending via Stripe" },
        { status: 400 }
      );
    }

    // Fetch the sprint + project to find the client account
    const sprintRes = await pool.query(
      `SELECT sd.id, sd.title, sd.project_id,
              COALESCE(p.account_id, d.account_id) AS client_account_id
       FROM sprint_drafts sd
       LEFT JOIN projects p ON sd.project_id = p.id
       LEFT JOIN documents d ON sd.document_id = d.id
       WHERE sd.id = $1`,
      [params.id]
    );
    if ((sprintRes.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    const sprint = sprintRes.rows[0] as {
      id: string;
      title: string | null;
      project_id: string | null;
      client_account_id: string | null;
    };

    if (!sprint.client_account_id) {
      return NextResponse.json(
        { error: "No client account is linked to this sprint — cannot create Stripe invoice" },
        { status: 400 }
      );
    }

    // Get or create a Stripe Customer for the client
    const stripeCustomerId = await getOrCreateStripeCustomer(pool, sprint.client_account_id);
    const stripe = getStripe();

    const amountCents = Math.round(inv.amount * 100);
    const description = [sprint.title, inv.label].filter(Boolean).join(" — ");

    // Create the draft invoice first so the line item is scoped to it,
    // preventing orphaned pending items if a later step fails on retry.
    const stripeInvoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: "send_invoice",
      days_until_due: 14,
      metadata: {
        sprint_id: params.id,
        invoice_id: params.invoiceId,
      },
    });

    await stripe.invoiceItems.create({
      customer: stripeCustomerId,
      invoice: stripeInvoice.id,
      amount: amountCents,
      currency: "usd",
      description,
    });

    await stripe.invoices.sendInvoice(stripeInvoice.id);

    // Re-fetch the invoice to get the hosted URL (available after finalization)
    const finalInvoice = await stripe.invoices.retrieve(stripeInvoice.id);

    // Persist the Stripe reference back to the DB
    await pool.query(
      `UPDATE sprint_invoices
       SET stripe_invoice_id = $1,
           invoice_url = $2,
           invoice_status = 'sent',
           updated_at = now()
       WHERE id = $3`,
      [finalInvoice.id, finalInvoice.hosted_invoice_url, params.invoiceId]
    );

    // Return the updated record
    const updatedRes = await pool.query(
      `SELECT id, sprint_id, label, invoice_url, invoice_status, invoice_pdf_url,
              amount, sort_order, stripe_invoice_id, created_at, updated_at
       FROM sprint_invoices WHERE id = $1`,
      [params.invoiceId]
    );

    return NextResponse.json({ invoice: updatedRes.rows[0] }, { status: 201 });
  } catch (err) {
    console.error("[Stripe Invoice POST]", err);
    const message = err instanceof Error ? err.message : "Failed to create Stripe invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
