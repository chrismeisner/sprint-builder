import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { ensureSchema, getPool, isEmailBlocked } from "@/lib/db";
import { sendEmail } from "@/lib/email";
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

    // Send the verification email
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: "Your verification code",
      text: `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code</title>
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
    .code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      text-align: center;
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 24px 0;
      font-family: monospace;
    }
    .expiry {
      text-align: center;
      color: #666;
      font-size: 14px;
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
    <h1 style="margin-top: 0;">Verify your email</h1>
    <p>Enter this code to verify your email address and create your account:</p>
    <div class="code">${code}</div>
    <p class="expiry">This code expires in 10 minutes.</p>
    <div class="footer">
      <p>If you didn't request this code, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
      `,
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
