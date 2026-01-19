import { NextResponse } from "next/server";
import { ensureSchema, getPool, isEmailBlocked } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();

    const body = (await request.json().catch(() => ({}))) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    
    const { email, code } = body as { email?: unknown; code?: unknown };
    
    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    
    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "Valid 6-digit code is required" }, { status: 400 });
    }
    
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is blocked
    if (await isEmailBlocked(normalizedEmail)) {
      return NextResponse.json({ 
        error: "This email has been blocked from creating an account. Please contact support if you believe this is an error."
      }, { status: 403 });
    }

    // Find the most recent unexpired, unverified code for this email
    const codeResult = await pool.query(
      `SELECT id, code, attempts FROM email_verification_codes 
       WHERE email = $1 
         AND expires_at > NOW() 
         AND verified_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedEmail]
    );

    if (!codeResult.rowCount || codeResult.rowCount === 0) {
      return NextResponse.json({ 
        error: "No valid verification code found. Please request a new code." 
      }, { status: 400 });
    }

    const verificationRecord = codeResult.rows[0] as { 
      id: string; 
      code: string; 
      attempts: number;
    };

    // Check max attempts (5)
    if (verificationRecord.attempts >= 5) {
      return NextResponse.json({ 
        error: "Too many failed attempts. Please request a new code." 
      }, { status: 400 });
    }

    // Increment attempts
    await pool.query(
      `UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id = $1`,
      [verificationRecord.id]
    );

    // Verify the code
    if (verificationRecord.code !== code) {
      const remainingAttempts = 4 - verificationRecord.attempts;
      return NextResponse.json({ 
        error: remainingAttempts > 0 
          ? `Invalid code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
          : "Invalid code. Please request a new code."
      }, { status: 400 });
    }

    // Mark code as verified
    await pool.query(
      `UPDATE email_verification_codes SET verified_at = NOW() WHERE id = $1`,
      [verificationRecord.id]
    );

    // Create or update the account with verified email
    const accountResult = await pool.query(
      `INSERT INTO accounts (id, email, email_verified_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (email) DO UPDATE SET email_verified_at = NOW()
       RETURNING id`,
      [crypto.randomUUID(), normalizedEmail]
    );

    const accountId = (accountResult.rows[0] as { id: string }).id;

    // Create session
    const sessionToken = createSessionToken(accountId);
    
    const response = NextResponse.json({ 
      ok: true,
      message: "Email verified successfully!"
    });
    
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log("[Auth] Email verified and account created/updated", { 
      email: normalizedEmail,
      accountId 
    });

    return response;
  } catch (error: unknown) {
    console.error("[Auth] verify-code error:", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
