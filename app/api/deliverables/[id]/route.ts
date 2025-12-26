import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

type Params = {
  params: { id: string };
};

export async function PATCH(request: Request, { params }: Params) {
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

    const fields: string[] = [];
    const values: unknown[] = [];

    if (typeof name === "string") {
      fields.push(`name = $${fields.length + 1}`);
      values.push(name.trim());
    }
    if (typeof description === "string") {
      fields.push(`description = $${fields.length + 1}`);
      values.push(description);
    }
    if (typeof category === "string") {
      fields.push(`category = $${fields.length + 1}`);
      values.push(category);
    }
    if (typeof scope === "string" || scope === null) {
      fields.push(`scope = $${fields.length + 1}`);
      values.push(scope);
    }
    if (typeof format === "string" || format === null) {
      fields.push(`format = $${fields.length + 1}`);
      values.push(format);
    }
    if (typeof active === "boolean") {
      fields.push(`active = $${fields.length + 1}`);
      values.push(active);
    }
    if (points !== undefined) {
      let pointsValue: number | null = null;
      if (typeof points === "number") {
        pointsValue = points;
      } else if (typeof points === "string" && points.trim()) {
        const parsed = Number(points);
        if (!Number.isNaN(parsed)) pointsValue = parsed;
      }
      if (pointsValue != null) {
        pointsValue = Math.round(pointsValue * 10) / 10;
      }
      fields.push(`points = $${fields.length + 1}`);
      values.push(pointsValue);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    fields.push(`updated_at = now()`);
    const setClause = fields.join(", ");

    const result = await pool.query(
      `
        UPDATE deliverables
        SET ${setClause}
        WHERE id = $${values.length + 1}
        RETURNING id
      `,
      [...values, params.id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM deliverables WHERE id = $1`,
      [params.id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}


