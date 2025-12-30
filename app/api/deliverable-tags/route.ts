import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const res = await pool.query(
      `
        SELECT id, name
        FROM deliverable_tags
        ORDER BY name ASC
      `
    );
    return NextResponse.json({ tags: res.rows });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();
    const body = (await request.json().catch(() => ({}))) as unknown;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name } = body as { name?: unknown };
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const trimmed = name.trim();
    const id = crypto.randomUUID();

    const res = await pool.query(
      `
        INSERT INTO deliverable_tags (id, name)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id, name
      `,
      [id, trimmed]
    );

    return NextResponse.json({ tag: res.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


