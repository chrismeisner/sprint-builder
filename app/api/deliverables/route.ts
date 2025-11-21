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
        ? `SELECT id, name, description, category, deliverable_type, default_estimate_points, fixed_hours, fixed_price, scope, active, created_at, updated_at
           FROM deliverables
           ORDER BY active DESC, deliverable_type ASC, name ASC`
        : `SELECT id, name, description, category, deliverable_type, default_estimate_points, fixed_hours, fixed_price, scope, active, created_at, updated_at
           FROM deliverables
           WHERE active = true
           ORDER BY deliverable_type ASC, name ASC`
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
    const { name, description, category, defaultEstimatePoints, fixedHours, fixedPrice, scope, active } = body as {
      name?: unknown;
      description?: unknown;
      category?: unknown;
      defaultEstimatePoints?: unknown;
      fixedHours?: unknown;
      fixedPrice?: unknown;
      scope?: unknown;
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

    let hours: number | null = null;
    if (typeof fixedHours === "number") {
      hours = fixedHours;
    } else if (typeof fixedHours === "string" && fixedHours.trim()) {
      const parsed = Number(fixedHours);
      if (!Number.isNaN(parsed)) hours = parsed;
    }

    let price: number | null = null;
    if (typeof fixedPrice === "number") {
      price = fixedPrice;
    } else if (typeof fixedPrice === "string" && fixedPrice.trim()) {
      const parsed = Number(fixedPrice);
      if (!Number.isNaN(parsed)) price = parsed;
    }

    const id = crypto.randomUUID();
    const activeValue = typeof active === "boolean" ? active : true;

    await pool.query(
      `
        INSERT INTO deliverables (id, name, description, category, default_estimate_points, fixed_hours, fixed_price, scope, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        id,
        name.trim(),
        typeof description === "string" ? description : null,
        typeof category === "string" ? category : null,
        estimate,
        hours,
        price,
        typeof scope === "string" ? scope : null,
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


