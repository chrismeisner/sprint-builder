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
