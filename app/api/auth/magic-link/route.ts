import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { createLoginToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();

    const body = (await request.json().catch(() => ({}))) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { email, redirectUrl } = body as { email?: unknown; redirectUrl?: unknown };
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if this email has been verified
    const existingAccount = await pool.query(
      `SELECT id, email_verified_at FROM accounts WHERE email = $1`,
      [normalizedEmail]
    );
    
    // If no account exists or email not verified, they need to use verification code flow
    if (!existingAccount.rowCount || existingAccount.rowCount === 0) {
      return NextResponse.json({ 
        error: "Email not verified. Please sign up first.",
        needsVerification: true
      }, { status: 400 });
    }
    
    const account = existingAccount.rows[0] as { id: string; email_verified_at: Date | null };
    
    if (!account.email_verified_at) {
      return NextResponse.json({ 
        error: "Email not verified. Please complete verification first.",
        needsVerification: true
      }, { status: 400 });
    }
    
    // Email is verified - proceed with magic link
    const accountId = account.id;
    
    // Default to profile with flag so UI can show a welcome overlay
    const defaultRedirect = "/profile?from=magic-email";
    const redirect = typeof redirectUrl === "string" && redirectUrl.trim() ? redirectUrl.trim() : defaultRedirect;

    const token = createLoginToken(accountId);
    
    // Use BASE_URL from env if set, otherwise fall back to request origin
    let origin: string;
    if (process.env.BASE_URL) {
      origin = process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash if present
    } else {
      const url = new URL(request.url);
      origin = `${url.protocol}//${url.host}`;
    }
    
    // Always include redirect so we land on profile (or custom redirect) after login
    const magicLink = `${origin}/api/auth/callback?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`;

    // Send magic link via Mailgun
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const mailgunFrom = process.env.MAILGUN_FROM_EMAIL || `no-reply@${mailgunDomain || "example.com"}`;

    if (mailgunApiKey && mailgunDomain) {
      try {
        const authHeader = `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString("base64")}`;
        const mailgunRes = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            from: mailgunFrom,
            to: normalizedEmail,
            subject: "Your sprint builder magic link",
            text: `Click this link to sign in:\n\n${magicLink}\n\nThis link will expire in 15 minutes.`,
          }),
        });
        if (!mailgunRes.ok) {
          const errText = await mailgunRes.text().catch(() => "");
          console.error("[Auth] Mailgun send failed", {
            status: mailgunRes.status,
            body: errText.slice(0, 500),
          });
        } else {
          console.log("[Auth] Magic link email sent via Mailgun", {
            email: normalizedEmail,
          });
        }
      } catch (err: unknown) {
        console.error("[Auth] Mailgun request error", {
          message: (err as Error)?.message,
        });
      }
    } else {
      // Dev fallback: log the magic link to console
      console.log("[Auth] Mailgun not configured; magic link:", {
        email: normalizedEmail,
        magicLink,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


