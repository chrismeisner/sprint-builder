import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { sendEmail, generateInvoiceDraftEmail } from "@/lib/email";

type Params = { params: { id: string; invoiceId: string } };

/**
 * POST /api/sprint-drafts/[id]/invoices/[invoiceId]/stripe
 *
 * Supports three actions via `{ action }` in the request body:
 *
 * - "generate": Creates a Stripe Invoice draft + line item, finalizes it to
 *   obtain the hosted URL, but does NOT email the client. Saves the Stripe
 *   Invoice ID and URL back to the DB.
 *
 * - "send": Calls stripe.invoices.sendInvoice() to email the client and
 *   marks the local record as "sent".
 *
 * - "send_draft": Emails the hosted Stripe invoice URL to the logged-in admin
 *   via Mailgun so they can preview before sending to the client.
 *
 * Admin only for all actions.
 */
export async function POST(request: Request, { params }: Params) {
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

    const body = await request.json().catch(() => ({})) as { action?: string };
    const action = body.action ?? "send";

    // Fetch the sprint invoice
    const invRes = await pool.query(
      `SELECT si.id, si.sprint_id, si.label, si.amount, si.stripe_invoice_id,
              si.invoice_status, si.invoice_url
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
      invoice_url: string | null;
    };

    // -------------------------------------------------------------------------
    // ACTION: generate
    // -------------------------------------------------------------------------
    if (action === "generate") {
      if (inv.stripe_invoice_id) {
        return NextResponse.json(
          { error: "A Stripe invoice has already been generated for this record" },
          { status: 409 }
        );
      }
      if (!inv.amount || inv.amount <= 0) {
        return NextResponse.json(
          { error: "Invoice must have a positive amount before generating a Stripe link" },
          { status: 400 }
        );
      }

      // Resolve the client account
      const sprintRes = await pool.query(
        `SELECT sd.id, sd.title,
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
        client_account_id: string | null;
      };

      if (!sprint.client_account_id) {
        return NextResponse.json(
          { error: "No client account is linked to this sprint — cannot create Stripe invoice" },
          { status: 400 }
        );
      }

      const stripeCustomerId = await getOrCreateStripeCustomer(pool, sprint.client_account_id);
      const stripe = getStripe();

      const amountCents = Math.round(inv.amount * 100);
      const description = [sprint.title, inv.label].filter(Boolean).join(" — ");

      // Create the draft invoice first so the line item is scoped to it
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

      // Finalize to get the hosted_invoice_url without emailing the client
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(stripeInvoice.id, {
        auto_advance: false,
      });

      await pool.query(
        `UPDATE sprint_invoices
         SET stripe_invoice_id = $1,
             invoice_url       = $2,
             updated_at        = now()
         WHERE id = $3`,
        [finalizedInvoice.id, finalizedInvoice.hosted_invoice_url, params.invoiceId]
      );

      const updatedRes = await pool.query(
        `SELECT id, sprint_id, label, invoice_url, invoice_status, invoice_pdf_url,
                amount, sort_order, stripe_invoice_id, created_at, updated_at
         FROM sprint_invoices WHERE id = $1`,
        [params.invoiceId]
      );

      return NextResponse.json({ invoice: updatedRes.rows[0] }, { status: 200 });
    }

    // -------------------------------------------------------------------------
    // ACTION: send
    // -------------------------------------------------------------------------
    if (action === "send") {
      if (!inv.stripe_invoice_id) {
        return NextResponse.json(
          { error: "Generate the Stripe link first before sending" },
          { status: 400 }
        );
      }

      const stripe = getStripe();
      await stripe.invoices.sendInvoice(inv.stripe_invoice_id);

      await pool.query(
        `UPDATE sprint_invoices
         SET invoice_status = 'sent',
             updated_at     = now()
         WHERE id = $1`,
        [params.invoiceId]
      );

      const updatedRes = await pool.query(
        `SELECT id, sprint_id, label, invoice_url, invoice_status, invoice_pdf_url,
                amount, sort_order, stripe_invoice_id, created_at, updated_at
         FROM sprint_invoices WHERE id = $1`,
        [params.invoiceId]
      );

      return NextResponse.json({ invoice: updatedRes.rows[0] }, { status: 200 });
    }

    // -------------------------------------------------------------------------
    // ACTION: send_draft
    // -------------------------------------------------------------------------
    if (action === "send_draft") {
      if (!inv.stripe_invoice_id || !inv.invoice_url) {
        return NextResponse.json(
          { error: "Generate the Stripe link first before sending a draft preview" },
          { status: 400 }
        );
      }

      // Fetch sprint title for context
      const sprintRes = await pool.query(
        `SELECT title FROM sprint_drafts WHERE id = $1`,
        [params.id]
      );
      const sprintTitle =
        (sprintRes.rowCount ?? 0) > 0
          ? ((sprintRes.rows[0] as { title: string | null }).title)
          : null;

      const adminName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.name ||
        user.email;

      const emailContent = generateInvoiceDraftEmail({
        invoiceLabel: inv.label,
        invoiceAmount: inv.amount ?? 0,
        hostedUrl: inv.invoice_url,
        adminName,
        sprintTitle,
      });

      const result = await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error ?? "Failed to send draft email" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, sentTo: user.email }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action. Use generate, send, or send_draft." }, { status: 400 });
  } catch (err) {
    console.error("[Stripe Invoice POST]", err);
    const message = err instanceof Error ? err.message : "Failed to process Stripe invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
