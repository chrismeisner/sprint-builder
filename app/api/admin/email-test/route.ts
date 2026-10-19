import { NextResponse } from "next/server";
import { getEmailConfig, sendEmail } from "@/lib/email";

type EmailStatus = {
  configured: boolean;
  smtpHost: string;
  smtpUser: string | null;
  fromEmail: string | null;
  fromName: string | null;
  fromHeader: string | null;
  replyTo: string | null;
};

export async function GET() {
  try {
    const config = getEmailConfig();
    const status: EmailStatus = {
      configured: config.configured,
      smtpHost: config.smtpHost,
      smtpUser: config.smtpUser,
      fromEmail: config.fromEmail || null,
      fromName: config.fromName,
      fromHeader: config.from || null,
      replyTo: config.replyTo,
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

    const result = await sendEmail({
      to,
      subject,
      text,
      html: typeof html === "string" && html.trim() ? html : undefined,
      category: "transactional",
      tag: "email-test",
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error ?? "Send failed" },
        { status: 502 }
      );
    }

    console.log("[Email Test] Test email sent successfully", {
      to,
      subject,
      messageId: result.messageId,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully!",
      messageId: result.messageId,
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
