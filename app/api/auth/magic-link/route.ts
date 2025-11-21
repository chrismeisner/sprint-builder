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
    const redirect = typeof redirectUrl === "string" && redirectUrl.trim() ? redirectUrl.trim() : null;
    const normalizedEmail = email.trim().toLowerCase();
    const accountRes = await pool.query(
      `
        INSERT INTO accounts (id, email)
        VALUES ($1, $2)
        ON CONFLICT (email)
        DO UPDATE SET email = EXCLUDED.email
        RETURNING id
      `,
      [crypto.randomUUID(), normalizedEmail]
    );
    const accountId = (accountRes.rows[0] as { id: string }).id;

    const token = createLoginToken(accountId);
    
    // Use BASE_URL from env if set, otherwise fall back to request origin
    let origin: string;
    if (process.env.BASE_URL) {
      origin = process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash if present
    } else {
      const url = new URL(request.url);
      origin = `${url.protocol}//${url.host}`;
    }
    
    const magicLink = redirect 
      ? `${origin}/api/auth/callback?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`
      : `${origin}/api/auth/callback?token=${encodeURIComponent(token)}`;

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


