import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import {
  sendEmail,
  generateInvoiceDraftEmail,
  generateInvoiceSentAdminEmail,
  generateInvoiceClientEmail,
  generateInvoiceCancelledClientEmail,
  generateInvoiceCancelledAdminEmail,
} from "@/lib/email";
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
 * Supports five actions via `{ action }` in the request body:
 *
 * - "generate": Creates a Stripe Invoice draft + line item, finalizes it to
 *   obtain the hosted URL, but does NOT email the client. Saves the Stripe
 *   Invoice ID and URL back to the DB. Supports achOnly flag (default true)
 *   to restrict payment methods to ACH (0.8% fee) and exclude card (2.9%).
 *
 * - "send": Calls stripe.invoices.sendInvoice() to email the client and
 *   marks the local record as "sent". Optionally CCs admin and sends
 *   studio-branded emails to project members via Mailgun.
 *
 * - "send_draft": Emails the hosted Stripe invoice URL to the logged-in admin
 *   via Mailgun so they can preview before sending to the client.
 *
 * - "void": Voids the Stripe invoice and clears the local stripe_invoice_id
 *   so the admin can regenerate. Only allowed before the invoice is sent.
 *
 * - "cancel": Voids the Stripe invoice (if present), optionally sends
 *   cancellation emails to selected client recipients, always notifies the
 *   admin, then permanently deletes the DB record. Blocked for paid/refunded.
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

    const body = await request.json().catch(() => ({})) as { action?: string; ccAdmin?: boolean; ccClientEmails?: string[]; recipientEmail?: string; dueDate?: string; achOnly?: boolean; notifyClient?: boolean; cancelClientEmails?: string[]; cancelMessage?: string | null };
    const action = body.action ?? "send";
    const ccAdmin = body.ccAdmin === true;
    const ccClientEmails: string[] = Array.isArray(body.ccClientEmails) ? body.ccClientEmails : [];
    const recipientEmail: string | undefined = typeof body.recipientEmail === "string" && body.recipientEmail ? body.recipientEmail : undefined;
    const dueDate: string | undefined = typeof body.dueDate === "string" && body.dueDate ? body.dueDate : undefined;
    // achOnly defaults to true — omitting card avoids the 2.9% card fee
    const achOnly: boolean = body.achOnly !== false;

    const origin = new URL(request.url).origin;
    const sprintUrl = `${origin}/sprints/${params.id}`;

    // Fetch the sprint invoice
    const invRes = await pool.query(
      `SELECT si.id, si.sprint_id, si.label, si.amount, si.stripe_invoice_id,
              si.invoice_status, si.invoice_url, si.stripe_recipient_email
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
      stripe_recipient_email: string | null;
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

      // Resolve the actual account email — this is what Stripe will use for all
      // system emails (payment link, receipt, reminders). We store it permanently
      // on the invoice so it never drifts if the account email changes later.
      const billingEmailRes = await pool.query(
        `SELECT email FROM accounts WHERE id = $1`,
        [billingAccountId]
      );
      const resolvedRecipientEmail: string | null =
        (billingEmailRes.rows[0] as { email: string } | undefined)?.email ?? null;

      const stripeCustomerId = await getOrCreateStripeCustomer(pool, billingAccountId);
      const stripe = getStripe();

      const amountCents = Math.round(inv.amount * 100);
      const description = [sprint.title, inv.label].filter(Boolean).join(" — ");

      // Resolve the due date: use the admin-selected date if valid, otherwise 14 days out
      let dueDateUnix: number;
      if (dueDate) {
        // Parse as noon UTC to avoid timezone-edge issues with date-only strings
        const parsed = new Date(`${dueDate}T12:00:00Z`).getTime();
        dueDateUnix = isNaN(parsed) ? Date.now() + 14 * 86400 * 1000 : parsed;
      } else {
        dueDateUnix = Date.now() + 14 * 86400 * 1000;
      }
      const dueDateSec = Math.floor(dueDateUnix / 1000);

      // Create the draft invoice first so the line item is scoped to it.
      // achOnly=true (default) restricts to ACH bank transfer (0.8%, capped $5).
      // achOnly=false also allows card (2.9% + 30¢) as a fallback option.
      const stripeInvoice = await stripe.invoices.create({
        customer: stripeCustomerId,
        collection_method: "send_invoice",
        due_date: dueDateSec,
        payment_settings: {
          payment_method_types: achOnly ? ["us_bank_account"] : ["us_bank_account", "card"],
        },
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
         SET stripe_invoice_id        = $1,
             invoice_url              = $2,
             stripe_recipient_email   = $3,
             updated_at               = now()
         WHERE id = $4`,
        [finalizedInvoice.id, finalizedInvoice.hosted_invoice_url, resolvedRecipientEmail, params.invoiceId]
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
                amount, sort_order, stripe_invoice_id, stripe_recipient_email, created_at, updated_at
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
      let stripeInvoiceIdForSend = inv.stripe_invoice_id;
      let invoiceUrlForEmails = inv.invoice_url ?? "";
      let recipientEmailForRecord: string | null = inv.stripe_recipient_email ?? null;

      // Allow changing the "always sent" Stripe recipient right before send.
      // If the selected email differs from the generated draft recipient, we
      // regenerate the Stripe invoice under the selected account, then send it.
      if (
        recipientEmail &&
        (!inv.invoice_status || !["sent", "paid", "processing", "refunded"].includes(inv.invoice_status))
      ) {
        const normalizedSelected = recipientEmail.toLowerCase();
        const normalizedStored = (inv.stripe_recipient_email ?? "").toLowerCase();

        if (normalizedSelected !== normalizedStored) {
          // Resolve sprint context for fallback account + description
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

          // Lookup selected recipient account first, then fallback to sprint client
          let billingAccountId: string | null = sprint.client_account_id;
          const emailRes = await pool.query(
            `SELECT id FROM accounts WHERE lower(email) = lower($1) LIMIT 1`,
            [recipientEmail]
          );
          if ((emailRes.rowCount ?? 0) > 0) {
            billingAccountId = (emailRes.rows[0] as { id: string }).id;
          }
          if (!billingAccountId) {
            return NextResponse.json(
              { error: "No client account is linked to this recipient — cannot send invoice" },
              { status: 400 }
            );
          }

          const billingEmailRes = await pool.query(
            `SELECT email FROM accounts WHERE id = $1`,
            [billingAccountId]
          );
          const resolvedRecipientEmail: string | null =
            (billingEmailRes.rows[0] as { email: string } | undefined)?.email ?? null;
          if (!resolvedRecipientEmail) {
            return NextResponse.json(
              { error: "Selected recipient account has no email address" },
              { status: 400 }
            );
          }

          // Read current Stripe invoice settings so the regenerated invoice keeps
          // the same due date + payment method availability.
          const currentStripeInvoice = await stripe.invoices.retrieve(inv.stripe_invoice_id);
          const dueDateSec =
            currentStripeInvoice.due_date ?? Math.floor((Date.now() + 14 * 86400 * 1000) / 1000);
          const allowsCard =
            currentStripeInvoice.payment_settings?.payment_method_types?.includes("card") ?? false;
          const paymentMethodTypes: import("stripe").Stripe.InvoiceCreateParams.PaymentSettings.PaymentMethodType[] =
            allowsCard ? ["us_bank_account", "card"] : ["us_bank_account"];

          if (!inv.amount || inv.amount <= 0) {
            return NextResponse.json(
              { error: "Invoice must have a positive amount before sending" },
              { status: 400 }
            );
          }

          const stripeCustomerId = await getOrCreateStripeCustomer(pool, billingAccountId);
          const amountCents = Math.round(inv.amount * 100);
          const description = [sprint.title, inv.label].filter(Boolean).join(" — ");

          const replacementStripeInvoice = await stripe.invoices.create({
            customer: stripeCustomerId,
            collection_method: "send_invoice",
            due_date: dueDateSec,
            payment_settings: {
              payment_method_types: paymentMethodTypes,
            },
            metadata: {
              sprint_id: params.id,
              invoice_id: params.invoiceId,
            },
          });

          await stripe.invoiceItems.create({
            customer: stripeCustomerId,
            invoice: replacementStripeInvoice.id,
            amount: amountCents,
            currency: "usd",
            description,
          });

          const finalizedReplacement = await stripe.invoices.finalizeInvoice(replacementStripeInvoice.id, {
            auto_advance: false,
          });

          // Best-effort void old draft/finalized invoice so only one remains active.
          try {
            await stripe.invoices.voidInvoice(inv.stripe_invoice_id);
          } catch (err) {
            console.warn("[Send action] Previous Stripe invoice void failed:", err);
          }

          stripeInvoiceIdForSend = finalizedReplacement.id;
          invoiceUrlForEmails = finalizedReplacement.hosted_invoice_url ?? invoiceUrlForEmails;
          recipientEmailForRecord = resolvedRecipientEmail;

          await pool.query(
            `UPDATE sprint_invoices
             SET stripe_invoice_id      = $1,
                 invoice_url            = $2,
                 stripe_recipient_email = $3,
                 updated_at             = now()
             WHERE id = $4`,
            [stripeInvoiceIdForSend, invoiceUrlForEmails, recipientEmailForRecord, params.invoiceId]
          );
        }
      }

      await stripe.invoices.sendInvoice(stripeInvoiceIdForSend);

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
          stripe_invoice_id: stripeInvoiceIdForSend,
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
            hostedUrl: invoiceUrlForEmails,
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
              hostedUrl: invoiceUrlForEmails,
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
                amount, sort_order, stripe_invoice_id, stripe_recipient_email, created_at, updated_at
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

    // -------------------------------------------------------------------------
    // ACTION: void
    // -------------------------------------------------------------------------
    if (action === "void") {
      if (!inv.stripe_invoice_id) {
        return NextResponse.json(
          { error: "No Stripe invoice to void" },
          { status: 400 }
        );
      }
      if (inv.invoice_status === "sent" || inv.invoice_status === "paid") {
        return NextResponse.json(
          { error: "Cannot void an invoice that has already been sent or paid" },
          { status: 409 }
        );
      }

      const stripe = getStripe();
      await stripe.invoices.voidInvoice(inv.stripe_invoice_id);

      await pool.query(
        `UPDATE sprint_invoices
         SET stripe_invoice_id = NULL,
             invoice_url       = NULL,
             invoice_pdf_url   = NULL,
             invoice_status    = 'draft',
             updated_at        = now()
         WHERE id = $1`,
        [params.invoiceId]
      );

      await writeChangelog(
        pool,
        params.id,
        user.accountId ?? null,
        "stripe_invoice_voided",
        `Stripe invoice voided for "${inv.label}" — ready to regenerate`,
        { invoice_id: inv.id, label: inv.label, voided_stripe_id: inv.stripe_invoice_id }
      );

      const updatedRes = await pool.query(
        `SELECT id, sprint_id, label, invoice_url, invoice_status, invoice_pdf_url,
                amount, sort_order, stripe_invoice_id, stripe_recipient_email, created_at, updated_at
         FROM sprint_invoices WHERE id = $1`,
        [params.invoiceId]
      );

      return NextResponse.json({ invoice: updatedRes.rows[0] }, { status: 200 });
    }

    // -------------------------------------------------------------------------
    // ACTION: cancel
    // Voids the Stripe invoice (if present), optionally emails the client a
    // cancellation notice, emails the admin, then deletes the DB record.
    // Blocked for paid/refunded invoices.
    // -------------------------------------------------------------------------
    if (action === "cancel") {
      if (inv.invoice_status === "paid" || inv.invoice_status === "refunded") {
        return NextResponse.json(
          { error: "Cannot cancel an invoice that has already been paid or refunded" },
          { status: 409 }
        );
      }

      // Void on Stripe if we have a Stripe invoice that isn't already voided
      if (inv.stripe_invoice_id && inv.invoice_status !== "voided") {
        try {
          const stripe = getStripe();
          await stripe.invoices.voidInvoice(inv.stripe_invoice_id);
        } catch (err) {
          // Log but don't block — the Stripe invoice may already be voided
          console.warn("[Cancel action] Stripe void failed (may already be voided):", err);
        }
      }

      // Resolve sprint + client info for notification emails
      const sprintRes = await pool.query(
        `SELECT sd.title, sd.project_id,
                COALESCE(p.account_id, d.account_id) AS client_account_id
         FROM sprint_drafts sd
         LEFT JOIN projects p ON sd.project_id = p.id
         LEFT JOIN documents d ON sd.document_id = d.id
         WHERE sd.id = $1`,
        [params.id]
      );
      const sprint = (sprintRes.rowCount ?? 0) > 0
        ? (sprintRes.rows[0] as { title: string | null; project_id: string | null; client_account_id: string | null })
        : null;

      const wasSent = inv.invoice_status === "sent";
      const cancelClientEmails: string[] = Array.isArray(body.cancelClientEmails) ? body.cancelClientEmails : [];
      const cancelMessage = typeof body.cancelMessage === "string" && body.cancelMessage.trim() ? body.cancelMessage.trim() : null;

      const clientEmailSummary = cancelClientEmails.join(", ") || null;

      // Send client cancellation emails to each explicitly-selected recipient
      if (wasSent && cancelClientEmails.length > 0) {
        // Look up names for the selected recipients
        type AccountRow = { email: string; first_name: string | null; last_name: string | null; name: string | null };
        let namesByEmail: Map<string, AccountRow> = new Map();
        try {
          const namesRes = await pool.query(
            `SELECT lower(email) AS email, first_name, last_name, name
             FROM accounts WHERE lower(email) = ANY($1::text[])`,
            [cancelClientEmails.map((e) => e.toLowerCase())]
          );
          namesByEmail = new Map((namesRes.rows as AccountRow[]).map((r) => [r.email.toLowerCase(), r]));
        } catch (err) {
          console.error("[Cancel action] Failed to fetch recipient names:", err);
        }

        for (const recipientEmail of cancelClientEmails) {
          try {
            const accountData = namesByEmail.get(recipientEmail.toLowerCase());
            const clientName = accountData
              ? ([accountData.first_name, accountData.last_name].filter(Boolean).join(" ") || accountData.name || null)
              : null;
            const content = generateInvoiceCancelledClientEmail({
              invoiceLabel: inv.label,
              invoiceAmount: inv.amount ?? 0,
              clientName,
              sprintTitle: sprint?.title ?? null,
              sprintUrl,
              customMessage: cancelMessage,
            });
            await sendEmail({ to: recipientEmail, ...content });
          } catch (err) {
            console.error(`[Cancel action] Client cancellation email failed for ${recipientEmail}:`, err);
          }
        }
      }

      // Always notify the admin
      try {
        const adminName = user.name ?? user.email.split("@")[0] ?? null;
        const content = generateInvoiceCancelledAdminEmail({
          invoiceLabel: inv.label,
          invoiceAmount: inv.amount ?? 0,
          adminName,
          clientEmail: clientEmailSummary,
          sprintTitle: sprint?.title ?? null,
          sprintUrl,
          notifiedClient: wasSent && cancelClientEmails.length > 0,
        });
        await sendEmail({ to: user.email, ...content });
      } catch (err) {
        console.error("[Cancel action] Admin cancellation email failed:", err);
      }

      await writeChangelog(
        pool,
        params.id,
        user.accountId ?? null,
        "invoice_cancelled",
        `Invoice "${inv.label}" cancelled and deleted`,
        {
          invoice_id: inv.id,
          label: inv.label,
          amount: inv.amount,
          stripe_invoice_id: inv.stripe_invoice_id,
          notified_client: wasSent && cancelClientEmails.length > 0,
          notified_emails: cancelClientEmails,
        }
      );

      // Delete the DB record
      await pool.query(
        `DELETE FROM sprint_invoices WHERE id = $1`,
        [params.invoiceId]
      );

      return NextResponse.json({ success: true, deletedId: params.invoiceId }, { status: 200 });
    }

    // -------------------------------------------------------------------------
    // ACTION: refresh
    // Fetches the live Stripe invoice + payment intent, maps status to our
    // local values, and updates the DB if anything has changed.
    // -------------------------------------------------------------------------
    if (action === "refresh") {
      if (!inv.stripe_invoice_id) {
        return NextResponse.json({ error: "No Stripe invoice linked — nothing to refresh" }, { status: 400 });
      }

      const stripe = getStripe();
      const stripeInvoice = (await stripe.invoices.retrieve(inv.stripe_invoice_id, {
        expand: ["payment_intent"],
      })) as import("stripe").Stripe.Invoice;

      // Map Stripe invoice + payment intent status → our local status
      let newStatus = inv.invoice_status;

      if (stripeInvoice.status === "paid") {
        newStatus = "paid";
      } else if (stripeInvoice.status === "void") {
        newStatus = "voided";
      } else if (stripeInvoice.status === "uncollectible") {
        newStatus = "failed";
      } else if (stripeInvoice.status === "open") {
        // Drill into the payment intent for ACH processing state
        const rawPaymentIntent = (
          stripeInvoice as unknown as {
            payment_intent?: string | import("stripe").Stripe.PaymentIntent | null;
          }
        ).payment_intent;
        const pi =
          rawPaymentIntent && typeof rawPaymentIntent !== "string"
            ? rawPaymentIntent
            : null;
        if (pi?.status === "processing") {
          newStatus = "processing";
        } else if (pi?.status === "succeeded") {
          newStatus = "paid";
        } else if (pi?.status === "canceled") {
          newStatus = "failed";
        } else {
          newStatus = "sent";
        }
      }

      const statusChanged = newStatus !== inv.invoice_status;

      if (statusChanged) {
        await pool.query(
          `UPDATE sprint_invoices SET invoice_status = $1, updated_at = now() WHERE id = $2`,
          [newStatus, params.invoiceId]
        );

        await writeChangelog(
          pool,
          params.id,
          user.accountId ?? null,
          "invoice_status_refreshed",
          `Invoice "${inv.label}" status updated to "${newStatus}" via manual refresh`,
          { invoice_id: inv.id, label: inv.label, old_status: inv.invoice_status, new_status: newStatus }
        );
      }

      const updatedRes = await pool.query(
        `SELECT id, sprint_id, label, invoice_url, invoice_status, invoice_pdf_url,
                amount, sort_order, stripe_invoice_id, stripe_recipient_email, created_at, updated_at
         FROM sprint_invoices WHERE id = $1`,
        [params.invoiceId]
      );

      return NextResponse.json({
        invoice: updatedRes.rows[0],
        statusChanged,
        stripeStatus: stripeInvoice.status,
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action. Use generate, send, send_draft, void, cancel, or refresh." }, { status: 400 });
  } catch (err) {
    console.error("[Stripe Invoice POST]", err);
    const message = err instanceof Error ? err.message : "Failed to process Stripe invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
