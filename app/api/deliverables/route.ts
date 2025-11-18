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
        ? `SELECT id, name, description, category, default_estimate_points, active, created_at, updated_at
           FROM deliverables
           ORDER BY active DESC, name ASC`
        : `SELECT id, name, description, category, default_estimate_points, active, created_at, updated_at
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
    const { name, description, category, defaultEstimatePoints, active } = body as {
      name?: unknown;
      description?: unknown;
      category?: unknown;
      defaultEstimatePoints?: unknown;
      active?: unknown;
    };

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let estimate: number | null = null;
    if (typeof defaultEstimatePoints === "number") {
      estimate = defaultEstimatePoints;
    } else if (typeof defaultEstimatePoints === "string" && defaultEstimatePoints.trim()) {
      const parsed = Number(defaultEstimatePoints);
      if (!Number.isNaN(parsed)) estimate = parsed;
    }

    const id = crypto.randomUUID();
    const activeValue = typeof active === "boolean" ? active : true;

    await pool.query(
      `
        INSERT INTO deliverables (id, name, description, category, default_estimate_points, active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        id,
        name.trim(),
        typeof description === "string" ? description : null,
        typeof category === "string" ? category : null,
        estimate,
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


