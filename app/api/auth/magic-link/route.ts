import { NextResponse } from "next/server";
import { ensureSchema, getPool, isEmailBlocked } from "@/lib/db";
import { createLoginToken, SUPERADMIN_EMAIL } from "@/lib/auth";
import { sendEmail, generateMagicLinkEmail } from "@/lib/email";

const MAGIC_LINK_EXPIRES_MINUTES = 15;

function resolveOrigin(request: Request): string {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/$/, "");
  }
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

/**
 * The link is a live login credential, so it's only logged outside production
 * (local testing without SMTP). In production the client gets an error instead
 * of a false "check your email".
 */
function magicLinkSendFailed(email: string, magicLink: string, error?: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[Auth] Magic link send failed; dev fallback:", { email, error, magicLink });
  } else {
    console.error("[Auth] Magic link send failed", { email, error });
  }
  return NextResponse.json(
    { error: "We couldn't send the sign-in email. Please try again in a few minutes." },
    { status: 502 }
  );
}

async function sendMagicLink(email: string, magicLink: string) {
  const content = generateMagicLinkEmail({
    magicLink,
    expiresInMinutes: MAGIC_LINK_EXPIRES_MINUTES,
  });
  return sendEmail({
    to: email,
    subject: content.subject,
    text: content.text,
    html: content.html,
    category: "transactional",
    tag: "magic-link",
  });
}

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
    const defaultRedirect = "/projects?from=magic-email";
    const redirect =
      typeof redirectUrl === "string" && redirectUrl.trim()
        ? redirectUrl.trim()
        : defaultRedirect;
    const origin = resolveOrigin(request);

    // Superadmin bypass: Always allow login and auto-create/update as admin
    if (normalizedEmail === SUPERADMIN_EMAIL) {
      const superadminResult = await pool.query(
        `INSERT INTO accounts (id, email, email_verified_at, is_admin)
         VALUES ($1, $2, NOW(), true)
         ON CONFLICT (email) DO UPDATE
         SET email_verified_at = COALESCE(accounts.email_verified_at, NOW()),
             is_admin = true
         RETURNING id`,
        [crypto.randomUUID(), normalizedEmail]
      );
      const accountId = (superadminResult.rows[0] as { id: string }).id;
      const token = createLoginToken(accountId);
      const magicLink = `${origin}/api/auth/callback?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`;

      const result = await sendMagicLink(normalizedEmail, magicLink);
      if (!result.success) return magicLinkSendFailed(normalizedEmail, magicLink, result.error);
      return NextResponse.json({ ok: true });
    }

    // Check if email is blocked
    if (await isEmailBlocked(normalizedEmail)) {
      return NextResponse.json(
        {
          error:
            "This email has been blocked from accessing this service. Please contact support if you believe this is an error.",
        },
        { status: 403 }
      );
    }

    // Check if this email has been verified
    const existingAccount = await pool.query(
      `SELECT id, email_verified_at FROM accounts WHERE email = $1`,
      [normalizedEmail]
    );

    // If no account exists or email not verified, they need to use verification code flow
    if (!existingAccount.rowCount || existingAccount.rowCount === 0) {
      return NextResponse.json(
        {
          error: "Email not verified. Please sign up first.",
          needsVerification: true,
        },
        { status: 400 }
      );
    }

    const account = existingAccount.rows[0] as {
      id: string;
      email_verified_at: Date | null;
    };

    if (!account.email_verified_at) {
      return NextResponse.json(
        {
          error: "Email not verified. Please complete verification first.",
          needsVerification: true,
        },
        { status: 400 }
      );
    }

    const accountId = account.id;
    const token = createLoginToken(accountId);
    const magicLink = `${origin}/api/auth/callback?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`;

    const result = await sendMagicLink(normalizedEmail, magicLink);
    if (!result.success) return magicLinkSendFailed(normalizedEmail, magicLink, result.error);

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
