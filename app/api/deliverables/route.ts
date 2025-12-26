import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const rows = await pool.query(
      includeInactive
        ? `SELECT id, name, description, category, points, scope, format, active, created_at, updated_at
           FROM deliverables
           ORDER BY active DESC, name ASC`
        : `SELECT id, name, description, category, points, scope, format, active, created_at, updated_at
           FROM deliverables
           WHERE active = true
           ORDER BY name ASC`
    );
    return NextResponse.json({ deliverables: rows.rows });
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
    const { name, description, category, points, scope, format, active } = body as {
      name?: unknown;
      description?: unknown;
      category?: unknown;
      points?: unknown;
      scope?: unknown;
      format?: unknown;
      active?: unknown;
    };

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let pointsValue: number | null = null;
    if (typeof points === "number") {
      pointsValue = points;
    } else if (typeof points === "string" && points.trim()) {
      const parsed = Number(points);
      if (!Number.isNaN(parsed)) pointsValue = parsed;
    }
    if (pointsValue == null || Number.isNaN(pointsValue)) {
      return NextResponse.json({ error: "Points (1.0 - 3.0) are required" }, { status: 400 });
    }
    if (pointsValue < 0.1 || pointsValue > 3.0) {
      return NextResponse.json({ error: "Points must be between 0.1 and 3.0" }, { status: 400 });
    }
    pointsValue = Math.round(pointsValue * 10) / 10; // enforce single decimal

    const id = crypto.randomUUID();
    const activeValue = typeof active === "boolean" ? active : true;

    await pool.query(
      `
        INSERT INTO deliverables (id, name, description, category, points, scope, format, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        id,
        name.trim(),
        typeof description === "string" ? description : null,
        typeof category === "string" ? category : null,
        pointsValue,
        typeof scope === "string" ? scope : null,
        typeof format === "string" ? format : null,
        activeValue,
      ]
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


