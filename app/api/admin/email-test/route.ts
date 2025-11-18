import { NextResponse } from "next/server";

type EmailStatus = {
  configured: boolean;
  apiKeyPresent: boolean;
  domainPresent: boolean;
  fromEmailPresent: boolean;
  apiKey: string | null;
  domain: string | null;
  fromEmail: string | null;
};

export async function GET() {
  try {
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const mailgunFrom = process.env.MAILGUN_FROM_EMAIL;

    const status: EmailStatus = {
      configured: !!(mailgunApiKey && mailgunDomain),
      apiKeyPresent: !!mailgunApiKey,
      domainPresent: !!mailgunDomain,
      fromEmailPresent: !!mailgunFrom,
      apiKey: mailgunApiKey ? `${mailgunApiKey.slice(0, 8)}...` : null,
      domain: mailgunDomain || null,
      fromEmail: mailgunFrom || `no-reply@${mailgunDomain || "example.com"}`,
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

    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const mailgunFrom = process.env.MAILGUN_FROM_EMAIL || `no-reply@${mailgunDomain || "example.com"}`;

    if (!mailgunApiKey || !mailgunDomain) {
      return NextResponse.json(
        { error: "Mailgun not configured. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN." },
        { status: 500 }
      );
    }

    const authHeader = `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString("base64")}`;
    
    const params: Record<string, string> = {
      from: mailgunFrom,
      to: to,
      subject: subject,
      text: text,
    };

    // Add HTML if provided
    if (typeof html === "string" && html.trim()) {
      params.html = html;
    }

    const mailgunRes = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(params),
    });

    if (!mailgunRes.ok) {
      const errText = await mailgunRes.text().catch(() => "");
      console.error("[Email Test] Mailgun send failed", {
        status: mailgunRes.status,
        body: errText.slice(0, 500),
      });
      return NextResponse.json(
        {
          success: false,
          error: `Mailgun API error: ${mailgunRes.status}`,
          details: errText.slice(0, 500),
        },
        { status: mailgunRes.status }
      );
    }

    const responseData = await mailgunRes.json();
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

