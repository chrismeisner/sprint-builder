import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { verifyTypeformSignature } from "@/lib/typeform";

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "20");
    const offset = Number(searchParams.get("offset") ?? "0");
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, filename, created_at FROM documents ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [isFinite(limit) ? limit : 20, isFinite(offset) ? offset : 0]
    );
    return NextResponse.json({ documents: result.rows });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Read raw body once, to support signature verification
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "";
    const typeformSignature = request.headers.get("typeform-signature");
    const typeformSecret = process.env.TYPEFORM_WEBHOOK_SECRET;
    const sharedSecret = process.env.ZAPIER_WEBHOOK_SECRET;
    const providedShared = request.headers.get("x-webhook-secret");

    // Verify Typeform signature if configured and header present
    if (typeformSecret && typeformSignature) {
      const ok = verifyTypeformSignature(rawBody, typeformSignature, typeformSecret);
      if (!ok) {
        return NextResponse.json({ error: "Invalid Typeform signature" }, { status: 401 });
      }
    } else if (sharedSecret) {
      // Fallback to simple shared secret if provided
      if (providedShared !== sharedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await ensureSchema();
    let content: unknown;
    const filename: string | null = null;

    if (contentType.includes("application/json") || contentType.includes("text/json") || contentType.includes("application/octet-stream")) {
      content = JSON.parse(rawBody || "{}");
    } else {
      return NextResponse.json(
        { error: "Unsupported Content-Type. Use application/json." },
        { status: 415 }
      );
    }

    const id = crypto.randomUUID();
    const pool = getPool();
    await pool.query(
      `INSERT INTO documents (id, content, filename) VALUES ($1, $2::jsonb, $3)`,
      [id, JSON.stringify(content), filename]
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


