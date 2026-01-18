import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getPool } from "./db";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

// Superadmin email that can always log in (safety backdoor)
export const SUPERADMIN_EMAIL = "chris@chrismeisner.com";

function sign(payload: string): string {
  const h = createHmac("sha256", SESSION_SECRET);
  h.update(payload);
  return h.digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  try {
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

type SessionPayload = {
  kind: "login" | "session";
  accountId: string;
  issuedAt: number;
};

function encodePayload(p: SessionPayload): string {
  return `${p.kind}:${p.accountId}:${p.issuedAt}`;
}

function decodePayload(raw: string): SessionPayload | null {
  const parts = raw.split(":");
  if (parts.length !== 3) return null;
  const [kind, accountId, issuedAtStr] = parts;
  if (kind !== "login" && kind !== "session") return null;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return null;
  if (!accountId || typeof accountId !== "string") return null;
  return { kind, accountId, issuedAt };
}

function createToken(kind: "login" | "session", accountId: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = encodePayload({ kind, accountId, issuedAt });
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

function verifyToken(
  token: string,
  expectedKind: "login" | "session",
  maxAgeSeconds: number
): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = sign(payload);
  if (!safeEqual(sig, expectedSig)) return null;
  const decoded = decodePayload(payload);
  if (!decoded || decoded.kind !== expectedKind) return null;
  const now = Math.floor(Date.now() / 1000);
  if (now - decoded.issuedAt > maxAgeSeconds) return null;
  return decoded;
}

export const SESSION_COOKIE_NAME = "sb_session";

// Magic-link login token (short-lived, used only in /api/auth/callback)
export function createLoginToken(accountId: string): string {
  return createToken("login", accountId);
}

export function verifyLoginToken(token: string, maxAgeSeconds = 15 * 60): { accountId: string } | null {
  const decoded = verifyToken(token, "login", maxAgeSeconds);
  if (!decoded) return null;
  return { accountId: decoded.accountId };
}

// Session token stored in HTTP-only cookie
export function createSessionToken(accountId: string): string {
  return createToken("session", accountId);
}

export function verifySessionToken(
  token: string,
  maxAgeSeconds = 7 * 24 * 60 * 60
): { accountId: string } | null {
  const decoded = verifyToken(token, "session", maxAgeSeconds);
  if (!decoded) return null;
  return { accountId: decoded.accountId };
}

// Helper to get current user from cookies (for use in server components)
export async function getCurrentUser(): Promise<{ accountId: string; email: string; name: string | null; isAdmin: boolean } | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifySessionToken(token);
    if (!session) return null;

    // Fetch user data from database
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, email, name, is_admin FROM accounts WHERE id = $1`,
      [session.accountId]
    );

    if (result.rowCount === 0) return null;
    
    const account = result.rows[0] as { id: string; email: string; name: string | null; is_admin: boolean };
    return { 
      accountId: account.id, 
      email: account.email,
      name: account.name,
      isAdmin: account.is_admin 
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Helper to check if current user is an admin
export async function requireAdmin(): Promise<{ accountId: string; email: string; name: string | null; isAdmin: true }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  if (!user.isAdmin) {
    throw new Error("Admin access required");
  }
  return { ...user, isAdmin: true as const };
}


