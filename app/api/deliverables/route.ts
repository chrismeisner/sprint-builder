import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

const ALLOWED_CATEGORIES = ["Branding", "Product"];

export async function GET(request: Request) {
  try {
    await ensureSchema();
    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const rows = await pool.query(
      includeInactive
        ? `
          SELECT
            d.id,
            d.name,
            d.description,
            d.category,
            d.points,
            d.scope,
            d.format,
            d.active,
            d.created_at,
            d.updated_at,
            COALESCE(array_remove(array_agg(dt.name ORDER BY dt.name), NULL), '{}') AS tags
          FROM deliverables d
          LEFT JOIN deliverable_tag_links dtl ON dtl.deliverable_id = d.id
          LEFT JOIN deliverable_tags dt ON dt.id = dtl.tag_id
          GROUP BY d.id, d.name, d.description, d.category, d.points, d.scope, d.format, d.active, d.created_at, d.updated_at
          ORDER BY d.active DESC, d.name ASC
        `
        : `
          SELECT
            d.id,
            d.name,
            d.description,
            d.category,
            d.points,
            d.scope,
            d.format,
            d.active,
            d.created_at,
            d.updated_at,
            COALESCE(array_remove(array_agg(dt.name ORDER BY dt.name), NULL), '{}') AS tags
          FROM deliverables d
          LEFT JOIN deliverable_tag_links dtl ON dtl.deliverable_id = d.id
          LEFT JOIN deliverable_tags dt ON dt.id = dtl.tag_id
          WHERE d.active = true
          GROUP BY d.id, d.name, d.description, d.category, d.points, d.scope, d.format, d.active, d.created_at, d.updated_at
          ORDER BY d.name ASC
        `
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
    const { name, description, category, points, scope, format, active, tags } = body as {
      name?: unknown;
      description?: unknown;
      category?: unknown;
      points?: unknown;
      scope?: unknown;
      format?: unknown;
      active?: unknown;
      tags?: unknown;
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

    const normalizeTags = (value: unknown): string[] => {
      if (!Array.isArray(value)) return [];
      const cleaned = value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((v) => v.length > 0);
      return Array.from(new Set(cleaned));
    };

    const normalizedCategory =
      typeof category === "string" && category.trim()
        ? category.trim()
        : null;
    if (normalizedCategory && !ALLOWED_CATEGORIES.includes(normalizedCategory)) {
      return NextResponse.json({ error: "Category must be Branding or Product" }, { status: 400 });
    }

    const tagNames = normalizeTags(tags);
    const id = crypto.randomUUID();
    const activeValue = typeof active === "boolean" ? active : true;

    await pool.query("BEGIN");
    await pool.query(
      `
        INSERT INTO deliverables (id, name, description, category, points, scope, format, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        id,
        name.trim(),
        typeof description === "string" ? description : null,
        normalizedCategory,
        pointsValue,
        typeof scope === "string" ? scope : null,
        typeof format === "string" ? format : null,
        activeValue,
      ]
    );

    for (const tagName of tagNames) {
      const tagRes = await pool.query(
        `
          INSERT INTO deliverable_tags (id, name)
          VALUES ($1, $2)
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `,
        [crypto.randomUUID(), tagName]
      );
      const tagId = tagRes.rows[0].id as string;
      await pool.query(
        `
          INSERT INTO deliverable_tag_links (deliverable_id, tag_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [id, tagId]
      );
    }

    await pool.query("COMMIT");

    return NextResponse.json({ id }, { status: 201 });
  } catch (error: unknown) {
    try {
      const pool = getPool();
      await pool.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


