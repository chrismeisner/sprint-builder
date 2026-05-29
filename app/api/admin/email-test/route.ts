import { NextResponse } from "next/server";

type EmailStatus = {
  configured: boolean;
  apiKeyPresent: boolean;
  fromEmailPresent: boolean;
  apiKey: string | null;
  fromEmail: string | null;
  fromName: string | null;
  fromHeader: string | null;
  replyTo: string | null;
};

export async function GET() {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM_EMAIL || process.env.MAILGUN_FROM_EMAIL;
    const fromName =
      process.env.EMAIL_FROM_NAME || process.env.MAILGUN_FROM_NAME || "Meisner Design";
    const replyTo = process.env.EMAIL_REPLY_TO || process.env.MAILGUN_REPLY_TO || null;

    const resolvedFromEmail = fromEmail || "no-reply@mail.meisner.design";
    const fromHeader = fromName
      ? `${fromName} <${resolvedFromEmail}>`
      : resolvedFromEmail;

    const status: EmailStatus = {
      configured: !!resendApiKey,
      apiKeyPresent: !!resendApiKey,
      fromEmailPresent: !!fromEmail,
      apiKey: resendApiKey ? `${resendApiKey.slice(0, 8)}...` : null,
      fromEmail: resolvedFromEmail,
      fromName,
      fromHeader,
      replyTo,
    };

    return NextResponse.json(status);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { to, subject, text, html } = body as {
      to?: unknown;
      subject?: unknown;
      text?: unknown;
      html?: unknown;
    };

    if (typeof to !== "string" || !to.includes("@")) {
      return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
    }

    if (typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 });
    }

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Email text is required" }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.EMAIL_FROM_EMAIL ||
      process.env.MAILGUN_FROM_EMAIL ||
      "no-reply@mail.meisner.design";
    const fromName =
      process.env.EMAIL_FROM_NAME || process.env.MAILGUN_FROM_NAME || "Meisner Design";
    const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Resend not configured. Please set RESEND_API_KEY." },
        { status: 500 }
      );
    }

    const payload: Record<string, unknown> = {
      from,
      to: [to],
      subject,
      text,
    };

    // Add HTML if provided
    if (typeof html === "string" && html.trim()) {
      payload.html = html;
    }

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text().catch(() => "");
      console.error("[Email Test] Resend send failed", {
        status: resendRes.status,
        body: errText.slice(0, 500),
      });
      return NextResponse.json(
        {
          success: false,
          error: `Resend API error: ${resendRes.status}`,
          details: errText.slice(0, 500),
        },
        { status: resendRes.status }
      );
    }

    const responseData = await resendRes.json();
    console.log("[Email Test] Test email sent successfully", {
      to,
      subject,
      messageId: responseData.id,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
      messageId: responseData.id,
    });
  } catch (error: unknown) {
    console.error("[Email Test] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}

