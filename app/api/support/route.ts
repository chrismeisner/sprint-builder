import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message, subject: subjectLine } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (message.trim().length < 10) {
      return NextResponse.json({ error: "Message is too short." }, { status: 400 });
    }

    const topic = subjectLine?.trim() || "General question";
    const emailSubject = `[Support] ${topic} — from ${name}`;

    const text = `New support request from meisner.design/support

Name: ${name}
Email: ${email}
Topic: ${topic}

Message:
${message.trim()}

---
Reply directly to this email to respond.
`;

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:8px;border:1px solid #e4e4e7;padding:32px;">
<tr><td style="color:#18181b;font-size:15px;line-height:1.6;">
<p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;">New support request</p>
<p style="margin:0 0 24px;font-size:20px;font-weight:700;">${topic}</p>
<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
  <tr><td style="padding:8px 0;border-top:1px solid #e4e4e7;font-size:13px;color:#71717a;width:80px;">Name</td><td style="padding:8px 0;border-top:1px solid #e4e4e7;font-size:14px;font-weight:500;">${name}</td></tr>
  <tr><td style="padding:8px 0;border-top:1px solid #e4e4e7;font-size:13px;color:#71717a;">Email</td><td style="padding:8px 0;border-top:1px solid #e4e4e7;font-size:14px;"><a href="mailto:${email}" style="color:#18181b;">${email}</a></td></tr>
</table>
<p style="margin:0 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#71717a;">Message</p>
<p style="margin:0;font-size:15px;line-height:1.7;white-space:pre-wrap;">${message.trim()}</p>
<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">
<p style="color:#71717a;font-size:13px;margin:0;">Reply directly to this email to respond to ${name}.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    const result = await sendEmail({
      to: "hello@meisner.design",
      subject: emailSubject,
      text,
      html,
      category: "transactional",
      tag: "support-request",
      replyTo: email,
    });

    if (!result.success) {
      console.error("[Support] Failed to send support email:", result.error);
      return NextResponse.json({ error: "Failed to send message. Please try emailing us directly." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Support] Unexpected error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
