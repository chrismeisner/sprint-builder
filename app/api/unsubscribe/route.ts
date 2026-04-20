import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { verifyUnsubToken } from "@/lib/email";

/**
 * Unsubscribe endpoint.
 *
 * - GET: user clicks the link from the email footer → record opt-out → redirect
 *   to the confirmation page at `/unsubscribe`.
 * - POST: Gmail/Yahoo one-click unsubscribe (per RFC 8058). Fires when the user
 *   clicks the mail client's native "Unsubscribe" affordance. Body is the form
 *   string `List-Unsubscribe=One-Click`; we don't need to parse it — the presence
 *   of the valid token is the authentication.
 *
 * Both methods authenticate via an HMAC token bound to `email + category`, so
 * the link is safe to log and cannot be guessed.
 */

async function recordUnsubscribe(
  email: string,
  category: string,
  source: string,
  userAgent: string | null,
  ip: string | null
): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `INSERT INTO email_unsubscribes (id, email, category, source, user_agent, ip)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email, category) DO NOTHING`,
    [crypto.randomUUID(), email.toLowerCase(), category, source, userAgent, ip]
  );
}

function parseParams(url: URL): { email: string; category: string; token: string } {
  return {
    email: (url.searchParams.get("e") || "").trim().toLowerCase(),
    category: (url.searchParams.get("c") || "").trim(),
    token: (url.searchParams.get("t") || "").trim(),
  };
}

function clientIp(request: Request): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { email, category, token } = parseParams(url);

  if (!email || !category || !token || !email.includes("@")) {
    return NextResponse.redirect(new URL("/unsubscribe?status=invalid", url.origin));
  }
  if (!verifyUnsubToken(email, category, token)) {
    return NextResponse.redirect(new URL("/unsubscribe?status=invalid", url.origin));
  }

  try {
    await recordUnsubscribe(
      email,
      category,
      "user_click",
      request.headers.get("user-agent"),
      clientIp(request)
    );
    const redirectUrl = new URL("/unsubscribe", url.origin);
    redirectUrl.searchParams.set("status", "ok");
    redirectUrl.searchParams.set("c", category);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[Unsubscribe] GET failed to record", {
      email,
      category,
      error: (err as Error).message,
    });
    return NextResponse.redirect(new URL("/unsubscribe?status=error", url.origin));
  }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const { email, category, token } = parseParams(url);

  if (
    !email ||
    !category ||
    !token ||
    !email.includes("@") ||
    !verifyUnsubToken(email, category, token)
  ) {
    return new NextResponse("Invalid unsubscribe request", { status: 400 });
  }

  try {
    await recordUnsubscribe(
      email,
      category,
      "one_click_post",
      request.headers.get("user-agent"),
      clientIp(request)
    );
    return new NextResponse("Unsubscribed", { status: 200 });
  } catch (err) {
    console.error("[Unsubscribe] POST failed", {
      email,
      category,
      error: (err as Error).message,
    });
    return new NextResponse("Error", { status: 500 });
  }
}
