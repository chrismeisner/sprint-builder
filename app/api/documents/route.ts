import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

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
    // Optional shared-secret check for webhook sources (e.g., Zapier)
    const expectedSecret = process.env.ZAPIER_WEBHOOK_SECRET;
    if (expectedSecret) {
      const providedSecret = request.headers.get("x-webhook-secret");
      if (providedSecret !== expectedSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await ensureSchema();
    const contentType = request.headers.get("content-type") || "";
    let content: unknown;
    const filename: string | null = null;

    if (contentType.includes("application/json")) {
      content = await request.json();
    } else if (contentType.includes("text/json") || contentType.includes("application/octet-stream")) {
      const text = await request.text();
      content = JSON.parse(text);
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


