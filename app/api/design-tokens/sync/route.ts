import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const TOKENS_DIR = path.join(process.cwd(), "lib", "design-system", "tokens");

/**
 * Allow sync only in development, or when DESIGN_TOKENS_SYNC_SECRET is set and
 * the request sends the same value in header x-design-tokens-secret.
 */
function isSyncAllowed(request: NextRequest): boolean {
  const secret = process.env.DESIGN_TOKENS_SYNC_SECRET;
  if (process.env.NODE_ENV === "development" && !secret) return true;
  if (!secret) return false;
  const header = request.headers.get("x-design-tokens-secret");
  return header === secret;
}

/**
 * POST /api/design-tokens/sync
 *
 * Body: same shape as GET /sandboxes/miles-proto-2/hub/tokens
 *   { primitives, typography?, state?, "semantic-light", "semantic-dark", sizing }
 *
 * Writes lib/design-system/tokens/primitives.json, semantic-light.json,
 * semantic-dark.json, sizing.json (and typography/state when provided).
 * Used by a "roll your own" Figma plugin
 * that pushes Variables from Figma into the hub so the wireframe app stays in sync.
 *
 * Allowed only in development, or when DESIGN_TOKENS_SYNC_SECRET is set and
 * the request includes header x-design-tokens-secret with that value.
 */
export async function POST(request: NextRequest) {
  if (!isSyncAllowed(request)) {
    return NextResponse.json(
      { error: "Design token sync not allowed" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Body must be an object" },
      { status: 400 }
    );
  }

  const payload = body as Record<string, unknown>;
  const required = ["primitives", "semantic-light", "semantic-dark", "sizing"] as const;
  for (const key of required) {
    if (!(key in payload) || typeof payload[key] !== "object") {
      return NextResponse.json(
        { error: `Missing or invalid token set: ${key}` },
        { status: 400 }
      );
    }
  }

  try {
    await fs.promises.mkdir(TOKENS_DIR, { recursive: true });
    const writes = [
      fs.promises.writeFile(
        path.join(TOKENS_DIR, "primitives.json"),
        JSON.stringify(payload.primitives, null, 2),
        "utf8"
      ),
      fs.promises.writeFile(
        path.join(TOKENS_DIR, "semantic-light.json"),
        JSON.stringify(payload["semantic-light"], null, 2),
        "utf8"
      ),
      fs.promises.writeFile(
        path.join(TOKENS_DIR, "semantic-dark.json"),
        JSON.stringify(payload["semantic-dark"], null, 2),
        "utf8"
      ),
      fs.promises.writeFile(
        path.join(TOKENS_DIR, "sizing.json"),
        JSON.stringify(payload.sizing, null, 2),
        "utf8"
      ),
    ];

    if ("typography" in payload && typeof payload.typography === "object") {
      writes.push(
        fs.promises.writeFile(
          path.join(TOKENS_DIR, "typography.json"),
          JSON.stringify(payload.typography, null, 2),
          "utf8"
        )
      );
    }

    if ("state" in payload && typeof payload.state === "object") {
      writes.push(
        fs.promises.writeFile(
          path.join(TOKENS_DIR, "state.json"),
          JSON.stringify(payload.state, null, 2),
          "utf8"
        )
      );
    }

    await Promise.all(writes);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Failed to write token files", detail: message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Token files updated (primitives, typography?, state?, semantic-light, semantic-dark, sizing)",
  });
}
