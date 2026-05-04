/**
 * Email utility functions using Mailgun
 */

import { createHmac, timingSafeEqual } from "crypto";
import { getPool } from "@/lib/db";

/**
 * Classification for deliverability handling.
 *
 * - `transactional` — user-initiated, required communication (magic link, verification
 *   code, support reply, intake confirmation, invoice sent/receipt). Never suppressed,
 *   no List-Unsubscribe header added, tracking disabled by default.
 *
 * - `notification` — system-generated updates where the recipient should be able to
 *   opt out (admin alerts on member adds, daily summaries, reminder-class messages).
 *   Honors the `email_unsubscribes` table and adds `List-Unsubscribe` +
 *   `List-Unsubscribe-Post` headers so Gmail/Yahoo one-click unsubscribe works.
 */
export type EmailCategory = "transactional" | "notification";

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  cc?: string;
  /** See {@link EmailCategory}. Defaults to `"transactional"` so legacy callers are safe. */
  category?: EmailCategory;
  /** Optional Mailgun tag (`o:tag`) for per-type analytics, e.g. "magic-link". */
  tag?: string;
  /** Override open/click tracking. Defaults depend on category. */
  tracking?: { clicks?: boolean; opens?: boolean };
}

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  /** True when the send was skipped because the recipient is on the suppression list. */
  suppressed?: boolean;
};

// ---------------------------------------------------------------------------
// Unsubscribe token + suppression helpers
// ---------------------------------------------------------------------------

const UNSUB_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

function getBaseUrl(): string {
  return (
    (process.env.BASE_URL || "").replace(/\/$/, "") ||
    "https://meisner.design"
  );
}

function makeUnsubToken(email: string, category: string): string {
  const h = createHmac("sha256", UNSUB_SECRET);
  h.update(`unsub:${email.trim().toLowerCase()}:${category}`);
  return h.digest("hex").slice(0, 32);
}

export function verifyUnsubToken(email: string, category: string, token: string): boolean {
  const expected = makeUnsubToken(email, category);
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}

export function buildUnsubscribeUrl(email: string, category: string): string {
  const token = makeUnsubToken(email, category);
  const qs = new URLSearchParams({ e: email.toLowerCase(), c: category, t: token });
  return `${getBaseUrl()}/api/unsubscribe?${qs.toString()}`;
}

/** Check whether this recipient has opted out of the given category (or all mail). */
export async function isUnsubscribed(email: string, category: string): Promise<boolean> {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 1 FROM email_unsubscribes
       WHERE lower(email) = lower($1)
         AND (category = $2 OR category = 'all')
       LIMIT 1`,
      [email, category]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    // Table may not exist yet in very fresh installs — fail-open so transactional
    // mail still flows. Notification mail is also still sent; risk is minimal because
    // ensureSchema() is called on nearly every route before sendEmail.
    console.warn("[Email] Suppression lookup failed; proceeding with send", {
      error: (err as Error).message,
    });
    return false;
  }
}

// ---------------------------------------------------------------------------
// sendEmail
// ---------------------------------------------------------------------------

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const category: EmailCategory = params.category ?? "transactional";
  const tag = params.tag;

  try {
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const mailgunFromEmail = process.env.MAILGUN_FROM_EMAIL || `no-reply@${mailgunDomain || "example.com"}`;
    const mailgunFromName = process.env.MAILGUN_FROM_NAME || "Meisner Design";
    const mailgunReplyTo = process.env.MAILGUN_REPLY_TO;
    const mailgunFrom = mailgunFromName
      ? `${mailgunFromName} <${mailgunFromEmail}>`
      : mailgunFromEmail;

    if (!mailgunApiKey || !mailgunDomain) {
      console.warn("[Email] Mailgun not configured. Email not sent.", { to: params.to });
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    // Suppression check: only for notification-class messages. Transactional mail
    // (magic links, receipts, invoices) is always sent.
    if (category === "notification" && (await isUnsubscribed(params.to, tag || category))) {
      console.log("[Email] Skipping send — recipient unsubscribed", {
        to: params.to,
        category,
        tag,
      });
      return {
        success: false,
        suppressed: true,
        error: "Recipient has unsubscribed",
      };
    }

    const authHeader = `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString("base64")}`;

    const requestParams: Record<string, string> = {
      from: mailgunFrom,
      to: params.to,
      subject: params.subject,
      text: params.text,
    };

    if (params.html) {
      requestParams.html = params.html;
    }
    const replyTo = params.replyTo || mailgunReplyTo;
    if (replyTo) {
      requestParams["h:Reply-To"] = replyTo;
    }
    if (params.cc) {
      requestParams.cc = params.cc;
    }

    // Per-send tracking controls.
    //
    // Default: transactional sends disable open + click tracking. Click-tracking
    // rewrites URLs through the Mailgun tracking CNAME, which (a) reduces trust on
    // the visible link and (b) occasionally trips Gmail heuristics for auth-style
    // mail. Notifications inherit the Mailgun dashboard defaults unless overridden.
    const clicks = params.tracking?.clicks ?? (category === "transactional" ? false : undefined);
    const opens = params.tracking?.opens ?? (category === "transactional" ? false : undefined);
    if (clicks === false) requestParams["o:tracking-clicks"] = "no";
    if (clicks === true) requestParams["o:tracking-clicks"] = "htmlonly";
    if (opens === false) requestParams["o:tracking-opens"] = "no";
    if (opens === true) requestParams["o:tracking-opens"] = "yes";
    if (category === "transactional") {
      // Belt and suspenders: also disable the parent "tracking" flag so nothing is
      // rewritten on auth/verification mail.
      requestParams["o:tracking"] = "no";
    }

    if (tag) {
      requestParams["o:tag"] = tag;
    }

    // One-click unsubscribe headers — required by Gmail/Yahoo 2024 bulk sender
    // rules for any mail that isn't purely transactional. We only add these for
    // notifications so recipients can't "unsubscribe" from security-critical mail.
    if (category === "notification") {
      const unsubUrl = buildUnsubscribeUrl(params.to, tag || category);
      requestParams["h:List-Unsubscribe"] = `<${unsubUrl}>, <mailto:unsubscribe@${mailgunDomain}?subject=unsubscribe>`;
      requestParams["h:List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    const mailgunRes = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(requestParams),
    });

    if (!mailgunRes.ok) {
      const errText = await mailgunRes.text().catch(() => "");
      console.error("[Email] Mailgun send failed", {
        status: mailgunRes.status,
        to: params.to,
        category,
        tag,
        body: errText.slice(0, 500),
      });
      return {
        success: false,
        error: `Mailgun API error: ${mailgunRes.status}`,
      };
    }

    const responseData = await mailgunRes.json();
    console.log("[Email] Email sent successfully", {
      to: params.to,
      subject: params.subject,
      category,
      tag,
      messageId: responseData.id,
    });

    return {
      success: true,
      messageId: responseData.id,
    };
  } catch (error: unknown) {
    console.error("[Email] Error sending email:", error);
    return {
      success: false,
      error: (error as Error).message ?? "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Shared HTML shell — keeps every email visually consistent and simple
// ---------------------------------------------------------------------------

function emailShell(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:8px;border:1px solid #e4e4e7;padding:32px;">
<tr><td style="color:#18181b;font-size:15px;line-height:1.6;">
${body}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function linkButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:#18181b;color:#ffffff!important;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:600;margin:16px 0;">${label}</a>`;
}

function muted(text: string): string {
  return `<p style="color:#71717a;font-size:13px;margin:0;">${text}</p>`;
}

function secondaryLink(href: string, label: string): string {
  return `<p style="margin:12px 0 0;"><a href="${href}" style="color:#71717a;font-size:13px;text-decoration:underline;">${label}</a></p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">`;
}

// ---------------------------------------------------------------------------
// Email generators
// ---------------------------------------------------------------------------

/**
 * Project draft notification
 */
export function generateSprintDraftEmail(params: {
  sprintTitle: string;
  sprintUrl: string;
  clientName?: string;
  projectName?: string;
}): { subject: string; text: string; html: string } {
  const { sprintTitle, sprintUrl, clientName, projectName } = params;

  const greeting = clientName ? `Hi ${clientName},` : "Hi there,";
  const projectContext = projectName ? ` for ${projectName}` : "";

  const subject = `Your project plan is ready: ${sprintTitle}`;

  const text = `${greeting}

Your project plan${projectContext} is ready to review.

${sprintTitle}

View it here: ${sprintUrl}

The plan includes selected deliverables with pricing, a detailed backlog, and timeline. This is a draft — reply to this email if you'd like any changes.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">Your project plan${projectContext} is ready to review.</p>
<p style="margin:0 0 4px;font-weight:600;">${sprintTitle}</p>
${linkButton(sprintUrl, "View project plan")}
<p style="margin:16px 0 0;">The plan includes deliverables with pricing, a detailed backlog, and timeline. This is a draft&nbsp;&mdash; reply to this email if you&rsquo;d like any changes.</p>
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

/**
 * Welcome email for a new project member
 */
export function generateMemberWelcomeEmail(params: {
  projectName: string;
  loginUrl: string;
  addedByName?: string;
}): { subject: string; text: string; html: string } {
  const { projectName, loginUrl, addedByName } = params;
  const addedBy = addedByName ? ` by ${addedByName}` : "";

  const subject = `You've been added to ${projectName}`;

  const text = `Hi there,

You've been added to "${projectName}"${addedBy}.

To access the project, go to ${loginUrl} and enter your email. You'll receive a magic link — no password needed.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">Hi there,</p>
<p style="margin:0 0 16px;">You&rsquo;ve been added to <strong>${projectName}</strong>${addedBy}.</p>
<p style="margin:0 0 16px;">To access the project, log in with your email. You&rsquo;ll receive a magic link&nbsp;&mdash; no password needed.</p>
${linkButton(loginUrl, "Log in")}
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

/**
 * Admin notification — new member added
 */
export function generateAdminNotificationEmail(params: {
  projectName: string;
  newMemberEmail: string;
  addedByName?: string;
  projectUrl: string;
}): { subject: string; text: string; html: string } {
  const { projectName, newMemberEmail, addedByName, projectUrl } = params;
  const who = addedByName || "Someone";

  const subject = `New member added to ${projectName}`;

  const text = `Hi there,

${who} added ${newMemberEmail} to "${projectName}".

View the project: ${projectUrl}

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">Hi there,</p>
<p style="margin:0 0 16px;">${who} added <strong>${newMemberEmail}</strong> to <strong>${projectName}</strong>.</p>
${linkButton(projectUrl, "View project")}
${divider()}
${muted("You're receiving this because you're an admin on this project.")}
`);

  return { subject, text, html };
}

/**
 * Admin notification — member removed
 */
export function generateMemberRemovedNotificationEmail(params: {
  projectName: string;
  removedMemberEmail: string;
  removedByName?: string;
  projectUrl: string;
}): { subject: string; text: string; html: string } {
  const { projectName, removedMemberEmail, removedByName, projectUrl } = params;
  const who = removedByName || "Someone";

  const subject = `Member removed from ${projectName}`;

  const text = `Hi there,

${who} removed ${removedMemberEmail} from "${projectName}".

View the project: ${projectUrl}

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">Hi there,</p>
<p style="margin:0 0 16px;">${who} removed <strong>${removedMemberEmail}</strong> from <strong>${projectName}</strong>.</p>
${linkButton(projectUrl, "View project")}
${divider()}
${muted("You're receiving this because you're an admin on this project.")}
`);

  return { subject, text, html };
}

/**
 * Invoice draft preview — sent to admin before sending to client
 */
export function generateInvoiceDraftEmail(params: {
  invoiceLabel: string;
  invoiceAmount: number;
  hostedUrl: string;
  adminName: string | null;
  sprintTitle?: string | null;
  sprintUrl?: string | null;
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, hostedUrl, adminName, sprintTitle, sprintUrl } = params;
  const greeting = adminName ? `Hi ${adminName},` : "Hi there,";
  const formattedAmount = `$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const context = sprintTitle ? ` for <strong>${sprintTitle}</strong>` : "";
  const contextText = sprintTitle ? ` for ${sprintTitle}` : "";

  const subject = `Draft invoice preview: ${invoiceLabel}${sprintTitle ? ` — ${sprintTitle}` : ""}`;

  const text = `${greeting}

Here is a preview of the Stripe invoice before it's sent to the client.

Invoice: ${invoiceLabel}${contextText}
Amount: ${formattedAmount}

Review it here: ${hostedUrl}
${sprintUrl ? `\nView sprint page: ${sprintUrl}\n` : ""}
This is a draft preview — the client has not been notified yet. Once you're ready, return to the sprint page and click "Send Invoice to Client".

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">Here is a preview of the Stripe invoice before it&rsquo;s sent to the client.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">${invoiceLabel}${context}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formattedAmount}</p>
    </td>
  </tr>
</table>
${linkButton(hostedUrl, "Preview Invoice")}
${sprintUrl ? secondaryLink(sprintUrl, "View sprint page →") : ""}
<p style="margin:16px 0 0;font-size:13px;color:#71717a;">This is a draft preview&nbsp;&mdash; the client has <strong>not</strong> been notified yet. Once you&rsquo;re ready, return to the sprint page and click &ldquo;Send Invoice to Client&rdquo;.</p>
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

/**
 * Invoice sent notification — CC'd to admin when the invoice is sent to the client
 */
export function generateInvoiceSentAdminEmail(params: {
  invoiceLabel: string;
  invoiceAmount: number;
  hostedUrl: string;
  adminName: string | null;
  clientEmail: string | null;
  sprintTitle?: string | null;
  sprintUrl?: string | null;
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, hostedUrl, adminName, clientEmail, sprintTitle, sprintUrl } = params;
  const greeting = adminName ? `Hi ${adminName},` : "Hi there,";
  const formattedAmount = `$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const context = sprintTitle ? ` for <strong>${sprintTitle}</strong>` : "";
  const contextText = sprintTitle ? ` for ${sprintTitle}` : "";
  const clientNote = clientEmail ? ` It was sent to <strong>${clientEmail}</strong>.` : "";
  const clientNoteText = clientEmail ? ` It was sent to ${clientEmail}.` : "";

  const subject = `Invoice sent: ${invoiceLabel}${sprintTitle ? ` — ${sprintTitle}` : ""}`;

  const text = `${greeting}

Just a heads up — the following invoice has been sent to the client.${clientNoteText}

Invoice: ${invoiceLabel}${contextText}
Amount: ${formattedAmount}

View invoice: ${hostedUrl}
${sprintUrl ? `View sprint page: ${sprintUrl}\n` : ""}
— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">Just a heads up&nbsp;&mdash; the following invoice has been sent to the client.${clientNote}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">${invoiceLabel}${context}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formattedAmount}</p>
    </td>
  </tr>
</table>
${linkButton(hostedUrl, "View Invoice")}
${sprintUrl ? secondaryLink(sprintUrl, "View sprint page →") : ""}
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

/**
 * Studio-branded invoice email sent directly to the client — provides sprint context
 * and a link back to the sprint page alongside the Stripe payment link.
 */
export function generateInvoiceClientEmail(params: {
  invoiceLabel: string;
  invoiceAmount: number;
  hostedUrl: string;
  clientName: string | null;
  sprintTitle?: string | null;
  sprintUrl?: string | null;
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, hostedUrl, clientName, sprintTitle, sprintUrl } = params;
  const greeting = clientName ? `Hi ${clientName},` : "Hi there,";
  const formattedAmount = `$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const context = sprintTitle ? ` for <strong>${sprintTitle}</strong>` : "";
  const contextText = sprintTitle ? ` for ${sprintTitle}` : "";

  const subject = `Invoice ready${sprintTitle ? ` — ${sprintTitle}` : ""}: ${invoiceLabel}`;

  const text = `${greeting}

Your invoice is ready for payment.

Invoice: ${invoiceLabel}${contextText}
Amount: ${formattedAmount}

Pay now: ${hostedUrl}
${sprintUrl ? `\nView your sprint: ${sprintUrl}\n` : ""}
Questions? Just reply to this email.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">Your invoice is ready for payment.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">${invoiceLabel}${context}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formattedAmount}</p>
    </td>
  </tr>
</table>
${linkButton(hostedUrl, "Pay Invoice")}
${sprintUrl ? secondaryLink(sprintUrl, "View your sprint →") : ""}
<p style="margin:16px 0 0;font-size:13px;color:#71717a;">Questions? Just reply to this email.</p>
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

/**
 * Invoice paid — sent to the client as a payment confirmation
 */
export function generateInvoicePaidClientEmail(params: {
  invoiceLabel: string;
  invoiceAmount: number;
  sprintTitle?: string | null;
  clientName?: string | null;
  sprintUrl?: string | null;
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, sprintTitle, clientName, sprintUrl } = params;
  const greeting = clientName ? `Hi ${clientName},` : "Hi there,";
  const formattedAmount = `$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const context = sprintTitle ? ` for <strong>${sprintTitle}</strong>` : "";
  const contextText = sprintTitle ? ` for ${sprintTitle}` : "";

  const subject = `Payment confirmed — thank you!`;

  const sprintLinkText = sprintUrl ? `\nView your project: ${sprintUrl}\n` : "";
  const text = `${greeting}

We've received your payment — thank you!

Invoice: ${invoiceLabel}${contextText}
Amount: ${formattedAmount}
${sprintLinkText}
Your account is all up to date. Reply to this email if you have any questions.

— Meisner Design
`;

  const sprintLinkHtml = sprintUrl
    ? `<p style="margin:16px 0 0;"><a href="${sprintUrl}" style="color:#4f46e5;text-decoration:none;font-weight:500;">View your project →</a></p>`
    : "";

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">We&rsquo;ve received your payment&nbsp;&mdash; thank you!</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">${invoiceLabel}${context}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formattedAmount}</p>
    </td>
  </tr>
</table>
<p style="margin:0;">Your account is all up to date. Reply to this email if you have any questions.</p>
${sprintLinkHtml}
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

/**
 * Invoice paid — sent to all admin accounts when payment has cleared and funds are available.
 * (Stripe sends invoice.paid when the payment is settled, not when it was merely initiated.)
 */
export function generateInvoicePaidAdminEmail(params: {
  invoiceLabel: string;
  invoiceAmount: number;
  sprintTitle?: string | null;
  clientName?: string | null;
  clientEmail: string;
  adminName?: string | null;
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, sprintTitle, clientName, clientEmail, adminName } = params;
  const greeting = adminName ? `Hi ${adminName},` : "Hi there,";
  const formattedAmount = `$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const context = sprintTitle ? ` for <strong>${sprintTitle}</strong>` : "";
  const contextText = sprintTitle ? ` for ${sprintTitle}` : "";
  const clientDisplay = clientName ? `${clientName} (${clientEmail})` : clientEmail;

  const subject = `Payment cleared: ${invoiceLabel}${sprintTitle ? ` — ${sprintTitle}` : ""}`;

  const text = `${greeting}

Payment for invoice "${invoiceLabel}"${contextText} from ${clientDisplay} has cleared — the funds have been deposited and are available.

Amount: ${formattedAmount}

No action needed — this is an automatic notification.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">Payment for invoice &ldquo;${invoiceLabel}&rdquo;${context} from <strong>${clientDisplay}</strong> has cleared&nbsp;&mdash; the funds have been deposited and are available.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">${invoiceLabel}${context}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formattedAmount}</p>
    </td>
  </tr>
</table>
${divider()}
${muted("No action needed&nbsp;&mdash; this is an automatic notification.")}
`);

  return { subject, text, html };
}

/**
 * Payment pending — sent to admin when the client has submitted payment and it's in the pending state
 * (e.g. ACH initiated; funds not yet cleared). A separate "payment cleared" email is sent when funds are available.
 */
export function generateInvoiceProcessingAdminEmail(params: {
  invoiceLabel: string;
  invoiceAmount: number;
  adminName?: string | null;
  clientEmail?: string | null;
  sprintTitle?: string | null;
  sprintUrl?: string | null;
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, adminName, clientEmail, sprintTitle, sprintUrl } = params;
  const greeting = adminName ? `Hi ${adminName},` : "Hi there,";
  const formattedAmount = `$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const context = sprintTitle ? ` for <strong>${sprintTitle}</strong>` : "";
  const contextText = sprintTitle ? ` for ${sprintTitle}` : "";
  const clientNote = clientEmail ? ` from <strong>${clientEmail}</strong>` : "";
  const clientNoteText = clientEmail ? ` from ${clientEmail}` : "";

  const subject = `Payment pending: ${invoiceLabel}${sprintTitle ? ` — ${sprintTitle}` : ""}`;

  const text = `${greeting}

A client has submitted payment${clientNoteText} for invoice "${invoiceLabel}"${contextText}. The payment is pending (not yet cleared).

Amount: ${formattedAmount}

For ACH/bank transfers, funds typically settle within 1–3 business days. You'll receive another notification once the payment has cleared and funds are available.
${sprintUrl ? `\nView sprint: ${sprintUrl}\n` : ""}
— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">A client has submitted payment${clientNote} for invoice &ldquo;${invoiceLabel}&rdquo;${context}. The payment is <strong>pending</strong> (not yet cleared).</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">${invoiceLabel}${context}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formattedAmount}</p>
    </td>
  </tr>
</table>
${sprintUrl ? secondaryLink(sprintUrl, "View sprint →") : ""}
${divider()}
${muted("For ACH/bank transfers, funds typically settle within 1&ndash;3 business days. You&rsquo;ll receive another notification once the payment has cleared and funds are available.")}
`);

  return { subject, text, html };
}

/**
 * ACH payment processing — sent to client confirming their bank transfer is in progress
 */
export function generateInvoiceProcessingClientEmail(params: {
  invoiceLabel: string;
  invoiceAmount: number;
  clientName?: string | null;
  sprintTitle?: string | null;
  sprintUrl?: string | null;
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, clientName, sprintTitle, sprintUrl } = params;
  const greeting = clientName ? `Hi ${clientName},` : "Hi there,";
  const formattedAmount = `$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const context = sprintTitle ? ` for <strong>${sprintTitle}</strong>` : "";
  const contextText = sprintTitle ? ` for ${sprintTitle}` : "";

  const subject = `Payment received — processing now`;

  const text = `${greeting}

We've received your ACH bank transfer for invoice "${invoiceLabel}"${contextText}.

Amount: ${formattedAmount}

Bank transfers typically clear within 1–3 business days. No further action is needed on your end.
${sprintUrl ? `\nView your project: ${sprintUrl}\n` : ""}
Questions? Just reply to this email.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">We&rsquo;ve received your ACH bank transfer for invoice &ldquo;${invoiceLabel}&rdquo;${context}.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">${invoiceLabel}${context}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formattedAmount}</p>
    </td>
  </tr>
</table>
<p style="margin:0;">Bank transfers typically clear within 1&ndash;3 business days. No further action is needed on your end.</p>
${sprintUrl ? secondaryLink(sprintUrl, "View your project →") : ""}
<p style="margin:16px 0 0;font-size:13px;color:#71717a;">Questions? Just reply to this email.</p>
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

/**
 * Invoice cancelled — sent to client when a previously-sent invoice is voided
 */
export function generateInvoiceCancelledClientEmail(params: {
  invoiceLabel: string;
  invoiceAmount: number;
  clientName?: string | null;
  sprintTitle?: string | null;
  sprintUrl?: string | null;
  customMessage?: string | null;
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, clientName, sprintTitle, sprintUrl, customMessage } = params;
  const greeting = clientName ? `Hi ${clientName},` : "Hi there,";
  const formattedAmount = `$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const context = sprintTitle ? ` for <strong>${sprintTitle}</strong>` : "";
  const contextText = sprintTitle ? ` for ${sprintTitle}` : "";

  const subject = `Invoice cancelled: ${invoiceLabel}${sprintTitle ? ` — ${sprintTitle}` : ""}`;

  const customMessageBlock = customMessage ? `\n${customMessage}\n` : "";
  const customMessageHtml = customMessage
    ? `<p style="margin:16px 0 0;white-space:pre-wrap;">${customMessage}</p>`
    : "";

  const text = `${greeting}

The following invoice has been cancelled — no payment is due.

Invoice: ${invoiceLabel}${contextText}
Amount: ${formattedAmount}
${customMessageBlock}${sprintUrl ? `\nView your project: ${sprintUrl}\n` : ""}
If you have any questions, just reply to this email.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">The following invoice has been cancelled&nbsp;&mdash; no payment is due.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">${invoiceLabel}${context}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formattedAmount}</p>
    </td>
  </tr>
</table>
${customMessageHtml}
${sprintUrl ? secondaryLink(sprintUrl, "View your project →") : ""}
<p style="margin:16px 0 0;font-size:13px;color:#71717a;">Questions? Just reply to this email.</p>
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

/**
 * Invoice cancelled — internal admin notification
 */
export function generateInvoiceCancelledAdminEmail(params: {
  invoiceLabel: string;
  invoiceAmount: number;
  adminName?: string | null;
  clientEmail?: string | null;
  sprintTitle?: string | null;
  sprintUrl?: string | null;
  notifiedClient: boolean;
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, adminName, clientEmail, sprintTitle, sprintUrl, notifiedClient } = params;
  const greeting = adminName ? `Hi ${adminName},` : "Hi there,";
  const formattedAmount = `$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const context = sprintTitle ? ` for <strong>${sprintTitle}</strong>` : "";
  const contextText = sprintTitle ? ` for ${sprintTitle}` : "";
  const clientNote = clientEmail
    ? notifiedClient
      ? ` A cancellation notice was sent to <strong>${clientEmail}</strong>.`
      : ` The client (<strong>${clientEmail}</strong>) was <strong>not</strong> notified.`
    : "";

  const subject = `Invoice cancelled: ${invoiceLabel}${sprintTitle ? ` — ${sprintTitle}` : ""}`;

  const text = `${greeting}

Invoice "${invoiceLabel}"${contextText} has been cancelled and removed.${clientEmail ? ` Client: ${clientEmail}. Notified: ${notifiedClient ? "yes" : "no"}.` : ""}

Amount: ${formattedAmount}
${sprintUrl ? `\nView sprint: ${sprintUrl}\n` : ""}
— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">Invoice &ldquo;${invoiceLabel}&rdquo;${context} has been cancelled and removed.${clientNote}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">${invoiceLabel}${context}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formattedAmount}</p>
    </td>
  </tr>
</table>
${sprintUrl ? secondaryLink(sprintUrl, "View sprint →") : ""}
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

/**
 * Magic-link login email (transactional)
 */
export function generateMagicLinkEmail(params: {
  magicLink: string;
  expiresInMinutes?: number;
}): { subject: string; text: string; html: string } {
  const expiresInMinutes = params.expiresInMinutes ?? 15;

  const subject = "Your sign-in link";

  const text = `Hi there,

Click the link below to sign in to Meisner Design:

${params.magicLink}

This link expires in ${expiresInMinutes} minutes and can only be used once.

If you didn't request this, you can safely ignore this email — no one can access your account without the link.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">Hi there,</p>
<p style="margin:0 0 16px;">Click the button below to sign in to Meisner Design.</p>
${linkButton(params.magicLink, "Sign in")}
<p style="margin:16px 0 0;font-size:13px;color:#71717a;">Or copy and paste this link into your browser:<br><span style="color:#52525b;word-break:break-all;">${params.magicLink}</span></p>
<p style="margin:16px 0 0;font-size:13px;color:#71717a;">This link expires in ${expiresInMinutes} minutes and can only be used once.</p>
${divider()}
${muted("If you didn&rsquo;t request this, you can safely ignore this email&nbsp;&mdash; no one can access your account without the link.")}
`);

  return { subject, text, html };
}

/**
 * Verification code email (transactional)
 */
export function generateVerificationCodeEmail(params: {
  code: string;
  expiresInMinutes?: number;
}): { subject: string; text: string; html: string } {
  const expiresInMinutes = params.expiresInMinutes ?? 10;

  const subject = "Your verification code";

  const text = `Hi there,

Your Meisner Design verification code is:

${params.code}

Enter this code to verify your email address and create your account. It expires in ${expiresInMinutes} minutes.

If you didn't request this code, you can safely ignore this email.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">Hi there,</p>
<p style="margin:0 0 16px;">Enter this code to verify your email address and finish creating your account:</p>
<div style="text-align:center;background-color:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:24px;margin:8px 0 16px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181b;">${params.code}</div>
<p style="margin:0;font-size:13px;color:#71717a;text-align:center;">This code expires in ${expiresInMinutes} minutes.</p>
${divider()}
${muted("If you didn&rsquo;t request this code, you can safely ignore this email.")}
`);

  return { subject, text, html };
}

/**
 * Intake form confirmation
 */
export function generateIntakeConfirmationEmail(): { subject: string; text: string; html: string } {
  const subject = "We Received Your Intake Form";

  const text = `Hi there,

Thanks for submitting your intake form — we've got it. Our team is reviewing your project details and will follow up with a personalized project plan within 1-2 business days.

Reply to this email if you have any questions.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">Hi there,</p>
<p style="margin:0 0 16px;">Thanks for submitting your intake form&nbsp;&mdash; we&rsquo;ve got it.</p>
<p style="margin:0 0 16px;">Our team is reviewing your project details and will follow up with a personalized project plan within 1&ndash;2 business days.</p>
<p style="margin:0 0 0;">Reply to this email if you have any questions.</p>
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Refinement Cycle email generators
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function projectLabel(name: string | null, emoji: string | null): string {
  const safeName = name ? escapeHtml(name) : "your project";
  return emoji ? `${emoji} ${safeName}` : safeName;
}

function formatDeliveryDate(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split("-").map((n) => Number(n));
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function attachmentBlock(url: string | null | undefined): string {
  if (!url) return "";
  const safeUrl = escapeHtml(url);
  const isImage = /\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(url);
  const preview = isImage
    ? `<a href="${safeUrl}"><img src="${safeUrl}" alt="Studio attachment" style="max-width:100%;border:1px solid #e4e4e7;border-radius:6px;display:block;margin:8px 0 0;"></a>`
    : `<p style="margin:8px 0 0;"><a href="${safeUrl}" style="color:#4f46e5;text-decoration:underline;">View attachment</a></p>`;
  return `<p style="margin:0 0 4px;"><strong>Studio attachment</strong></p>
${preview}
<div style="height:16px;"></div>`;
}

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function generateRefinementCycleRevokedClientEmail(params: {
  title?: string | null;
  projectName: string | null;
  projectEmoji: string | null;
  revokedByStudio: boolean;
  newSubmissionUrl: string;
}): { subject: string; text: string; html: string } {
  const project = projectLabel(params.projectName, params.projectEmoji);
  const titlePart = params.title ? `${params.title} — ` : "";
  const subject = `${titlePart}Refinement cycle revoked`;
  const opener = params.revokedByStudio
    ? "The studio has revoked this refinement cycle."
    : "Your refinement cycle has been revoked.";

  const text = `${opener} It will not be reviewed${
    params.revokedByStudio
      ? ""
      : " — you can submit a new one whenever you're ready"
  }.

If a deposit invoice was issued, it has been voided.

Submit a new cycle:
${params.newSubmissionUrl}
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${escapeHtml(opener)}</p>
<p style="margin:0 0 16px;">It will not be reviewed${
    params.revokedByStudio
      ? ""
      : " &mdash; you can submit a new one whenever you&rsquo;re ready"
  } for <strong>${project}</strong>.</p>
<p style="margin:0 0 16px;">If a deposit invoice was issued, it has been voided.</p>
${linkButton(params.newSubmissionUrl, "Submit a new cycle")}
${divider()}
${muted("Meisner Design — Refinement Cycles")}
`);

  return { subject, text, html };
}

export function generateRefinementCycleRevokedAdminEmail(params: {
  title?: string | null;
  submitterEmail: string | null;
  projectName: string | null;
  projectEmoji: string | null;
  revokedByStudio: boolean;
  actorEmail: string | null;
}): { subject: string; text: string; html: string } {
  const project = projectLabel(params.projectName, params.projectEmoji);
  const titlePart = params.title ? `${params.title} — ` : "";
  const actorLabel = params.revokedByStudio
    ? params.actorEmail
      ? `the studio (${params.actorEmail})`
      : "the studio"
    : params.submitterEmail ?? "the submitter";
  const subject = `${titlePart}Refinement cycle revoked — ${params.projectName ?? "project"}`;

  const text = `A refinement cycle was just revoked.

Project: ${params.projectName ?? "—"}
Submitter: ${params.submitterEmail ?? "(unknown)"}
Revoked by: ${actorLabel}

Any unpaid Stripe deposit invoice has been voided. The cycle has been removed from the queue.
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">A refinement cycle was just revoked.</p>
<p style="margin:0 0 8px;"><strong>Project:</strong> ${project}</p>
<p style="margin:0 0 8px;"><strong>Submitter:</strong> ${escapeHtml(params.submitterEmail ?? "(unknown)")}</p>
<p style="margin:0 0 16px;"><strong>Revoked by:</strong> ${escapeHtml(actorLabel)}</p>
<p style="margin:0 0 16px;">Any unpaid Stripe deposit invoice has been voided. The cycle has been removed from the queue.</p>
${divider()}
${muted("Meisner Design — Refinement Cycles")}
`);

  return { subject, text, html };
}

export function generateRefinementCycleSubmittedClientEmail(params: {
  title?: string | null;
  submitterName: string | null;
  projectName: string | null;
  projectEmoji: string | null;
  projectUrl: string;
}): { subject: string; text: string; html: string } {
  const project = projectLabel(params.projectName, params.projectEmoji);
  const titlePart = params.title ? `${params.title} — ` : "";
  const subject = `${titlePart}Refinement cycle received — ${params.projectName ?? "project"}`;
  const greeting = params.submitterName ? `Hi ${params.submitterName},` : "Hi,";

  const text = `${greeting}

Your refinement cycle ${params.title ? `"${params.title}" ` : ""}has been submitted${
    params.projectName ? ` for ${params.projectName}` : ""
  }.

The studio will review and decide by 5pm ET. You'll get an email either way — accepted (with deposit invoice + optional check-in link) or declined.

View the cycle on your project page:
${params.projectUrl}
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${escapeHtml(greeting)}</p>
<p style="margin:0 0 16px;">Your refinement cycle ${
    params.title ? `<strong>${escapeHtml(params.title)}</strong> ` : ""
  }has been submitted for <strong>${project}</strong>.</p>
<p style="margin:0 0 16px;">The studio will review and decide by 5pm ET. You&rsquo;ll get an email either way — accepted (with deposit invoice + optional check-in link) or declined.</p>
${linkButton(params.projectUrl, "View project")}
${divider()}
${muted("Cycles end at delivery. Further changes are submitted as a new cycle.")}
`);

  return { subject, text, html };
}

export function generateRefinementCycleSubmittedAdminEmail(params: {
  title?: string | null;
  submitterEmail: string | null;
  projectName: string | null;
  projectEmoji: string | null;
  reviewUrl: string;
}): { subject: string; text: string; html: string } {
  const project = projectLabel(params.projectName, params.projectEmoji);
  const titleSuffix = params.title ? `: ${params.title}` : "";
  const subject = `New refinement cycle${titleSuffix} — ${params.projectName ?? "project"}`;
  const submitter = params.submitterEmail ?? "(unknown submitter)";

  const text = `A refinement cycle was just submitted.

Project: ${params.projectName ?? "—"}
Submitter: ${submitter}

Decide by 5pm ET — accept or decline:
${params.reviewUrl}
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">A refinement cycle was just submitted.</p>
<p style="margin:0 0 8px;"><strong>Project:</strong> ${project}</p>
<p style="margin:0 0 16px;"><strong>Submitter:</strong> ${escapeHtml(submitter)}</p>
<p style="margin:0 0 16px;">Decide by 5pm ET — accept or decline.</p>
${linkButton(params.reviewUrl, "Review cycle")}
${divider()}
${muted("Meisner Design — Refinement Cycles")}
`);

  return { subject, text, html };
}

export function generateRefinementCycleAcceptedClientEmail(params: {
  title?: string | null;
  projectName: string | null;
  projectEmoji: string | null;
  studioNote: string | null;
  studioAttachmentUrl?: string | null;
  deliveryDate: string | null;
  totalPrice: number;
  calBookingUrl: string | null;
  // Deposit-flow extras. When `requiresDeposit` is true the email shows a
  // "Pay deposit" CTA + amount breakdown; otherwise it falls back to the
  // pay-on-delivery copy.
  requiresDeposit?: boolean;
  depositAmount?: number;
  finalAmount?: number;
  stripeDepositInvoiceUrl?: string | null;
}): { subject: string; text: string; html: string } {
  const project = projectLabel(params.projectName, params.projectEmoji);
  const deliveryLine = params.deliveryDate
    ? formatDeliveryDate(params.deliveryDate)
    : "the next business day";
  const titlePart = params.title ? `${params.title} — ` : "";
  const subject = `${titlePart}Refinement cycle accepted — delivery ${deliveryLine}`;

  const requiresDeposit = Boolean(params.requiresDeposit);
  const depositAmount = params.depositAmount ?? 0;
  const finalAmount = params.finalAmount ?? params.totalPrice;
  const depositUrl = params.stripeDepositInvoiceUrl ?? null;

  const textLines: string[] = [];
  textLines.push(`Your refinement cycle has been accepted.`);
  textLines.push("");
  if (params.studioNote) {
    textLines.push("Studio note:");
    textLines.push(params.studioNote);
    textLines.push("");
  }
  if (params.studioAttachmentUrl) {
    textLines.push(`Studio attachment: ${params.studioAttachmentUrl}`);
    textLines.push("");
  }
  textLines.push(`Delivery target: ${deliveryLine} at 6pm ET.`);
  if (requiresDeposit) {
    textLines.push(
      `Total: ${formatUsd(params.totalPrice)} — ${formatUsd(depositAmount)} deposit due before we start, ${formatUsd(finalAmount)} on delivery.`
    );
    if (depositUrl) {
      textLines.push("");
      textLines.push(`Pay deposit: ${depositUrl}`);
    } else {
      textLines.push("");
      textLines.push(
        "Deposit invoice is on the way — we'll send it shortly."
      );
    }
  } else {
    textLines.push(
      `Total: ${formatUsd(params.totalPrice)} — invoiced on delivery, no deposit needed.`
    );
  }
  if (params.calBookingUrl) {
    textLines.push("");
    textLines.push(
      `Optional 15-minute check-in (10am ET on delivery day) — book a slot:`
    );
    textLines.push(params.calBookingUrl);
  }

  const totalLine = requiresDeposit
    ? `<p style="margin:0 0 16px;"><strong>Total:</strong> ${formatUsd(params.totalPrice)} — ${formatUsd(depositAmount)} deposit due before we start, ${formatUsd(finalAmount)} on delivery.</p>`
    : `<p style="margin:0 0 16px;"><strong>Total:</strong> ${formatUsd(params.totalPrice)} — invoiced on delivery, no deposit needed.</p>`;

  const depositBlock = requiresDeposit
    ? depositUrl
      ? `<p style="margin:24px 0 8px;"><strong>Pay deposit</strong></p>
<p style="margin:0 0 16px;">Once we receive your ${formatUsd(depositAmount)} deposit, we'll get started on your cycle.</p>
${linkButton(depositUrl, "Pay deposit invoice")}`
      : `<p style="margin:24px 0 8px;"><strong>Pay deposit</strong></p>
<p style="margin:0 0 16px;">Your ${formatUsd(depositAmount)} deposit invoice is on the way — we'll send it shortly.</p>`
    : "";

  const html = emailShell(`
<p style="margin:0 0 16px;">Your refinement cycle for <strong>${project}</strong> has been accepted.</p>
${
  params.studioNote
    ? `<p style="margin:0 0 4px;"><strong>Studio note</strong></p>
<p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(params.studioNote)}</p>`
    : ""
}
${attachmentBlock(params.studioAttachmentUrl)}
<p style="margin:0 0 8px;"><strong>Delivery target:</strong> ${escapeHtml(deliveryLine)} at 6pm ET</p>
${totalLine}
${depositBlock}
${
  params.calBookingUrl
    ? `<p style="margin:24px 0 8px;"><strong>Optional check-in</strong></p>
<p style="margin:0 0 16px;">Want a 15-minute call at 10am ET on delivery day to confirm direction or surface edge cases? Book a slot — no pressure if you skip it.</p>
${linkButton(params.calBookingUrl, "Book check-in")}`
    : ""
}
${divider()}
${muted("Cycles end at delivery. Further changes are submitted as a new cycle.")}
`);

  return { subject, text: textLines.join("\n"), html };
}

export function generateRefinementCycleDeclinedClientEmail(params: {
  projectName: string | null;
  projectEmoji: string | null;
  studioNote: string | null;
  studioAttachmentUrl?: string | null;
  newSubmissionUrl: string;
}): { subject: string; text: string; html: string } {
  const project = projectLabel(params.projectName, params.projectEmoji);
  const subject = `Refinement cycle declined — ${params.projectName ?? "project"}`;

  const textLines: string[] = [];
  textLines.push("We weren't able to take this refinement cycle as submitted.");
  textLines.push("");
  if (params.studioNote) {
    textLines.push("Studio note:");
    textLines.push(params.studioNote);
    textLines.push("");
  }
  if (params.studioAttachmentUrl) {
    textLines.push(`Studio attachment: ${params.studioAttachmentUrl}`);
    textLines.push("");
  }
  textLines.push(
    "If you'd like to refine the scope and resubmit, you can submit a new cycle here:"
  );
  textLines.push(params.newSubmissionUrl);

  const html = emailShell(`
<p style="margin:0 0 16px;">We weren&rsquo;t able to take this refinement cycle for <strong>${project}</strong> as submitted.</p>
${
  params.studioNote
    ? `<p style="margin:0 0 4px;"><strong>Studio note</strong></p>
<p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(params.studioNote)}</p>`
    : ""
}
${attachmentBlock(params.studioAttachmentUrl)}
<p style="margin:0 0 16px;">If you&rsquo;d like to refine the scope and resubmit, you can submit a new cycle.</p>
${linkButton(params.newSubmissionUrl, "Submit a new cycle")}
${divider()}
${muted("Meisner Design — Refinement Cycles")}
`);

  return { subject, text: textLines.join("\n"), html };
}

export function generateRefinementCycleExpiredClientEmail(params: {
  projectName: string | null;
  projectEmoji: string | null;
  newSubmissionUrl: string;
}): { subject: string; text: string; html: string } {
  const project = projectLabel(params.projectName, params.projectEmoji);
  const subject = `Refinement cycle expired — deposit not received`;

  const text = `Your accepted refinement cycle expired because the deposit wasn't received before 10am ET on delivery day. The slot is now released.

If you'd still like to move forward, please submit a new cycle:
${params.newSubmissionUrl}
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">Your accepted refinement cycle for <strong>${project}</strong> expired because the deposit wasn&rsquo;t received before 10am ET on delivery day.</p>
<p style="margin:0 0 16px;">The slot has been released. If you&rsquo;d still like to move forward, please submit a new cycle.</p>
${linkButton(params.newSubmissionUrl, "Submit a new cycle")}
${divider()}
${muted("Meisner Design — Refinement Cycles")}
`);

  return { subject, text, html };
}

export function generateRefinementCycleDeliveredClientEmail(params: {
  projectName: string | null;
  projectEmoji: string | null;
  finalAmount: number;
  stripeInvoiceUrl: string | null;
  figmaFileUrl: string | null;
  loomWalkthroughUrl: string | null;
  engineeringNotes: string | null;
  screenshots?: Array<{ fileUrl: string; filename: string | null }>;
}): { subject: string; text: string; html: string } {
  const project = projectLabel(params.projectName, params.projectEmoji);
  const subject = `Refinement cycle delivered — ${params.projectName ?? "project"}`;
  const shots = params.screenshots ?? [];

  const lines: string[] = [];
  lines.push("Your refinement cycle is delivered.");
  lines.push("");
  if (params.figmaFileUrl) lines.push(`Figma file: ${params.figmaFileUrl}`);
  if (params.loomWalkthroughUrl)
    lines.push(`Walkthrough Loom: ${params.loomWalkthroughUrl}`);
  if (params.engineeringNotes) {
    lines.push("");
    lines.push("Engineering notes:");
    lines.push(params.engineeringNotes);
  }
  if (shots.length > 0) {
    lines.push("");
    lines.push("Screenshots:");
    for (const s of shots) {
      lines.push(s.filename ? `${s.filename}: ${s.fileUrl}` : s.fileUrl);
    }
  }
  lines.push("");
  lines.push(`Final invoice: ${formatUsd(params.finalAmount)}`);
  if (params.stripeInvoiceUrl) {
    lines.push(`Pay final invoice: ${params.stripeInvoiceUrl}`);
  }

  const screenshotsHtml =
    shots.length > 0
      ? `<p style="margin:16px 0 8px;"><strong>Screenshots</strong></p>
${shots
  .map(
    (s) =>
      `<p style="margin:0 0 8px;"><a href="${escapeHtml(s.fileUrl)}"><img src="${escapeHtml(s.fileUrl)}" alt="${escapeHtml(s.filename ?? "Screenshot")}" style="max-width:100%;border:1px solid #e5e7eb;border-radius:6px;" /></a></p>`
  )
  .join("\n")}`
      : "";

  const html = emailShell(`
<p style="margin:0 0 16px;">Your refinement cycle for <strong>${project}</strong> is delivered.</p>
${
  params.figmaFileUrl
    ? `<p style="margin:0 0 8px;"><strong>Figma file:</strong> <a href="${escapeHtml(params.figmaFileUrl)}">${escapeHtml(params.figmaFileUrl)}</a></p>`
    : ""
}
${
  params.loomWalkthroughUrl
    ? `<p style="margin:0 0 8px;"><strong>Walkthrough Loom:</strong> <a href="${escapeHtml(params.loomWalkthroughUrl)}">${escapeHtml(params.loomWalkthroughUrl)}</a></p>`
    : ""
}
${
  params.engineeringNotes
    ? `<p style="margin:16px 0 4px;"><strong>Engineering notes</strong></p>
<p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(params.engineeringNotes)}</p>`
    : ""
}
${screenshotsHtml}
<p style="margin:24px 0 8px;"><strong>Final invoice:</strong> ${formatUsd(params.finalAmount)}</p>
${
  params.stripeInvoiceUrl
    ? linkButton(params.stripeInvoiceUrl, "Pay final invoice")
    : `<p style="margin:0 0 16px;color:#a16207;">Final invoice link will follow shortly.</p>`
}
${divider()}
${muted("Cycles end at delivery. Further changes are submitted as a new cycle.")}
`);

  return { subject, text: lines.join("\n"), html };
}

// Admin-only notification fired by the Stripe webhook when a cycle invoice
// enters payment_intent.processing — the client has submitted payment
// (typically ACH) but it has not yet cleared. Mirrors
// generateInvoiceProcessingAdminEmail but tailored to refinement cycles.
export function generateRefinementCyclePaymentProcessingAdminEmail(params: {
  kind: "deposit" | "final";
  cycleTitle: string | null;
  projectName: string | null;
  projectEmoji: string | null;
  amount: number;
  clientEmail: string | null;
  adminName?: string | null;
  cycleUrl: string;
}): { subject: string; text: string; html: string } {
  const { kind, cycleTitle, projectName, projectEmoji, amount, clientEmail, adminName, cycleUrl } = params;
  const project = projectLabel(projectName, projectEmoji);
  const greeting = adminName ? `Hi ${adminName},` : "Hi there,";
  const kindLabel = kind === "final" ? "final invoice" : "deposit invoice";
  const subjectTitle = cycleTitle ? `${cycleTitle} — ` : "";
  const subject = `Payment pending: ${subjectTitle}refinement cycle ${kindLabel}`;
  const clientNoteText = clientEmail ? ` from ${clientEmail}` : "";
  const clientNoteHtml = clientEmail ? ` from <strong>${escapeHtml(clientEmail)}</strong>` : "";
  const projectText = projectName ?? "(unnamed project)";

  const text = `${greeting}

A client has submitted payment${clientNoteText} on the ${kindLabel} for refinement cycle "${cycleTitle ?? "(untitled)"}" (${projectText}). The payment is pending (not yet cleared).

Amount: ${formatUsd(amount)}

For ACH/bank transfers, funds typically settle within 1–3 business days. You'll receive another notification once the payment has cleared.

View cycle: ${cycleUrl}

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">A client has submitted payment${clientNoteHtml} on the ${kindLabel} for refinement cycle <strong>${escapeHtml(cycleTitle ?? "(untitled)")}</strong> (${project}). The payment is <strong>pending</strong> (not yet cleared).</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">Refinement cycle ${kindLabel}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formatUsd(amount)}</p>
    </td>
  </tr>
</table>
${secondaryLink(cycleUrl, "View cycle →")}
${divider()}
${muted("For ACH/bank transfers, funds typically settle within 1&ndash;3 business days. You&rsquo;ll receive another notification once the payment has cleared.")}
`);

  return { subject, text, html };
}

// Client-facing confirmation fired by the Stripe webhook when a cycle invoice
// enters payment_intent.processing — reassures the client that the studio
// has seen their payment even though it hasn't cleared yet.
export function generateRefinementCyclePaymentProcessingClientEmail(params: {
  kind: "deposit" | "final";
  cycleTitle: string | null;
  projectName: string | null;
  projectEmoji: string | null;
  amount: number;
  clientName?: string | null;
}): { subject: string; text: string; html: string } {
  const { kind, cycleTitle, projectName, projectEmoji, amount, clientName } = params;
  const project = projectLabel(projectName, projectEmoji);
  const greeting = clientName ? `Hi ${clientName},` : "Hi there,";
  const kindLabel = kind === "final" ? "final invoice" : "deposit invoice";
  const cycleLabel = cycleTitle ?? "your refinement cycle";
  const subject = `Payment received — processing now`;

  const text = `${greeting}

Thanks — we've received your bank transfer for ${cycleLabel} (${projectName ?? "your project"}). The ${kindLabel} payment is processing now.

Amount: ${formatUsd(amount)}

ACH/bank transfers typically clear within 1–3 business days. No further action is needed on your end — we'll send another note once it settles.

Questions? Just reply to this email.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;">Thanks &mdash; we&rsquo;ve received your bank transfer for <strong>${escapeHtml(cycleLabel)}</strong> (${project}). The ${kindLabel} payment is processing now.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #e4e4e7;border-radius:6px;overflow:hidden;">
  <tr>
    <td style="padding:12px 16px;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Invoice</p>
      <p style="margin:4px 0 0;font-weight:600;">Refinement cycle ${kindLabel}</p>
    </td>
    <td style="padding:12px 16px;text-align:right;background-color:#f4f4f5;">
      <p style="margin:0;font-size:13px;color:#71717a;">Amount</p>
      <p style="margin:4px 0 0;font-weight:600;font-variant-numeric:tabular-nums;">${formatUsd(amount)}</p>
    </td>
  </tr>
</table>
<p style="margin:0;">ACH/bank transfers typically clear within 1&ndash;3 business days. No further action is needed on your end &mdash; we&rsquo;ll send another note once it settles.</p>
<p style="margin:16px 0 0;font-size:13px;color:#71717a;">Questions? Just reply to this email.</p>
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}
