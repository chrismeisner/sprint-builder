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

/**
 * Generate sprint draft notification email
 */
export function generateSprintDraftEmail(params: {
  sprintTitle: string;
  sprintUrl: string;
  clientName?: string;
  projectName?: string;
}): { subject: string; text: string; html: string } {
  const { sprintTitle, sprintUrl, clientName, projectName } = params;

  const greeting = clientName ? `Hi ${clientName}!` : "Hi there!";
  const projectContext = projectName ? ` for ${projectName}` : "";
  
  const subject = `Your Sprint Plan is Ready: ${sprintTitle}`;

  const text = `${greeting}

Great news - we've analyzed your project requirements and created a custom 2-week sprint plan just for you${projectContext}.

Sprint Title: ${sprintTitle}

View your sprint plan here:
${sprintUrl}

Your sprint plan includes:
• Selected deliverables with fixed pricing
• Detailed backlog with story points
• Day-by-day timeline for 2 weeks
• Clear goals and acceptance criteria

This plan is a draft and we're happy to discuss any adjustments. Simply reply to this email with your questions or feedback.

Looking forward to working with you!

Best regards,
The Sprint Planning Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #000;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .sprint-title {
      background-color: #f8f9fa;
      padding: 16px;
      border-radius: 6px;
      border-left: 4px solid #000;
      margin: 24px 0;
      font-weight: 600;
    }
    .cta-button {
      display: inline-block;
      background-color: #000;
      color: white !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      margin: 24px 0;
    }
    .cta-button:hover {
      background-color: #333;
    }
    .features {
      list-style: none;
      padding: 0;
      margin: 24px 0;
    }
    .features li {
      padding: 8px 0;
      padding-left: 24px;
      position: relative;
    }
    .features li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #22c55e;
      font-weight: bold;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .link {
      color: #3b82f6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎉 Your Sprint Plan is Ready!</h1>
    
    <p>${greeting}</p>
    
    <p>Great news - we've analyzed your project requirements and created a custom 2-week sprint plan tailored specifically to your needs${projectContext}.</p>
    
    <div class="sprint-title">
      ${sprintTitle}
    </div>
    
    <a href="${sprintUrl}" class="cta-button">View Your Sprint Plan →</a>
    
    <p><strong>What's included in your sprint plan:</strong></p>
    
    <ul class="features">
      <li>Selected deliverables with fixed pricing</li>
      <li>Detailed backlog with story points and acceptance criteria</li>
      <li>Day-by-day timeline for 2 weeks</li>
      <li>Clear goals, assumptions, and risk assessment</li>
    </ul>
    
    <p>This plan is a draft and we're happy to discuss any adjustments. Simply reply to this email with your questions or feedback.</p>
    
    <p>Looking forward to working with you!</p>
    
    <div class="footer">
      <p><strong>The Sprint Planning Team</strong></p>
      <p>You're receiving this email because you submitted a project request through our intake form.</p>
      <p style="margin-top: 16px; font-size: 12px;">
        If you can't click the button above, copy and paste this link into your browser:<br>
        <a href="${sprintUrl}" class="link">${sprintUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, text, html };
}

/**
 * Generate intake form confirmation email
 */
export function generateIntakeConfirmationEmail(): { subject: string; text: string; html: string } {
  const subject = "We Received Your Intake Form";

  const text = `Hi there!

Thank you for submitting your project intake form. We've successfully received your information and our team is reviewing your requirements.

What happens next:
• Our team will analyze your project details
• We'll create a custom sprint plan tailored to your needs
• You'll receive a follow-up email with your personalized sprint plan within 1-2 business days

In the meantime, if you have any questions or need to provide additional information, feel free to reply to this email.

We're excited to work with you!

Best regards,
The Sprint Planning Team
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #000;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .success-badge {
      background-color: #dcfce7;
      color: #166534;
      padding: 12px 20px;
      border-radius: 6px;
      text-align: center;
      font-weight: 600;
      margin: 24px 0;
    }
    .next-steps {
      background-color: #f8f9fa;
      padding: 24px;
      border-radius: 6px;
      border-left: 4px solid #000;
      margin: 24px 0;
    }
    .next-steps h2 {
      margin-top: 0;
      font-size: 18px;
      color: #000;
    }
    .steps-list {
      list-style: none;
      padding: 0;
      margin: 16px 0 0 0;
    }
    .steps-list li {
      padding: 8px 0;
      padding-left: 32px;
      position: relative;
    }
    .steps-list li:before {
      content: "→";
      position: absolute;
      left: 8px;
      color: #000;
      font-weight: bold;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✓ Intake Form Received</h1>
    
    <div class="success-badge">
      ✓ Your submission has been received
    </div>
    
    <p>Hi there,</p>
    
    <p>Thank you for submitting your project intake form! We've successfully received your information and our team is reviewing your requirements.</p>
    
    <div class="next-steps">
      <h2>What happens next:</h2>
      <ul class="steps-list">
        <li>Our team will analyze your project details</li>
        <li>We'll create a custom sprint plan tailored to your needs</li>
        <li>You'll receive a follow-up email with your personalized sprint plan within 1-2 business days</li>
      </ul>
    </div>
    
    <p>In the meantime, if you have any questions or need to provide additional information, feel free to reply to this email.</p>
    
    <p>We're excited to work with you!</p>
    
    <div class="footer">
      <p><strong>The Sprint Planning Team</strong></p>
      <p>You're receiving this email because you submitted a project request through our intake form.</p>
    </div>
  </div>
</body>
</html>
`;

  return { subject, text, html };
}

