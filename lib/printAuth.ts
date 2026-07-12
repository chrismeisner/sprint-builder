import { NextRequest } from "next/server";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { getPool } from "./db";

// ─────────────────────────────────────────────────────────────────────────────
// Studio Printer — agent authentication.
//
// The always-on studio Mac authenticates every call with a long random bearer
// token issued at installer-download time. We store only sha256(token); tokens
// are high-entropy random strings (not user passwords), so a fast hash is fine.
// See docs/studio-printer-plan.md §4.
// ─────────────────────────────────────────────────────────────────────────────

const TOKEN_PREFIX = "pa_";

export type PrintAgent = { id: string; name: string };

// Mint a fresh agent token. Returns the plaintext (shown/downloaded ONCE) and the
// hash to persist. Regenerating invalidates any previous bundle for that agent.
export function mintAgentToken(): { token: string; hash: string } {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("hex")}`;
  return { token, hash: hashAgentToken(token) };
}

export function hashAgentToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  try {
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

function readBearer(request: NextRequest): string | null {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

// Verify the request's bearer token against print_agents.key_hash. On success,
// stamps last_seen_at and returns the agent. Throws "Agent authentication required"
// otherwise — callers map that to a 401.
export async function requireAgent(request: NextRequest): Promise<PrintAgent> {
  const token = readBearer(request);
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    throw new Error("Agent authentication required");
  }
  const hash = hashAgentToken(token);

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, name, key_hash FROM print_agents WHERE key_hash = $1 LIMIT 1`,
    [hash]
  );
  const agent = rows[0];
  // Constant-time compare as defence-in-depth even though the lookup used the hash.
  if (!agent || !safeEqualHex(agent.key_hash, hash)) {
    throw new Error("Agent authentication required");
  }

  await pool
    .query(`UPDATE print_agents SET last_seen_at = now() WHERE id = $1`, [agent.id])
    .catch(() => {});

  return { id: agent.id, name: agent.name };
}
