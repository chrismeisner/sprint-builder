import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { ensureSchema, getPool, isEmailBlocked } from "@/lib/db";
import { sendEmail, generateVerificationCodeEmail } from "@/lib/email";
import { SUPERADMIN_EMAIL } from "@/lib/auth";

// Generate a 6-digit numeric code
function generateCode(): string {
  return randomInt(100000, 999999).toString();
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();

    const body = (await request.json().catch(() => ({}))) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    
    const { email } = body as { email?: unknown };
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    
    const normalizedEmail = email.trim().toLowerCase();

    // Superadmin bypass: Always allow magic link for superadmin email
    if (normalizedEmail === SUPERADMIN_EMAIL) {
      return NextResponse.json({ 
        verified: true,
        message: "Superadmin email - using magic link."
      });
    }

    // Check if email is blocked
    if (await isEmailBlocked(normalizedEmail)) {
      return NextResponse.json({ 
        error: "This email has been blocked from creating an account. Please contact support if you believe this is an error."
      }, { status: 403 });
    }

    // Check if this email is already verified (existing account)
    const existingAccount = await pool.query(
      `SELECT id, email_verified_at FROM accounts WHERE email = $1`,
      [normalizedEmail]
    );
    
    if (existingAccount.rowCount && existingAccount.rowCount > 0) {
      const account = existingAccount.rows[0] as { id: string; email_verified_at: Date | null };
      if (account.email_verified_at) {
        // Email already verified - tell client to use magic link instead
        return NextResponse.json({ 
          verified: true,
          message: "Email already verified. Use magic link to sign in."
        });
      }
    }

    // Rate limiting: Check for recent codes sent to this email (max 3 per hour)
    const recentCodes = await pool.query(
      `SELECT COUNT(*)::int as count FROM email_verification_codes 
       WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
      [normalizedEmail]
    );
    
    if ((recentCodes.rows[0]?.count ?? 0) >= 5) {
      return NextResponse.json({ 
        error: "Too many verification attempts. Please try again later." 
      }, { status: 429 });
    }

    // Generate code and expiry (10 minutes)
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store the verification code
    await pool.query(
      `INSERT INTO email_verification_codes (id, email, code, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [crypto.randomUUID(), normalizedEmail, code, expiresAt]
    );

    // Send the verification email (transactional — no tracking, no unsubscribe)
    const emailContent = generateVerificationCodeEmail({ code, expiresInMinutes: 10 });
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
      category: "transactional",
      tag: "verification-code",
    });

    if (!emailResult.success) {
      console.error("[Auth] Failed to send verification email:", emailResult.error);
      // Still return success to not leak whether email sending worked
      // In production you might want to handle this differently
    }

    console.log("[Auth] Verification code sent", { email: normalizedEmail });

    return NextResponse.json({ 
      ok: true,
      verified: false,
      message: "Verification code sent to your email."
    });
  } catch (error: unknown) {
    console.error("[Auth] send-code error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
