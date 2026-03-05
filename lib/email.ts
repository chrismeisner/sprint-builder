/**
 * Email utility functions using Mailgun
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const mailgunFrom = process.env.MAILGUN_FROM_EMAIL || `no-reply@${mailgunDomain || "example.com"}`;

    if (!mailgunApiKey || !mailgunDomain) {
      console.warn("[Email] Mailgun not configured. Email not sent.", { to: params.to });
      return {
        success: false,
        error: "Email service not configured",
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
 * Lead notification — new member added
 */
export function generateLeadNotificationEmail(params: {
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
${muted("You're receiving this because you're a lead on this project.")}
`);

  return { subject, text, html };
}

/**
 * Lead notification — member removed
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
${muted("You're receiving this because you're a lead on this project.")}
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
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, hostedUrl, adminName, sprintTitle } = params;
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
<p style="margin:16px 0 0;font-size:13px;color:#71717a;">This is a draft preview&nbsp;&mdash; the client has <strong>not</strong> been notified yet. Once you&rsquo;re ready, return to the sprint page and click &ldquo;Send Invoice to Client&rdquo;.</p>
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
}): { subject: string; text: string; html: string } {
  const { invoiceLabel, invoiceAmount, sprintTitle, clientName } = params;
  const greeting = clientName ? `Hi ${clientName},` : "Hi there,";
  const formattedAmount = `$${invoiceAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const context = sprintTitle ? ` for <strong>${sprintTitle}</strong>` : "";
  const contextText = sprintTitle ? ` for ${sprintTitle}` : "";

  const subject = `Payment confirmed — thank you!`;

  const text = `${greeting}

We've received your payment — thank you!

Invoice: ${invoiceLabel}${contextText}
Amount: ${formattedAmount}

Your account is all up to date. Reply to this email if you have any questions.

— Meisner Design
`;

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
<p style="margin:0 0 0;">Your account is all up to date. Reply to this email if you have any questions.</p>
${divider()}
${muted("Meisner Design")}
`);

  return { subject, text, html };
}

/**
 * Invoice paid — sent to all admin accounts as an internal notification
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

  const subject = `Invoice paid: ${invoiceLabel}${sprintTitle ? ` — ${sprintTitle}` : ""}`;

  const text = `${greeting}

${clientDisplay} has paid invoice "${invoiceLabel}"${contextText}.

Amount: ${formattedAmount}

No action needed — this is an automatic notification.

— Meisner Design
`;

  const html = emailShell(`
<p style="margin:0 0 16px;">${greeting}</p>
<p style="margin:0 0 16px;"><strong>${clientDisplay}</strong> has paid invoice &ldquo;${invoiceLabel}&rdquo;${context}.</p>
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
