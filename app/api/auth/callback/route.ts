import { NextResponse } from "next/server";
import { verifyLoginToken, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const verified = verifyLoginToken(token);
    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const sessionToken = createSessionToken(verified.accountId);
    
    // Use BASE_URL from env if set, otherwise fall back to request origin
    let origin: string;
    if (process.env.BASE_URL) {
      origin = process.env.BASE_URL.replace(/\/$/, ''); // Remove trailing slash if present
    } else {
      const url = new URL(request.url);
      origin = `${url.protocol}//${url.host}`;
    }
    
    const redirectUrl = new URL("/my-sprints", origin);
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    return res;
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


