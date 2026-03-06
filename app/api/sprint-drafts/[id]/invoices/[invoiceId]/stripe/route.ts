import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { sendEmail, generateInvoiceDraftEmail, generateInvoiceSentAdminEmail, generateInvoiceClientEmail } from "@/lib/email";
import { randomUUID } from "crypto";

type Params = { params: { id: string; invoiceId: string } };

async function writeChangelog(
  pool: ReturnType<typeof getPool>,
  sprintId: string,
  accountId: string | null,
  action: string,
  summary: string,
  details?: Record<string, unknown>
) {
  try {
    await pool.query(
      `INSERT INTO sprint_draft_changelog (id, sprint_draft_id, account_id, action, summary, details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [randomUUID(), sprintId, accountId, action, summary, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    // Non-blocking — don't fail the main operation if changelog fails
    console.error("[Changelog write]", err);
  }
}

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

    const body = await request.json().catch(() => ({})) as { action?: string; ccAdmin?: boolean; ccClientEmails?: string[]; recipientEmail?: string };
    const action = body.action ?? "send";
    const ccAdmin = body.ccAdmin === true;
    const ccClientEmails: string[] = Array.isArray(body.ccClientEmails) ? body.ccClientEmails : [];
    const recipientEmail: string | undefined = typeof body.recipientEmail === "string" && body.recipientEmail ? body.recipientEmail : undefined;

    const origin = new URL(request.url).origin;
    const sprintUrl = `${origin}/sprints/${params.id}`;

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

      // If a specific recipient email was selected in the modal, look up that
      // account and bill them. Otherwise fall back to the sprint's linked client.
      let billingAccountId: string | null = sprint.client_account_id;
      if (recipientEmail) {
        const emailRes = await pool.query(
          `SELECT id FROM accounts WHERE lower(email) = lower($1) LIMIT 1`,
          [recipientEmail]
        );
        if ((emailRes.rowCount ?? 0) > 0) {
          billingAccountId = (emailRes.rows[0] as { id: string }).id;
        }
      }

      if (!billingAccountId) {
        return NextResponse.json(
          { error: "No client account is linked to this sprint — cannot create Stripe invoice" },
          { status: 400 }
        );
      }

      const stripeCustomerId = await getOrCreateStripeCustomer(pool, billingAccountId);
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

      await writeChangelog(
        pool,
        params.id,
        user.accountId ?? null,
        "stripe_link_generated",
        `Stripe payment link generated for invoice "${inv.label}"`,
        {
          invoice_id: inv.id,
          label: inv.label,
          amount: inv.amount,
          stripe_invoice_id: finalizedInvoice.id,
          invoice_url: finalizedInvoice.hosted_invoice_url,
        }
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

      await writeChangelog(
        pool,
        params.id,
        user.accountId ?? null,
        "invoice_sent",
        `Invoice "${inv.label}" sent to client via Stripe`,
        {
          invoice_id: inv.id,
          label: inv.label,
          amount: inv.amount,
          stripe_invoice_id: inv.stripe_invoice_id,
        }
      );

      // Fetch sprint title (needed for admin CC and client studio emails)
      let sharedSprintTitle: string | null = null;
      if (ccAdmin || ccClientEmails.length > 0) {
        try {
          const titleRes = await pool.query(
            `SELECT title FROM sprint_drafts WHERE id = $1`,
            [params.id]
          );
          if ((titleRes.rowCount ?? 0) > 0) {
            sharedSprintTitle = titleRes.rows[0].title ?? null;
          }
        } catch (err) {
          console.error("[Send action] Failed to fetch sprint title:", err);
        }
      }

      // CC the admin if requested
      if (ccAdmin && user.email) {
        try {
          const adminName = user.name ?? user.email.split("@")[0] ?? null;
          const clientEmailSummary = ccClientEmails.length > 0 ? ccClientEmails.join(", ") : null;

          const emailContent = generateInvoiceSentAdminEmail({
            invoiceLabel: inv.label,
            invoiceAmount: inv.amount ?? 0,
            hostedUrl: inv.invoice_url ?? "",
            adminName,
            clientEmail: clientEmailSummary,
            sprintTitle: sharedSprintTitle,
            sprintUrl,
          });

          await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
          });
        } catch (err) {
          // Non-blocking — don't fail the send if CC email fails
          console.error("[Send action] CC admin email error:", err);
        }
      }

      // Send studio-branded invoice email to each checked client recipient
      if (ccClientEmails.length > 0) {
        // Look up names for all recipient emails in one query
        type AccountRow = { email: string; first_name: string | null; last_name: string | null; name: string | null };
        let namesByEmail: Map<string, AccountRow> = new Map();
        try {
          const namesRes = await pool.query(
            `SELECT lower(email) AS email, first_name, last_name, name
             FROM accounts
             WHERE lower(email) = ANY($1::text[])`,
            [ccClientEmails.map((e) => e.toLowerCase())]
          );
          namesByEmail = new Map(
            (namesRes.rows as AccountRow[]).map((r) => [r.email.toLowerCase(), r])
          );
        } catch (err) {
          console.error("[Send action] Failed to fetch recipient names:", err);
        }

        for (const recipientEmail of ccClientEmails) {
          try {
            const accountData = namesByEmail.get(recipientEmail.toLowerCase());
            const clientName = accountData
              ? ([accountData.first_name, accountData.last_name].filter(Boolean).join(" ") || accountData.name || null)
              : null;

            const emailContent = generateInvoiceClientEmail({
              invoiceLabel: inv.label,
              invoiceAmount: inv.amount ?? 0,
              hostedUrl: inv.invoice_url ?? "",
              clientName,
              sprintTitle: sharedSprintTitle,
              sprintUrl,
            });

            await sendEmail({
              to: recipientEmail,
              subject: emailContent.subject,
              text: emailContent.text,
              html: emailContent.html,
            });
          } catch (err) {
            // Non-blocking — don't fail the overall send if one studio email fails
            console.error(`[Send action] Studio client email error for ${recipientEmail}:`, err);
          }
        }
      }

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
        sprintUrl,
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
